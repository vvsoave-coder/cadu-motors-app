import React from 'react';

/**
 * Selos BLINDADO e VENDIDO.
 * Caixa alta, fundo laranja ou preto com borda laranja.
 */
export default function VehicleBadge({ type, className = '' }) {
  if (type === 'vendido') {
    return (
      <span
        className={`inline-flex items-center bg-[#F26A21] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#0A0A0A] ${className}`}
      >
        VENDIDO
      </span>
    );
  }
  if (type === 'blindado') {
    return (
      <span
        className={`inline-flex items-center border border-[#F26A21] bg-[#0A0A0A] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#F26A21] ${className}`}
      >
        BLINDADO
      </span>
    );
  }
  return null;
}