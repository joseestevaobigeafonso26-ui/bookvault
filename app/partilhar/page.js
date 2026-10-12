'use client';
import { useEffect, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

const MAX = 30 * 1024 * 1024;
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const label = 'mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400';
const STATUS = { pendente: 'Em análise', aprovado: 'Publicado', rejeitado: 'Não aceite' };
const empty = { title: '', author: '', category: '', note: '' };

export default function Partilhar() {
  const [f, setF] = useState(empty);
  const [file, setFile] = useState(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [mine, setMine] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const load = async () => {
    const { data } = await supabaseBrowser().from('submissions').select('id,title,status,created_at').order('created_at', { ascending: false });
    setMine(data || []);
  };
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setOk(false);
    if (!file) return setErr('Escolhe o ficheiro PDF.');
    if (file.type !== 'application/pdf') return setErr('O ficheiro tem de ser um PDF.');
    if (file.size > MAX) return setErr('O PDF não pode ter mais de 30 MB.');
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    const path = `${user.id}/${crypto.randomUUID()}.pdf`;
    const up = await sb.storage.from('submissions').upload(path, file, { contentType: 'application/pdf' });
    if (up.error) { setBusy(false); return setErr(up.error.message); }
    const { error } = await sb.from('submissions').insert({ ...f, user_id: user.id, file_path: path });
    if (error) {
      await sb.storage.from('submissions').remove([path]);
      setBusy(false);
      return setErr(/row-level security/i.test(error.message) ? 'Já tens 5 sugestões em análise. Espera pela resposta antes de enviar mais.' : error.message);
    }
    setBusy(false); setOk(true); setF(empty); setFile(null); setAgree(false); e.target.reset();
    load();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Partilhar um livro</h1>
      <p className="mb-6 text-sm text-slate-500">Conheces um livro que faria bem aqui? Envia o PDF. Se for aprovado, fica disponível para todos.</p>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div><label className={label}>Ficheiro PDF * (até 30 MB)</label><input type="file" accept="application/pdf" required onChange={(e) => setFile(e.target.files[0])} className={input} /></div>
        <div><label className={label}>Título *</label><input required className={input} value={f.title} onChange={set('title')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Autor</label><input className={input} value={f.author} onChange={set('author')} /></div>
          <div><label className={label}>Categoria</label><input className={input} placeholder="Ex.: Romance" value={f.category} onChange={set('category')} /></div>
        </div>
        <div><label className={label}>Porque achas que devia estar aqui? (opcional)</label><textarea rows={3} className={input} value={f.note} onChange={set('note')} /></div>
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
          Confirmo que este livro é de domínio público ou que tenho autorização para o partilhar.
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-brand-700">Obrigado! A tua sugestão foi enviada e vai ser analisada.</p>}
        <button disabled={busy} className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {busy ? 'A enviar...' : 'Enviar sugestão'}
        </button>
      </form>

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-bold">As tuas sugestões</h2>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white text-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
            {mine.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate">{m.title}</span>
                <span className="shrink-0 text-xs text-slate-500">{STATUS[m.status]} · {new Date(m.created_at).toLocaleDateString('pt-PT')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
