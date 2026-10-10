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
