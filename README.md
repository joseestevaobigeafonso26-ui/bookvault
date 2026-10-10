# BookVault (Next.js + Supabase + AdSense)

## 1. Supabase
1. Cria um projeto em supabase.com.
2. SQL Editor → cola e corre `supabase/schema.sql` (tabelas, RLS, buckets `covers` e `books`).
3. Authentication → Providers → Email (desativa "Confirm email" se quiseres entrar logo após registo).
4. Settings → API: copia a URL e a anon key.

## 2. Local
```bash
cp .env.example .env.local   # preenche URL e anon key
npm install
npm run dev
```

## 3. Primeiro admin
Cria conta em `/login` e corre no SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'teu@email.com';
```
Depois, esse email entra no mesmo `/login` e é levado ao `/admin`.

## 4. AdSense
No `/admin` → Publicidade: ativa, cola o ID `ca-pub-...` e os slots. O script do Google e o `/ads.txt` são gerados automaticamente.
Precisas de domínio próprio, página de política de privacidade e conta AdSense aprovada.

## Deploy
Vercel: importa o repositório e define as 2 variáveis de ambiente.

## Antes de pedir a aprovação do AdSense
1. Publica pelo menos 10–15 livros com sinopse (conteúdo próprio, não só a capa).
2. Define `NEXT_PUBLIC_SITE_URL` com o teu domínio final (usado em `sitemap.xml` e `robots.txt`).
3. Confirma que `/privacidade`, `/sobre` e `/ads.txt` abrem.
4. No AdSense, adiciona o domínio e envia o site para revisão. Depois da aprovação, cria os blocos de anúncio e cola os slots no `/admin`.
