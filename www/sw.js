const C="ekg-v7";
const FILES=["./","index.html","privacy.html","config.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png",
"fonts/manrope-cyrillic-400-normal.woff2","fonts/manrope-cyrillic-500-normal.woff2","fonts/manrope-cyrillic-600-normal.woff2","fonts/manrope-cyrillic-700-normal.woff2","fonts/manrope-cyrillic-800-normal.woff2",
"fonts/manrope-latin-400-normal.woff2","fonts/manrope-latin-500-normal.woff2","fonts/manrope-latin-600-normal.woff2","fonts/manrope-latin-700-normal.woff2","fonts/manrope-latin-800-normal.woff2",
"fonts/jetbrains-mono-cyrillic-500-normal.woff2","fonts/jetbrains-mono-cyrillic-700-normal.woff2","fonts/jetbrains-mono-latin-500-normal.woff2","fonts/jetbrains-mono-latin-700-normal.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
