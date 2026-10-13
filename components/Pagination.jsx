import Link from 'next/link';

const base = 'rounded-lg border px-3 py-2 text-sm';
const idle = 'border-slate-200 hover:border-brand-600 hover:text-brand-600 dark:border-slate-700';
const off = 'cursor-not-allowed border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600';

// Páginas com ligações normais (o Google também as segue). `href(n)` devolve o endereço da página n.
export default function Pagination({ page, pages, href }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, pages, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) items.push(`gap-${n}`);
    items.push(n);
  });
  return (
    <nav aria-label="Páginas" className="mt-10 flex items-center justify-center gap-2">
      {page > 1
        ? <Link href={href(page - 1)} className={`${base} ${idle}`}>← <span className="hidden sm:inline">Anterior</span></Link>
        : <span className={`${base} ${off}`}>← <span className="hidden sm:inline">Anterior</span></span>}

      <div className="hidden items-center gap-1 sm:flex">
        {items.map((n) => typeof n === 'string'
          ? <span key={n} className="px-1 text-slate-400">…</span>
          : n === page
            ? <span key={n} aria-current="page" className={`${base} border-brand-600 bg-brand-600 font-semibold text-white`}>{n}</span>
            : <Link key={n} href={href(n)} className={`${base} ${idle}`}>{n}</Link>)}
      </div>
      <span className="text-sm text-slate-500 sm:hidden">Página {page} de {pages}</span>

      {page < pages
        ? <Link href={href(page + 1)} className={`${base} ${idle}`}><span className="hidden sm:inline">Seguinte</span> →</Link>
        : <span className={`${base} ${off}`}><span className="hidden sm:inline">Seguinte</span> →</span>}
    </nav>
  );
}
