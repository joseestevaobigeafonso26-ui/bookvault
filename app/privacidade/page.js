export const metadata = { title: 'Política de Privacidade | BookVault' };

const Sec = ({ t, children }) => (
  <section className="mb-6">
    <h2 className="mb-2 text-lg font-bold">{t}</h2>
    <div className="space-y-2 text-slate-600 dark:text-slate-300">{children}</div>
  </section>
);

export default function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-6 text-3xl font-bold">Política de Privacidade</h1>
      <p className="mb-6 text-sm text-slate-400">Última atualização: {new Date().toLocaleDateString('pt-PT')}</p>

      <Sec t="Que dados recolhemos">
        <p>Ao criar conta guardamos o teu email e uma palavra-passe cifrada, geridos pelo Supabase. Contamos também downloads e leituras de cada livro, sem os associar a ti.</p>
      </Sec>
      <Sec t="Publicidade Google AdSense">
        <p>Este site usa o Google AdSense para mostrar anúncios. O Google e os seus parceiros podem usar cookies para apresentar anúncios com base nas tuas visitas a este e a outros sites.</p>
        <p>Podes desativar a publicidade personalizada em <a className="text-brand-600 underline" href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">adssettings.google.com</a> e saber mais em <a className="text-brand-600 underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/ads</a>.</p>
      </Sec>
      <Sec t="Cookies">
        <p>Usamos cookies essenciais para manter a tua sessão iniciada e cookies de terceiros (Google) para publicidade. Podes apagá-los ou bloqueá-los nas definições do navegador.</p>
      </Sec>
      <Sec t="Os teus direitos">
        <p>Podes pedir o acesso, a correção ou a eliminação da tua conta e dos teus dados escrevendo para o contacto indicado na página <a className="text-brand-600 underline" href="/sobre">Sobre</a>.</p>
      </Sec>
    </div>
  );
}
