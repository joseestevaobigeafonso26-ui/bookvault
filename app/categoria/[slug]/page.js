import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookCard from '@/components/BookCard';
import AdSlot from '@/components/AdSlot';
import Pagination from '@/components/Pagination';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';
import { getMeta } from '@/lib/catalog';
import { slugify } from '@/lib/slug';

const PAGE_SIZE = 20;
const pageOf = (sp) => Math.max(1, parseInt(sp?.page, 10) || 1);
const urlOf = (slug, n) => `/categoria/${slug}${n > 1 ? `?page=${n}` : ''}`;

async function load(slug, page) {
  const meta = await getMeta();
  const cat = meta.categories.find((c) => slugify(c.name) === slug);
  if (!cat) return null;
  const from = (page - 1) * PAGE_SIZE;
  const { data } = await supabaseServer().from('books').select('*').eq('category', cat.name)
    .order('downloads', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { name: cat.name, n: cat.n, books: data || [] };
}

export async function generateMetadata({ params, searchParams }) {
  const cat = (await getMeta()).categories.find((c) => slugify(c.name) === params.slug);
  if (!cat) return { title: 'BookVault' };
  return {
    title: `Livros de ${cat.name}: ler online e baixar PDF | BookVault`,
    description: `${cat.n} livros de ${cat.name} para ler online ou baixar em PDF, gratuitamente.`,
    alternates: { canonical: urlOf(params.slug, pageOf(searchParams)) },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const page = pageOf(searchParams);
  const cat = await load(params.slug, page);
  if (!cat || !cat.books.length) notFound();
  const authors = [...new Set(cat.books.map((b) => b.author))].slice(0, 4);
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Todos os livros</Link>
      <h1 className="mb-3 mt-4 text-3xl font-bold">Livros de {cat.name}</h1>
      <p className="mb-8 max-w-3xl text-slate-600 dark:text-slate-300">
        Reunimos {cat.n} {cat.n === 1 ? 'livro' : 'livros'} de {cat.name} para ler online ou baixar em PDF, sem custo.
        Entre as obras estão títulos de {authors.join(', ')}. Escolhe um livro para ver a sinopse e começar a ler.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {cat.books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(cat.n / PAGE_SIZE))} href={(n) => urlOf(params.slug, n)} />
      <AdSlot {...adsFrom(s, 'slot_feed')} className="mt-10" />
    </div>
  );
}
