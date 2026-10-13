import { supabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const sb = supabaseServer();
  const books = [];
  for (let from = 0; ; from += 1000) {            // o Supabase devolve no máx. 1000 por pedido
    const { data } = await sb.from('books').select('id,category,created_at').range(from, from + 999);
    if (!data?.length) break;
    books.push(...data);
    if (data.length < 1000) break;
  }
  const cats = [...new Set(books.map((b) => slugify(b.category)))];
  return [
    { url: site },
    { url: `${site}/privacidade` },
    { url: `${site}/sobre` },
    ...cats.map((c) => ({ url: `${site}/categoria/${c}` })),
    ...books.map((b) => ({ url: `${site}/livro/${b.id}`, lastModified: b.created_at })),
  ];
}
