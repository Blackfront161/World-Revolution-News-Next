import {OWN_PREFIX, ownsCache, byteRange, verifiedBytes} from './atlas-offline-core.js';
// The producer replaces this placeholder with the complete admitted byte inventory.
const PACKAGE = __WRN_OFFLINE_PACKAGE__;
const CONTROL = OWN_PREFIX + 'control', POINTER = '/atlas/__wrn_host_offline_ready__';
const entries = new Map(PACKAGE.files.map(f => ['/' + f.path, f]));
let job, abort, phase = 'idle', done = 0, removing = false;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
async function pointer() {
  if (!(await caches.keys()).includes(CONTROL)) return null;
  const response = await (await caches.open(CONTROL)).match(POINTER);
  const p = response ? await response.json() : null;
  return p?.package === PACKAGE.id && ownsCache(p.cache) && p.cache !== CONTROL ? p : null;
}
async function complete() {
  const p = await pointer();
  if (!p || !(await caches.keys()).includes(p.cache)) return null;
  const cache = await caches.open(p.cache), keys = await cache.keys();
  return keys.length === entries.size && keys.every(r => entries.has(new URL(r.url).pathname)) ? p : null;
}
async function state() { return {type:'wrn-atlas-offline', package:PACKAGE.id, phase, done, total:PACKAGE.bytes, ready:!!(await complete())}; }
async function notify() { const value = await state(); for (const c of await self.clients.matchAll({includeUncontrolled:true})) if (validClient(c)) c.postMessage(value); }
function validClient(client) { const u = new URL(client.url); return u.origin === self.location.origin && ['/atlas/','/atlas/index.html'].includes(u.pathname); }
async function download() {
  const name = OWN_PREFIX + 'payload.' + crypto.randomUUID();
  let control, previous, committed = false;
  abort = new AbortController(); phase = 'downloading'; done = 0;
  try {
    const cache = await caches.open(name);
    for (const entry of PACKAGE.files) {
      abort.signal.throwIfAborted();
      const url = new URL('/' + entry.path, self.location.origin);
      const response = await fetch(url, {cache:'reload', credentials:'same-origin', signal:abort.signal});
      const bytes = await verifiedBytes(response, entry);
      abort.signal.throwIfAborted();
      await cache.put(url, new Response(bytes, {status:200, headers:response.headers}));
      // Read back the actual stored bytes before the ready pointer may be committed.
      await verifiedBytes(await cache.match(url), entry);
      done += entry.bytes; await notify();
    }
    abort.signal.throwIfAborted(); phase = 'verifying'; await notify();
    const keys = await cache.keys(); if (keys.length !== entries.size) throw Error('INTEGRITY');
    control = await caches.open(CONTROL); previous = await control.match(POINTER);
    abort.signal.throwIfAborted();
    await control.put(POINTER, new Response(JSON.stringify({package:PACKAGE.id, cache:name}), {headers:{'Content-Type':'application/json'}}));
    committed = true;
    abort.signal.throwIfAborted();
    phase = 'ready';
  } catch (error) {
    if (committed) { if (previous) await control.put(POINTER, previous); else await control.delete(POINTER); committed = false; }
    await caches.delete(name); phase = error.name === 'AbortError' ? 'cancelled' : 'error';
  }
  abort = null;
  // Cleanup failure must never remove the newly committed, verified package.
  if (committed) { try { for (const key of await caches.keys()) if (ownsCache(key) && key !== CONTROL && key !== name) await caches.delete(key); } catch {} }
  await notify();
}
self.addEventListener('message', event => {
  if (!event.source || !validClient(event.source) || event.data?.type !== 'wrn-atlas-offline-command') return;
  event.waitUntil((async () => {
    const command = event.data.command;
    if (command === 'download' && !job && !removing) { job = download(); try { await job; } finally { job = null; } }
    else if (command === 'cancel') { abort?.abort(); if (job) await job; }
    else if (command === 'remove' && !removing) {
      removing = true;
      try { abort?.abort(); if (job) await job; for (const key of await caches.keys()) if (ownsCache(key)) await caches.delete(key); phase = 'idle'; done = 0; }
      finally { removing = false; }
    }
    if (event.ports[0]) event.ports[0].postMessage(await state()); await notify();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (url.origin !== self.location.origin || !['GET','HEAD'].includes(request.method)) return;
  const pathname = url.pathname === '/atlas/' ? '/atlas/index.html' : url.pathname;
  const entry = entries.get(pathname); if (!entry) return;
  event.respondWith((async () => {
    // Wrapper updates stay reachable online. Runtime bytes remain pinned.
    if (!pathname.startsWith('/atlas/versions/')) { try { const live = await fetch(request); if (live.ok) return live; } catch {} }
    const p = await complete(); if (!p) return fetch(request);
    const cached = await (await caches.open(p.cache)).match(new URL(pathname, self.location.origin));
    if (!cached) return Response.error();
    let bytes; try { bytes = await verifiedBytes(cached, entry); } catch { return Response.error(); }
    const headers = new Headers(cached.headers); headers.delete('Content-Encoding'); headers.set('Accept-Ranges','bytes');
    const range = byteRange(request.headers.get('Range'), bytes.byteLength);
    if (range === false) { headers.set('Content-Range', 'bytes */' + bytes.byteLength); return new Response(null,{status:416,headers}); }
    if (range) { headers.set('Content-Range', `bytes ${range.start}-${range.end}/${bytes.byteLength}`); headers.set('Content-Length',String(range.end-range.start+1)); return new Response(request.method==='HEAD'?null:bytes.slice(range.start,range.end+1),{status:206,headers}); }
    headers.set('Content-Length',String(bytes.byteLength)); return new Response(request.method==='HEAD'?null:bytes,{status:200,headers});
  })());
});
