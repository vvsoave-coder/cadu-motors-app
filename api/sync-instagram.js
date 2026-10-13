// POST /api/sync-instagram
// Chamado por: (a) o cron do GitHub Actions a cada 20 min, com header
// x-cron-secret; ou (b) o botão "Sincronizar" no Admin, com JWT de admin.
//
// Porta base44/functions/syncInstagramPosts/entry.ts. Duas diferenças
// importantes em relação à versão Base44:
//  1. As fotos são baixadas e re-hospedadas no Supabase Storage (o Base44
//     só salvava o link direto do CDN do Instagram, que expira — por isso
//     carros antigos já estavam sem foto).
//  2. A extração de título/ano/preço/km da legenda é por regex
//     (src/lib/classification.js → parseCaption), não por LLM paga.

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { requireAdmin, isCronRequest } from './_lib/requireAdmin.js';
import { buildClassificationUpdate, parseCaption } from '../src/lib/classification.js';

const BUCKET = 'vehicle-photos';

async function downloadAndStorePhoto(supabaseAdmin, url, pathPrefix, index) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const buffer = Buffer.from(await resp.arrayBuffer());
  const path = `${pathPrefix}/${index}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) return null;

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

async function collectAndStorePhotos(supabaseAdmin, item, accessToken) {
  let sourceUrls = [];
  if (item.media_type === 'CAROUSEL_ALBUM') {
    try {
      const childRes = await fetch(
        `https://graph.instagram.com/${item.id}/children?fields=media_url,media_type&access_token=${accessToken}`
      );
      const childData = await childRes.json();
      sourceUrls = (childData.data || [])
        .filter((c) => c.media_type === 'IMAGE' && c.media_url)
        .map((c) => c.media_url);
    } catch {
      // segue sem carrossel
    }
  }
  if (sourceUrls.length === 0 && item.media_type === 'IMAGE' && item.media_url) {
    sourceUrls = [item.media_url];
  }
  if (sourceUrls.length === 0 && item.thumbnail_url) {
    sourceUrls = [item.thumbnail_url];
  }

  const stored = [];
  for (let i = 0; i < sourceUrls.length; i++) {
    const publicUrl = await downloadAndStorePhoto(supabaseAdmin, sourceUrls[i], item.id, i);
    if (publicUrl) stored.push(publicUrl);
  }
  return stored;
}

const toNum = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[^\d]/g, ''));
  return isNaN(n) ? null : n;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseAdmin = getSupabaseAdmin();

  try {
    if (!isCronRequest(req)) {
      await requireAdmin(req); // lança 401/403 se não for admin logado
    }

    const { data: conn } = await supabaseAdmin
      .from('instagram_connection')
      .select('access_token')
      .eq('id', 1)
      .single();
    const accessToken = conn?.access_token;
    if (!accessToken) return res.status(400).json({ error: 'Instagram não conectado' });

    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (!me.id) return res.status(400).json({ error: 'Sem usuário Instagram (token inválido/expirado)' });

    const mediaRes = await fetch(
      `https://graph.instagram.com/${me.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=25&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();
    const items = (mediaData.data || []).slice(0, 25);

    const { data: existingVehicles } = await supabaseAdmin
      .from('vehicles')
      .select('id, instagram_post_id, override_manual, data_venda, photo_url')
      .not('instagram_post_id', 'is', null);
    const existingMap = new Map((existingVehicles || []).map((v) => [v.instagram_post_id, v]));

    let synced = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const caption = item.caption || '';
      const existing = existingMap.get(item.id);

      if (existing) {
        const update = {
          instagram_caption: caption,
          instagram_url: item.permalink,
          ativo: true,
          review_status: 'publicado',
        };
        // Só baixa as fotos de novo se o veículo ainda não tiver nenhuma
        // (ex.: link do Instagram tinha expirado na migração). Reprocessar
        // fotos de todo mundo a cada sync estoura o tempo da function.
        if (!existing.photo_url) {
          const photos = await collectAndStorePhotos(supabaseAdmin, item, accessToken);
          if (photos.length) {
            update.photos = photos;
            update.photo_url = photos[0];
            update.gallery = photos.slice(1);
          }
        }
        if (!existing.override_manual) {
          Object.assign(update, buildClassificationUpdate(caption, existing.data_venda));
        }
        const { error } = await supabaseAdmin.from('vehicles').update(update).eq('id', existing.id);
        if (error) skipped++;
        else updated++;
        continue;
      }

      const photos = await collectAndStorePhotos(supabaseAdmin, item, accessToken);
      if (photos.length === 0) {
        skipped++;
        continue;
      }

      const parsed = parseCaption(caption);
      if (!parsed.title) {
        skipped++;
        continue;
      }

      const classification = buildClassificationUpdate(caption, null);
      let data_publicacao = null;
      if (item.timestamp) {
        try {
          data_publicacao = new Date(item.timestamp).toISOString().split('T')[0];
        } catch {
          // ignora timestamp inválido
        }
      }

      const { error } = await supabaseAdmin.from('vehicles').insert({
        title: parsed.title,
        instagram_caption: caption,
        description: parsed.description || caption,
        year: toNum(parsed.year),
        km: toNum(parsed.km),
        price: toNum(parsed.price),
        photos,
        photo_url: photos[0],
        gallery: photos.slice(1),
        instagram_url: item.permalink,
        ad_link: item.permalink,
        instagram_post_id: item.id,
        instagram_media_id: item.id,
        data_publicacao,
        ...classification,
        override_manual: false,
        ativo: true,
        review_status: 'publicado',
        is_sample: false,
      });
      if (error) skipped++;
      else synced++;
    }

    await supabaseAdmin.from('instagram_connection').update({ last_synced_at: new Date().toISOString() }).eq('id', 1);

    return res.status(200).json({ synced, updated, skipped, total: items.length });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
