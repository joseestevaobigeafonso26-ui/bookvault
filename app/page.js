import { Suspense } from 'react';
import Catalog from '@/components/Catalog';
import { CatalogSkeleton } from '@/components/Skeletons';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';

export const dynamic = 'force-dynamic';

async function Books() {
  const { data: books } = await supabaseServer().from('books').select('*').order('created_at', { ascending: false });
  const s = await getSettings();
  return <Catalog books={books || []} ad={adsFrom(s, 'slot_feed')} />;
}

export default function Home() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <Books />
    </Suspense>
  );
}
