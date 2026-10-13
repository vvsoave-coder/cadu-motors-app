// POST /api/instagram-refresh-token — chamado 1x por semana pelo GitHub
// Actions (header x-cron-secret). O token de longa duração do Instagram
// dura ~60 dias mas precisa ser renovado ANTES de expirar — se deixar
// vencer, só dá pra recuperar reconectando a conta manualmente de novo.

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { isCronRequest } from './_lib/requireAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isCronRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { data: conn } = await supabaseAdmin.from('instagram_connection').select('access_token').eq('id', 1).single();
    if (!conn?.access_token) return res.status(200).json({ refreshed: false, reason: 'not_connected' });

    const refreshRes = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${conn.access_token}`
    );
    const data = await refreshRes.json();
    if (!data.access_token) {
      return res.status(200).json({ refreshed: false, reason: data.error?.message || 'refresh_failed' });
    }

    const expiresAt = new Date(Date.now() + (data.expires_in || 5184000) * 1000).toISOString();
    await supabaseAdmin.from('instagram_connection').update({
      access_token: data.access_token,
      token_expires_at: expiresAt,
    }).eq('id', 1);

    return res.status(200).json({ refreshed: true, expires_at: expiresAt });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
