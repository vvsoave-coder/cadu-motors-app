// GET /api/instagram-oauth-start?token=<jwt do admin logado>
// Chamado por navegação de página inteira (não fetch), por isso o JWT vem
// na query string em vez de um header Authorization.
// Gera um "state" de uso único e redireciona pro Instagram autorizar.

import crypto from 'node:crypto';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).send('Faltou o token de login.');

    const supabaseAdmin = getSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return res.status(401).send('Sessão inválida, faça login de novo.');

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return res.status(403).send('Só administradores podem conectar o Instagram.');

    const state = crypto.randomBytes(24).toString('hex');
    const { error: insertError } = await supabaseAdmin.from('oauth_state').insert({ state, user_id: user.id });
    if (insertError) throw insertError;

    const redirectUri = `${process.env.PUBLIC_SITE_URL}/api/instagram-oauth-callback`;
    const scope = ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_messages'].join(',');
    const authorizeUrl =
      `https://www.instagram.com/oauth/authorize` +
      `?client_id=${encodeURIComponent(process.env.INSTAGRAM_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`;

    res.writeHead(302, { Location: authorizeUrl });
    res.end();
  } catch (error) {
    res.status(500).send('Erro ao iniciar conexão: ' + error.message);
  }
}
