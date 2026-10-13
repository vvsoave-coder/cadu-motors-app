// Camada de compatibilidade de auth: reproduz a forma de base44.auth.*
// em cima do Supabase Auth. Mantém os nomes de método usados pelas páginas
// (Login.jsx, AuthContext.jsx) pra minimizar mudança de código.
//
// Decisão de produto (migração para fora do Base44): este site tem só
// administradores pré-aprovados (lista em supabase/migrations — ADMIN_EMAILS),
// não visitante público criando conta. Por isso o cadastro público com OTP
// do Base44 foi removido — login é só "Continuar com Google" (ou e-mail/senha
// se você criar a conta manualmente no painel do Supabase).

import { supabase } from './supabaseClient';

export const auth = {
  async loginViaEmailPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async loginWithProvider(provider, returnTo = '/') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${returnTo}` },
    });
    if (error) throw error;
  },

  async sendPasswordResetEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  // Equivalente a base44.auth.me() — usuário atual + role (de "profiles").
  async me() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
      role: profile?.role || 'user',
    };
  },

  logout(redirectUrl) {
    supabase.auth.signOut().finally(() => {
      if (redirectUrl) window.location.href = redirectUrl;
    });
  },

  redirectToLogin(returnTo) {
    const url = new URL('/login', window.location.origin);
    if (returnTo && returnTo !== window.location.origin + '/login') {
      url.searchParams.set('returnTo', returnTo);
    }
    window.location.href = url.toString();
  },

  onAuthStateChange(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },
};
