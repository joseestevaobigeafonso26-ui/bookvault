import { Suspense } from 'react';
import Link from 'next/link';
import Catalog from '@/components/Catalog';
import { CatalogSkeleton } from '@/components/Skeletons';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

async function Books() {
  const { data } = await supabaseServer().from('books').select('*').order('created_at', { ascending: false });
  const books = data || [];
  const s = await getSettings();
  const cats = [...new Set(books.map((b) => b.category))];
  return (
    <>
      <Catalog books={books} ad={adsFrom(s, 'slot_feed')} />
      {cats.length > 0 && (
        <nav className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-lg font-bold">Explorar por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link key={c} href={`/categoria/${slugify(c)}`} className="rounded-full border border-slate-200 px-4 py-1.5 text-sm hover:border-brand-600 hover:text-brand-600 dark:border-slate-700">
                {c}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Books />
    </Suspense>
  );
}
