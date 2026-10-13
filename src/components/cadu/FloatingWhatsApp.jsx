import React from 'react';
import { MessageCircle } from 'lucide-react';
import { siteConfig, waLink } from '@/lib/siteConfig';

export default function FloatingWhatsApp() {
  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noreferrer"
      aria-label={`WhatsApp ${siteConfig.whatsapp.display}`}
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3"
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#F26A21]/60 bg-[#0a0a0a] text-[#F26A21] shadow-lg transition group-hover:scale-105 group-hover:border-[#F26A21]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26A21]/20" />
        <MessageCircle size={26} className="relative" />
      </span>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap rounded-full border border-[#1c1c1c] bg-[#0a0a0a] py-3 text-xs tracking-wide text-[#E0E0E0] opacity-0 transition-all duration-300 group-hover:max-w-[240px] group-hover:px-4 group-hover:opacity-100 md:block">
        WhatsApp · {siteConfig.whatsapp.display}
      </span>
    </a>
  );
}