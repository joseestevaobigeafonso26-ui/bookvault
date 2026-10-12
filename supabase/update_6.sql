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
