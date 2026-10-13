// Migração única: lê o backup dos veículos exportado do Base44
// (cadu-motors-migration/backup-base44/vehicles.json), baixa as fotos que
// ainda estiverem no ar no CDN do Instagram, re-hospeda no Supabase Storage,
// e insere tudo na tabela `vehicles` nova.
//
// Rode DEPOIS de aplicar supabase/migrations/0001_init.sql no projeto Supabase.
//
// Uso:
//   1. Crie um arquivo .env.local nesta pasta (cadu-motors-app/) com:
//        SUPABASE_URL=...
//        SUPABASE_SERVICE_ROLE_KEY=...
//      (os mesmos valores que vão na Vercel — Project Settings → API no Supabase)
//   2. npm run migrate-data

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- carrega .env.local sem precisar da lib dotenv ---
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local — veja o cabeçalho deste arquivo.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const BACKUP_PATH = path.resolve(__dirname, '..', '..', 'backup-base44', 'vehicles.json');
const BUCKET = 'vehicle-photos';

async function downloadAndUpload(url, pathPrefix, index) {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(await resp.arrayBuffer());
    const storagePath = `migrated/${pathPrefix}/${index}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.warn(`  ⚠ upload falhou (${storagePath}): ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data?.publicUrl || null;
  } catch (e) {
    return null; // link morto do Instagram — normal pros posts mais antigos
  }
}

async function main() {
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error(`Backup não encontrado em: ${BACKUP_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  const vehicles = raw.entities || raw;
  console.log(`Migrando ${vehicles.length} veículos...\n`);

  let migrated = 0;
  let noPhotos = 0;
  const vehiclesWithoutPhotos = [];

  for (const v of vehicles) {
    const prefix = v.instagram_post_id || v.id;
    console.log(`→ ${v.title} (${prefix})`);

    const sourcePhotos = (v.photos && v.photos.length ? v.photos : v.photo_url ? [v.photo_url] : []);
    const newPhotos = [];
    for (let i = 0; i < sourcePhotos.length; i++) {
      const url = await downloadAndUpload(sourcePhotos[i], prefix, i);
      if (url) newPhotos.push(url);
    }

    if (newPhotos.length === 0) {
      noPhotos++;
      vehiclesWithoutPhotos.push(v.title);
      console.log('  ⚠ nenhuma foto recuperada (link do Instagram já expirou) — precisa subir manual depois no Admin.');
    } else {
      console.log(`  ✓ ${newPhotos.length}/${sourcePhotos.length} foto(s) migrada(s)`);
    }

    const row = {
      title: v.title,
      instagram_caption: v.instagram_caption || null,
      description: v.description || null,
      price: v.price ?? null,
      photos: newPhotos,
      photo_url: newPhotos[0] || null,
      gallery: newPhotos.slice(1),
      brand: v.brand || null,
      model: v.model || null,
      year: v.year ?? null,
      km: v.km ?? null,
      transmission: v.transmission || null,
      fuel: v.fuel || null,
      color: v.color || null,
      category: v.category || 'portfolio',
      is_blindado: !!v.is_blindado,
      is_vendido: !!v.is_vendido,
      override_manual: !!v.override_manual,
      review_status: v.review_status || 'publicado',
      instagram_url: v.instagram_url || v.ad_link || null,
      instagram_post_id: v.instagram_post_id || v.instagram_media_id || null,
      instagram_media_id: v.instagram_media_id || v.instagram_post_id || null,
      ad_link: v.ad_link || v.instagram_url || null,
      data_publicacao: v.data_publicacao || null,
      data_venda: v.data_venda || null,
      ativo: v.ativo !== false,
      is_sample: !!v.is_sample,
    };

    const { error } = await supabase.from('vehicles').upsert(row, { onConflict: 'instagram_post_id' });
    if (error) {
      console.error(`  ✗ erro ao salvar: ${error.message}`);
    } else {
      migrated++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Concluído: ${migrated}/${vehicles.length} veículos migrados.`);
  console.log(`${noPhotos} veículo(s) sem nenhuma foto recuperável (link do Instagram expirado):`);
  vehiclesWithoutPhotos.forEach((t) => console.log(`  - ${t}`));
  console.log('\nEsses você precisa subir foto manual em Admin → Editar (ou esperar a próxima sincronização, se o post ainda existir no Instagram — o sync atualiza as fotos de posts já cadastrados).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
