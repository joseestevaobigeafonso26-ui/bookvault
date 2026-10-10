import Link from 'next/link';
import { Star, Download } from 'lucide-react';

export default function BookCard({ book }) {
  return (
    <Link href={`/livro/${book.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
      <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-700">
        {book.cover_url
          ? <img src={book.cover_url} alt={`Capa de ${book.title}`} loading="lazy" className="h-full w-full object-cover" />
          : <div className="grid h-full place-items-center p-4 text-center font-serif text-sm">{book.title}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs font-semibold text-brand-600">{book.category}</span>
        <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-brand-600">{book.title}</h3>
        <p className="text-sm text-slate-500">{book.author}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{book.rating}</span>
          <span className="flex items-center gap-1"><Download size={12} />{book.downloads}</span>
        </div>
      </div>
    </Link>
  );
}
