import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseManagedListing,
  retentionPlan,
  readAutomationState,
  guardedPrune,
  semanticTupleHash,
  ownershipStartSequence,
  retentionGraceMs,
  managedByteLimit,
} from './website-tuple-retention.mjs';
import { publishManagedWebsiteTuple } from './publish-managed-website-tuple.mjs';
import { prepareWebsiteContentTuple } from './prepare-website-content-tuple.mjs';
import { websiteTupleFixture } from './website-tuple-test-fixture.mjs';
import { projectionHash } from './website-content-projection.mjs';
const now = Date.parse('2026-11-10T12:00:00Z'),
  codeCommit = 'a'.repeat(40),
  sha = 'b'.repeat(64);
const seed = await prepareWebsiteContentTuple(websiteTupleFixture());
const pointer = (sequence) => ({
  ...seed.pointer,
  sequence,
  artifactSha256: sha,
  artifactPath: `snapshots/website-${sequence}-${sha}.json`,
});
const current = pointer(202611101200),
  previous = pointer(202611101100);
const listing = (name, facts = 'type=file;size=40;modify=20261025000000;') =>
  Buffer.from(`${facts} ${name}\r\n`);
const entry = (sequence, overrides = {}) => ({
  path: pointer(sequence).artifactPath,
  size: 40,
  modifiedAt: now - retentionGraceMs - 1,
  regular: true,
  sequence,
  owned: sequence > ownershipStartSequence,
  snapshot: true,
  ...overrides,
});

