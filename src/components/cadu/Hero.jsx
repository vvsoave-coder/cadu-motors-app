import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { ChevronDown, MessageCircle, MapPin, Instagram } from 'lucide-react';
import { siteConfig, waLink, mapsLink } from '@/lib/siteConfig';
import FacebookIcon from '@/components/cadu/FacebookIcon';

// Antes apontava pro CDN do Base44 (media.base44.com/.../generated_f0606a88.png).
// Baixei essa imagem e ela agora é um asset estático do próprio projeto
// (public/hero.png), pra não depender de nada do Base44 depois da migração.
const HERO_IMG = '/hero.png';

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const sweepX = useTransform(scrollYProgress, [0, 1], ['-60%', '260%']);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#050505]">
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <Image src={HERO_IMG} fittingType="fill" className="h-full w-full" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/40" />
      <motion.div
        style={{ x: sweepX }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#F26A21]/[0.12] to-transparent"
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-xl font-bold tracking-tight text-[#E0E0E0] md:text-2xl">
          C<span className="text-[#F26A21]">A</span>DU MOTORS
        </span>
        <nav className="hidden items-center gap-6 text-xs tracking-[0.2em] text-[#888888] md:flex">
          <button onClick={() => scrollTo('blindados')} className="transition hover:text-[#F26A21]">BLINDADOS</button>
          <button onClick={() => scrollTo('portfolio')} className="transition hover:text-[#F26A21]">NÃO BLINDADOS</button>
          <button onClick={() => scrollTo('vendidos')} className="transition hover:text-[#F26A21]">VENDIDOS</button>
          <button onClick={() => scrollTo('contato')} className="transition hover:text-[#F26A21]">CONTATO</button>
        </nav>
      </div>

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 flex h-full flex-col justify-center px-6 md:px-12">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-12 bg-[#F26A21]" />
          <span className="text-xs tracking-[0.3em] text-[#888888]">VEÍCULOS PREMIUM · BLINDADOS · PORTFÓLIO</span>
        </div>
        <h1 className="font-display text-[15vw] font-bold leading-[0.85] tracking-tight text-[#E0E0E0] md:text-[9rem]">
          C<span className="text-[#F26A21]">A</span>DU<br />MOTORS
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-display text-sm font-semibold text-[#F26A21]">+ DE 30 ANOS</span>
          <span className="h-px w-6 bg-[#333]" />
          <span className="text-sm text-[#888888]">no mercado de automóveis</span>
        </div>
        <p className="mt-6 max-w-md text-base leading-relaxed text-[#888888] md:text-lg">
          Veículos selecionados em um portfólio vivo — sincronizado automaticamente com o nosso Instagram.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button onClick={() => scrollTo('blindados')} className="group inline-flex items-center gap-3 bg-[#F26A21] px-7 py-4 text-sm font-semibold tracking-wide text-[#050505] transition hover:bg-[#FF8B43]">
            VER PORTFÓLIO
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
          <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#222] px-7 py-4 text-sm tracking-wide text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
            <MessageCircle size={16} /> WhatsApp {siteConfig.whatsapp.display}
          </a>
          <a href={siteConfig.instagram.url} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center border border-[#222] px-5 py-4 text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
            <Instagram size={16} />
          </a>
          <a href={siteConfig.facebook.url} target="_blank" rel="noreferrer" aria-label="Facebook" className="inline-flex items-center justify-center border border-[#222] px-5 py-4 text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
            <FacebookIcon size={16} />
          </a>
        </div>
      </motion.div>

      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3 md:bottom-10 md:left-12">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F26A21] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F26A21]" />
          </span>
          <span className="text-[10px] tracking-[0.25em] text-[#888888]">FEED AO VIVO · INSTAGRAM</span>
        </div>
        <a href={mapsLink()} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] text-[#888888] transition hover:text-[#F26A21]">
          <MapPin size={12} className="text-[#F26A21]" /> {siteConfig.address.label} · {siteConfig.address.city}/{siteConfig.address.state}
        </a>
      </div>
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center gap-2 text-[#888888] md:bottom-10 md:right-12">
        <span className="text-[10px] tracking-[0.25em] [writing-mode:vertical-rl]">SCROLL</span>
        <ChevronDown size={14} className="animate-bounce" />
      </div>
    </section>
  );
}
