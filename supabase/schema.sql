-- Corre isto no Supabase: SQL Editor > New query > Run

-- ========== PERFIS (user / admin) ==========
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, case when new.email = 'joseestevaoedson@gmail.com' then 'admin' else 'user' end)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== LIVROS ==========
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category text not null default 'Geral',
  synopsis text,
  pages int,
  rating numeric(2,1) default 4.5,
  cover_url text, cover_path text,
  file_url text,  file_path text,
  downloads int not null default 0,
  reads int not null default 0,
  created_at timestamptz default now()
);

-- ========== CONFIGURAÇÕES (AdSense) ==========
create table public.settings (
  id int primary key default 1 check (id = 1),
  adsense_enabled boolean not null default false,
  adsense_client text not null default '',   -- ex: ca-pub-1234567890123456
  slot_feed text not null default '',
  slot_book text not null default ''
);
insert into public.settings default values;

-- ========== CONTADORES ==========
create function public.increment_book(book uuid, field text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if field = 'downloads' then update books set downloads = downloads + 1 where id = book;
  elsif field = 'reads' then update books set reads = reads + 1 where id = book;
  end if;
end $$;
grant execute on function public.increment_book to anon, authenticated;

-- ========== SEGURANÇA (RLS): o admin controla tudo ==========
alter table public.profiles enable row level security;
alter table public.books    enable row level security;
alter table public.settings enable row level security;

create policy "perfil: ver o proprio ou admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "perfil: so admin altera"        on profiles for update using (is_admin());
create policy "livros: leitura publica"        on books for select using (true);
create policy "livros: so admin escreve"       on books for all using (is_admin()) with check (is_admin());
create policy "settings: leitura publica"      on settings for select using (true);
create policy "settings: so admin altera"      on settings for update using (is_admin());

-- ========== STORAGE (capas e PDFs) ==========
insert into storage.buckets (id, name, public) values ('covers','covers',true), ('books','books',true)
  on conflict do nothing;

create policy "storage: leitura publica" on storage.objects for select
  using (bucket_id in ('covers','books'));
create policy "storage: so admin escreve" on storage.objects for all
  using (bucket_id in ('covers','books') and is_admin())
  with check (bucket_id in ('covers','books') and is_admin());

-- ========== PRIMEIRO ADMIN ==========
-- 1) Cria a tua conta em /login   2) Corre isto com o teu email:
-- update public.profiles set role = 'admin' where email = 'teu@email.com';

-- ===== Atualização 2 e 3 (para instalações novas) =====
-- Corre UMA vez no SQL Editor: sugestões de livros enviadas pelos utilizadores

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  user_email text default (auth.jwt() ->> 'email'),
  title text not null,
  author text,
  category text,
  note text,
  file_path text,
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  created_at timestamptz default now()
);

alter table public.submissions enable row level security;

-- o utilizador envia (máx. 5 pendentes ao mesmo tempo) e vê só as suas
create policy "sugestoes: utilizador envia" on submissions for insert to authenticated
  with check (
    user_id = auth.uid()
    and user_email = (auth.jwt() ->> 'email')
    and (select count(*) from submissions s where s.user_id = auth.uid() and s.status = 'pendente') < 5
  );
create policy "sugestoes: ver proprias ou admin" on submissions for select to authenticated
  using (user_id = auth.uid() or is_admin());
create policy "sugestoes: so admin altera"  on submissions for update to authenticated using (is_admin());
create policy "sugestoes: so admin apaga"   on submissions for delete to authenticated using (is_admin());

-- bucket PRIVADO (só o admin lê os PDFs), até 30 MB, só PDF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', false, 31457280, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 31457280, allowed_mime_types = array['application/pdf'];

create policy "sugestoes-storage: utilizador envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sugestoes-storage: admin gere" on storage.objects for all to authenticated
  using (bucket_id = 'submissions' and is_admin())
  with check (bucket_id = 'submissions' and is_admin());

-- ===== Atualização 4 (sugestões sem conta) =====
-- Corre UMA vez no SQL Editor: sugestões SEM conta (qualquer visitante pode enviar)

alter table public.submissions alter column user_id drop not null;
alter table public.submissions alter column user_email drop default;

drop policy if exists "sugestoes: utilizador envia" on public.submissions;
drop policy if exists "sugestoes: ver proprias ou admin" on public.submissions;
drop policy if exists "sugestoes-storage: utilizador envia" on storage.objects;

-- trava anti-spam: no máximo 60 sugestões e 40 PDFs à espera de análise
-- (protege o teu armazenamento; quando estiver cheio, o visitante vê um aviso simpático)
create or replace function public.submissions_open() returns boolean
language sql security definer stable set search_path = public, storage as $$
  select (select count(*) from public.submissions where status = 'pendente') < 60
     and (select count(*) from storage.objects where bucket_id = 'submissions') < 40
$$;
grant execute on function public.submissions_open() to anon, authenticated;

alter table public.submissions drop constraint if exists submissions_limites;
alter table public.submissions add constraint submissions_limites check (
  char_length(coalesce(title,''))    <= 200 and char_length(coalesce(author,'')) <= 200 and
  char_length(coalesce(category,'')) <= 100 and char_length(coalesce(note,''))   <= 1000);

create policy "sugestoes: visitante envia" on public.submissions for insert to anon, authenticated
  with check (status = 'pendente' and user_id is null
              and (file_path is null or file_path like 'inbox/%') and public.submissions_open());
create policy "sugestoes: so admin ve" on public.submissions for select to authenticated using (is_admin());

create policy "sugestoes-storage: visitante envia" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = 'inbox' and public.submissions_open());

-- PDFs até 20 MB
update storage.buckets set file_size_limit = 20971520 where id = 'submissions';
