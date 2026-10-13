import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { X, Instagram, MessageCircle, Gauge, Calendar, Fuel, Cog, Palette } from 'lucide-react';
import { waLink } from '@/lib/siteConfig';
import VehicleBadge from '@/components/cadu/VehicleBadge';

function formatBRL(v) {
  if (v == null) return 'Sob consulta';
  return 'R$ ' + v.toLocaleString('pt-BR');
}

function mainPhoto(vehicle) {
  if (vehicle.photos && vehicle.photos.length > 0) return vehicle.photos[0];
  return vehicle.photo_url;
}

export default function VehicleDossier({ vehicle, onClose }) {
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => { setActivePhoto(0); }, [vehicle.id]);

  const isVendido = vehicle.is_vendido || vehicle.category === 'vendido';
  const isBlindado = vehicle.is_blindado || vehicle.category === 'blindado';
  const ad = vehicle.instagram_url || vehicle.ad_link || 'https://www.instagram.com/cadu.motors/';

  const photos = vehicle.photos && vehicle.photos.length > 0
    ? vehicle.photos
    : (vehicle.photo_url ? [vehicle.photo_url] : []);
  const currentPhoto = photos[activePhoto] || photos[0];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#1c1c1c] bg-[#0a0a0a] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#1c1c1c] px-6 py-4">
          <span className="text-[10px] tracking-[0.3em] text-[#666]">FICHA DO VEÍCULO</span>
          <button onClick={onClose} className="text-[#888888] transition hover:text-[#F26A21]"><X size={20} /></button>
        </div>

        <div className="relative aspect-square shrink-0 overflow-hidden">
          <Image src={currentPhoto} fittingType="fill" className="h-full w-full" />
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {isVendido && <VehicleBadge type="vendido" />}
            {isBlindado && <VehicleBadge type="blindado" />}
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-[#1c1c1c] px-6 py-3 scrollbar-thin">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden ring-1 transition ${i === activePhoto ? 'ring-[#F26A21]' : 'ring-[#1c1c1c] hover:ring-[#444]'}`}
              >
                <Image src={p} fittingType="fill" className="h-full w-full" />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <h2 className="font-display text-2xl font-bold text-[#E0E0E0]">{vehicle.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#888888]">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#F26A21]" />
            {isVendido ? 'Veículo já vendido' : 'Disponível · atualizado via Instagram'}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-px bg-[#1c1c1c]">
            {vehicle.year != null && (
              <div className="bg-[#0a0a0a] p-4">
                <Calendar size={14} className="text-[#666]" />
                <span className="mt-2 block text-[10px] tracking-[0.2em] text-[#666]">ANO</span>
                <span className="text-sm font-semibold text-[#E0E0E0]">{vehicle.year}</span>
              </div>
            )}
            {vehicle.km != null && (
              <div className="bg-[#0a0a0a] p-4">
                <Gauge size={14} className="text-[#666]" />
                <span className="mt-2 block text-[10px] tracking-[0.2em] text-[#666]">KM</span>
                <span className="text-sm font-semibold text-[#E0E0E0]">{vehicle.km ? vehicle.km.toLocaleString('pt-BR') : '—'}</span>
              </div>
            )}
            <div className="bg-[#0a0a0a] p-4">
              <span className="block text-[10px] tracking-[0.2em] text-[#666]">PREÇO</span>
              <span className={`font-display text-lg font-bold ${isVendido ? 'text-[#888]' : 'text-[#F26A21]'}`}>{isVendido ? 'Vendido' : formatBRL(vehicle.price)}</span>
            </div>
          </div>

          {(vehicle.transmission || vehicle.fuel || vehicle.color || vehicle.brand) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {vehicle.brand && <SpecChip icon={<Palette size={12} />} label="Marca" value={vehicle.brand} />}
              {vehicle.transmission && <SpecChip icon={<Cog size={12} />} label="Câmbio" value={vehicle.transmission} />}
              {vehicle.fuel && <SpecChip icon={<Fuel size={12} />} label="Combustível" value={vehicle.fuel} />}
              {vehicle.color && <SpecChip icon={<Palette size={12} />} label="Cor" value={vehicle.color} />}
            </div>
          )}

          <div className="mt-6">
            <span className="text-[10px] tracking-[0.3em] text-[#666]">DESCRIÇÃO</span>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#E0E0E0]">{vehicle.description}</p>
          </div>

          <a href={ad} target="_blank" rel="noreferrer" className="mt-6 flex items-center gap-3 border border-[#1c1c1c] p-4 transition hover:border-[#F26A21]/50">
            <Instagram size={16} className="text-[#F26A21]" />
            <div className="flex-1">
              <span className="block text-xs text-[#E0E0E0]">Ver publicação original</span>
              <span className="block text-[10px] text-[#666]">@cadu.motors · Instagram</span>
            </div>
          </a>
        </div>

        <div className="border-t border-[#1c1c1c] bg-[#050505] p-6">
          {isVendido ? (
            <div className="flex w-full items-center justify-center gap-3 border border-[#1c1c1c] bg-[#0a0a0a] py-4 text-sm tracking-wide text-[#888]">
              VEÍCULO JÁ VENDIDO
            </div>
          ) : (
            <a href={waLink(`Olá! Tenho interesse no ${vehicle.title} (${formatBRL(vehicle.price)}) anunciado no site da Cadu Motors.`)} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-3 bg-[#F26A21] py-4 text-sm font-semibold tracking-wide text-[#050505] transition hover:bg-[#FF8B43]">
              <MessageCircle size={16} /> INICIAR NEGOCIAÇÃO
            </a>
          )}
          {!isVendido && <p className="mt-3 text-center text-[10px] tracking-[0.2em] text-[#666]">RESPOSTA DIRETA NO WHATSAPP</p>}
        </div>
      </motion.aside>
    </>
  );
}

function SpecChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 border border-[#1c1c1c] px-3 py-2">
      <span className="text-[#F26A21]">{icon}</span>
      <div>
        <span className="block text-[9px] tracking-[0.15em] text-[#666]">{label.toUpperCase()}</span>
        <span className="text-xs font-semibold text-[#E0E0E0]">{value}</span>
      </div>
    </div>
  );
}