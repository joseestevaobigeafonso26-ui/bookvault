import { Suspense, Fragment } from 'react';
import Link from 'next/link';
import CatalogControls from '@/components/CatalogControls';
import BookCard from '@/components/BookCard';
import AdSlot from '@/components/AdSlot';
import Pagination from '@/components/Pagination';
import { GridSkeleton } from '@/components/Skeletons';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';
import { getMeta } from '@/lib/catalog';
import { catalogUrl } from '@/lib/catalogUrl';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const SORTS = ['popular', 'recent', 'title', 'rating'];

function parse(sp = {}) {
  const q = (typeof sp.q === 'string' ? sp.q : '').replace(/[,()%_\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  const cat = typeof sp.cat === 'string' ? sp.cat.slice(0, 100) : '';
  const sort = SORTS.includes(sp.sort) ? sp.sort : 'popular';
  const page = Math.max(1, parseInt(sp.page, 10) || 1);
  return { q, cat, sort, page };
}

// pesquisas não devem ir para o Google (páginas quase infinitas)
export function generateMetadata({ searchParams }) {
  return parse(searchParams).q ? { robots: { index: false, follow: true } } : {};
}

async function Results({ params, ad }) {
  const { q, cat, sort, page } = params;
  let query = supabaseServer().from('books').select('*', { count: 'exact' });
  if (cat) query = query.eq('category', cat);
  if (q) query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%,synopsis.ilike.%${q}%`);
  if (sort === 'recent') query = query.order('created_at', { ascending: false });
  else if (sort === 'title') query = query.order('title');
  else if (sort === 'rating') query = query.order('rating', { ascending: false, nullsFirst: false }).order('downloads', { ascending: false });
  else query = query.order('downloads', { ascending: false }).order('created_at', { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  const books = data || [];
  const pages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  if (!books.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-800/50">
        <h3 className="mb-1 text-lg font-bold">{error && page > 1 ? 'Esta página não existe' : 'Nenhum livro encontrado'}</h3>
        <p className="mb-4 text-sm text-slate-500">Tenta outro termo ou limpa os filtros.</p>
        <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Limpar filtros</Link>
      </div>
    );
  }

  return (
    <>
      {(q || cat) && <p className="mb-4 text-sm text-slate-500">{count} {count === 1 ? 'livro encontrado' : 'livros encontrados'}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {books.map((b, i) => (
          <Fragment key={b.id}>
            {i === 10 && ad.client && <div className="col-span-full"><AdSlot {...ad} /></div>}
            <BookCard book={b} />
          </Fragment>
        ))}
      </div>
      <Pagination page={page} pages={pages} href={(n) => catalogUrl({ q, cat, sort, page: n })} />
    </>
  );
}

export default async function Home({ searchParams }) {
  const params = parse(searchParams);
  const [meta, s] = await Promise.all([getMeta(), getSettings()]);
  return (
    <>
      <CatalogControls meta={meta} q={params.q} cat={params.cat} sort={params.sort} />
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <Suspense key={JSON.stringify(params)} fallback={<GridSkeleton />}>
          <Results params={params} ad={adsFrom(s, 'slot_feed')} />
        </Suspense>
      </div>
      {meta.categories.length > 0 && (
        <nav className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-lg font-bold">Explorar por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {meta.categories.map((c) => (
              <Link key={c.name} href={`/categoria/${slugify(c.name)}`} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm hover:border-brand-600 hover:text-brand-600 dark:border-slate-700">
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
