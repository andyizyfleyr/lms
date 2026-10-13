/* ============================================================
   CosmétiLab — service worker
   ------------------------------------------------------------
   Deux métiers, et rien d'autre :
   1. l'application est gardée en cache : elle s'ouvre même sans réseau ;
   2. au retour du réseau, la file d'attente hors-ligne est envoyée.
   Aucune donnée personnelle n'est mise en cache (les /api/* passent
   toujours par le réseau ; seul l'écran d'erreur est servi si le réseau
   manque, l'application affiche alors l'état « hors ligne »).
   ============================================================ */
const CACHE = 'cosmetilab-v3';
const COQUILLE = ['/', '/cours', '/revision', '/outils', '/hors-ligne', '/manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE).catch(() => undefined)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(c => c !== CACHE).map(c => caches.delete(c))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.indexOf('/api/') === 0) return;                 // toujours en direct
  e.respondWith(
    fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => undefined);
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  );
});

/* l'application demande la synchronisation quand le réseau revient */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'sync-maintenant'){
    self.clients.matchAll().then(liste => liste.forEach(c => c.postMessage({ type: 'synchroniser' })));
  }
});
