import Catalog from '@/components/Catalog';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';

export default async function Home() {
  const { data: books } = await supabaseServer().from('books').select('*').order('created_at', { ascending: false });
  const s = await getSettings();
  return <Catalog books={books || []} ad={adsFrom(s, 'slot_feed')} />;
}
