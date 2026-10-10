export const metadata = { title: 'Sobre e Contacto | BookVault' };
const EMAIL = 'joseestevaoedson@gmail.com';

export default function Sobre() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed text-slate-600 dark:text-slate-300">
      <h1 className="mb-6 text-3xl font-bold text-slate-800 dark:text-slate-100">Sobre o BookVault</h1>
      <p className="mb-4">O BookVault é um repositório digital onde podes ler no navegador e baixar em PDF livros de domínio público ou com licença de distribuição livre.</p>
      <h2 className="mb-2 mt-8 text-lg font-bold text-slate-800 dark:text-slate-100">Direitos de autor</h2>
      <p className="mb-4">Respeitamos os direitos de autor. Se és titular de direitos e encontras aqui uma obra que não deveria estar disponível, escreve-nos com o link do livro e removemo-lo rapidamente.</p>
      <h2 className="mb-2 mt-8 text-lg font-bold text-slate-800 dark:text-slate-100">Contacto</h2>
      <p><a className="text-brand-600 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </div>
  );
}
