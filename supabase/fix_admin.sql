-- Corre isto UMA vez no Supabase (SQL Editor). Resolve o admin de vez.

-- 1) Cria o perfil de contas que já existiam sem perfil
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 2) Torna o teu email admin
update public.profiles set role = 'admin' where email = 'joseestevaoedson@gmail.com';

-- 3) Novas contas com este email já nascem admin
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, case when new.email = 'joseestevaoedson@gmail.com' then 'admin' else 'user' end)
  on conflict (id) do nothing;
  return new;
end $$;

-- 4) Confirmação: deve aparecer 1 linha com role = admin
select id, email, role from public.profiles where email = 'joseestevaoedson@gmail.com';
