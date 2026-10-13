// Constrói o endereço do catálogo com os filtros ativos: /?q=...&cat=...&sort=...&page=2
export function catalogUrl({ q, cat, sort, page } = {}) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (cat && cat !== 'Todos') p.set('cat', cat);
  if (sort && sort !== 'popular') p.set('sort', sort);
  if (page > 1) p.set('page', String(page));
  const s = p.toString();
  return s ? `/?${s}` : '/';
}
