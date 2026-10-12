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
