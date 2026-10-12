'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Trash2, Ban, Users } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export default function Chat({ enabled = true }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [cid, setCid] = useState('');
  const [nick, setNick] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [admin, setAdmin] = useState(false);
  const [online, setOnline] = useState(0);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [on, setOn] = useState(enabled);
  const box = useRef(null);
  const stick = useRef(true);

  // identidade anónima: um id e um nome aleatório guardados neste navegador
  useEffect(() => {
    let id = store.get('bv_client');
    if (!id) { id = crypto.randomUUID(); store.set('bv_client', id); }
    let n = store.get('bv_nick');
    if (!n) { n = `Leitor-${Math.floor(1000 + Math.random() * 9000)}`; store.set('bv_nick', n); }
    setCid(id); setNick(n);
  }, []);

  // admin? (vê o chat mesmo desligado e tem os botões de moderação)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
      setAdmin(p?.role === 'admin');
    })();
  }, [sb]);

  // interruptor: se o admin desligar o chat, fecha para todos na hora
  useEffect(() => {
    const ch = sb.channel('chat-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (p) => {
        if (typeof p.new.chat_enabled === 'boolean') {
          setOn(p.new.chat_enabled);
          if (!p.new.chat_enabled) setMsgs([]);
        }
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb]);

  useEffect(() => {
    if (!cid || (!on && !admin)) return;
    let alive = true;
    (async () => {
      const { data } = await sb.from('messages').select('*').order('id', { ascending: false }).limit(100);
      if (alive) setMsgs((data || []).reverse());
    })();

    const ch = sb.channel('comunidade', { config: { presence: { key: cid } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (p) => setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new].slice(-200))))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        (p) => setMsgs((m) => m.filter((x) => x.id !== p.old.id)))
      .on('presence', { event: 'sync' }, () => setOnline(Object.keys(ch.presenceState()).length))
      .subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ at: Date.now() }); });

    return () => { alive = false; sb.removeChannel(ch); };
  }, [cid, sb, on, admin]);

  useEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const onScroll = () => {
    const el = box.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setErr(''); setSending(true);
    const { data, error } = await sb.from('messages')
      .insert({ nickname: (nick.trim() || 'Anónimo').slice(0, 24), body, client_id: cid }).select().single();
    setSending(false);
    if (error) {
      return setErr(
        /messages_limites/.test(error.message) ? 'Mensagem inválida: máximo 500 caracteres e sem links.'
        : /row-level|policy/i.test(error.message) ? 'Estás a enviar depressa demais, ou o chat está bloqueado para ti. Espera um pouco.'
        : 'Não foi possível enviar. Tenta de novo.'
      );
    }
    setText(''); stick.current = true;
    setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  // moderação (só aparece para o admin com sessão iniciada)
  async function del(id) {
    await sb.from('messages').delete().eq('id', id);
    setMsgs((m) => m.filter((x) => x.id !== id));
  }
  async function ban(m) {
    if (!confirm(`Bloquear "${m.nickname}" e apagar as mensagens dele?`)) return;
    await sb.from('banned_clients').insert({ client_id: m.client_id });
    await sb.from('messages').delete().eq('client_id', m.client_id);
    setMsgs((x) => x.filter((y) => y.client_id !== m.client_id));
  }

  if (!on && !admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="mb-2 text-xl font-bold">Chat temporariamente fechado</h1>
        <p className="text-sm text-slate-500">A comunidade está em pausa. Volta mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Comunidade</h1>
          <p className="text-xs text-slate-500">Chat anónimo sobre livros e tudo o resto. Sê respeitoso: mensagens ofensivas são apagadas e quem insistir é bloqueado.</p>
          {!on && <p className="text-xs font-semibold text-amber-600">Chat desligado para o público (só tu vês isto).</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500"><Users size={14} /> {online} online</span>
      </div>

      <div ref={box} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Ainda ninguém falou. Começa a conversa! 👋</p>}
        {msgs.map((m) => {
          const mine = m.client_id === cid;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <div className={`mb-0.5 flex items-center gap-2 text-[11px] ${mine ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  <b>{m.nickname}</b>
                  <span>{new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                  {admin && (
                    <span className="ml-1 flex gap-2">
                      <button onClick={() => del(m.id)} title="Apagar"><Trash2 size={12} /></button>
                      <button onClick={() => ban(m)} title="Bloquear pessoa"><Ban size={12} /></button>
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="mt-2">
        {err && <p className="mb-1 text-xs text-red-600">{err}</p>}
        <div className="flex items-center gap-2">
          <input aria-label="O teu nome" value={nick} maxLength={24} onChange={(e) => setNick(e.target.value)} onBlur={() => store.set('bv_nick', nick)} className={`${field} w-28 sm:w-36`} />
          <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Escreve uma mensagem..." className={`${field} min-w-0 flex-1`} />
          <button disabled={sending || !text.trim()} aria-label="Enviar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"><Send size={16} /></button>
        </div>
      </form>
    </div>
  );
}
