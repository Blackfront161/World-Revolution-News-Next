import assert from 'node:assert/strict';
import test from 'node:test';

test('complete nine-entry shell keeps exact original families, new metadata bounds and aggregate identity', async () => {
  const { createShellProtocol } = await import('./protocol.mjs');
  const p = createShellProtocol();
  const current = {
    totalBytes: 9,
    entries: [
      ['/index.html', 'text/html; charset=utf-8'],
      ['/assets/index-a.js', 'text/javascript; charset=utf-8'],
      ['/assets/index-a.css', 'text/css; charset=utf-8'],
      ['/assets/solinaridao-header-mark-filled-a.png', 'image/png'],
      ['/assets/wrn-future-header-white-a.png', 'image/png'],
      ...[
        'legacy-knowledge-v1',
        'legacy-support-v1',
        'content-directory-v1',
        'production-events-media-v1',
      ].map((name) => [`/assets/${name}-a.json`, 'application/json; charset=utf-8']),
    ].map(([path, mime]) => ({ path, mime, bytes: 1, sha256: 'a'.repeat(64) })),
  };
  assert.equal(p.metadata(current), true);
  const limited = structuredClone(current);
  limited.entries[8].bytes = 4 * 1024 * 1024;
  limited.totalBytes = 4 * 1024 * 1024 + 8;
  assert.equal(p.metadata(limited), true);
  for (const patch of [
    { path: '/assets/unknown-a.json' },
    { path: '/assets/content-directory-v1-b.json' },
    { path: 'https://example.org/assets/production-events-media-v1-a.json' },
    { path: '/assets/../production-events-media-v1-a.json' },
    { path: '/assets/production-events-media-v1-a.json?query=1' },
    { path: '/assets/production-events-media-v1-a.json#fragment' },
    { mime: 'text/plain' },
    { sha256: 'invalid' },
    { bytes: 0 },
    { bytes: 1.5 },
    { bytes: 4 * 1024 * 1024 + 1 },
    { extra: 'unbound' },
  ]) {
    const changed = structuredClone(current);
    Object.assign(changed.entries[8], patch);
    changed.totalBytes = changed.entries.reduce((sum, item) => sum + item.bytes, 0);
    assert.equal(p.metadata(changed), false, JSON.stringify(patch));
  }
  // An eight-entry generation must contain the three historical JSON families;
  // the new family cannot stand in for any of them.
  for (const absent of [5, 6, 7]) {
    const changed = structuredClone(current);
    changed.entries.splice(absent, 1);
    changed.totalBytes = 8;
    assert.equal(p.metadata(changed), false);
  }
  assert.equal(p.metadata({ ...current, totalBytes: 10 }), false);
  const tooLarge = structuredClone(limited);
  tooLarge.entries[5].bytes = 3 * 1024 * 1024;
  tooLarge.entries[6].bytes = 1024 * 1024;
  tooLarge.totalBytes = tooLarge.entries.reduce((sum, item) => sum + item.bytes, 0);
  assert.equal(p.metadata(tooLarge), false);
  const duplicate = structuredClone(current);
  duplicate.entries[7] = {
    ...duplicate.entries[8],
    path: '/assets/production-events-media-v1-b.json',
  };
  assert.equal(p.metadata(duplicate), false);
});

