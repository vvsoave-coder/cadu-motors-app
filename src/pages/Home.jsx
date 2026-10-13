import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Vehicle } from '@/api/entities';
import Hero from '@/components/cadu/Hero';
import VehicleSection from '@/components/cadu/VehicleSection';
import VehicleDossier from '@/components/cadu/VehicleDossier';
import Footer from '@/components/cadu/Footer';
import CustomCursor from '@/components/cadu/CustomCursor';
import FloatingWhatsApp from '@/components/cadu/FloatingWhatsApp';

const getCategory = (v) => v.category || (v.is_vendido ? 'vendido' : v.is_blindado ? 'blindado' : 'portfolio');

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => Vehicle.list('-created_date', 100)
      .then((list) => { if (mounted) { setVehicles(list || []); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    load();
    const unsubscribe = Vehicle.subscribe((event) => {
      if (!mounted) return;
      setVehicles((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        if (event.type === 'delete') return list.filter(v => v.id !== event.data?.id);
        const idx = list.findIndex(v => v.id === event.data?.id);
        if (event.type === 'update' && idx >= 0) { list[idx] = event.data; return list; }
        if (event.type === 'create' && idx < 0) { list.unshift(event.data); return list; }
        return prev;
      });
    });
    return () => { mounted = false; unsubscribe && unsubscribe(); };
  }, []);

  const blindados = useMemo(() => vehicles.filter(v => getCategory(v) === 'blindado' && v.ativo !== false && v.is_sample !== true), [vehicles]);
  const portfolio = useMemo(() => vehicles.filter(v => getCategory(v) === 'portfolio' && v.ativo !== false && v.is_sample !== true), [vehicles]);
  const vendidos = useMemo(() => vehicles.filter(v => getCategory(v) === 'vendido' && v.ativo !== false && v.is_sample !== true), [vehicles]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0]">
      <CustomCursor />
      <FloatingWhatsApp />
      <Hero />
      <VehicleSection
        id="blindados"
        title="BLINDADOS"
        subtitle="CARRO-CHEFE · PROTEÇÃO E CONFORTO"
        vehicles={blindados}
        loading={loading}
        onSelect={setSelected}
        variant="blindado"
      />
      <VehicleSection
        id="portfolio"
        title="NÃO BLINDADOS"
        subtitle="VEÍCULOS DISPONÍVEIS · ATUALIZADO VIA INSTAGRAM"
        vehicles={portfolio}
        loading={loading}
        onSelect={setSelected}
        showSyncNote
      />
      <VehicleSection
        id="vendidos"
        title="VENDIDOS"
        subtitle="NEGÓCIOS FECHADOS"
        vehicles={vendidos}
        loading={loading}
        onSelect={setSelected}
        variant="vendido"
      />
      <Footer />
      <AnimatePresence>
        {selected && <VehicleDossier key={selected.id} vehicle={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
