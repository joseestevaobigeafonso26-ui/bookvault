import { redirect } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  const { data: me } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-xl font-bold">Sem permissão de administrador</h1>
        <p className="mb-4 text-sm text-slate-500">
          Entraste como <b>{user.email}</b>, mas esta conta não tem o papel admin. Corre o ficheiro <code>supabase/fix_admin.sql</code> no Supabase e entra de novo.
        </p>
        <a href="/" className="text-sm text-brand-600 hover:underline">Voltar ao catálogo</a>
      </div>
    );
  }

  const [{ data: books }, { data: profiles }, { data: settings }, { data: submissions }] = await Promise.all([
    sb.from('books').select('*').order('created_at', { ascending: false }),
    sb.from('profiles').select('*').order('created_at', { ascending: false }),
    sb.from('settings').select('*').single(),
    sb.from('submissions').select('*').order('created_at', { ascending: false }),
  ]);
  return <AdminPanel me={user.id} books={books || []} profiles={profiles || []} settings={settings} submissions={submissions || []} />;
}