test('one shared protocol strictly rejects untrusted control and bounds three immutable generation slots', async () => {
  const { createShellProtocol } = await import('./protocol.mjs');
  const p = createShellProtocol();
  assert.equal(p.parse(null).kind, 'missing');
  assert.equal(p.parse('{').kind, 'malformed');
  assert.equal(p.parse('{"version":99}').kind, 'unknown');
  assert.equal(p.parse(' '.repeat(p.maxMetadata + 1)).kind, 'malformed');
  const c = p.initial(1);
  assert.equal(p.parse(JSON.stringify(c) + ' '.repeat(p.maxControlMetadata)).kind, 'malformed');
  // One 4KiB Control plus three conservative 16KiB per-generation metadata
  // reservations (manifest, duplicate request keys/origin prefixes/headers).
  assert.ok(p.maxControlMetadata + 3 * 16 * 1024 <= p.maxMetadata);
  assert.equal(p.parse(JSON.stringify(c)).kind, 'known');
  for (const value of [
    { ...c, epoch: 1.5 },
    { ...c, epoch: -1 },
    { ...c, enabled: 'true' },
    { ...c, extra: 'query' },
    { ...c, state: 'removed' },
    { ...c, pendingJob: { kind: 'remove', id: 'a', epoch: 9 } },
    { ...c, pendingJob: { kind: 'register', id: 'x'.repeat(65), epoch: 1 } },
    { ...c, pendingJob: { kind: 'register', id: 'a', epoch: 2 } },
    { ...c, removalJob: { id: 'a', epoch: 1, phase: 'settled' } },
  ])
    assert.equal(p.parse(JSON.stringify(value)).kind, 'malformed');
  const generation = (id) => ({ id: id.repeat(64), bytes: 10, ready: true, epoch: 1 });
  assert.equal(
    p.valid({ ...c, generations: [{ ...generation('a'), bytes: p.maxBytes + 1 }] }),
    false,
  );
  assert.equal(
    p.valid({
      ...c,
      enabled: false,
      state: 'removing',
      removalJob: { id: 'a', epoch: 1, phase: 'settled' },
    }),
    true,
  );
  let canceled = false;
  const bounded = await p.read({
    match: async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(p.maxMetadata + 1));
          },
          cancel() {
            canceled = true;
          },
        }),
      ),
  });
  assert.equal(bounded.kind, 'malformed');
  assert.equal(canceled, true);
  assert.equal(
    p.parse(JSON.stringify({ ...c, generations: ['a', 'b', 'c'].map(generation) })).kind,
    'known',
  );
  assert.equal(
    p.parse(JSON.stringify({ ...c, generations: ['a', 'b', 'c', 'd'].map(generation) })).kind,
    'malformed',
  );
  assert.equal(
    p.parse(JSON.stringify({ ...c, generations: [generation('a'), generation('a')] })).kind,
    'malformed',
  );
  assert.equal(p.parse(JSON.stringify({ ...c, active: 'a'.repeat(64) })).kind, 'malformed');
  assert.equal(
    p.message({ protocol: p.protocol, type: 'status', requestId: 'valid-id', epoch: 1 }),
    true,
  );
  assert.equal(
    p.message({
      protocol: p.protocol,
      type: 'status',
      requestId: 'valid-id',
      epoch: 1,
      url: '/content',
    }),
    false,
  );
  assert.equal(
    p.message({ protocol: p.protocol, type: 'remove', requestId: 'x'.repeat(100), epoch: 1 }),
    false,
  );
});

test('protocol admits only the historical five or current eight bounded shell entries', async () => {
  const { createShellProtocol } = await import('./protocol.mjs');
  const p = createShellProtocol();
  const entry = (path) => ({
    path,
    mime: 'application/json; charset=utf-8',
    bytes: 1,
    sha256: 'a'.repeat(64),
  });
  assert.equal(
    p.metadata({
      entries: Array.from({ length: 5 }, (_, index) => entry(`/assets/${index}.json`)),
    }),
    true,
  );
  const current = {
    totalBytes: 8,
    entries: [
      { ...entry('/index.html'), mime: 'text/html; charset=utf-8' },
      { ...entry('/assets/index-a.js'), mime: 'text/javascript; charset=utf-8' },
      { ...entry('/assets/index-a.css'), mime: 'text/css; charset=utf-8' },
      { ...entry('/assets/solinaridao-header-mark-filled-a.png'), mime: 'image/png' },
      { ...entry('/assets/wrn-future-header-white-a.png'), mime: 'image/png' },
      entry('/assets/legacy-knowledge-v1-a.json'),
      entry('/assets/legacy-support-v1-a.json'),
      entry('/assets/content-directory-v1-a.json'),
    ],
  };
  assert.equal(p.metadata(current), true);
  for (const patch of [
    { path: '/assets/unknown-a.json' },
    { path: '/assets/legacy-knowledge-v1-b.json' },
    { path: 'https://example.org/assets/content-directory-v1-a.json' },
    { path: '/assets/../content-directory-v1-a.json' },
    { path: '/assets/content-directory-v1-a.json?query=1' },
    { path: '/assets/content-directory-v1-a.json#fragment' },
    { mime: 'text/plain' },
    { sha256: 'invalid' },
    { sha256: 'A'.repeat(64) },
    { bytes: 0 },
    { bytes: 1.5 },
    { bytes: 3 * 1024 * 1024 + 1 },
    { extra: 'unbound' },
  ]) {
    const changed = structuredClone(current);
    Object.assign(changed.entries[7], patch);
    changed.totalBytes = changed.entries.reduce((sum, item) => sum + item.bytes, 0);
    assert.equal(p.metadata(changed), false, JSON.stringify(patch));
  }
  const supportOversize = structuredClone(current);
  supportOversize.entries[6].bytes = 1024 * 1024 + 1;
  supportOversize.totalBytes = 1024 * 1024 + 8;
  assert.equal(p.metadata(supportOversize), false);
  assert.equal(p.metadata({ ...current, totalBytes: 9 }), false);
  const aggregateOversize = structuredClone(current);
  aggregateOversize.entries[1].bytes = p.maxBytes;
  aggregateOversize.totalBytes = p.maxBytes + 7;
  assert.equal(p.metadata(aggregateOversize), false);
  assert.equal(
    p.metadata({
      entries: Array.from({ length: 6 }, (_, index) => entry(`/assets/${index}.json`)),
    }),
    false,
  );
  assert.equal(
    p.metadata({
      entries: Array.from({ length: 9 }, (_, index) => entry(`/assets/${index}.json`)),
    }),
    false,
  );
});
