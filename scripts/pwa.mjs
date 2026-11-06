import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function pwa() {
  let base = '/';
  return {
    name: 'lottocube-offline',
    configResolved(config) {
      base = config.base || '/';
      if (!base.endsWith('/')) base += '/';
    },
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
        base,
        `${base}manifest.webmanifest`,
        `${base}icon-192.png`,
        `${base}icon-512.png`,
        `${base}icon-maskable.png`,
        ...files.map((file) => `${base}${file}`),
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
    event.respondWith(fetch(event.request).catch(() => caches.match('${base}')));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});`,
      });
      const rawManifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
      rawManifest.id = base;
      rawManifest.start_url = base;
      rawManifest.scope = base;
      rawManifest.icons = rawManifest.icons.map((icon) => ({
        ...icon,
        src: icon.src.startsWith('/') ? `${base}${icon.src.slice(1)}` : `${base}${icon.src}`,
      }));
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(rawManifest, null, 2),
      });
    },
  };
}
