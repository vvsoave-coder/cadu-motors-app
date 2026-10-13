import React from 'react';

/**
 * Logotipo textual "CADU MOTORS".
 * A letra "A" de "CADU" em laranja, o restante na cor do tema (claro/escuro).
 */
export default function BrandLogo({ className = '', variant = 'light', size = 'text-xl' }) {
  const base = variant === 'light' ? '#E8E8E8' : '#0A0A0A';
  return (
    <span
      className={`font-display font-bold tracking-tight ${size} ${className}`}
      style={{ color: base }}
    >
      C<span style={{ color: '#F26A21' }}>A</span>DU MOTORS
    </span>
  );
}