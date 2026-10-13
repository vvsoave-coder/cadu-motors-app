import React from 'react';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { siteConfig, waLink, mapsLink, fullAddress } from '@/lib/siteConfig';
import FacebookIcon from '@/components/cadu/FacebookIcon';

export default function Footer() {
  const a = siteConfig.address;
  return (
    <footer id="contato" className="relative overflow-hidden border-t border-[#1c1c1c] bg-[#050505]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <span className="mb-8 block font-display text-3xl font-bold tracking-tight text-[#E0E0E0]">
          C<span className="text-[#F26A21]">A</span>DU MOTORS
        </span>
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-12 bg-[#F26A21]" />
          <span className="text-xs tracking-[0.3em] text-[#888888]">CONTATO DIRETO</span>
        </div>
        <h2 className="font-display text-[12vw] font-bold leading-[0.9] tracking-tight text-[#E0E0E0] md:text-[7rem]">VAMOS<br />NEGOCIAR?</h2>
        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-sm leading-relaxed text-[#888888]">Cada veículo do portfólio é uma publicação real do nosso Instagram. Fale diretamente com o Cadu pelo WhatsApp e feche negócio.</p>
            <a href={waLink()} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-3 bg-[#F26A21] px-8 py-4 text-sm font-semibold tracking-wide text-[#050505] transition hover:bg-[#FF8B43]">
              <MessageCircle size={16} /> WHATSAPP {siteConfig.whatsapp.display}
            </a>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] tracking-[0.3em] text-[#666]">SIGA:</span>
              <a href={siteConfig.instagram.url} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center border border-[#1c1c1c] text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
                <Instagram size={15} />
              </a>
              <a href={siteConfig.facebook.url} target="_blank" rel="noreferrer" aria-label="Facebook" className="inline-flex h-9 w-9 items-center justify-center border border-[#1c1c1c] text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
                <FacebookIcon size={15} />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:text-right">
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#666]">WHATSAPP</span>
              <a href={waLink()} target="_blank" rel="noreferrer" className="block text-sm text-[#E0E0E0] transition hover:text-[#F26A21]">{siteConfig.whatsapp.display}</a>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#666]">LOCALIZAÇÃO</span>
              <a href={mapsLink()} target="_blank" rel="noreferrer" className="mt-1 flex items-start gap-2 md:justify-end">
                <MapPin size={14} className="mt-0.5 text-[#F26A21]" />
                <span className="text-left text-sm leading-relaxed text-[#E0E0E0]">{fullAddress()}<br />{a.city} – {a.state}</span>
              </a>
              {a.note && <span className="mt-1 block text-[10px] text-[#666]">{a.note}</span>}
            </div>
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#666]">INSTAGRAM</span>
              <a href={siteConfig.instagram.url} target="_blank" rel="noreferrer" className="block text-sm text-[#E0E0E0] transition hover:text-[#F26A21]">{siteConfig.instagram.handle}</a>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.3em] text-[#666]">FACEBOOK</span>
              <a href={siteConfig.facebook.url} target="_blank" rel="noreferrer" className="block text-sm text-[#E0E0E0] transition hover:text-[#F26A21]">Cadu Motors</a>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-[#1c1c1c] pt-6 text-[10px] tracking-[0.2em] text-[#666] md:flex-row md:items-center">
          <span>© 2026 C<span className="text-[#F26A21]">A</span>DU MOTORS · TODOS OS DIREITOS RESERVADOS</span>
          <span>{a.label.toUpperCase()} · MACHINED ELEGANCE</span>
        </div>
      </div>
    </footer>
  );
}