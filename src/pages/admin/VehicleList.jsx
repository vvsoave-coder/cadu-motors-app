import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Vehicle } from '@/api/entities';
import { functions } from '@/api/functions';
import { Image } from '@/components/ui/image';
import { Plus, RefreshCw, Edit, Trash2, Loader2, Instagram } from 'lucide-react';
import VehicleBadge from '@/components/cadu/VehicleBadge';
import BrandLogo from '@/components/cadu/BrandLogo';

const TABS = [
  { v: 'all', l: 'Todos' },
  { v: 'blindado', l: 'Blindados' },
  { v: 'portfolio', l: 'Portfólio' },
  { v: 'vendido', l: 'Vendidos' },
];

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reprocessing, setReprocessing] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    Vehicle.list('-created_date', 200)
      .then((list) => { setVehicles(list || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all'
    ? vehicles
    : vehicles.filter(v => (v.category || 'portfolio') === filter);

  const handleReprocessAll = async () => {
    setReprocessing(true);
    try {
      await functions.invoke('reprocess-classification', { all: true });
      load();
    } catch (e) { console.error(e); }
    setReprocessing(false);
  };

  const handleReprocessOne = async (id) => {
    try {
      await functions.invoke('reprocess-classification', { vehicle_id: id });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este veículo?')) return;
    try {
      await Vehicle.delete(id);
      load();
    } catch (e) { console.error(e); }
  };

  const handleToggleAtivo = async (v) => {
    try {
      await Vehicle.update(v.id, { ativo: v.ativo === false ? true : false });
      load();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E0E0E0]">
      <header className="sticky top-0 z-30 border-b border-[#1c1c1c] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <BrandLogo size="text-lg" />
            <Link to="/" className="text-xs tracking-[0.2em] text-[#888] transition hover:text-[#F26A21]">← VOLTAR AO SITE</Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReprocessAll} disabled={reprocessing} className="inline-flex items-center gap-2 border border-[#1c1c1c] px-4 py-2 text-xs tracking-wide text-[#E0E0E0] transition hover:border-[#F26A21] disabled:opacity-50">
              {reprocessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} REPROCESSAR TODOS
            </button>
            <Link to="/admin/instagram" className="inline-flex items-center gap-2 border border-[#1c1c1c] px-4 py-2 text-xs tracking-wide text-[#E0E0E0] transition hover:border-[#F26A21] hover:text-[#F26A21]">
              <Instagram size={14} /> INSTAGRAM
            </Link>
            <button onClick={() => navigate('/admin/vehicles/new')} className="inline-flex items-center gap-2 bg-[#F26A21] px-4 py-2 text-xs font-semibold tracking-wide text-[#050505] transition hover:bg-[#FF8B43]">
              <Plus size={14} /> NOVO VEÍCULO
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="flex gap-1 border-b border-[#1c1c1c]">
          {TABS.map(t => (
            <button key={t.v} onClick={() => setFilter(t.v)} className={`px-4 py-3 text-xs tracking-[0.15em] transition ${filter === t.v ? 'border-b-2 border-[#F26A21] text-[#F26A21]' : 'text-[#888] hover:text-[#E0E0E0]'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#F26A21]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#666]">Nenhum veículo encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(v => {
              const cat = v.category || 'portfolio';
              const photo = (v.photos && v.photos[0]) || v.photo_url;
              return (
                <div key={v.id} className="flex gap-4 border border-[#1c1c1c] bg-[#121212] p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#0a0a0a]">
                    {photo && <Image src={photo} fittingType="fill" className="h-full w-full" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-[#E0E0E0]">{v.title}</h3>
                      <div className="flex shrink-0 gap-1">
                        {v.is_blindado && cat === 'vendido' && <VehicleBadge type="blindado" />}
                        {cat !== 'portfolio' && <VehicleBadge type={cat} />}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#666]">{v.year || '—'} · {v.price ? 'R$ ' + v.price.toLocaleString('pt-BR') : 'Sob consulta'}</span>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                      <button onClick={() => navigate(`/admin/vehicles/${v.id}`)} className="inline-flex items-center gap-1 text-[10px] text-[#888] transition hover:text-[#F26A21]"><Edit size={12} /> Editar</button>
                      <button onClick={() => handleReprocessOne(v.id)} className="inline-flex items-center gap-1 text-[10px] text-[#888] transition hover:text-[#F26A21]"><RefreshCw size={12} /> Reprocessar</button>
                      <button onClick={() => handleToggleAtivo(v)} className={`text-[10px] transition ${v.ativo !== false ? 'text-[#F26A21]' : 'text-[#666]'}`}>{v.ativo !== false ? '● Ativo' : '○ Inativo'}</button>
                      <button onClick={() => handleDelete(v.id)} className="ml-auto text-[10px] text-[#888] transition hover:text-[#f44]"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
