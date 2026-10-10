'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500';

// Ecrã único: utilizadores e admin entram aqui. O papel (role) decide para onde vão.
function LoginForm() {
  const next = useSearchParams().get('next');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg('');
    const sb = supabaseBrowser();
    const { data, error } = mode === 'login'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      return setMsg(/not confirmed/i.test(error.message) ? 'Confirma o teu email antes de entrar (vê a caixa de entrada).'
        : /invalid login/i.test(error.message) ? 'Email ou palavra-passe incorretos.' : error.message);
    }
    if (!data.session) return setMsg('Conta criada. Confirma o teu email para entrar.');
    const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
    // Navegação completa: garante que o servidor já recebe a sessão (cookies) ao abrir /admin
    window.location.assign(p?.role === 'admin' ? '/admin' : next || '/');
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800">
      <h1 className="text-xl font-bold">{mode === 'login' ? 'Entrar no BookVault' : 'Criar conta'}</h1>
      <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" required minLength={6} placeholder="Palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-sm text-slate-500 hover:underline">
        {mode === 'login' ? 'Não tens conta? Cria uma' : 'Já tens conta? Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
