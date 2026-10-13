// Confere o JWT do Supabase que o frontend manda em Authorization: Bearer <token>
// e checa se o usuário é admin (tabela profiles). Usa isso no topo de toda
// função serverless que só o admin logado pode chamar.

import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return { user, supabaseAdmin };
}

// Pro cron do GitHub Actions, que não tem usuário logado — autentica com um
// segredo compartilhado (CRON_SECRET), igual o Base44 fazia com o workflow
// agendado rodando "sem sessão de usuário".
export function isCronRequest(req) {
  const secret = req.headers['x-cron-secret'] || req.headers['X-Cron-Secret'];
  return Boolean(secret) && secret === process.env.CRON_SECRET;
}
