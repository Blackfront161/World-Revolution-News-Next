/** Serialized into the classic worker; no imports or mutable trust source. */
export function installWebsiteShellRuntime(self, manifest, p) {
  const storage = self.caches;
  const payload = p.prefix + manifest.shellId;
  const started = performance.now();
  // This promise captures the dispatch's authority, never a later enable epoch.
  const dispatchControl = p.read(storage);
  const withLock = (task, signal) => {
    if (!self.navigator?.locks?.request) throw new Error('unsupported');
    return self.navigator.locks.request(
      p.lock,
      { mode: 'exclusive', ...(signal ? { signal } : {}) },
      task,
    );
  };
  const known = (read) => {
    if (read.kind !== 'known') throw new Error('protected');
    return read.value;
  };
  const enabled = (c, epoch) => c.enabled && c.state === 'enabled' && c.epoch === epoch;
  const generation = (c) => c.generations.find((g) => g.id === manifest.shellId);
  const ready = (c) =>
    manifest.version === c.version &&
    manifest.compatibility === c.compatibility &&
    c.enabled &&
    generation(c)?.ready === true &&
    generation(c)?.bytes === manifest.totalBytes;
  const digest = async (bytes) =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
  const checked = async (response, expected) => {
    if (
      !response ||
      response.status !== 200 ||
      response.headers.get('content-type') !== expected.mime ||
      response.type === 'opaqueredirect' ||
      !response.body
    )
      throw new Error('integrity');
    const length = response.headers.get('content-length');
    if (length !== null && Number(length) !== expected.bytes) throw new Error('integrity');
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > expected.bytes) {
        await reader.cancel();
        throw new Error('budget');
      }
      chunks.push(next.value);
    }
    if (total !== expected.bytes) throw new Error('integrity');
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    if ((await digest(bytes)) !== expected.sha256) throw new Error('integrity');
    return new Response(bytes, {
      headers: {
        'content-type': expected.mime,
        'cache-control': 'no-store',
        'x-wrn-shell-id': manifest.shellId,
      },
    });
  };
  const network = async (entry, milliseconds) =>
    checked(
      await fetch(entry.path, {
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(Math.max(1, Math.ceil(milliseconds))),
      }),
      entry,
    );
  const notify = async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ protocol: p.protocol, type: 'changed' });
  };
  const verifiedReady = async (c) => {
    if (!ready(c)) return false;
    try {
      for (const entry of manifest.entries)
        await checked(await storage.match(entry.path, { cacheName: payload }), entry);
      const current = known(await p.read(storage));
      return current.epoch === c.epoch && ready(current);
    } catch {
      return false;
    }
  };
  const install = async (
    authorityPromise = dispatchControl,
    startedAt = started,
    ticket = null,
  ) => {
    const authority = known(await authorityPromise);
    if (!p.metadata(manifest)) throw new Error('budget');
    if (
      manifest.version !== authority.version ||
      manifest.compatibility !== authority.compatibility
    )
      throw new Error('protected');
    if (!authority.enabled) throw new Error('disabled');
    const epoch = authority.epoch;
    const remaining = () => 30000 - (performance.now() - startedAt);
    await withLock(
      async () => {
        const c = known(await p.read(storage));
        if (!enabled(c, epoch) || remaining() <= 0) throw new Error('stale');
        if (
          ticket &&
          (c.pendingJob?.id !== ticket ||
            c.pendingJob.kind !== 'register' ||
            c.pendingJob.epoch !== epoch)
        )
          throw new Error('stale');
        await p.inventory(storage, c);
        const existing = generation(c);
        if (existing?.ready) {
          // Rollback reuse is immutable: a failed verification never deletes it.
          for (const entry of manifest.entries) {
            await checked(await storage.match(entry.path, { cacheName: payload }), entry);
            if (remaining() <= 0) throw new Error('timeout');
          }
          return;
        }
        if (c.generations.length >= 3 || existing || c.generations.some((g) => !g.ready))
          throw new Error('budget');
        if (
          manifest.totalBytes > p.maxBytes ||
          manifest.entries.reduce((sum, e) => sum + e.bytes, 0) !== manifest.totalBytes
        )
          throw new Error('budget');
        const next = {
          ...c,
          generations: [
            ...c.generations,
            { id: manifest.shellId, bytes: manifest.totalBytes, ready: false, epoch },
          ],
        };
        await p.write(storage, next);
        try {
          const cache = await storage.open(payload);
          for (const entry of manifest.entries) {
            if (remaining() <= 0) throw new Error('timeout');
            await cache.put(entry.path, await network(entry, Math.min(10000, remaining())));
            // Storage promises are not cancellable: always await quiescence,
            // including after a deadline, before releasing the shared lock.
            if (remaining() <= 0) throw new Error('timeout');
          }
          await p.write(storage, {
            ...next,
            generations: next.generations.map((g) =>
              g.id === manifest.shellId ? { ...g, ready: true } : g,
            ),
          });
          if (remaining() <= 0) throw new Error('timeout');
        } catch (error) {
          await storage.delete(payload);
          if (await storage.has(payload)) throw new Error('cleanup-pending', { cause: error });
          await p.write(storage, c);
          throw error;
        }
      },
      AbortSignal.timeout(Math.max(1, Math.ceil(remaining()))),
    );
    await notify();
  };
  const reconcileActive = async () =>
    withLock(async () => {
      const c = known(await p.read(storage));
      if (!ready(c) || self.registration.active !== self.serviceWorker) return;
      // A failed activate bookkeeping step never prevents ready B serving.
      const previous = c.active === manifest.shellId ? c.previous : c.active;
      if (previous && !c.generations.some((g) => g.id === previous && g.ready)) return;
      let next = { ...c, active: manifest.shellId, previous };
      await p.inventory(storage, next);
      if (c.active !== next.active || c.previous !== next.previous) await p.write(storage, next);
      // Pending native updates may carry a newer installer; don't prune them.
      if (self.registration.installing || self.registration.waiting) return;
      const stale = next.generations.filter((g) => g.id !== next.active && g.id !== next.previous);
      for (const g of stale) {
        await storage.delete(p.prefix + g.id);
        if (await storage.has(p.prefix + g.id)) throw new Error('cleanup-pending');
        next = { ...next, generations: next.generations.filter((x) => x.id !== g.id) };
        await p.write(storage, next);
      }
    });
  const recoverRemove = async (expectedEpoch) => {
    // unregister is a native job queue fence. Start under lock, settle outside.
    const job = await withLock(async () => {
      let c = known(await p.read(storage));
      if (expectedEpoch !== undefined) {
        if (c.epoch !== expectedEpoch) throw new Error('stale');
        if (c.state === 'removed') return null;
        c = { ...c, enabled: false, state: 'removing', epoch: c.epoch + 1, removalJob: null };
        await p.write(storage, c);
      }
      if (c.state !== 'removing') return null;
      const ticket = { id: crypto.randomUUID(), epoch: c.epoch, phase: 'started' };
      await p.write(storage, { ...c, removalJob: ticket });
      return { ticket, settlement: self.registration.unregister() };
    });
    if (!job) return;
    await job.settlement;
    await withLock(async () => {
      const c = known(await p.read(storage));
      if (
        c.state !== 'removing' ||
        c.epoch !== job.ticket.epoch ||
        c.removalJob?.id !== job.ticket.id
      )
        return;
      await p.write(storage, {
        ...c,
        pendingJob: null,
        removalJob: { ...job.ticket, phase: 'settled' },
      });
      // The worker cannot enumerate registrations. The window adapter performs
      // final ownership/rest verification; worker recovery remains honest pending.
      await p.inventory(storage, c);
      for (const g of c.generations) await storage.delete(p.prefix + g.id);
      await p.write(storage, { ...c, pendingJob: null, removalJob: null });
    });
    await notify();
  };
  self.addEventListener('install', (event) => event.waitUntil(install()));
  self.addEventListener('activate', (event) =>
    event.waitUntil(
      reconcileActive()
        .then(notify)
        .catch(() => undefined),
    ),
  );
  self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;
    const navigation =
      request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html');
    // Query-bearing assets aren't manifest assets. HTML only has navigation semantics.
    const entry = navigation
      ? manifest.entries.find((e) => e.path === '/index.html')
      : !url.search && manifest.entries.find((e) => e.path === url.pathname);
    if (!entry) return;
    event.respondWith(
      (async () => {
        const c = known(await p.read(storage));
        if (!ready(c)) return Response.error();
        if (navigation) {
          try {
            return await network(entry, 5000);
          } catch {
            /* exact own cache only */
          }
        }
        return checked(await storage.match(entry.path, { cacheName: payload }), entry);
      })().catch(() => Response.error()),
    );
  });
  self.addEventListener('message', (event) => {
    const m = event.data;
    const source = event.source;
    if (!p.message(m) || !source || source.type !== 'window') return;
    try {
      if (new URL(source.url).origin !== self.location.origin) return;
    } catch {
      return;
    }
    if (m.type === 'prepare')
      event.waitUntil(
        (async () => {
          const captured = p.read(storage);
          const start = performance.now();
          const c = known(await captured);
          if (
            !enabled(c, m.epoch) ||
            c.pendingJob?.id !== m.requestId ||
            c.pendingJob.kind !== 'register'
          )
            return;
          try {
            await install(captured, start, m.requestId);
            await reconcileActive();
            source.postMessage({
              protocol: p.protocol,
              type: 'prepared',
              requestId: m.requestId,
              epoch: m.epoch,
              shellId: manifest.shellId,
              ok: true,
            });
          } catch {
            source.postMessage({
              protocol: p.protocol,
              type: 'prepared',
              requestId: m.requestId,
              epoch: m.epoch,
              shellId: manifest.shellId,
              ok: false,
            });
          }
        })().catch(() => undefined),
      );
    if (m.type === 'status')
      event.waitUntil(
        (async () => {
          const c = known(await p.read(storage));
          if (c.epoch !== m.epoch) return;
          source.postMessage({
            protocol: p.protocol,
            type: 'status',
            requestId: m.requestId,
            epoch: c.epoch,
            shellId: manifest.shellId,
            ready: await verifiedReady(c),
          });
          if (c.state === 'removing') await recoverRemove();
          else await reconcileActive();
        })().catch(() => undefined),
      );
    if (m.type === 'remove') event.waitUntil(recoverRemove(m.epoch).catch(() => undefined));
  });
}
