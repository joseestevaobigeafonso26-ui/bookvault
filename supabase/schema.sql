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

-- ===== Atualização 5 (chat) =====
-- Corre UMA vez no SQL Editor: chat anónimo "Comunidade"

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  nickname text not null default 'Anónimo',
  body text not null,
  client_id text not null,
  created_at timestamptz not null default now(),
  constraint messages_limites check (
    char_length(body) between 1 and 500
    and char_length(nickname) between 1 and 24
    and char_length(client_id) between 8 and 64
    and body !~* '(https?://|www\.)'            -- sem links (anti-spam)
  )
);
create index if not exists messages_client_idx on public.messages (client_id, created_at);

create table if not exists public.banned_clients (
  client_id text primary key,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
alter table public.banned_clients enable row level security;

-- travões: bloqueados não escrevem; máx. 12 msgs/min por pessoa, 1 a cada 2 s, e 60/min no chat todo
create or replace function public.can_post(cid text) returns boolean
language sql security definer stable set search_path = public as $$
  select not exists (select 1 from banned_clients where client_id = cid)
     and (select count(*) from messages where client_id = cid and created_at > now() - interval '1 minute') < 12
     and not exists (select 1 from messages where client_id = cid and created_at > now() - interval '2 seconds')
     and (select count(*) from messages where created_at > now() - interval '1 minute') < 60
$$;
grant execute on function public.can_post to anon, authenticated;

create policy "chat: ler"          on public.messages for select to anon, authenticated using (true);
create policy "chat: enviar"       on public.messages for insert to anon, authenticated with check (public.can_post(client_id));
create policy "chat: admin apaga"  on public.messages for delete to authenticated using (is_admin());
create policy "bloqueios: admin"   on public.banned_clients for all to authenticated using (is_admin()) with check (is_admin());

-- tempo real
alter publication supabase_realtime add table public.messages;

-- ===== Atualização 6 (interruptor do chat) =====
-- Corre UMA vez no SQL Editor: interruptor para ligar/desligar o chat

alter table public.settings add column if not exists chat_enabled boolean not null default true;

create or replace function public.chat_on() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select chat_enabled from settings where id = 1), true)
$$;
grant execute on function public.chat_on to anon, authenticated;

-- desligado = ninguém escreve (mesmo por fora do site)
create or replace function public.can_post(cid text) returns boolean
language sql security definer stable set search_path = public as $$
  select public.chat_on()
     and not exists (select 1 from banned_clients where client_id = cid)
     and (select count(*) from messages where client_id = cid and created_at > now() - interval '1 minute') < 12
     and not exists (select 1 from messages where client_id = cid and created_at > now() - interval '2 seconds')
     and (select count(*) from messages where created_at > now() - interval '1 minute') < 60
$$;

-- desligado = só o admin lê as mensagens
drop policy if exists "chat: ler" on public.messages;
create policy "chat: ler" on public.messages for select to anon, authenticated
  using (public.chat_on() or is_admin());

-- avisa quem está no chat em tempo real quando o interruptor muda
alter publication supabase_realtime add table public.settings;

-- ===== Atualização 7 (respostas e reações) =====
-- Corre UMA vez no SQL Editor: respostas e reações (👍 Gosto, ❤️ Adoro) no chat

alter table public.messages
  add column if not exists reply_to bigint references public.messages(id) on delete set null;

create table if not exists public.message_reactions (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.messages(id) on delete cascade,
  client_id text not null,
  kind text not null check (kind in ('like','love')),
  created_at timestamptz not null default now(),
  unique (message_id, client_id)          -- 1 reação por pessoa em cada mensagem
);
create index if not exists reactions_message_idx on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;
create policy "reacoes: ler" on public.message_reactions for select to anon, authenticated
  using (public.chat_on() or is_admin());
create policy "reacoes: admin apaga" on public.message_reactions for delete to authenticated
  using (is_admin());

-- reagir passa por esta função (com travões): clicar de novo na mesma reação retira-a, outra reação troca
create or replace function public.react(p_message bigint, p_client text, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('like','love') then raise exception 'tipo invalido'; end if;
  if char_length(p_client) not between 8 and 64 then raise exception 'cliente invalido'; end if;
  if not public.chat_on() then raise exception 'chat desligado'; end if;
  if exists (select 1 from banned_clients where client_id = p_client) then raise exception 'bloqueado'; end if;
  if (select count(*) from message_reactions where client_id = p_client and created_at > now() - interval '1 minute') >= 30
    then raise exception 'muito depressa'; end if;

  if exists (select 1 from message_reactions where message_id = p_message and client_id = p_client and kind = p_kind) then
    delete from message_reactions where message_id = p_message and client_id = p_client;
  else
    insert into message_reactions (message_id, client_id, kind) values (p_message, p_client, p_kind)
    on conflict (message_id, client_id) do update set kind = excluded.kind, created_at = now();
  end if;
end $$;
grant execute on function public.react to anon, authenticated;

alter publication supabase_realtime add table public.message_reactions;

-- ===== Atualização 8 (catálogo por páginas) =====
-- Corre UMA vez no SQL Editor: catálogo por páginas (estatísticas rápidas + índices)

create or replace function public.catalog_meta() returns json
language sql stable as $$
  select json_build_object(
    'total',     (select count(*) from public.books),
    'downloads', (select coalesce(sum(downloads), 0) from public.books),
    'categories', coalesce((
      select json_agg(json_build_object('name', category, 'n', n) order by n desc)
      from (select category, count(*) as n from public.books group by category) c
    ), '[]'::json)
  )
$$;
grant execute on function public.catalog_meta to anon, authenticated;

create index if not exists books_downloads_idx on public.books (downloads desc);
create index if not exists books_created_idx   on public.books (created_at desc);
create index if not exists books_category_idx  on public.books (category);
