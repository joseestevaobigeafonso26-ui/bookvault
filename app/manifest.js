export default function manifest() {
  return {
    name: 'BookVault - Livros Gratuitos',
    short_name: 'BookVault',
    description: 'Leia e baixe livros gratuitos do domínio público.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#16a34a',
    lang: 'pt',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [{ name: 'Comunidade', url: '/comunidade' }],
  };
}
