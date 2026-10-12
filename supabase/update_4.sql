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
