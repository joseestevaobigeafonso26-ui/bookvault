import { supabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { data } = await supabaseServer().from('books').select('id,category,created_at');
  const books = data || [];
  const cats = [...new Set(books.map((b) => slugify(b.category)))];
  return [
    { url: site },
    { url: `${site}/privacidade` },
    { url: `${site}/sobre` },
    ...cats.map((c) => ({ url: `${site}/categoria/${c}` })),
    ...books.map((b) => ({ url: `${site}/livro/${b.id}`, lastModified: b.created_at })),
  ];
}
