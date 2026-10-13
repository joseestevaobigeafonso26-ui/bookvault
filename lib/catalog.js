import { supabaseServer } from './supabase/server';

// Totais e categorias (com nº de livros). Usa a função SQL; se ainda não existir, calcula à mão.
export async function getMeta() {
  const sb = supabaseServer();
  const { data, error } = await sb.rpc('catalog_meta');
  if (!error && data) return data;
  const { data: rows } = await sb.from('books').select('category,downloads');
  const map = {};
  let downloads = 0;
  (rows || []).forEach((r) => { map[r.category] = (map[r.category] || 0) + 1; downloads += r.downloads || 0; });
  return {
    total: rows?.length || 0,
    downloads,
    categories: Object.entries(map).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n),
  };
}
