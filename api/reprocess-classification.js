// POST /api/reprocess-classification
// Body: { vehicle_id } ou { all: true }
// Porta base44/functions/reprocessClassification/entry.ts.

import { requireAdmin } from './_lib/requireAdmin.js';
import { buildClassificationUpdate } from '../src/lib/classification.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { supabaseAdmin } = await requireAdmin(req);
    const { vehicle_id, all } = req.body || {};

    let vehicles = [];
    if (all) {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('id, instagram_caption, description, data_venda, override_manual')
        .order('created_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      vehicles = data || [];
    } else if (vehicle_id) {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('id, instagram_caption, description, data_venda, override_manual')
        .eq('id', vehicle_id)
        .single();
      if (error) throw error;
      vehicles = data ? [data] : [];
    } else {
      return res.status(400).json({ error: 'vehicle_id ou all=true obrigatório' });
    }

    let reprocessed = 0;
    let skipped = 0;
    for (const v of vehicles) {
      if (v.override_manual) {
        skipped++;
        continue;
      }
      const caption = v.instagram_caption || v.description || '';
      const update = buildClassificationUpdate(caption, v.data_venda);
      const { error: updateError } = await supabaseAdmin.from('vehicles').update(update).eq('id', v.id);
      if (updateError) throw updateError;
      reprocessed++;
    }

    return res.status(200).json({ reprocessed, skipped, total: vehicles.length });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
