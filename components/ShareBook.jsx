'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Loader2, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

const MAX = 20 * 1024 * 1024;
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const label = 'mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400';
const empty = { title: '', author: '', category: '', note: '' };

// Botão + janela para qualquer visitante sugerir um livro (sem conta, nenhum campo obrigatório)
export default function ShareBook({ className = '' }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [f, setF] = useState(empty);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden'; // trava o scroll da página por trás
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [open]);

  function close() { setOpen(false); setDone(false); setErr(''); }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (e.target.elements.website.value) return setDone(true); // campo-armadilha: só robôs o preenchem
    if (!file && !f.title.trim() && !f.note.trim()) return setErr('Preenche pelo menos um campo ou escolhe um PDF.');
    if (file && file.type !== 'application/pdf') return setErr('O ficheiro tem de ser um PDF.');
    if (file && file.size > MAX) return setErr('O PDF não pode ter mais de 20 MB.');
    setBusy(true);
    const sb = supabaseBrowser();
    let path = null;
    if (file) {
      path = `inbox/${crypto.randomUUID()}.pdf`;
      const up = await sb.storage.from('submissions').upload(path, file, { contentType: 'application/pdf' });
      if (up.error) { setBusy(false); return setErr('Não foi possível enviar agora. Tenta mais tarde, obrigado!'); }
    }
    const { error } = await sb.from('submissions').insert({
      title: f.title.trim() || file?.name.replace(/\.pdf$/i, '') || 'Sem título',
      author: f.author.trim() || null,
      category: f.category.trim() || null,
      note: f.note.trim() || null,
      file_path: path,
    });
    setBusy(false);
    if (error) return setErr('Não foi possível enviar agora. Tenta mais tarde, obrigado!');
    setF(empty); setFile(null); setDone(true);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <Upload size={16} /> <span className="hidden sm:inline">Partilhar livro</span>
      </button>

      {open && mounted && createPortal(
        <div onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 sm:p-8">
            <button onClick={close} aria-label="Fechar" className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"><X /></button>

            {done ? (
              <div className="py-6 text-center">
                <h2 className="mb-2 text-xl font-bold">Obrigado! 🎉</h2>
                <p className="mb-6 text-sm text-slate-500">A tua sugestão foi enviada. Se for aprovada, vai aparecer para todos.</p>
                <button onClick={close} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Fechar</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Partilhar um livro</h2>
                  <p className="text-sm text-slate-500">Conheces um livro que faria bem aqui? Envia-o, é rápido e não precisas de conta.</p>
                </div>
                <div><label className={label}>Ficheiro PDF (até 20 MB)</label><input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} className={input} /></div>
                <div><label className={label}>Título</label><input className={input} value={f.title} onChange={set('title')} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className={label}>Autor</label><input className={input} value={f.author} onChange={set('author')} /></div>
                  <div><label className={label}>Categoria</label><input className={input} value={f.category} onChange={set('category')} /></div>
                </div>
                <div><label className={label}>Porque devia estar aqui?</label><textarea rows={3} className={input} value={f.note} onChange={set('note')} /></div>
                {/* campo-armadilha para robôs (invisível para pessoas) */}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <p className="text-xs text-slate-400">Partilha apenas livros de domínio público ou que tenhas autorização para divulgar.</p>
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
                  {busy && <Loader2 size={16} className="animate-spin" />} {busy ? 'A enviar...' : 'Enviar sugestão'}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
