import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function pwa() {
  return {
    name: 'lottocube-offline',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(
        (name) => !name.endsWith('.map'),
      );
      const revision = createHash('sha256')
        .update(files.join('|'))
        .update(readFileSync('public/manifest.webmanifest'))
        .update(readFileSync('public/icon-512.png'))
        .digest('hex')
        .slice(0, 12);
      const assets = [
        '/',
        '/manifest.webmanifest',
        '/icon-192.png',
        '/icon-512.png',
        '/icon-maskable.png',
        ...files.map((file) => `/${file}`),
      ];
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE = 'lottocube-${revision}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('lottocube-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});`,
      });
    },
  };
}
