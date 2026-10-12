import Link from 'next/link';
import { BookOpen, ShieldCheck, LogIn, LogOut, MessageCircle } from 'lucide-react';
import ShareBook from './ShareBook';
import { supabaseServer } from '@/lib/supabase/server';

export default async function Header() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  let role = null;
  if (user) {
    const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
    role = data?.role;
  }
  const btn = 'flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800';
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-600 grid place-items-center text-white shadow-lg shadow-brand-600/30">
            <BookOpen size={22} />
          </span>
          <span className="font-bold text-xl tracking-tight">Book<span className="text-brand-600">Vault</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/comunidade" className={btn}><MessageCircle size={16} /> <span className="hidden sm:inline">Comunidade</span></Link>
          <ShareBook className={btn} />
          {role === 'admin' && (
            <Link href="/admin" className={btn}><ShieldCheck size={16} className="text-amber-500" /> <span className="hidden sm:inline">Painel Admin</span></Link>
          )}
          {user ? (
            <form action="/auth/signout" method="post">
              <button className={btn}><LogOut size={16} /> <span className="hidden sm:inline">Sair</span></button>
            </form>
          ) : (
            <Link href="/login" className={btn}><LogIn size={16} /> Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
