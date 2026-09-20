/** One canonical wire/storage validator, embedded verbatim into generated workers. */
export function createShellProtocol() {
  const protocol = 'wrn.website-shell.v1';
  const controlCache = 'wrn.website-shell.v1.control';
  const controlKey = '/__wrn_website_shell_control_v1__';
  const prefix = 'wrn.website-shell.v1.payload.';
  const lock = 'wrn.website-shell.v1.lock';
  const maxMetadata = 64 * 1024;
  const maxControlMetadata = 4 * 1024;
  const maxManifestMetadata = 4 * 1024;
  const maxBytes = 8 * 1024 * 1024;
  const id = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
  const epoch = (v) => Number.isSafeInteger(v) && v >= 1 && v < Number.MAX_SAFE_INTEGER;
  const requestId = (v) => typeof v === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(v);
  const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const keys = (v, expected) =>
    object(v) && Object.keys(v).sort().join(',') === expected.split(',').sort().join(',');
  const initial = (value) => ({
    version: 1,
    compatibility: 'g3-015-v1',
    epoch: value,
    enabled: true,
    state: 'enabled',
    active: null,
    previous: null,
    generations: [],
    pendingJob: null,
    removalJob: null,
  });
  const validJob = (j) =>
    keys(j, 'id,epoch,kind') &&
    requestId(j.id) &&
    epoch(j.epoch) &&
    ['register', 'update'].includes(j.kind);
  const valid = (c) => {
    if (
      !keys(
        c,
        'version,compatibility,epoch,enabled,state,active,previous,generations,pendingJob,removalJob',
      ) ||
      c.version !== 1 ||
      c.compatibility !== 'g3-015-v1' ||
      !epoch(c.epoch) ||
      !['enabled', 'removing', 'removed'].includes(c.state) ||
      c.enabled !== (c.state === 'enabled')
    )
      return false;
    if (!Array.isArray(c.generations) || c.generations.length > 3) return false;
    if (
      c.generations.some(
        (g) =>
          !keys(g, 'id,bytes,ready,epoch') ||
          !id(g.id) ||
          !epoch(g.epoch) ||
          g.epoch > c.epoch ||
          typeof g.ready !== 'boolean' ||
          !Number.isSafeInteger(g.bytes) ||
          g.bytes < 1 ||
          g.bytes > maxBytes,
      )
    )
      return false;
    if (new Set(c.generations.map((g) => g.id)).size !== c.generations.length) return false;
    if (c.generations.filter((g) => !g.ready).length > 1) return false;
    for (const role of ['active', 'previous'])
      if (c[role] !== null && !c.generations.some((g) => g.id === c[role] && g.ready)) return false;
    if (c.active !== null && c.active === c.previous) return false;
    if (
      c.pendingJob !== null &&
      (!validJob(c.pendingJob) ||
        c.pendingJob.epoch > c.epoch ||
        (c.enabled && c.pendingJob.epoch !== c.epoch))
    )
      return false;
    if (
      c.removalJob !== null &&
      (!keys(c.removalJob, 'id,epoch,phase') ||
        !requestId(c.removalJob.id) ||
        !['started', 'settled'].includes(c.removalJob.phase) ||
        c.removalJob.epoch !== c.epoch ||
        c.state !== 'removing')
    )
      return false;
    return (
      c.state !== 'removed' ||
      (c.generations.length === 0 &&
        c.active === null &&
        c.previous === null &&
        c.pendingJob === null &&
        c.removalJob === null)
    );
  };
  const parse = (text) => {
    if (text === null) return { kind: 'missing' };
    if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > maxControlMetadata)
      return { kind: 'malformed' };
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return { kind: 'malformed' };
    }
    if (
      object(value) &&
      ((Number.isSafeInteger(value.version) && value.version !== 1) ||
        (typeof value.compatibility === 'string' && value.compatibility !== 'g3-015-v1'))
    )
      return { kind: 'unknown' };
    return valid(value) ? { kind: 'known', value } : { kind: 'malformed' };
  };
  const encode = (c) => {
    const text = JSON.stringify(c);
    if (parse(text).kind !== 'known') throw new Error('protected');
    return text;
  };
  const read = async (storage) => {
    // cacheName-scoped match never creates an evicted/deleted cache.
    const response = await storage.match(controlKey, { cacheName: controlCache });
    if (!response)
      return (await storage.has(controlCache)) ? { kind: 'malformed' } : { kind: 'missing' };
    if (!response.body) return { kind: 'malformed' };
    const reader = response.body.getReader();
    let total = 0;
    const chunks = [];
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxControlMetadata) {
        await reader.cancel();
        return { kind: 'malformed' };
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return parse(new TextDecoder().decode(bytes));
  };
  const write = async (storage, c) => {
    const body = encode(c);
    await (
      await storage.open(controlCache)
    ).put(
      controlKey,
      new Response(body, {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      }),
    );
  };
  const message = (m) =>
    keys(m, 'protocol,type,requestId,epoch') &&
    m.protocol === protocol &&
    ['status', 'remove', 'prepare'].includes(m.type) &&
    requestId(m.requestId) &&
    epoch(m.epoch);
  const currentGraph = (manifest) => {
    const families = [
      [/^\/index\.html$/, 'text/html; charset=utf-8', maxBytes],
      [/^\/assets\/index-[A-Za-z0-9_-]+\.js$/, 'text/javascript; charset=utf-8', maxBytes],
      [/^\/assets\/index-[A-Za-z0-9_-]+\.css$/, 'text/css; charset=utf-8', maxBytes],
      [/^\/assets\/solinaridao-header-mark-filled-[A-Za-z0-9_-]+\.png$/, 'image/png', maxBytes],
      [/^\/assets\/wrn-future-header-white-[A-Za-z0-9_-]+\.png$/, 'image/png', maxBytes],
      [
        /^\/assets\/legacy-knowledge-v1-[A-Za-z0-9_-]+\.json$/,
        'application/json; charset=utf-8',
        3 * 1024 * 1024,
      ],
      [
        /^\/assets\/legacy-support-v1-[A-Za-z0-9_-]+\.json$/,
        'application/json; charset=utf-8',
        1024 * 1024,
      ],
      [
        /^\/assets\/content-directory-v1-[A-Za-z0-9_-]+\.json$/,
        'application/json; charset=utf-8',
        3 * 1024 * 1024,
      ],
      [
        /^\/assets\/production-events-media-v1-[A-Za-z0-9_-]+\.json$/,
        'application/json; charset=utf-8',
        4 * 1024 * 1024,
      ],
    ];
    const seen = new Set();
    let total = 0;
    for (const entry of manifest.entries) {
      const family = families.findIndex(([pattern]) => pattern.test(entry.path));
      if (family < 0 || seen.has(family) || !keys(entry, 'path,mime,bytes,sha256')) return false;
      const [, mime, limit] = families[family];
      if (
        entry.mime !== mime ||
        !id(entry.sha256) ||
        !Number.isSafeInteger(entry.bytes) ||
        entry.bytes < 1 ||
        entry.bytes > limit
      )
        return false;
      seen.add(family);
      total += entry.bytes;
    }
    return (
      (seen.size === 9 || (seen.size === 8 && !seen.has(8))) &&
      total <= maxBytes &&
      manifest.totalBytes === total
    );
  };
  const metadata = (manifest) =>
    object(manifest) &&
    Array.isArray(manifest.entries) &&
    [5, 8, 9].includes(manifest.entries.length) &&
    manifest.entries.every(
      (entry) =>
        object(entry) &&
        typeof entry.path === 'string' &&
        new TextEncoder().encode(entry.path).byteLength <= 512,
    ) &&
    new TextEncoder().encode(JSON.stringify(manifest)).byteLength <= maxManifestMetadata &&
    // Historical five-file generations retain their original read contract.
    (manifest.entries.length === 5 || currentGraph(manifest));
  const inventory = async (storage, c) => {
    const names = await storage.keys();
    const known = new Set(c.generations.map((g) => prefix + g.id));
    if (
      names.some((n) => n.startsWith('wrn.website-shell.') && n !== controlCache && !known.has(n))
    )
      throw new Error('protected');
    return names.filter((n) => known.has(n));
  };
  return {
    protocol,
    controlCache,
    controlKey,
    prefix,
    lock,
    maxMetadata,
    maxControlMetadata,
    maxManifestMetadata,
    maxBytes,
    initial,
    valid,
    parse,
    encode,
    read,
    write,
    message,
    metadata,
    inventory,
  };
}
