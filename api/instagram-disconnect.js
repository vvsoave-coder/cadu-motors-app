// POST /api/instagram-disconnect — admin-only.
import { requireAdmin } from './_lib/requireAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { supabaseAdmin } = await requireAdmin(req);
    const { error } = await supabaseAdmin
      .from('instagram_connection')
      .update({ access_token: null, username: null, ig_user_id: null, token_expires_at: null })
      .eq('id', 1);
    if (error) throw error;
    return res.status(200).json({ disconnected: true });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
