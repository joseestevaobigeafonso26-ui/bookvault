'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { catalogUrl } from '@/lib/catalogUrl';

// Cabeçalho do catálogo: pesquisa (com pequena espera), categorias e ordenação. Tudo vai para o endereço (?q=&cat=&sort=).
export default function CatalogControls({ meta, q, cat, sort }) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const [, start] = useTransition();
  const first = useRef(true);

  useEffect(() => { setText(q); }, [q]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (text.trim() === q) return;
    const t = setTimeout(() => start(() => router.replace(catalogUrl({ q: text.trim(), cat, sort }))), 350);
    return () => clearTimeout(t);
  }, [text]);

  const chip = (active) => `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'}`;

  return (
    <>
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-brand-50/50 to-slate-50 px-4 pb-12 pt-10 text-center dark:border-slate-800 dark:from-slate-800/40 dark:to-slate-900">
        <span className="mb-4 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">100% Gratuito</span>
        <h1 className="mx-auto mb-4 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">Explore, Leia e Baixe Livros do Domínio Público</h1>
        <p className="mx-auto mb-8 max-w-2xl text-slate-600 dark:text-slate-400">Leia direto no navegador ou baixe em PDF em 1 clique.</p>
        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Busque por título, autor ou palavra-chave..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-base shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none sm:text-lg" />
          {text && <button onClick={() => setText('')} aria-label="Limpar pesquisa" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={20} /></button>}
        </div>
        <p className="mt-6 text-sm text-slate-500">{meta.total} livros disponíveis · {meta.downloads} downloads realizados</p>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <Link href={catalogUrl({ q, sort })} className={chip(!cat)}>Todos</Link>
            {meta.categories.map((c) => (
              <Link key={c.name} href={catalogUrl({ q, cat: c.name, sort })} className={chip(cat === c.name)}>{c.name}</Link>
            ))}
          </div>
          <select value={sort} onChange={(e) => router.push(catalogUrl({ q, cat, sort: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 sm:w-auto">
            <option value="popular">Mais populares</option>
            <option value="recent">Mais recentes</option>
            <option value="title">Título (A-Z)</option>
            <option value="rating">Melhor avaliados</option>
          </select>
        </div>
      </div>
    </>
  );
}
