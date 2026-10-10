import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import DownloadButton from '@/components/DownloadButton';
import AdSlot from '@/components/AdSlot';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';

const getBook = async (id) => (await supabaseServer().from('books').select('*').eq('id', id).single()).data;

export async function generateMetadata({ params }) {
  const b = await getBook(params.id);
  return { title: b ? `${b.title} – ${b.author} | BookVault` : 'BookVault' };
}

export default async function BookPage({ params }) {
  const book = await getBook(params.id);
  if (!book) notFound();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:underline">← Voltar ao catálogo</Link>
      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <div className="w-40 shrink-0 self-center sm:w-48 overflow-hidden rounded-xl bg-slate-200 shadow-xl sm:self-start">
          {book.cover_url && <img src={book.cover_url} alt={`Capa de ${book.title}`} className="w-full" />}
        </div>
        <div>
          <span className="text-xs font-semibold text-brand-600">{book.category}</span>
          <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{book.title}</h1>
          <p className="mb-4 text-slate-500">{book.author}</p>
          <p className="mb-4 text-sm text-slate-500">{book.pages} páginas · ★ {book.rating} · {book.downloads} downloads · {book.reads} leituras</p>
          <p className="mb-6 font-serif leading-relaxed text-slate-700 dark:text-slate-300">{book.synopsis}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/livro/${book.id}/ler`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 sm:flex-none text-sm font-medium text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700">
              <BookOpen size={16} /> Ler online
            </Link>
            {book.file_url && <DownloadButton id={book.id} url={book.file_url} title={book.title} />}
          </div>
        </div>
      </div>
      <AdSlot {...adsFrom(s, 'slot_book')} className="mt-10" />
    </div>
  );
}
