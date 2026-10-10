import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { data } = await supabaseServer().from('books').select('id,created_at');
  return [
    { url: site },
    { url: `${site}/privacidade` },
    { url: `${site}/sobre` },
    ...(data || []).map((b) => ({ url: `${site}/livro/${b.id}`, lastModified: b.created_at })),
  ];
}
