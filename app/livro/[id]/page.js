import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import DownloadButton from '@/components/DownloadButton';
import AdSlot from '@/components/AdSlot';
import BookCard from '@/components/BookCard';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';
import { slugify } from '@/lib/slug';

const getBook = async (id) => (await supabaseServer().from('books').select('*').eq('id', id).single()).data;

export async function generateMetadata({ params }) {
  const b = await getBook(params.id);
  if (!b) return { title: 'BookVault' };
  const title = `${b.title} – ${b.author} | BookVault`;
  const description = (b.synopsis || '').slice(0, 160);
  const images = b.cover_url ? [b.cover_url] : [];
  return {
    title, description,
    alternates: { canonical: `/livro/${b.id}` },
    openGraph: { title, description, type: 'book', images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function BookPage({ params }) {
  const sb = supabaseServer();
  const book = await getBook(params.id);
  if (!book) notFound();
  const s = await getSettings();
  const { data: related } = await sb.from('books').select('*').eq('category', book.category).neq('id', book.id)
    .order('downloads', { ascending: false }).limit(5);

  const ld = {
    '@context': 'https://schema.org', '@type': 'Book', name: book.title,
    author: { '@type': 'Person', name: book.author }, description: book.synopsis, image: book.cover_url,
    numberOfPages: book.pages, genre: book.category, inLanguage: 'pt', isAccessibleForFree: true,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Voltar ao catálogo</Link>
      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="w-40 shrink-0 self-center overflow-hidden rounded-xl bg-slate-200 shadow-xl sm:w-48 sm:self-start">
          {book.cover_url && <img src={book.cover_url} alt={`Capa de ${book.title}`} className="w-full" />}
        </div>
        <div>
          <Link href={`/categoria/${slugify(book.category)}`} className="text-xs font-semibold text-brand-600 hover:underline">{book.category}</Link>
          <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{book.title}</h1>
          <p className="mb-4 text-slate-500">{book.author}</p>
          <p className="mb-4 text-sm text-slate-500">{book.pages} páginas · {book.downloads} downloads · {book.reads} leituras</p>
          <p className="mb-6 font-serif leading-relaxed text-slate-700 dark:text-slate-300">{book.synopsis}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/livro/${book.id}/ler`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 sm:flex-none">
              <BookOpen size={16} /> Ler online
            </Link>
            {book.file_url && <DownloadButton id={book.id} url={book.file_url} title={book.title} />}
          </div>
        </div>
      </div>


      <AdSlot {...adsFrom(s, 'slot_book')} className="mt-10" />

      {related?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Mais livros de {book.category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {related.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}
