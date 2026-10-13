// GET /api/instagram-status — admin-only. Porta getInstagramStatus/entry.ts.
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { requireAdmin } from './_lib/requireAdmin.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: conn } = await supabaseAdmin
      .from('instagram_connection')
      .select('access_token, username, token_expires_at, connected_at, last_synced_at')
      .eq('id', 1)
      .single();

    if (!conn?.access_token) return res.status(200).json({ connected: false });

    // Confere com o Instagram se o token ainda é válido de verdade
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${conn.access_token}`);
    const me = await meRes.json();
    if (!me.id) return res.status(200).json({ connected: false });

    return res.status(200).json({
      connected: true,
      username: me.username || conn.username,
      connected_at: conn.connected_at,
      token_expires_at: conn.token_expires_at,
      last_synced_at: conn.last_synced_at,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ connected: false, error: error.message });
  }
}
