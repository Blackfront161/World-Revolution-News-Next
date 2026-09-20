import { expect, test } from '@playwright/test';
import { g3020RegionalEventsStoreHarness } from './g3-020-regional-events-store-harness';

test('G3-020 R4-B-R3-A proves final safety reference, entry and UTF-8 byte caps in Chrome IndexedDB', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    type Entry = {
      namespace: 'continent' | 'source';
      id: string;
      status: 'blocked';
    };
    type Reference = { namespace: 'continent' | 'source'; id: string };
    type Safety = {
      storeSchema: 1;
      key: 'safety';
      revision: number;
      sha256: string;
      entries: Entry[];
      references: Reference[];
    };
    const encoder = new TextEncoder();
    const byteLength = (value: unknown) => encoder.encode(JSON.stringify(value)).byteLength;
    const sha256 = async (value: unknown) => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(value)));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const sha256Text = async (value: string) => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
      );
    };
    const compare = (
      left: { namespace: string; id: string },
      right: { namespace: string; id: string },
    ) =>
      left.namespace < right.namespace
        ? -1
        : left.namespace > right.namespace
          ? 1
          : left.id < right.id
            ? -1
            : left.id > right.id
              ? 1
              : 0;
    const uniqueSorted = <T extends { namespace: string; id: string }>(values: readonly T[]) =>
      values.every((value, index) => index === 0 || compare(values[index - 1]!, value) < 0);
    const referencesFor = (entries: readonly Entry[]): Reference[] =>
      entries.map(({ namespace, id }) => ({ namespace, id }));
    const assert = (condition: unknown, message: string): asserts condition => {
      if (!condition) throw new Error(`cap-builder-${message}`);
    };
    const sortEntries = (entries: readonly Entry[]) =>
      [...entries].sort((left, right) => compare(left, right));
    const sortReferences = (references: readonly Reference[]) => [...references].sort(compare);
    const assertShape = async (
      safety: Safety,
      options: {
        allowEntryOverflow?: boolean;
        allowReferenceOverflow?: boolean;
        allowByteOverflow?: boolean;
      } = {},
    ) => {
      const entryKeys = new Set(
        safety.entries.map((entry) => `${entry.namespace}\u0000${entry.id}`),
      );
      const referenceKeys = new Set(
        safety.references.map((reference) => `${reference.namespace}\u0000${reference.id}`),
      );
      assert(
        safety.entries.every(
          (entry) =>
            (entry.namespace === 'continent' || entry.namespace === 'source') &&
            /^wrn-(cont|source)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) &&
            entry.status === 'blocked',
        ),
        'entry-schema',
      );
      assert(
        safety.references.every(
          (reference) =>
            (reference.namespace === 'continent' || reference.namespace === 'source') &&
            /^wrn-(cont|source)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(reference.id) &&
            encoder.encode(reference.id).byteLength <= 128,
        ),
        'reference-schema',
      );
      assert(entryKeys.size === safety.entries.length, 'entry-unique');
      assert(referenceKeys.size === safety.references.length, 'reference-unique');
      assert(uniqueSorted(safety.entries), 'entry-sorted');
      assert(uniqueSorted(safety.references), 'reference-sorted');
      assert(
        referencesFor(safety.entries).every((reference) =>
          referenceKeys.has(`${reference.namespace}\u0000${reference.id}`),
        ),
        'reference-coverage',
      );
      assert(
        safety.entries.length <= names.safetyEntryCap || options.allowEntryOverflow,
        'entry-cap',
      );
      assert(
        safety.references.length <= names.safetyReferenceCap || options.allowReferenceOverflow,
        'reference-cap',
      );
      assert(byteLength(safety) <= names.safetyByteCap || options.allowByteOverflow, 'byte-cap');
      assert(
        safety.sha256 ===
          (await sha256({
            revision: safety.revision,
            entries: safety.entries,
            references: safety.references,
          })),
        'hash',
      );
    };
    const safety = async (
      revision: number,
      entries: readonly Entry[],
      references: readonly Reference[],
    ): Promise<Safety> => {
      const next: Safety = {
        storeSchema: 1,
        key: 'safety',
        revision,
        sha256: await sha256({ revision, entries, references }),
        entries: sortEntries(entries),
        references: sortReferences(references),
      };
      await assertShape(next);
      return next;
    };
    const rawSafety = async (
      revision: number,
      entries: readonly Entry[],
      references: readonly Reference[],
    ) => {
      const next: Safety = {
        storeSchema: 1,
        key: 'safety',
        revision,
        sha256: await sha256({
          revision,
          entries: sortEntries(entries),
          references: sortReferences(references),
        }),
        entries: sortEntries(entries),
        references: sortReferences(references),
      };
      return next;
    };
    const entry = (index: number): Entry => ({
      namespace: 'source',
      id: `wrn-source-cap-${String(index).padStart(4, '0')}`,
      status: 'blocked',
    });
    const historyReference = (index: number, padding = 0): Reference => ({
      namespace: 'source',
      id: `wrn-source-history-${String(index).padStart(4, '0')}${'x'.repeat(padding)}`,
    });
    const paddedReferences = (entries: readonly Entry[], targetBytes: number): Reference[] => {
      const incoming = referencesFor(entries);
      let extraCount = 0;
      let best: Reference[] | null = null;
      while (incoming.length + extraCount < names.safetyReferenceCap) {
        const extras = Array.from({ length: extraCount }, (_, index) => historyReference(index));
        const candidate = {
          storeSchema: 1,
          key: 'safety',
          revision: 2,
          sha256: '0'.repeat(64),
          entries: sortEntries(entries),
          references: sortReferences([...incoming, ...extras]),
        };
        if (byteLength(candidate) > targetBytes) break;
        best = extras;
        extraCount += 1;
      }
      assert(best !== null && best.length > 0, 'padding-base');
      const base = sortReferences([...incoming, ...best]);
      const placeholder = {
        storeSchema: 1,
        key: 'safety',
        revision: 2,
        sha256: '0'.repeat(64),
        entries: sortEntries(entries),
        references: base,
      };
      const remaining = targetBytes - byteLength(placeholder);
      assert(remaining >= 0 && remaining < 128, 'padding-range');
      const padded = [...best];
      padded[padded.length - 1] = historyReference(padded.length - 1, remaining);
      assert(encoder.encode(padded[padded.length - 1]!.id).byteLength <= 128, 'padding-id-cap');
      return sortReferences([...incoming, ...padded]);
    };
    const fixture = await (
      await fetch('/wrn-mobile-regional-events/v1/mobile-regional-events.json')
    ).json();
    const candidateFor = async (entries: readonly Entry[]) => {
      const sources = entries
        .filter((value) => value.namespace === 'source')
        .map((value) => ({ ...fixture.sources[0], sourceId: value.id }));
      const revocations = sortEntries(entries);
      const rawJson = JSON.stringify({
        ...fixture,
        bundleRevision: 2,
        revocationRevision: 2,
        ...(sources.length ? { sources, sourcesSha256: await sha256(sources) } : {}),
        revocations,
        revocationsSha256: await sha256(revocations),
      });
      return {
        storeSchema: 1,
        slot: 'candidate',
        bundleRevision: 2,
        taxonomyRevision: fixture.taxonomyRevision,
        transportSha256: await sha256Text(rawJson),
        rawJson,
      };
    };
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    const setup = async (old: Safety, candidate: Awaited<ReturnType<typeof candidateFor>>) => {
      await remove(names.eventDatabase);
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(names.eventDatabase, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('eventBundles', { keyPath: 'slot' });
          request.result.createObjectStore('eventControl', { keyPath: 'key' });
          request.result.createObjectStore('eventSafety', { keyPath: 'key' });
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            ['eventBundles', 'eventControl', 'eventSafety'],
            'readwrite',
          );
          transaction.objectStore('eventBundles').put(candidate);
          transaction.objectStore('eventControl').put({
            storeSchema: 1,
            key: 'control',
            generation: 0,
            active: null,
            candidate: {
              bundleRevision: candidate.bundleRevision,
              taxonomyRevision: candidate.taxonomyRevision,
              transportSha256: candidate.transportSha256,
            },
            previous: null,
            safetyRevision: old.revision,
          });
          transaction.objectStore('eventSafety').put(old);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = transaction.onabort = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    };
    const run = async (
      old: Safety,
      candidate: Awaited<ReturnType<typeof candidateFor>>,
      expected: 'ready' | 'protected',
    ) => {
      await setup(old, candidate);
      const eventsModule = await import('/src/mobile-regional-events-store.ts');
      const store = await eventsModule.openMobileRegionalEventsStore();
      const before = await store.snapshot();
      const prototype = IDBObjectStore.prototype;
      const originalPut = prototype.put;
      let safetyPuts = 0;
      Object.defineProperty(prototype, 'put', {
        configurable: true,
        value(this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
          if (this.name === 'eventSafety') safetyPuts += 1;
          return originalPut.apply(this, args);
        },
      });
      let code = 'ready';
      let after: Awaited<ReturnType<typeof store.snapshot>>;
      try {
        after = await store.activate(0);
      } catch (error) {
        code = error instanceof Error ? error.message : 'unexpected';
        after = await store.snapshot();
      } finally {
        Object.defineProperty(prototype, 'put', { configurable: true, value: originalPut });
        store.close();
      }
      const restartStore = await eventsModule.openMobileRegionalEventsStore();
      const restart = await restartStore.snapshot();
      restartStore.close();
      await remove(names.eventDatabase);
      assert(code === expected, `outcome-${expected}`);
      if (expected === 'ready') {
        assert(safetyPuts === 1, 'positive-one-safety-put');
        assert(after.control.generation === before.control.generation + 1, 'positive-generation');
        assert(JSON.stringify(after) === JSON.stringify(restart), 'positive-restart');
      } else {
        assert(safetyPuts === 0, 'negative-no-safety-put');
        assert(JSON.stringify(after) === JSON.stringify(before), 'negative-no-mutation');
        assert(JSON.stringify(restart) === JSON.stringify(before), 'negative-restart');
      }
      return { code, safetyPuts, before, after, restart };
    };
    const referenceCase = async (count: number) => {
      const incoming: Entry[] = [
        { namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' },
      ];
      const historical = Array.from({ length: count - 1 }, (_, index) => historyReference(index));
      const final = await rawSafety(2, incoming, [...historical, ...referencesFor(incoming)]);
      await assertShape(final, { allowReferenceOverflow: count === 1025 });
      assert(final.references.length === count, `reference-count-${count}`);
      assert(byteLength(final) <= names.safetyByteCap, `reference-byte-isolation-${count}`);
      const old = await safety(1, [], historical);
      return run(old, await candidateFor(incoming), count === 1025 ? 'protected' : 'ready');
    };
    const exactByteCase = async (
      count: number,
      target: number,
      expected: 'ready' | 'protected',
    ) => {
      const entries = Array.from({ length: count }, (_, index) => entry(index));
      const references = paddedReferences(entries, target);
      const final = await rawSafety(2, entries, references);
      await assertShape(final, {
        allowReferenceOverflow: false,
        allowByteOverflow: target > names.safetyByteCap,
      });
      assert(final.entries.length === count, `entry-count-${count}`);
      assert(byteLength(final) === target, `exact-byte-${target}`);
      const historical = references.filter((reference) => reference.namespace === 'source');
      const old = await safety(1, [], historical);
      return run(old, await candidateFor(entries), expected);
    };
    const entryOverflowCase = async () => {
      const oldEntries = Array.from({ length: names.safetyEntryCap }, (_, index) => entry(index));
      const old = await safety(1, oldEntries, referencesFor(oldEntries));
      const incoming = [entry(names.safetyEntryCap)];
      const final = await rawSafety(
        2,
        [...oldEntries, ...incoming],
        referencesFor([...oldEntries, ...incoming]),
      );
      await assertShape(final, { allowEntryOverflow: true });
      assert(final.entries.length === names.safetyEntryCap + 1, 'entry-overflow-count');
      assert(byteLength(final) < names.safetyByteCap, 'entry-overflow-byte-isolation');
      return run(old, await candidateFor(incoming), 'protected');
    };
    const references1023 = await referenceCase(1023);
    const references1024 = await referenceCase(1024);
    const references1025 = await referenceCase(1025);
    const entries511 = await exactByteCase(511, 65535, 'ready');
    const entries512 = await exactByteCase(512, 65536, 'ready');
    const entries513 = await entryOverflowCase();
    const bytes65537 = await exactByteCase(512, 65537, 'protected');
    return {
      references1023: { code: references1023.code, puts: references1023.safetyPuts },
      references1024: { code: references1024.code, puts: references1024.safetyPuts },
      references1025: { code: references1025.code, puts: references1025.safetyPuts },
      entries511: { code: entries511.code, puts: entries511.safetyPuts },
      entries512: { code: entries512.code, puts: entries512.safetyPuts },
      entries513: { code: entries513.code, puts: entries513.safetyPuts },
      bytes65537: { code: bytes65537.code, puts: bytes65537.safetyPuts },
    };
  }, g3020RegionalEventsStoreHarness);
  expect(result).toEqual({
    references1023: { code: 'ready', puts: 1 },
    references1024: { code: 'ready', puts: 1 },
    references1025: { code: 'protected', puts: 0 },
    entries511: { code: 'ready', puts: 1 },
    entries512: { code: 'ready', puts: 1 },
    entries513: { code: 'protected', puts: 0 },
    bytes65537: { code: 'protected', puts: 0 },
  });
});
