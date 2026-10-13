// Camada de compatibilidade: reproduz base44.functions.invoke(name, payload)
// chamando as rotas serverless locais em /api/<name> (Vercel Functions),
// anexando o token de sessão do Supabase pra autenticação no backend.

import { supabase } from './supabaseClient';

export const functions = {
  async invoke(name, payload = {}) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch(`/api/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error || `Falha ao chamar ${name}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
};
