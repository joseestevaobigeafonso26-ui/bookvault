import Chat from '@/components/Chat';
import { getSettings } from '@/lib/settings';

// noindex: conversas de utilizadores não devem ser indexadas pelo Google
export const metadata = {
  title: 'Comunidade | BookVault',
  description: 'Conversa anónima sobre livros e tudo o resto.',
  robots: { index: false, follow: true },
};

export default async function ComunidadePage() {
  const s = await getSettings();
  return <Chat enabled={s.chat_enabled !== false} />;
}
