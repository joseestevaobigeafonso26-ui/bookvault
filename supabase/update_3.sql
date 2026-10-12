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
