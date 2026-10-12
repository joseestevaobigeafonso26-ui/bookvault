import './globals.css';
import { Inter, Merriweather } from 'next/font/google';
import Header from '@/components/Header';
import TopProgress from '@/components/TopProgress';
import { getSettings } from '@/lib/settings';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Merriweather({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-serif' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { siteName: 'BookVault', locale: 'pt_PT', type: 'website' },
  title: 'BookVault - Repositório Digital de Livros Gratuitos',
  description: 'Explore, leia e baixe livros do domínio público.',
};

// O layout lê a sessão (cookies) em cada pedido, por isso nada é pré-renderizado no build
export const dynamic = 'force-dynamic';

export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const s = await getSettings();
  const ads = s.adsense_enabled && s.adsense_client;
  return (
    <html lang="pt">
      <head>
        {ads && (
          <>
            <meta name="google-adsense-account" content={s.adsense_client} />
            <script async crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${s.adsense_client}`} />
          </>
        )}
      </head>
      <body className={`${sans.variable} ${serif.variable} min-h-screen flex flex-col overflow-x-hidden font-sans bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100`}>
        <TopProgress />
        <Header />
        <main className="flex-grow">{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center text-sm text-slate-500">
          <nav className="mb-3 flex justify-center gap-4">
            <a href="/sobre" className="hover:underline">Sobre e Contacto</a>
            <a href="/privacidade" className="hover:underline">Privacidade</a>
          </nav>
          <p className="mb-1">BookVault © {new Date().getFullYear()} – Repositório de livros de livre acesso.</p>
          <p className="text-xs text-slate-400">Todas as obras fazem parte do domínio público ou têm licença de distribuição livre.</p>
        </footer>
      </body>
    </html>
  );
}