test('MLSD rejects malformed/duplicate lines and never treats links or unknown names as removable', () => {
  assert.throws(() => parseManagedListing(Buffer.from('not MLSD')), /tuple-list-format/);
  assert.throws(
    () => parseManagedListing(Buffer.concat([listing('a'), listing('a')])),
    /duplicate/,
  );
  assert.throws(
    () => parseManagedListing(listing('a', 'type=OS.unix=slink;type=file;size=40;')),
    /duplicate-fact/,
  );
  assert.equal(
    parseManagedListing(listing(`website-202610990000-${sha}.json`), 'snapshots/')[0].owned,
    false,
  );
  const unknown = parseManagedListing(listing('foreign.json'), 'snapshots/')[0];
  assert.equal(unknown.owned, false);
  const link = parseManagedListing(
    listing(
      `website-202610250000-${sha}.json`,
      'type=OS.unix=slink;size=40;modify=20261025000000;',
    ),
    'snapshots/',
  )[0];
  assert.equal(link.regular, false);
  assert.throws(() => retentionPlan([link], { current, previous, now }), /unclassifiable/);
});
test('retention protects current, previous, cutoff, recent and future entries', () => {
  const entries = [
    entry(current.sequence),
    entry(previous.sequence),
    entry(ownershipStartSequence),
    entry(202610250001, { modifiedAt: now - retentionGraceMs + 1 }),
    entry(202611111200),
    entry(202610250002),
  ];
  assert.deepEqual(retentionPlan(entries, { current, previous, now }).remove, [
    pointer(202610250002).artifactPath,
  ]);
});
test('missing/unsafe size, type or timestamp never permits deletion', () => {
  for (const change of [{ size: null }, { size: -1 }, { regular: false }])
    assert.throws(
      () => retentionPlan([entry(202610250001, change)], { current, previous, now }),
      /unclassifiable/,
    );
  assert.deepEqual(
    retentionPlan([entry(202610250001, { modifiedAt: NaN })], { current, previous, now }).remove,
    [],
  );
});
test('unreachable byte/count budget fails before any plan can execute', () => {
  assert.throws(
    () =>
      retentionPlan([entry(current.sequence, { size: managedByteLimit })], {
        current,
        previous,
        now,
        reserveBytes: 1,
      }),
    /capacity/,
  );
  const many = Array.from({ length: 257 }, (_, i) => entry(202611111200 + i));
  assert.throws(() => retentionPlan(many, { current, previous, now }), /capacity/);
});
test('cleanup is bounded and checks exact current bytes before each delete and after the series', async () => {
  const removed = [],
    paths = ['one', 'two'];
  let reads = 0;
  await assert.rejects(
    guardedPrune({
      plan: { remove: paths },
      transport: { removeManaged: async (p) => removed.push(p) },
      expectedBytes: Buffer.from('old'),
      fetchCurrentBytes: async () => Buffer.from(++reads === 2 ? 'new' : 'old'),
    }),
    /concurrent/,
  );
  assert.deepEqual(removed, ['one']);
  reads = 0;
  await assert.rejects(
    guardedPrune({
      plan: { remove: ['one'] },
      transport: { removeManaged: async () => {} },
      expectedBytes: Buffer.from('old'),
      fetchCurrentBytes: async () => Buffer.from(++reads === 2 ? 'new' : 'old'),
    }),
    /concurrent/,
  );
  assert.equal(
    retentionPlan(
      Array.from({ length: 40 }, (_, i) => entry(202610250000 + i)),
      { current, previous, now },
    ).remove.length,
    24,
  );
});
test('state seed/recovery preserves the genuine immediate predecessor and rejects alien writers', () => {
  const initial = readAutomationState(null, pointer(ownershipStartSequence));
  assert.equal(initial.previous, null);
  assert.throws(() => readAutomationState(null, current), /seed/);
  const state = {
    ...initial,
    active: previous,
    previous: pointer(202611101000),
    codeCommit,
    pending: { pointer: current, codeCommit },
  };
  const recovered = readAutomationState(Buffer.from(JSON.stringify(state)), current);
  assert.deepEqual(recovered.previous, previous);
  assert.equal(recovered.pending, null);
  assert.throws(
    () => readAutomationState(Buffer.from(JSON.stringify(state)), pointer(202611101300)),
    /concurrent/,
  );
});
test('semantic hash ignores only audit churn, retaining content, rights, raw-input and code changes', () => {
  const a = JSON.parse(seed.bytes),
    b = structuredClone(a);
  b.observedAt = 'later';
  b.sequence++;
  b.directory.observedAt = 'later';
  b.directory.sourceCommit = 'c'.repeat(40);
  b.home.directoryCommit = 'c'.repeat(40);
  b.images.dataCommit = 'c'.repeat(40);
  b.source.dataCommit = 'c'.repeat(40);
  b.directory.articles[0].observations[0].provenance.observedAt = 'later';
  for (const k of ['observedAt', 'commit', 'directorySha256', 'sequence']) b.summary[k] = 'later';
  assert.equal(semanticTupleHash(a, codeCommit), semanticTupleHash(b, codeCommit));
  for (const mutate of [
    (x) => (x.directory.articles[0].title += ' changed'),
    (x) => (x.directory.rights = 'changed'),
    (x) => (x.source.revocationsSha256 = 'd'.repeat(64)),
    (x) => x.home.visibleIds.pop(),
  ]) {
    const c = structuredClone(b);
    mutate(c);
    assert.notEqual(semanticTupleHash(a, codeCommit), semanticTupleHash(c, codeCommit));
  }
  assert.notEqual(semanticTupleHash(a, codeCommit), semanticTupleHash(a, 'd'.repeat(40)));
});

