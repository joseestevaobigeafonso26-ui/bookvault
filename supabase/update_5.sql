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
