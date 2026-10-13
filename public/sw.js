// BookVault service worker: abre mais depressa e mostra uma página simpática sem ligação.
// Não guarda páginas, login, chat nem dados: só ficheiros do visual e capas.
const VERSION = 'v1';
const STATIC = `bv-static-${VERSION}`;
const IMAGES = `bv-img-${VERSION}`;
const OFFLINE = '/offline.html';
const MAX_IMAGES = 200;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC).then((c) => c.addAll([OFFLINE, '/icons/icon-192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== IMAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const c = await caches.open(name);
  let keys = await c.keys();
  while (keys.length > max) { await c.delete(keys[0]); keys = await c.keys(); }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // páginas: sempre da internet; se não houver ligação, mostra a página offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // ficheiros do site com nome único (nunca mudam): cache primeiro
  if (url.origin === location.origin && url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // capas dos livros: cache primeiro (no máximo 200)
  if (url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/covers/')) {
    e.respondWith(
      caches.open(IMAGES).then(async (c) => {
        const hit = await c.match(req.url);
        if (hit) return hit;
        try {
          const res = await fetch(req.url, { mode: 'cors' }); // resposta normal (não "opaca"), ocupa menos espaço
          if (res.ok) { await c.put(req.url, res.clone()); trim(IMAGES, MAX_IMAGES); }
          return res;
        } catch {
          return fetch(req);
        }
      })
    );
  }
});
