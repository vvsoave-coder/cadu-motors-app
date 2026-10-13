import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Vehicle, uploadVehiclePhoto } from '@/api/entities';
import { functions } from '@/api/functions';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Loader2, X, Upload } from 'lucide-react';
import VehicleBadge from '@/components/cadu/VehicleBadge';
import BrandLogo from '@/components/cadu/BrandLogo';

const inputClass = "w-full border border-[#1c1c1c] bg-[#121212] px-4 py-3 text-sm text-[#E0E0E0] placeholder:text-[#555] focus:border-[#F26A21] focus:outline-none";

const EMPTY = {
  title: '', instagram_caption: '', description: '', price: '',
  photos: [], brand: '', model: '', year: '', km: '',
  transmission: '', fuel: '', color: '', instagram_url: '',
  override_manual: false, ativo: true,
};

export default function VehicleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Vehicle.get(id)
      .then((v) => {
        if (v) {
          setForm({
            ...EMPTY,
            ...v,
            price: v.price || '',
            year: v.year || '',
            km: v.km || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadVehiclePhoto(file);
        urls.push(url);
      }
      setForm(f => ({ ...f, photos: [...(f.photos || []), ...urls] }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const removePhoto = (idx) => {
    setForm(f => ({ ...f, photos: (f.photos || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        instagram_caption: form.instagram_caption,
        description: form.description,
        price: form.price ? Number(form.price) : null,
        photos: form.photos,
        photo_url: form.photos && form.photos[0] ? form.photos[0] : null,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        km: form.km ? Number(form.km) : null,
        transmission: form.transmission || null,
        fuel: form.fuel || null,
        color: form.color || null,
        instagram_url: form.instagram_url || null,
        override_manual: form.override_manual,
        ativo: form.ativo,
      };

      let savedId = id;
      if (id) {
        await Vehicle.update(id, data);
      } else {
        const created = await Vehicle.create(data);
        savedId = created.id;
      }

      if (!form.override_manual && savedId) {
        try {
          await functions.invoke('reprocess-classification', { vehicle_id: savedId });
        } catch (e) { console.error(e); }
      }

      navigate('/admin');
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  const category = form.category || (form.is_vendido ? 'vendido' : form.is_blindado ? 'blindado' : 'portfolio');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E0E0E0]">
      <header className="sticky top-0 z-30 border-b border-[#1c1c1c] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <BrandLogo size="text-lg" />
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-[#888] transition hover:text-[#F26A21]">
            <ArrowLeft size={14} /> VOLTAR
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold">{id ? 'Editar Veículo' : 'Novo Veículo'}</h1>

        <div className="space-y-5">
          <Field label="Título / Modelo *">
            <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="Ex: BMW 320i M Sport" />
          </Field>

          <Field label="Legenda do Instagram (base da classificação automática)">
            <textarea value={form.instagram_caption} onChange={e => set('instagram_caption', e.target.value)} rows={5} className={`${inputClass} resize-y`} placeholder="Cole aqui a legenda do post do Instagram..." />
            <p className="mt-1 text-[10px] text-[#666]">A classificação (Blindado/Portfólio/Vendido) roda automaticamente sobre este texto ao salvar.</p>
          </Field>

          <div className="flex items-center gap-3 border border-[#1c1c1c] bg-[#121212] p-4">
            <span className="text-[10px] tracking-[0.2em] text-[#666]">CATEGORIA:</span>
            {category === 'portfolio' && <span className="text-[10px] font-bold tracking-[0.2em] text-[#888]">PORTFÓLIO</span>}
            {category === 'blindado' && <VehicleBadge type="blindado" />}
            {category === 'vendido' && <VehicleBadge type="vendido" />}
            {form.override_manual && <span className="ml-auto text-[10px] text-[#F26A21]">⚠ OVERRIDE MANUAL</span>}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.override_manual} onChange={e => set('override_manual', e.target.checked)} className="h-4 w-4 accent-[#F26A21]" />
            <span className="text-sm text-[#E0E0E0]">Override manual (impede a reclassificação automática)</span>
          </label>

          <Field label="Preço (BRL)">
            <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={inputClass} placeholder="85000" />
          </Field>

          <Field label="Descrição (exibida no site)">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={`${inputClass} resize-y`} />
          </Field>

          <Field label="Fotos">
            <div className="flex flex-wrap gap-3">
              {(form.photos || []).map((p, i) => (
                <div key={i} className="relative h-24 w-24">
                  <Image src={p} fittingType="fill" className="h-full w-full" />
                  <button onClick={() => removePhoto(i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#F26A21] text-[#050505]"><X size={12} /></button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-[#333] text-[#666] transition hover:border-[#F26A21] hover:text-[#F26A21]">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
              </label>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca"><input value={form.brand} onChange={e => set('brand', e.target.value)} className={inputClass} /></Field>
            <Field label="Modelo"><input value={form.model} onChange={e => set('model', e.target.value)} className={inputClass} /></Field>
            <Field label="Ano"><input type="number" value={form.year} onChange={e => set('year', e.target.value)} className={inputClass} /></Field>
            <Field label="KM"><input type="number" value={form.km} onChange={e => set('km', e.target.value)} className={inputClass} /></Field>
            <Field label="Câmbio"><input value={form.transmission} onChange={e => set('transmission', e.target.value)} className={inputClass} /></Field>
            <Field label="Combustível"><input value={form.fuel} onChange={e => set('fuel', e.target.value)} className={inputClass} /></Field>
            <Field label="Cor"><input value={form.color} onChange={e => set('color', e.target.value)} className={inputClass} /></Field>
            <Field label="Instagram URL"><input value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} className={inputClass} /></Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} className="h-4 w-4 accent-[#F26A21]" />
            <span className="text-sm text-[#E0E0E0]">Visível no site</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-2 bg-[#F26A21] px-6 py-3 text-sm font-semibold text-[#050505] transition hover:bg-[#FF8B43] disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} SALVAR
            </button>
            <button onClick={() => navigate('/admin')} className="border border-[#1c1c1c] px-6 py-3 text-sm text-[#888] transition hover:text-[#E0E0E0]">CANCELAR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] tracking-[0.2em] text-[#666]">{label.toUpperCase()}</label>
      {children}
    </div>
  );
}
