const Sk = ({ className = '' }) => <div className={`skeleton ${className}`} />;
const wrap = 'mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8';
const grid = 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5';

export function CatalogSkeleton() {
  return (
    <>
      <section className="px-4 pb-12 pt-10 text-center">
        <Sk className="mx-auto mb-4 h-6 w-28 !rounded-full" />
        <Sk className="mx-auto mb-3 h-10 w-full max-w-2xl" />
        <Sk className="mx-auto mb-8 h-5 w-full max-w-md" />
        <Sk className="mx-auto h-14 w-full max-w-2xl !rounded-2xl" />
      </section>
      <div className={wrap}>
        <div className="mb-8 flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => <Sk key={i} className="h-8 w-20 shrink-0 !rounded-full" />)}
        </div>
        <div className={grid}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
              <Sk className="aspect-[2/3] !rounded-none" />
              <div className="space-y-2 p-3"><Sk className="h-3 w-1/3" /><Sk className="h-4 w-4/5" /><Sk className="h-3 w-1/2" /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function BookSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Sk className="h-4 w-40" />
      <div className="mt-6 flex flex-col gap-8 sm:flex-row">
        <Sk className="aspect-[2/3] w-40 shrink-0 self-center !rounded-xl sm:w-48 sm:self-start" />
        <div className="flex-1 space-y-3">
          <Sk className="h-3 w-20" /><Sk className="h-8 w-4/5" /><Sk className="h-4 w-1/3" />
          <Sk className="h-4 w-2/3" /><Sk className="h-20 w-full" />
          <div className="flex gap-3 pt-2"><Sk className="h-11 w-32 !rounded-xl" /><Sk className="h-11 w-32 !rounded-xl" /></div>
        </div>
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <Sk className="mb-3 h-5 w-48" />
      <Sk className="h-[calc(100dvh-14rem)] min-h-[420px] w-full !rounded-xl" />
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className={wrap}>
      <Sk className="mb-2 h-8 w-64" /><Sk className="mb-6 h-4 w-80 max-w-full" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">{[...Array(3)].map((_, i) => <Sk key={i} className="h-20 !rounded-2xl" />)}</div>
      <Sk className="mb-6 h-10 w-full max-w-md" />
      <div className="space-y-3">{[...Array(5)].map((_, i) => <Sk key={i} className="h-16 w-full !rounded-xl" />)}</div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className={grid}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800">
          <Sk className="aspect-[2/3] !rounded-none" />
          <div className="space-y-2 p-3"><Sk className="h-3 w-1/3" /><Sk className="h-4 w-4/5" /><Sk className="h-3 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}
