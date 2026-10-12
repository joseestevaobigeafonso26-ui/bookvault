'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Library, Download, Eye, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { extractPdfInfo } from '@/lib/pdfCover';

const CATS = ['Ficção', 'Filosofia', 'Romance', 'Ciência', 'Estratégia', 'Didático'];
const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500';
const label = 'mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400';
const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800';
const primary = 'rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50';

export default function AdminPanel({ me, books, profiles, settings, submissions = [] }) {
  const [tab, setTab] = useState('books');
  const pending = submissions.filter((s) => s.status === 'pendente').length;
  const tabs = { books: 'Livros', subs: `Sugestões${pending ? ` (${pending})` : ''}`, users: 'Utilizadores', chat: 'Comunidade', ads: 'Publicidade (AdSense)' };
  const stats = [
    [Library, 'Total de livros', books.length],
    [Download, 'Total de downloads', books.reduce((n, b) => n + b.downloads, 0)],
    [Eye, 'Leituras online', books.reduce((n, b) => n + b.reads, 0)],
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Painel de Administração</h1>
      <p className="mb-6 text-sm text-slate-500">Controla o acervo, os utilizadores e a publicidade.</p>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map(([Icon, t, v]) => (
          <div key={t} className={`${card} flex items-center gap-4 p-5`}>
            <Icon className="text-brand-600" />
            <div><div className="text-xs text-slate-400">{t}</div><div className="text-2xl font-bold">{v}</div></div>
          </div>
        ))}
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {Object.entries(tabs).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>{v}</button>
        ))}
      </div>
      {tab === 'books' && <BooksTab books={books} />}
      {tab === 'subs' && <SubmissionsTab submissions={submissions} />}
      {tab === 'users' && <UsersTab me={me} profiles={profiles} />}
      {tab === 'chat' && <ChatTab settings={settings} />}
      {tab === 'ads' && <AdsTab settings={settings} />}
    </div>
  );
}

