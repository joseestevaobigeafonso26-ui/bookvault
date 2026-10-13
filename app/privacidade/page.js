export const metadata = { title: 'Política de Privacidade | BookVault' };

const UPDATED = '13 de outubro de 2026'; // atualiza esta data sempre que mudares o texto

const Sec = ({ t, children }) => (
  <section className="mb-7">
    <h2 className="mb-2 text-lg font-bold">{t}</h2>
    <div className="space-y-2 text-slate-600 dark:text-slate-300">{children}</div>
  </section>
);
const A = ({ href, children, ext }) => (
  <a className="text-brand-600 underline" href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
);

export default function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="mb-2 text-3xl font-bold">Política de Privacidade</h1>
      <p className="mb-8 text-sm text-slate-400">Última atualização: {UPDATED}</p>

      <p className="mb-7 text-slate-600 dark:text-slate-300">
        Podes navegar, ler, baixar livros, partilhar sugestões e usar o chat <b>sem criar conta</b>.
        Esta página explica, em linguagem simples, que informação existe quando usas o BookVault.
      </p>

      <Sec t="1. Navegação e contagens">
        <p>Contamos quantas vezes cada livro é lido e baixado. Esses números são totais do livro e não ficam associados a ti.</p>
      </Sec>

      <Sec t="2. Contas">
        <p>Criar conta é opcional. Se criares, guardamos o teu email e uma palavra-passe cifrada (que nem nós conseguimos ler), geridos pelo nosso fornecedor de base de dados, o Supabase.</p>
      </Sec>

      <Sec t="3. Chat da Comunidade (anónimo)">
        <p>O chat não pede email, telefone nem conta. Quando escreves, ficam guardados:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>o nome que escolheste (ou o nome aleatório, tipo “Leitor-1234”);</li>
          <li>o texto da mensagem, a hora, e as respostas e reações (“Gosto” e “Adoro”) que deres;</li>
          <li>um identificador aleatório, guardado no teu navegador, que serve para reconhecer as tuas mensagens, limitar spam e bloquear abusos. Não está ligado ao teu nome real.</li>
        </ul>
        <p><b>As mensagens são visíveis para qualquer pessoa que abra o chat.</b> Não escrevas dados pessoais teus ou de outras pessoas (nome completo, telefone, morada, documentos).</p>
        <p>As mensagens ficam guardadas até serem apagadas. Podemos apagar mensagens, bloquear quem desrespeite as regras (ofensas, conteúdo ilegal, spam) e desligar o chat a qualquer momento. As mensagens não têm ligações (links) permitidas e a página do chat não é indexada pelo Google nem tem anúncios.</p>
        <p>Queres que uma mensagem tua seja removida? Escreve-nos pelo contacto da página <A href="/sobre">Sobre</A> a indicar o nome e a hora aproximada da mensagem.</p>
      </Sec>

      <Sec t="4. Livros partilhados por ti">
        <p>Se usares “Partilhar livro”, recebemos o PDF e os textos que escreveres (título, autor, categoria, nota). Não pedimos identificação. O ficheiro fica numa área privada, que só o administrador vê. Se o livro for aprovado, passa a ser público no site. Se for rejeitado, o ficheiro é apagado.</p>
        <p>Só partilha livros de domínio público ou que tenhas autorização para divulgar.</p>
      </Sec>

      <Sec t="5. O que fica guardado no teu aparelho">
        <p>O site guarda no teu navegador o identificador e o nome do chat, a tua sessão (se tiveres conta) e, se instalares o BookVault como app, ficheiros de visual e capas para abrir mais depressa. Apagar os dados do navegador remove tudo isto.</p>
      </Sec>

      <Sec t="6. Publicidade Google AdSense">
        <p>Este site usa o Google AdSense para mostrar anúncios. O Google e os seus parceiros podem usar cookies para apresentar anúncios com base nas tuas visitas a este e a outros sites.</p>
        <p>Podes desativar a publicidade personalizada em <A ext href="https://adssettings.google.com">adssettings.google.com</A> e saber mais em <A ext href="https://policies.google.com/technologies/ads">policies.google.com/technologies/ads</A>.</p>
      </Sec>

      <Sec t="7. Fornecedores e registos técnicos">
        <p>O site funciona com serviços de terceiros (alojamento na Vercel e base de dados e armazenamento no Supabase). No funcionamento normal, estes serviços podem registar dados técnicos, como o endereço IP e o tipo de navegador. Não vendemos os teus dados.</p>
      </Sec>

      <Sec t="8. Os teus direitos">
        <p>Podes pedir o acesso, a correção ou a eliminação da tua conta, de mensagens tuas ou de sugestões que enviaste, escrevendo para o contacto da página <A href="/sobre">Sobre</A>.</p>
      </Sec>

      <Sec t="9. Crianças">
        <p>O chat é aberto a todos e não é moderado em tempo real. Recomendamos que menores o usem com acompanhamento de um adulto.</p>
      </Sec>

      <Sec t="10. Alterações">
        <p>Se esta política mudar, a data no topo é atualizada.</p>
      </Sec>
    </div>
  );
}
