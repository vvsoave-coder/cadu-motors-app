import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { functions } from '@/api/functions';
import { supabase } from '@/api/supabaseClient';
import { Loader2, RefreshCw, Check, X, Instagram, Link2, Unlink, Calendar } from 'lucide-react';
import BrandLogo from '@/components/cadu/BrandLogo';
import { siteConfig } from '@/lib/siteConfig';

function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function InstagramSettings() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [connectError, setConnectError] = useState(searchParams.get('ig_error'));

  const fetchStatus = async () => {
    try {
      const data = await functions.invoke('instagram-status', {});
      setConnected(!!data?.connected);
      setUsername(data?.username || null);
      setLastSync(data?.last_synced_at || null);
    } catch {
      setConnected(false);
      setUsername(null);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStatus();
      setLoading(false);
    })();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setConnecting(false);
      return;
    }
    // Navegação de página inteira — o fluxo termina com o Instagram
    // redirecionando de volta pra cá (/admin/instagram?connected=1).
    window.location.href = `/api/instagram-oauth-start?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Desconectar a conta do Instagram? A sincronização automática será pausada.')) return;
    try {
      await functions.invoke('instagram-disconnect', {});
      setConnected(false);
      setUsername(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const data = await functions.invoke('sync-instagram', {});
      setSyncResult(data);
      if (!data?.error) setLastSync(new Date().toISOString());
    } catch (e) {
      setSyncResult({ error: e?.data?.error || e.message || 'Falha na sincronização' });
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E0E0E0]">
      <header className="sticky top-0 z-30 border-b border-[#1c1c1c] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <BrandLogo size="text-lg" />
            <Link to="/admin" className="text-xs tracking-[0.2em] text-[#888] transition hover:text-[#F26A21]">← PAINEL</Link>
          </div>
          <span className="text-xs tracking-[0.2em] text-[#666]">INTEGRAÇÃO · INSTAGRAM</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <Instagram size={20} className="text-[#F26A21]" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Conexão Instagram</h1>
          </div>
          <p className="text-sm text-[#888]">Conecte sua conta comercial {siteConfig.instagram.handle} para sincronizar os anúncios automaticamente com o showroom.</p>
        </div>

        {connectError && (
          <div className="mb-6 border border-[#f44]/40 bg-[#f44]/10 p-4 text-sm text-[#f44]">
            Falha ao conectar: {connectError}
          </div>
        )}

        {/* Card de conexão */}
        <div className="border border-[#1c1c1c] bg-[#121212] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center border ${connected ? 'border-[#F26A21]/40 bg-[#F26A21]/10' : 'border-[#1c1c1c] bg-[#0a0a0a]'}`}>
                {connected ? <Check size={22} className="text-[#F26A21]" /> : <Instagram size={22} className="text-[#666]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#E0E0E0]">{connected ? 'Conectado' : 'Não conectado'}</span>
                  <span className={`inline-flex h-1.5 w-1.5 rounded-full ${connected ? 'bg-[#F26A21]' : 'bg-[#444]'}`} />
                </div>
                <span className="text-xs text-[#666]">{connected ? (username ? `@${username}` : 'Conta conectada') : 'Conecte para ativar a sincronização'}</span>
              </div>
            </div>
            {connected ? (
              <button onClick={handleDisconnect} className="inline-flex items-center justify-center gap-2 border border-[#1c1c1c] px-5 py-3 text-xs font-semibold tracking-wide text-[#E0E0E0] transition hover:border-[#f44] hover:text-[#f44]">
                <Unlink size={14} /> DESCONECTAR
              </button>
            ) : (
              <button onClick={handleConnect} disabled={connecting} className="inline-flex items-center justify-center gap-2 bg-[#F26A21] px-5 py-3 text-xs font-semibold tracking-wide text-[#050505] transition hover:bg-[#FF8B43] disabled:opacity-50">
                {connecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} CONECTAR CONTA
              </button>
            )}
          </div>
        </div>

        {/* Importação */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Importação de anúncios</h2>
          <div className="border border-[#1c1c1c] bg-[#121212] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-[#E0E0E0]">
                  <RefreshCw size={14} className="text-[#F26A21]" />
                  <span>Sincronizar agora</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#666]">
                  <Calendar size={12} />
                  {lastSync ? `Última sincronização: ${fmtDate(lastSync)}` : 'Nenhuma sincronização realizada ainda'}
                </div>
              </div>
              <button onClick={handleSync} disabled={!connected || syncing} className="inline-flex items-center justify-center gap-2 border border-[#F26A21] px-5 py-3 text-xs font-semibold tracking-wide text-[#F26A21] transition hover:bg-[#F26A21] hover:text-[#050505] disabled:cursor-not-allowed disabled:border-[#1c1c1c] disabled:text-[#444] disabled:hover:bg-transparent">
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} SINCRONIZAR
              </button>
            </div>

            {syncResult && (
              <div className="mt-5 border-t border-[#1c1c1c] pt-5">
                {syncResult.error ? (
                  <div className="flex items-start gap-3 text-sm text-[#f44]">
                    <X size={16} className="mt-0.5 shrink-0" />
                    <span>{syncResult.error}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-sm text-[#888]">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#F26A21]" />
                    <div>
                      <span className="text-[#E0E0E0]">Sincronização concluída.</span>{' '}
                      {syncResult.synced != null && <span>{syncResult.synced} importado(s), </span>}
                      {syncResult.updated != null && syncResult.updated > 0 && <span>{syncResult.updated} atualizado(s), </span>}
                      {syncResult.skipped != null && <span>{syncResult.skipped} ignorado(s)</span>}
                      {syncResult.total != null && <span> · {syncResult.total} post(s) processado(s)</span>}
                      <div className="mt-1 text-xs text-[#666]">Novos anúncios são publicados automaticamente no showroom.</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 border-t border-[#1c1c1c] pt-5">
              <Instagram size={14} className="mt-0.5 shrink-0 text-[#666]" />
              <p className="text-xs leading-relaxed text-[#666]">
                A sincronização busca as publicações recentes do Instagram a cada 20 minutos (GitHub Actions). Cada post de veículo é <span className="text-[#E0E0E0]">importado e publicado automaticamente</span> no showroom. Posts já importados apenas atualizam legendas, fotos e classificação — edições manuais (título, preço, descrição) não são sobrescritas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