function BooksTab({ books }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null); // null | 'new' | book
  const [deleting, setDeleting] = useState(null);

  async function remove(b) {
    if (!confirm(`Excluir "${b.title}"?`)) return;
    setDeleting(b.id);
    const sb = supabaseBrowser();
    if (b.file_path) await sb.storage.from('books').remove([b.file_path]);
    if (b.cover_path) await sb.storage.from('covers').remove([b.cover_path]);
    await sb.from('books').delete().eq('id', b.id);
    router.refresh();
    setDeleting(null);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing('new')} className={`${primary} flex items-center gap-2`}><Plus size={16} /> Publicar novo livro</button>
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
            <tr>{['Livro', 'Categoria', 'Páginas', 'Downloads', ''].map((h) => <th key={h} className="px-6 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {books.map((b) => (
              <tr key={b.id} className={deleting === b.id ? 'animate-pulse opacity-40' : ''}>
                <td className="flex items-center gap-3 px-6 py-3">
                  {b.cover_url && <img src={b.cover_url} alt="" className="h-12 w-9 rounded object-cover" />}
                  <div><b className="block">{b.title}</b><span className="text-xs text-slate-400">{b.author}</span></div>
                </td>
                <td className="px-6 py-3">{b.category}</td>
                <td className="px-6 py-3">{b.pages}</td>
                <td className="px-6 py-3 font-bold">{b.downloads}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setEditing(b)} className="p-2 text-slate-500 hover:text-brand-600" title="Editar"><Pencil size={16} /></button>
                  <button onClick={() => remove(b)} className="p-2 text-slate-500 hover:text-red-600" title="Excluir"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {!books.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Ainda não há livros. Publica o primeiro.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <BookForm book={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function BookForm({ book, prefill, onClose, onSaved }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: book?.title || prefill?.title || '', author: book?.author || prefill?.author || '', category: book?.category || prefill?.category || CATS[0],
    synopsis: book?.synopsis || '', rating: book?.rating ?? 4.5, pages: book?.pages || '',
  });
  const [pdf, setPdf] = useState(null);
  const [cover, setCover] = useState(null); // Blob/File novo
  const [preview, setPreview] = useState(book?.cover_url || '');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Sugestão de utilizador: carrega o PDF automaticamente (e extrai a capa)
  useEffect(() => {
    if (!prefill?.pdfUrl) return;
    (async () => {
      try {
        setBusy('A carregar o PDF da sugestão...');
        const blob = await (await fetch(prefill.pdfUrl)).blob();
        await onPdf(new File([blob], `${prefill.title}.pdf`, { type: 'application/pdf' }));
      } catch {
        setErr('Não foi possível carregar o PDF. Baixa-o e escolhe-o manualmente.');
        setBusy('');
      }
    })();
  }, []);

  // Ao escolher o PDF, a capa nativa (1ª página) é extraída e carregada automaticamente
  async function onPdf(file) {
    if (!file) return;
    setPdf(file); setErr(''); setBusy('A extrair a capa do livro...');
    try {
      const info = await extractPdfInfo(file);
      setCover(info.cover);
      setPreview(URL.createObjectURL(info.cover));
      setF((p) => ({ ...p, pages: info.pages, title: p.title || info.title || file.name.replace(/\.pdf$/i, ''), author: p.author || info.author }));
    } catch {
      setErr('Não foi possível extrair a capa. Escolhe uma imagem manualmente.');
    }
    setBusy('');
  }

  function onCover(file) {
    if (!file) return;
    setCover(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save(e) {
    e.preventDefault();
    if (!book && !pdf) return setErr('Escolhe o ficheiro PDF do livro.');
    setBusy('A guardar...'); setErr('');
    try {
      const sb = supabaseBrowser();
      const id = book?.id || crypto.randomUUID();
      const row = { ...f, pages: +f.pages || null, rating: +f.rating || null };
      if (pdf) {
        const path = `${id}/${Date.now()}.pdf`;
        const { error } = await sb.storage.from('books').upload(path, pdf, { contentType: 'application/pdf' });
        if (error) throw error;
        if (book?.file_path) await sb.storage.from('books').remove([book.file_path]);
        Object.assign(row, { file_path: path, file_url: sb.storage.from('books').getPublicUrl(path).data.publicUrl });
      }
      if (cover) {
        const path = `${id}/${Date.now()}.jpg`;
        const { error } = await sb.storage.from('covers').upload(path, cover, { contentType: cover.type || 'image/jpeg' });
        if (error) throw error;
        if (book?.cover_path) await sb.storage.from('covers').remove([book.cover_path]);
        Object.assign(row, { cover_path: path, cover_url: sb.storage.from('covers').getPublicUrl(path).data.publicUrl });
      }
      const { error } = book ? await sb.from('books').update(row).eq('id', id) : await sb.from('books').insert({ ...row, id });
      if (error) throw error;
      await onSaved?.();
      router.refresh();
      onClose();
    } catch (e2) {
      setErr(e2.message || 'Erro ao guardar.');
      setBusy('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <form onSubmit={save} className="relative my-8 w-full max-w-xl space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-slate-400"><X /></button>
        <h3 className="text-xl font-bold">{book ? 'Editar livro' : 'Publicar novo livro'}</h3>

        <div>
          <label className={label}>Ficheiro PDF {book ? '(opcional: substitui o atual)' : '*'}</label>
          <input type="file" accept="application/pdf" onChange={(e) => onPdf(e.target.files[0])} className={input} />
        </div>

        <div className="flex gap-4">
          <div className="grid h-36 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-center text-xs text-slate-400 dark:bg-slate-900">
            {preview ? <img src={preview} alt="Capa" className="h-full w-full object-cover" /> : 'Capa'}
          </div>
          <div className="flex-1">
            <label className={label}>Capa (automática do PDF; troca se quiseres)</label>
            <input type="file" accept="image/*" onChange={(e) => onCover(e.target.files[0])} className={input} />
          </div>
        </div>

        <div><label className={label}>Título *</label><input required className={input} value={f.title} onChange={set('title')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Autor *</label><input required className={input} value={f.author} onChange={set('author')} /></div>
          <div><label className={label}>Categoria *</label>
            <input required list="cats" className={input} value={f.category} onChange={set('category')} />
            <datalist id="cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Páginas</label><input type="number" min="1" className={input} value={f.pages} onChange={set('pages')} /></div>
          <div><label className={label}>Avaliação (1 a 5)</label><input type="number" step="0.1" min="1" max="5" className={input} value={f.rating} onChange={set('rating')} /></div>
        </div>
        <div><label className={label}>Sinopse *</label><textarea required rows={3} className={input} value={f.synopsis} onChange={set('synopsis')} /></div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex items-center justify-end gap-3">
          {busy && <span className="mr-auto text-sm text-slate-500">{busy}</span>}
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-medium dark:bg-slate-700">Cancelar</button>
          <button disabled={!!busy} className={`${primary} flex items-center gap-2`}>{busy && <Loader2 size={16} className="animate-spin" />} Guardar livro</button>
        </div>
      </form>
    </div>
  );
}

function UsersTab({ me, profiles }) {
  const router = useRouter();
  async function setRole(id, role) {
    await supabaseBrowser().from('profiles').update({ role }).eq('id', id);
    router.refresh();
  }
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
          <tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Criado em</th><th className="px-6 py-3">Papel</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {profiles.map((p) => (
            <tr key={p.id}>
              <td className="px-6 py-3">{p.email}{p.id === me && <span className="ml-2 text-xs text-slate-400">(tu)</span>}</td>
              <td className="px-6 py-3">{new Date(p.created_at).toLocaleDateString('pt-PT')}</td>
              <td className="px-6 py-3">
                <select disabled={p.id === me} value={p.role} onChange={(e) => setRole(p.id, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                  <option value="user">Utilizador</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdsTab({ settings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState('');
  async function save(e) {
    e.preventDefault();
    const { adsense_enabled, adsense_client, slot_feed, slot_book } = s;
    const { error } = await supabaseBrowser().from('settings').update({ adsense_enabled, adsense_client, slot_feed, slot_book }).eq('id', 1);
    setMsg(error ? error.message : 'Guardado.');
    router.refresh();
  }
  return (
    <form onSubmit={save} className={`${card} max-w-xl space-y-4 p-6`}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={s.adsense_enabled} onChange={(e) => setS({ ...s, adsense_enabled: e.target.checked })} />
        Ativar anúncios Google AdSense
      </label>
      <div><label className={label}>ID do editor (ca-pub-XXXXXXXXXXXXXXXX)</label><input className={input} value={s.adsense_client} onChange={(e) => setS({ ...s, adsense_client: e.target.value.trim() })} /></div>
      <div><label className={label}>Slot do catálogo (anúncio entre os livros)</label><input className={input} value={s.slot_feed} onChange={(e) => setS({ ...s, slot_feed: e.target.value.trim() })} /></div>
      <div><label className={label}>Slot da página do livro e do leitor</label><input className={input} value={s.slot_book} onChange={(e) => setS({ ...s, slot_book: e.target.value.trim() })} /></div>
      <div className="flex items-center gap-3"><button className={primary}>Guardar</button><span className="text-sm text-slate-500">{msg}</span></div>
    </form>
  );
}

function SubmissionsTab({ submissions }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const sb = () => supabaseBrowser();
  const STATUS = { pendente: 'Em análise', aprovado: 'Publicado', rejeitado: 'Rejeitado' };

  async function signed(path, name) {
    const { data, error } = await sb().storage.from('submissions').createSignedUrl(path, 600, name ? { download: `${name}.pdf` } : undefined);
    if (error) throw error;
    return data.signedUrl;
  }
  async function download(s) {
    setBusyId(s.id);
    try { const a = document.createElement('a'); a.href = await signed(s.file_path, s.title); a.click(); } catch (e) { alert(e.message); }
    setBusyId(null);
  }
  async function publish(s) {
    setBusyId(s.id);
    try { setPublishing({ sub: s, pdfUrl: s.file_path ? await signed(s.file_path) : null }); } catch (e) { alert(e.message); }
    setBusyId(null);
  }
  async function approved() {
    const s = publishing.sub;
    await sb().from('submissions').update({ status: 'aprovado', file_path: null }).eq('id', s.id);
    if (s.file_path) await sb().storage.from('submissions').remove([s.file_path]);
  }
  async function reject(s) {
    if (!confirm('Rejeitar esta sugestão?')) return;
    await sb().from('submissions').update({ status: 'rejeitado', file_path: null }).eq('id', s.id);
    if (s.file_path) await sb().storage.from('submissions').remove([s.file_path]);
    router.refresh();
  }
  async function del(s) {
    if (!confirm('Excluir esta sugestão?')) return;
    if (s.file_path) await sb().storage.from('submissions').remove([s.file_path]);
    await sb().from('submissions').delete().eq('id', s.id);
    router.refresh();
  }

  const act = 'rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50';
  return (
    <>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
            <tr>{['Livro', 'Enviado por', 'Estado', 'Ações'].map((h) => <th key={h} className="px-6 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {submissions.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-3">
                  <b className="block">{s.title}</b>
                  <span className="text-xs text-slate-400">{[s.author, s.category].filter(Boolean).join(' · ')}</span>
                  {s.note && <p className="mt-1 max-w-xs text-xs italic text-slate-500">“{s.note}”</p>}
                </td>
                <td className="px-6 py-3 text-xs">{s.user_email || 'Visitante'}<br /><span className="text-slate-400">{new Date(s.created_at).toLocaleDateString('pt-PT')}</span></td>
                <td className="px-6 py-3">{STATUS[s.status]}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-2">
                    {s.file_path && <button disabled={busyId === s.id} onClick={() => download(s)} className={`${act} bg-slate-100 dark:bg-slate-700`}>Baixar PDF</button>}
                    {s.status === 'pendente' && <>
                      <button disabled={busyId === s.id} onClick={() => publish(s)} className={`${act} bg-brand-600 text-white`}>Publicar</button>
                      <button onClick={() => reject(s)} className={`${act} bg-slate-100 dark:bg-slate-700`}>Rejeitar</button>
                    </>}
                    <button onClick={() => del(s)} className={`${act} text-red-600`}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {!submissions.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Ainda não há sugestões.</td></tr>}
          </tbody>
        </table>
      </div>
      {publishing && <BookForm prefill={{ ...publishing.sub, pdfUrl: publishing.pdfUrl }} onClose={() => setPublishing(null)} onSaved={approved} />}
    </>
  );
}

function ChatTab({ settings }) {
  const router = useRouter();
  const [on, setOn] = useState(settings?.chat_enabled !== false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function toggle() {
    setBusy(true); setMsg('');
    const next = !on;
    const { error } = await supabaseBrowser().from('settings').update({ chat_enabled: next }).eq('id', 1);
    setBusy(false);
    if (error) return setMsg(/chat_enabled/.test(error.message) ? 'Corre primeiro o ficheiro supabase/update_6.sql no Supabase.' : error.message);
    setOn(next);
    router.refresh();
  }
  async function clearAll() {
    if (!confirm('Apagar TODAS as mensagens do chat? Não dá para desfazer.')) return;
    const { error } = await supabaseBrowser().from('messages').delete().gte('id', 0);
    setMsg(error ? error.message : 'Todas as mensagens foram apagadas.');
  }

  return (
    <div className={`${card} max-w-xl space-y-5 p-6`}>
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${on ? 'bg-brand-500' : 'bg-red-500'}`} />
        <div>
          <div className="font-bold">Chat da comunidade: {on ? 'ligado' : 'desligado'}</div>
          <p className="text-sm text-slate-500">
            {on ? 'Qualquer visitante pode ler e escrever em /comunidade.' : 'Fechado para o público. Só tu vês as mensagens.'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={toggle} disabled={busy} className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${on ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
          {busy ? 'A guardar...' : on ? 'Desligar o chat agora' : 'Ligar o chat'}
        </button>
        <button onClick={clearAll} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium dark:bg-slate-700">Apagar todas as mensagens</button>
      </div>
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
