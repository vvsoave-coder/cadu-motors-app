// Cliente Supabase com a SERVICE ROLE KEY — só roda no backend (Vercel
// Functions), nunca no navegador. Ignora RLS (acesso total), por isso as
// variáveis de ambiente abaixo NÃO têm prefixo VITE_ e não vão pro bundle
// do frontend.

import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel.');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
