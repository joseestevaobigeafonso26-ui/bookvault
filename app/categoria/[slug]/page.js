import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookCard from '@/components/BookCard';
import AdSlot from '@/components/AdSlot';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';
import { slugify } from '@/lib/slug';

async function load(slug) {
  const { data } = await supabaseServer().from('books').select('*').order('downloads', { ascending: false });
  return (data || []).filter((b) => slugify(b.category) === slug);
}

export async function generateMetadata({ params }) {
  const books = await load(params.slug);
  if (!books.length) return { title: 'BookVault' };
  const c = books[0].category;
  return {
    title: `Livros de ${c}: ler online e baixar PDF | BookVault`,
    description: `${books.length} livros de ${c} para ler online ou baixar em PDF, gratuitamente.`,
    alternates: { canonical: `/categoria/${params.slug}` },
  };
}

export default async function CategoryPage({ params }) {
  const books = await load(params.slug);
  if (!books.length) notFound();
  const cat = books[0].category;
  const authors = [...new Set(books.map((b) => b.author))].slice(0, 4);
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Todos os livros</Link>
      <h1 className="mb-3 mt-4 text-3xl font-bold">Livros de {cat}</h1>
      <p className="mb-8 max-w-3xl text-slate-600 dark:text-slate-300">
        Reunimos {books.length} {books.length === 1 ? 'livro' : 'livros'} de {cat} para ler online ou baixar em PDF, sem custo.
        Entre as obras estão títulos de {authors.join(', ')}. Escolhe um livro para ver a sinopse e começar a ler.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
      <AdSlot {...adsFrom(s, 'slot_feed')} className="mt-10" />
    </div>
  );
}