function harness({
  age = 3600000,
  changed = false,
  cleanupFailure = false,
  budgetFailure = false,
  readbackFailure = false,
} = {}) {
  const make = (sequence, observedAt, change) => {
    const tuple = JSON.parse(seed.bytes);
    tuple.sequence = sequence;
    tuple.observedAt = new Date(observedAt).toISOString();
    if (change) tuple.directory.articles[0].title += ' changed';
    const snapshotBytes = Buffer.from(JSON.stringify(tuple));
    const manifest = {
      ...seed.pointer,
      sequence,
      observedAt: tuple.observedAt,
      artifactSha256: projectionHash(snapshotBytes),
      artifactBytes: snapshotBytes.length,
    };
    manifest.artifactPath = `snapshots/website-${sequence}-${manifest.artifactSha256}.json`;
    return {
      manifest,
      pointerBytes: Buffer.from(JSON.stringify(manifest)),
      snapshotBytes,
      snapshotPath: 'fixture',
    };
  };
  const before = make(202611101100, now - age, false),
    prepared = make(202611101200, now, changed),
    calls = [];
  let active = before.pointerBytes;
  let stored = {
    schema: 'wrn.website-news-auto-state.v1',
    ownershipStartSequence,
    active: before.manifest,
    previous: null,
    codeCommit,
    pending: null,
  };
  const transport = {
    readAutomationState: async () => Buffer.from(JSON.stringify(stored)),
    writeAutomationState: async (bytes) => {
      calls.push('state');
      stored = JSON.parse(bytes);
    },
    listManaged: async (dir) =>
      budgetFailure && dir === 'snapshots/'
        ? listing(
            before.manifest.artifactPath.split('/')[1],
            `type=file;size=${managedByteLimit};modify=20261110110000;`,
          )
        : Buffer.alloc(0),
    removeManaged: async () => {
      calls.push('remove');
      if (cleanupFailure) throw Error('cleanup failed');
    },
    uploadSnapshot: async () => calls.push('upload'),
    uploadPointer: async (p) => calls.push(p.endsWith('rollback.tmp') ? 'backup' : 'pending'),
    activatePointer: async (p) => {
      calls.push('activate');
      active = p.endsWith('rollback.tmp') ? before.pointerBytes : prepared.pointerBytes;
    },
  };
  return {
    calls,
    prepared,
    before,
    transport,
    get stored() {
      return stored;
    },
    get active() {
      return active;
    },
    args: {
      prepared,
      transport,
      codeCommit,
      now,
      fetchCurrentBytes: async () => active,
      fetchPublic: async (url) => {
        if (readbackFailure) throw Error('offline');
        return new Response(
          String(url).endsWith(before.manifest.artifactPath)
            ? before.snapshotBytes
            : prepared.snapshotBytes,
          { headers: { 'content-type': 'application/json' } },
        );
      },
    },
  };
}
test('unchanged semantics younger than 6h perform no snapshot, pointer or activation upload', async () => {
  const h = harness();
  const result = await publishManagedWebsiteTuple(h.args);
  assert.equal(result.state, 'unchanged');
  assert.deepEqual(h.calls, ['state']);
  assert.deepEqual(h.active, h.before.pointerBytes);
});
test('6h boundary, changed content, code change and unverifiable old body force a checked publication', async () => {
  for (const options of [{ age: 6 * 3600000 }, { changed: true }]) {
    const h = harness(options);
    const result = await publishManagedWebsiteTuple(h.args);
    assert.equal(result.state, 'published');
    assert.ok(h.calls.includes('upload'));
    assert.deepEqual(h.stored.previous, h.before.manifest);
    assert.equal(h.stored.pending, null);
  }
  const h = harness();
  h.args.codeCommit = 'e'.repeat(40);
  assert.equal((await publishManagedWebsiteTuple(h.args)).state, 'published');
  const bad = harness({ readbackFailure: true });
  await assert.rejects(publishManagedWebsiteTuple(bad.args), /offline/);
  assert.ok(bad.calls.includes('upload'));
  assert.ok(!bad.calls.includes('activate'));
});
test('capacity failure occurs before snapshot, state or pointer upload', async () => {
  const h = harness({ changed: true, budgetFailure: true });
  await assert.rejects(publishManagedWebsiteTuple(h.args), /capacity/);
  assert.deepEqual(h.calls, []);
});
test('post-activation housekeeping failure remains explicitly published and never triggers rollback', async () => {
  const h = harness({ changed: true, cleanupFailure: true });
  const result = await publishManagedWebsiteTuple(h.args);
  assert.equal(result.state, 'published');
  assert.equal(result.cleanup, 'failed-after-confirmed-publication');
  assert.equal(h.calls.filter((x) => x === 'activate').length, 1);
  assert.deepEqual(h.active, h.prepared.pointerBytes);
});
