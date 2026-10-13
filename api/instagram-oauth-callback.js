// GET /api/instagram-oauth-callback?code=...&state=...
// O Instagram chama isso depois que o admin autoriza. Troca o code por um
// token de curta duração, troca esse por um de longa duração (~60 dias),
// e salva em instagram_connection.

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  const supabaseAdmin = getSupabaseAdmin();
  const adminUrl = `${process.env.PUBLIC_SITE_URL}/admin/instagram`;

  try {
    const { code, state, error: igError } = req.query;
    if (igError) return res.redirect(302, `${adminUrl}?ig_error=${encodeURIComponent(igError)}`);
    if (!code || !state) return res.redirect(302, `${adminUrl}?ig_error=missing_code_or_state`);

    // Valida e consome o state (uso único, anti-CSRF)
    const { data: stateRow } = await supabaseAdmin.from('oauth_state').select('*').eq('state', state).single();
    if (!stateRow) return res.redirect(302, `${adminUrl}?ig_error=invalid_state`);
    await supabaseAdmin.from('oauth_state').delete().eq('state', state);

    const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/instagram-oauth-callback`;

    // 1) code -> token de curta duração
    const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });
    const shortData = await shortRes.json();
    if (!shortData.access_token) {
      return res.redirect(302, `${adminUrl}?ig_error=${encodeURIComponent(shortData.error_message || 'token_exchange_failed')}`);
    }

    // 2) token curto -> token longo (~60 dias)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortData.access_token}`
    );
    const longData = await longRes.json();
    if (!longData.access_token) {
      return res.redirect(302, `${adminUrl}?ig_error=long_token_exchange_failed`);
    }

    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longData.access_token}`);
    const me = await meRes.json();

    const expiresAt = new Date(Date.now() + (longData.expires_in || 5184000) * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin.from('instagram_connection').upsert({
      id: 1,
      ig_user_id: me.id || shortData.user_id,
      username: me.username || null,
      access_token: longData.access_token,
      token_expires_at: expiresAt,
      connected_at: new Date().toISOString(),
      connected_by: stateRow.user_id,
    });
    if (upsertError) throw upsertError;

    return res.redirect(302, `${adminUrl}?connected=1`);
  } catch (error) {
    return res.redirect(302, `${adminUrl}?ig_error=${encodeURIComponent(error.message)}`);
  }
}
