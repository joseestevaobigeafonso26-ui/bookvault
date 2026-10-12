'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Trash2, Ban, Users, CornerUpLeft, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500';
const pill = 'rounded-full bg-white px-2 py-0.5 text-xs shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600';

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export default function Chat({ enabled = true }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [cid, setCid] = useState('');
  const [nick, setNick] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [reacts, setReacts] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [active, setActive] = useState(null); // mensagem clicada (mostra Gosto / Adoro / Responder)
  const [admin, setAdmin] = useState(false);
  const [online, setOnline] = useState(0);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [on, setOn] = useState(enabled);
  const box = useRef(null);
  const input = useRef(null);
  const stick = useRef(true);

  const byId = useMemo(() => new Map(msgs.map((m) => [m.id, m])), [msgs]);
  const counts = useMemo(() => {
    const map = {};
    for (const r of reacts) {
      const c = (map[r.message_id] ??= { like: 0, love: 0, mine: null });
      c[r.kind]++;
      if (r.client_id === cid) c.mine = r.kind;
    }
    return map;
  }, [reacts, cid]);

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

  // interruptor: se o admin desligar o chat, fecha para todos na hora (não apaga nada)
  useEffect(() => {
    const ch = sb.channel('chat-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (p) => {
        if (typeof p.new.chat_enabled === 'boolean') setOn(p.new.chat_enabled);
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb]);

  useEffect(() => {
    if (!cid || (!on && !admin)) return;
    let alive = true;
    (async () => {
      const { data } = await sb.from('messages').select('*').order('id', { ascending: false }).limit(100);
      const rows = (data || []).reverse();
      if (!alive) return;
      setMsgs(rows);
      if (rows.length) {
        const { data: rs } = await sb.from('message_reactions').select('*').in('message_id', rows.map((m) => m.id));
        if (alive) setReacts(rs || []);
      }
    })();

    const ch = sb.channel('comunidade', { config: { presence: { key: cid } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (p) => setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new].slice(-200))))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
        (p) => setMsgs((m) => m.filter((x) => x.id !== p.old.id)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (p) => {
        if (p.eventType === 'DELETE') setReacts((r) => r.filter((x) => x.id !== p.old.id));
        else setReacts((r) => [...r.filter((x) => x.id !== p.new.id), p.new]);
      })
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
      .insert({ nickname: (nick.trim() || 'Anónimo').slice(0, 24), body, client_id: cid, reply_to: replyTo?.id ?? null })
      .select().single();
    setSending(false);
    if (error) {
      return setErr(
        /messages_limites/.test(error.message) ? 'Mensagem inválida: máximo 500 caracteres e sem links.'
        : /row-level|policy/i.test(error.message) ? 'Estás a enviar depressa demais, ou o chat está bloqueado para ti. Espera um pouco.'
        : 'Não foi possível enviar. Tenta de novo.'
      );
    }
    setText(''); setReplyTo(null); stick.current = true;
    setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  async function react(m, kind) {
    setErr('');
    const { error } = await sb.rpc('react', { p_message: m.id, p_client: cid, p_kind: kind });
    if (error) return setErr('Não foi possível reagir agora. Tenta de novo daqui a pouco.');
    const { data } = await sb.from('message_reactions').select('*').eq('message_id', m.id);
    setReacts((r) => [...r.filter((x) => x.message_id !== m.id), ...(data || [])]);
    setActive(null);
  }

  const jump = (id) => document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // moderação (só aparece para o admin com sessão iniciada): apaga só o que escolheres
  async function del(id) {
    await sb.from('messages').delete().eq('id', id);
    setMsgs((m) => m.filter((x) => x.id !== id));
  }
  async function ban(m) {
    if (!confirm(`Bloquear "${m.nickname}" e apagar as mensagens dele?`)) return;
    await sb.from('banned_clients').insert({ client_id: m.client_id });
    await sb.from('messages').delete().eq('client_id', m.client_id);
    await sb.from('message_reactions').delete().eq('client_id', m.client_id);
    setMsgs((x) => x.filter((y) => y.client_id !== m.client_id));
    setReacts((x) => x.filter((y) => y.client_id !== m.client_id));
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
          const quoted = m.reply_to ? byId.get(m.reply_to) : null;
          const c = counts[m.id];
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div onClick={() => setActive(active === m.id ? null : m.id)}
                className={`max-w-[85%] cursor-pointer rounded-2xl px-3.5 py-2 ${mine ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700'} ${active === m.id ? 'ring-2 ring-brand-500/50' : ''}`}>
                <div className={`mb-0.5 flex items-center gap-2 text-[11px] ${mine ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  <b>{m.nickname}</b>
                  <span>{new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                  {admin && (
                    <span className="ml-1 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); del(m.id); }} title="Apagar esta mensagem"><Trash2 size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); ban(m); }} title="Bloquear pessoa"><Ban size={12} /></button>
                    </span>
                  )}
                </div>
                {m.reply_to && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); quoted && jump(m.reply_to); }}
                    className={`mb-1 block w-full truncate rounded-lg border-l-4 px-2 py-1 text-left text-xs ${mine ? 'border-white/60 bg-white/15' : 'border-brand-500 bg-black/5 dark:bg-white/10'}`}>
                    {quoted ? <><b>{quoted.nickname}</b>: {quoted.body}</> : 'Mensagem anterior'}
                  </button>
                )}
                <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
              </div>

              {c && (c.like > 0 || c.love > 0) && (
                <span className={`${pill} -mt-1.5 mx-2`}>
                  {c.like > 0 && `👍 ${c.like}`}{c.like > 0 && c.love > 0 && ' '}{c.love > 0 && `❤️ ${c.love}`}
                </span>
              )}

              {active === m.id && (
                <div className={`${pill} mt-1 flex items-center gap-1 !py-1`}>
                  <button onClick={() => react(m, 'like')} className={`rounded-full px-2 py-1 ${c?.mine === 'like' ? 'bg-brand-100 font-semibold text-brand-800' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>👍 Gosto</button>
                  <button onClick={() => react(m, 'love')} className={`rounded-full px-2 py-1 ${c?.mine === 'love' ? 'bg-brand-100 font-semibold text-brand-800' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>❤️ Adoro</button>
                  <button onClick={() => { setReplyTo(m); setActive(null); input.current?.focus(); }} className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"><CornerUpLeft size={12} /> Responder</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="mt-2">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border-l-4 border-brand-500 bg-slate-100 px-3 py-1.5 text-xs dark:bg-slate-800">
            <span className="truncate">Respondendo a <b>{replyTo.nickname}</b>: {replyTo.body}</span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancelar resposta"><X size={14} /></button>
          </div>
        )}
        {err && <p className="mb-1 text-xs text-red-600">{err}</p>}
        <div className="flex items-center gap-2">
          <input aria-label="O teu nome" value={nick} maxLength={24} onChange={(e) => setNick(e.target.value)} onBlur={() => store.set('bv_nick', nick)} className={`${field} w-28 sm:w-36`} />
          <input ref={input} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Escreve uma mensagem..." className={`${field} min-w-0 flex-1`} />
          <button disabled={sending || !text.trim()} aria-label="Enviar" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"><Send size={16} /></button>
        </div>
      </form>
    </div>
  );
}
