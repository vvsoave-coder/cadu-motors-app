import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import VehicleCard from '@/components/cadu/VehicleCard';
import { Instagram, Shield } from 'lucide-react';

function LoadingGauge() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1c1c1c" strokeWidth="4" />
          <motion.circle
            cx="50" cy="50" r="44" fill="none" stroke="#F26A21" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="276"
            initial={{ strokeDashoffset: 276 }}
            animate={{ strokeDashoffset: [276, 0, 276] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xs tracking-widest text-[#888888]">RPM</span>
      </div>
      <span className="mt-4 text-[10px] tracking-[0.3em] text-[#666]">CARREGANDO</span>
    </div>
  );
}

const PRICE_RANGES = [
  { value: '', label: 'Faixa de preço' },
  { value: '0-50', label: 'Até R$ 50 mil' },
  { value: '50-100', label: 'R$ 50k – 100k' },
  { value: '100-200', label: 'R$ 100k – 200k' },
  { value: '200+', label: 'Acima de R$ 200k' },
];

export default function VehicleSection({ id, title, subtitle, vehicles, loading, onSelect, variant, showSyncNote }) {
  const [brandFilter, setBrandFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const brands = useMemo(() => [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort(), [vehicles]);
  const years = useMemo(() => [...new Set(vehicles.map(v => v.year).filter(Boolean))].sort((a, b) => b - a), [vehicles]);

  const filtered = useMemo(() => {
    let result = vehicles.filter(v => {
      if (brandFilter && v.brand !== brandFilter) return false;
      if (yearFilter && String(v.year) !== String(yearFilter)) return false;
      if (priceFilter) {
        const price = v.price || 0;
        if (priceFilter === '0-50' && price > 50000) return false;
        if (priceFilter === '50-100' && (price < 50000 || price > 100000)) return false;
        if (priceFilter === '100-200' && (price < 100000 || price > 200000)) return false;
        if (priceFilter === '200+' && price < 200000) return false;
      }
      return true;
    });
    if (variant === 'vendido') {
      result = [...result].sort((a, b) => {
        const da = a.data_venda ? new Date(a.data_venda).getTime() : 0;
        const db = b.data_venda ? new Date(b.data_venda).getTime() : 0;
        return db - da;
      });
    }
    return result;
  }, [vehicles, brandFilter, yearFilter, priceFilter, variant]);

  const showFilters = !loading && vehicles.length > 0;

  return (
    <section id={id} className="relative bg-[#050505] px-6 py-24 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                {variant === 'vendido' ? (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#666]" />
                ) : (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26A21] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F26A21]" />
                  </>
                )}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#888888]">{subtitle}</span>
            </div>
            <h2 className="font-display text-5xl font-bold tracking-tight text-[#E0E0E0] md:text-6xl">{title}</h2>
          </div>
        </div>

        {variant === 'blindado' && (
          <div className="mt-6 border border-[#F26A21]/30 bg-gradient-to-r from-[#F26A21]/10 to-transparent p-6">
            <div className="mb-2 flex items-center gap-3">
              <Shield size={18} className="text-[#F26A21]" />
              <span className="text-[10px] tracking-[0.3em] text-[#F26A21]">VEÍCULOS BLINDADOS</span>
            </div>
            <p className="text-sm text-[#888]">Proteção e conforto em cada detalhe. Seleção de veículos blindados de alta performance.</p>
          </div>
        )}

        {showFilters && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {brands.length > 1 && (
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="border border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 text-sm text-[#E0E0E0] focus:border-[#F26A21] focus:outline-none">
                <option value="">Todas as marcas</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="border border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 text-sm text-[#E0E0E0] focus:border-[#F26A21] focus:outline-none">
              {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {years.length > 1 && (
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="border border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 text-sm text-[#E0E0E0] focus:border-[#F26A21] focus:outline-none">
                <option value="">Todos os anos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        )}

        {loading ? (
          <LoadingGauge />
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center text-[#666]">Nenhum veículo no momento.</div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} index={i} onSelect={onSelect} />
            ))}
          </div>
        )}

        {showSyncNote && (
          <div className="mt-16 flex items-start gap-4 border-t border-[#1c1c1c] pt-8">
            <Instagram size={18} className="mt-0.5 shrink-0 text-[#F26A21]" />
            <p className="text-xs leading-relaxed text-[#888888]">
              Esta seção é alimentada automaticamente pelas publicações do Instagram. Sincronização ativa — novos anúncios de veículos publicados no <span className="text-[#E0E0E0]">@cadu.motors</span> entram aqui automaticamente (a cada 20 min).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}