-- Corre UMA vez no SQL Editor: catálogo por páginas (estatísticas rápidas + índices)

create or replace function public.catalog_meta() returns json
language sql stable as $$
  select json_build_object(
    'total',     (select count(*) from public.books),
    'downloads', (select coalesce(sum(downloads), 0) from public.books),
    'categories', coalesce((
      select json_agg(json_build_object('name', category, 'n', n) order by n desc)
      from (select category, count(*) as n from public.books group by category) c
    ), '[]'::json)
  )
$$;
grant execute on function public.catalog_meta to anon, authenticated;

create index if not exists books_downloads_idx on public.books (downloads desc);
create index if not exists books_created_idx   on public.books (created_at desc);
create index if not exists books_category_idx  on public.books (category);
