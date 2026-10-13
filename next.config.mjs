export default {
  webpack: (config) => {
    config.resolve.alias.canvas = false; // exigido pelo pdfjs-dist no browser
    return config;
  },
  async headers() {
    // o service worker nunca fica preso na cache, para as atualizações chegarem logo
    return [{
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    }];
  },
};
