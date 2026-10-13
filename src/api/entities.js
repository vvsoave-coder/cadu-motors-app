// Camada de compatibilidade: reproduz a forma da API de entidades do Base44
// (list/get/create/update/delete/subscribe) em cima do Supabase.
// Objetivo: as páginas (Home, VehicleList, VehicleEdit...) quase não mudam —
// só trocam o import de `base44.entities.Vehicle` para `Vehicle` daqui.

import { supabase } from './supabaseClient';

const TABLE = 'vehicles';

function parseSort(sort) {
  // Base44 usava string tipo '-created_date' (desc) ou 'created_date' (asc)
  if (!sort) return { column: 'created_date', ascending: false };
  const desc = sort.startsWith('-');
  return { column: desc ? sort.slice(1) : sort, ascending: !desc };
}

// Equivalente a base44.integrations.Core.UploadFile({ file }) — upload manual
// de foto no Admin (o sync automático do Instagram usa o bucket direto pelo
// backend, não passa por aqui).
export async function uploadVehiclePhoto(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `manual/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('vehicle-photos')
    .upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
  return data.publicUrl;
}

export const Vehicle = {
  async list(sort = '-created_date', limit = 100) {
    const { column, ascending } = parseSort(sort);
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order(column, { ascending })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Realtime — mesmo formato de evento que o Base44 ({type, data}),
  // pra Home.jsx não precisar mudar a lógica de handling.
  subscribe(callback) {
    const channel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        const typeMap = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' };
        const type = typeMap[payload.eventType] || payload.eventType;
        const data = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
        callback({ type, data });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
