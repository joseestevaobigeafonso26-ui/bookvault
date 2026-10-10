import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import { supabaseServer } from '@/lib/supabase/server';
import { getSettings, adsFrom } from '@/lib/settings';

export default async function ReadPage({ params }) {
  const sb = supabaseServer();
  const { data: book } = await sb.from('books').select('id,title,author,file_url').eq('id', params.id).single();
  if (!book?.file_url) notFound();
  await sb.rpc('increment_book', { book: book.id, field: 'reads' });
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/livro/${book.id}`} className="text-sm text-slate-500 hover:underline">← {book.title}</Link>
        <span className="text-sm text-slate-400">{book.author}</span>
        <a href={book.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">Abrir em nova aba ↗</a>
      </div>
      <iframe src={book.file_url} title={book.title} className="h-[calc(100dvh-14rem)] min-h-[420px] w-full rounded-xl border border-slate-200 dark:border-slate-700" />
      <AdSlot {...adsFrom(s, 'slot_book')} className="mt-4" />
    </div>
  );
}
