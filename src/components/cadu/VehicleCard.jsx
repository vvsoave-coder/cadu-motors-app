import React from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { ArrowUpRight } from 'lucide-react';
import VehicleBadge from '@/components/cadu/VehicleBadge';

function formatBRL(v) {
  if (v == null) return 'Sob consulta';
  return 'R$ ' + v.toLocaleString('pt-BR');
}

function mainPhoto(vehicle) {
  if (vehicle.photos && vehicle.photos.length > 0) return vehicle.photos[0];
  return vehicle.photo_url;
}

export default function VehicleCard({ vehicle, index, onSelect }) {
  const isVendido = vehicle.is_vendido || vehicle.category === 'vendido';
  const isBlindado = vehicle.is_blindado || vehicle.category === 'blindado';

  return (
    <motion.button
      data-cursor="view"
      onClick={() => onSelect(vehicle)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group relative flex flex-col overflow-hidden bg-[#121212] text-left ring-1 ring-[#1c1c1c] transition hover:ring-[#F26A21]/60"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image src={mainPhoto(vehicle)} fittingType="fill" className="h-full w-full transition duration-700 group-hover:scale-105" />
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {isVendido && <VehicleBadge type="vendido" />}
          {isBlindado && <VehicleBadge type="blindado" />}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className={`border px-4 py-2 text-xs tracking-[0.25em] backdrop-blur-sm ${isVendido ? 'border-[#666] bg-[#050505]/60 text-[#888]' : 'border-[#F26A21] bg-[#050505]/60 text-[#F26A21]'}`}>
            {isVendido ? 'VENDIDO' : 'VER FICHA'}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 truncate font-display text-sm font-semibold text-[#E0E0E0]">{vehicle.title}</h3>
        {vehicle.year && <span className="text-[10px] tracking-[0.15em] text-[#666]">{vehicle.year}</span>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] text-[#666]">PREÇO</span>
            <p className={`font-display text-lg font-bold ${isVendido ? 'text-[#888]' : 'text-[#F26A21]'}`}>{isVendido ? 'Vendido' : formatBRL(vehicle.price)}</p>
          </div>
          <ArrowUpRight size={18} className="text-[#888888] transition group-hover:text-[#F26A21]" />
        </div>
      </div>
    </motion.button>
  );
}