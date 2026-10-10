'use client';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function DownloadButton({ id, url, title }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    await supabaseBrowser().rpc('increment_book', { book: id, field: 'downloads' });
    window.open(`${url}?download=${encodeURIComponent(title)}.pdf`, '_blank');
    setBusy(false);
  }
  return (
    <button onClick={go} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-medium hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600 sm:flex-none">
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Baixar PDF
    </button>
  );
}
