'use client';
import { Fragment, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import BookCard from './BookCard';
import AdSlot from './AdSlot';

const SORTS = {
  popular: (a, b) => b.downloads - a.downloads,
  recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  title: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => b.rating - a.rating,
};

export default function Catalog({ books, ad }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');
  const [sort, setSort] = useState('popular');

  const cats = useMemo(() => ['Todos', ...new Set(books.map((b) => b.category))], [books]);
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return books
      .filter((b) => (cat === 'Todos' || b.category === cat) && `${b.title} ${b.author} ${b.synopsis || ''}`.toLowerCase().includes(t))
      .sort(SORTS[sort]);
  }, [books, q, cat, sort]);
  const downloads = books.reduce((n, b) => n + b.downloads, 0);

  return (
    <>
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-brand-50/50 to-slate-50 px-4 pb-12 pt-10 text-center dark:border-slate-800 dark:from-slate-800/40 dark:to-slate-900">
        <span className="mb-4 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">100% Gratuito</span>
        <h1 className="mx-auto mb-4 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">Explore, Leia e Baixe Livros do Domínio Público</h1>
        <p className="mx-auto mb-8 max-w-2xl text-slate-600 dark:text-slate-400">Leia direto no navegador ou baixe em PDF em 1 clique.</p>
        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busque por título, autor ou palavra-chave..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-base sm:text-lg shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none" />
          {q && <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={20} /></button>}
        </div>
        <p className="mt-6 text-sm text-slate-500">{books.length} livros disponíveis · {downloads} downloads realizados</p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${cat === c ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'}`}>
                {c}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="popular">Mais populares</option>
            <option value="recent">Mais recentes</option>
            <option value="title">Título (A-Z)</option>
            <option value="rating">Melhor avaliados</option>
          </select>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-800/50">
            <h3 className="mb-1 text-lg font-bold">Nenhum livro encontrado</h3>
            <p className="mb-4 text-sm text-slate-500">Tenta outro termo ou limpa os filtros.</p>
            <button onClick={() => { setQ(''); setCat('Todos'); }} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Limpar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
            {list.map((b, i) => (
              <Fragment key={b.id}>
                {i > 0 && i % 10 === 0 && ad.client && <div className="col-span-full"><AdSlot {...ad} /></div>}
                <BookCard book={b} />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
