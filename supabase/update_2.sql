-- Corre UMA vez no SQL Editor antes de usar a versão nova (biografia do autor)
alter table public.books add column if not exists author_bio text;
