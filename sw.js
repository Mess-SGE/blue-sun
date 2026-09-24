/* Service worker de Blue Sun.
   - index.html: primero la red (así siempre se ve la última versión) y, si no hay conexión, la copia guardada.
   - Logos, íconos y demás archivos propios: primero la copia guardada (abren al instante).
   - Firebase, Google Fonts y cualquier otro dominio: no se tocan (los datos siempre van en vivo).
   Al publicar cambios hay que subir el número de CACHE: el SW nuevo queda esperando
   y la app muestra «Hay una versión nueva — Actualizar» (no recarga sola en medio del uso). */
var CACHE = 'bluesun-v5';
var ARCHIVOS = ['./', 'index.html', 'manifest.json', 'logo-blanco.png', 'logo-rosa.png', 'mess-logo.svg', 'icono.png',
  'icono-192.png', 'icono-512.png', 'icono-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('message', function(e){ if(e.data === 'actualizar') self.skipWaiting(); });
self.addEventListener('fetch', function(e){
  var req = e.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;
  var esPagina = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if(esPagina){
    e.respondWith(fetch(req).then(function(r){
      var copia = r.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copia); }); return r;
    }).catch(function(){ return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(resp){
      if(resp.ok){ var copia = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); }
      return resp;
    });
  }));
});
