import { supabaseServer } from './supabase/server';

export async function getSettings() {
  const { data } = await supabaseServer().from('settings').select('*').single();
  return data || {};
}

// Devolve { client, slot } só se o AdSense estiver ativo (admin controla em /admin)
export const adsFrom = (s, slotKey) =>
  s?.adsense_enabled && s.adsense_client && s[slotKey] ? { client: s.adsense_client, slot: s[slotKey] } : {};
