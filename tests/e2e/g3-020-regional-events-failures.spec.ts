import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  canonicalRegionalEventsSafety,
  regionalEventsEventContentPreimage,
  regionalEventsEventsPreimage,
  regionalEventsRevocationsPreimage,
  validateRegionalEventBundle,
} from '../../packages/content-contracts/src/mobile-regional-events-v1.ts';
import { sha256Utf8 } from '../../packages/content-contracts/src/index.ts';
import { g3020RegionalEventsStoreHarness } from './g3-020-regional-events-store-harness';

const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../../apps/mobile/public/wrn-mobile-regional-events/v1/mobile-regional-events.json',
      import.meta.url,
    ),
    'utf8',
  ),
);

const localText = {
  en: 'Test event',
  de: 'Testereignis',
  es: 'Evento de prueba',
  fr: 'Evenement test',
  it: 'Evento test',
  pt: 'Evento teste',
  ru: 'Тестовое событие',
  el: 'Δοκιμαστικό γεγονός',
  tr: 'Deneme etkinliği',
} as const;
type Revocation = {
  namespace: 'continent' | 'event';
  id: string;
  status: 'blocked' | 'replaced';
  objectSha256?: string;
  replacementId?: string;
};
type Reference = { namespace: 'continent' | 'event'; id: string };
type BundleRecord = {
  storeSchema: 1;
  slot: 'candidate';
  bundleRevision: number;
  taxonomyRevision: number;
  transportSha256: string;
  rawJson: string;
};

const target = (testInfo: { project: { name: string } }) =>
  testInfo.project.name === 'mobile-390x844';
const unsignedEvent = (eventId: string) => ({
  eventId,
  regionId: 'wrn-region-test',
  sourceId: 'wrn-source-local-fixture',
  status: 'scheduled' as const,
  titles: localText,
  locationNames: localText,
  summaries: localText,
  startInstant: '2026-09-01T12:00:00.000Z',
  startLocal: '2026-09-01T14:00:00',
  startUtcOffsetMinutes: 120,
  timeZone: 'Europe/Zurich',
  publishedAt: '2026-09-01T00:00:00.000Z',
  observedAt: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-09-02T00:00:00.000Z',
  contentRevision: 1,
  contentSha256: '0'.repeat(64),
  rightsStatus: 'self-authored-local-fixture' as const,
  licenseId: 'CC0-1.0' as const,
  rightsReference: 'wrn-rights-local-fixture',
  provenanceReference: 'wrn-provenance-local-fixture',
});
async function makeBundle(
  bundleRevision: number,
  revocationRevision: number,
  revocations: readonly Revocation[],
  ids = ['wrn-event-proof'],
) {
  const events = await Promise.all(
    ids.map(async (eventId) => {
      const value = unsignedEvent(eventId);
      value.contentSha256 = await sha256Utf8(regionalEventsEventContentPreimage(value));
      return value;
    }),
  );
  const value = {
    ...fixture,
    bundleRevision,
    events,
    eventsSha256: await sha256Utf8(regionalEventsEventsPreimage(events)),
    revocationRevision,
    revocations,
    revocationsSha256: await sha256Utf8(regionalEventsRevocationsPreimage(revocations)),
  };
  const rawJson = JSON.stringify(value);
  const record: BundleRecord = {
    storeSchema: 1,
    slot: 'candidate',
    bundleRevision,
    taxonomyRevision: fixture.taxonomyRevision,
    transportSha256: await sha256Utf8(rawJson),
    rawJson,
  };
  return { record, events };
}
async function makeSafety(
  revision: number,
  entries: readonly Revocation[],
  references: readonly Reference[],
) {
  return {
    storeSchema: 1 as const,
    key: 'safety' as const,
    revision,
    sha256: await sha256Utf8(canonicalRegionalEventsSafety(entries, revision, references)),
    entries,
    references,
  };
}

test('G3-020 R3-B permits V1 to V2 rotation and persists exact or wildcard blocks before protection', async ({
  page,
}, testInfo) => {
  test.skip(!target(testInfo), 'One deterministic real-IDB project.');
  expect(await validateRegionalEventBundle(fixture)).not.toBeNull();
  const v1 = await makeBundle(1, 0, []);
  const v2 = await makeBundle(2, 0, []);
  const proof = v2.events[0]!;
  expect(await validateRegionalEventBundle(JSON.parse(v1.record.rawJson))).not.toBeNull();
  expect(await validateRegionalEventBundle(JSON.parse(v2.record.rawJson))).not.toBeNull();
  const exact = await makeBundle(2, 1, [
    { namespace: 'event', id: proof.eventId, status: 'blocked', objectSha256: proof.contentSha256 },
  ]);
  const wildcard = await makeBundle(2, 1, [
    { namespace: 'event', id: proof.eventId, status: 'blocked' },
  ]);
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(
    async ({ names, v1, v2, exact, wildcard }) => {
      const pointer = (record: BundleRecord) => ({
        bundleRevision: record.bundleRevision,
        taxonomyRevision: record.taxonomyRevision,
        transportSha256: record.transportSha256,
      });
      const remove = (name: string) =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.deleteDatabase(name);
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        });
      const seed = (active: BundleRecord, candidate: BundleRecord) =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.open(names.eventDatabase, 1);
          r.onupgradeneeded = () => {
            r.result.createObjectStore('eventBundles', { keyPath: 'slot' });
            r.result.createObjectStore('eventControl', { keyPath: 'key' });
            r.result.createObjectStore('eventSafety', { keyPath: 'key' });
          };
          r.onsuccess = () => {
            const db = r.result;
            const tx = db.transaction(['eventBundles', 'eventControl'], 'readwrite');
            tx.objectStore('eventBundles').put({ ...active, slot: 'active' });
            tx.objectStore('eventBundles').put(candidate);
            tx.objectStore('eventControl').put({
              storeSchema: 1,
              key: 'control',
              generation: 0,
              active: pointer(active),
              candidate: pointer(candidate),
              previous: null,
              safetyRevision: 0,
            });
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = tx.onabort = () => reject(tx.error);
          };
          r.onerror = () => reject(r.error);
        });
      const invoke = async (candidate: BundleRecord) => {
        await remove(names.eventDatabase);
        await seed(v1.record, candidate);
        const module = await import('/src/mobile-regional-events-store.ts');
        const store = await module.openMobileRegionalEventsStore();
        const before = await store.snapshot();
        let code = 'ready';
        try {
          await store.activate(0);
        } catch (error) {
          code = error instanceof Error ? error.message : 'unexpected';
        }
        const after = await store.snapshot();
        store.close();
        const restarted = await module.openMobileRegionalEventsStore();
        const restart = await restarted.snapshot();
        restarted.close();
        return { before, after, restart, code };
      };
      const allowed = await invoke(v2.record);
      const exactResult = await invoke(exact.record);
      const wildcardResult = await invoke(wildcard.record);
      await remove(names.eventDatabase);
      return { allowed, exact: exactResult, wildcard: wildcardResult };
    },
    { names: g3020RegionalEventsStoreHarness, v1, v2, exact, wildcard },
  );
  expect(result.allowed.code).toBe('ready');
  expect(result.allowed.after.control.generation).toBe(1);
  expect(result.allowed.after.bundles.active?.bundleRevision).toBe(2);
  for (const value of [result.exact, result.wildcard]) {
    expect(value.code).toBe('protected');
    expect(value.after.control.generation).toBe(value.before.control.generation);
    expect(value.after.bundles).toEqual(value.before.bundles);
    expect(value.after.safety.revision).toBe(1);
    expect(value.restart).toEqual(value.after);
  }
});

test('G3-020 R3-B keeps only committed safety across injected S-W/S-R/S-A and R-W/R-R/R-A/R-Q failures', async ({
  page,
}, testInfo) => {
  test.skip(!target(testInfo), 'One deterministic real-IDB project.');
  const candidate = await makeBundle(2, 1, [
    { namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' },
  ]);
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(
    async ({ names, candidate }) => {
      const pointer = (record: BundleRecord) => ({
        bundleRevision: record.bundleRevision,
        taxonomyRevision: record.taxonomyRevision,
        transportSha256: record.transportSha256,
      });
      const remove = (name: string) =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.deleteDatabase(name);
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        });
      const seed = () =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.open(names.eventDatabase, 1);
          r.onupgradeneeded = () => {
            r.result.createObjectStore('eventBundles', { keyPath: 'slot' });
            r.result.createObjectStore('eventControl', { keyPath: 'key' });
            r.result.createObjectStore('eventSafety', { keyPath: 'key' });
          };
          r.onsuccess = () => {
            const db = r.result;
            const tx = db.transaction(['eventBundles', 'eventControl'], 'readwrite');
            tx.objectStore('eventBundles').put(candidate.record);
            tx.objectStore('eventControl').put({
              storeSchema: 1,
              key: 'control',
              generation: 0,
              active: null,
              candidate: pointer(candidate.record),
              previous: null,
              safetyRevision: 0,
            });
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = tx.onabort = () => reject(tx.error);
          };
          r.onerror = () => reject(r.error);
        });
      const ids = ['S-W', 'S-R', 'S-A', 'R-W', 'R-R', 'R-A', 'R-Q'] as const;
      const result: Record<string, unknown> = {};
      for (const id of ids) {
        await remove(names.eventDatabase);
        await seed();
        const prototype = IDBObjectStore.prototype as IDBObjectStore &
          Record<string, (...args: unknown[]) => unknown>;
        const original = new Map<string, (...args: unknown[]) => unknown>();
        const counts = new Map<string, number>();
        for (const method of ['put', 'get', 'getAll', 'delete']) {
          const base = prototype[method]!;
          original.set(method, base);
          Object.defineProperty(prototype, method, {
            configurable: true,
            value(this: IDBObjectStore, ...args: unknown[]) {
              const key = `${this.name}:${method}`;
              const count = (counts.get(key) ?? 0) + 1;
              counts.set(key, count);
              const match =
                (id === 'S-W' && this.name === 'eventSafety' && method === 'put') ||
                (id === 'S-R' && this.name === 'eventSafety' && method === 'get') ||
                (id === 'S-A' && this.name === 'eventSafety' && method === 'put') ||
                (id === 'R-W' && this.name === 'eventBundles' && method === 'delete') ||
                (id === 'R-R' &&
                  this.name === 'eventBundles' &&
                  method === 'getAll' &&
                  count === 3) ||
                (id === 'R-A' && this.name === 'eventControl' && method === 'put' && count === 2) ||
                (id === 'R-Q' && this.name === 'eventBundles' && method === 'put');
              if (!match) return base.apply(this, args);
              if (id === 'S-A' || id === 'R-A') {
                const request = base.apply(this, args);
                this.transaction.abort();
                return request;
              }
              throw new DOMException(
                'injected',
                id === 'R-Q' ? 'QuotaExceededError' : 'AbortError',
              );
            },
          });
        }
        try {
          const module = await import('/src/mobile-regional-events-store.ts');
          const store = await module.openMobileRegionalEventsStore();
          const before = await store.snapshot();
          let code = 'ready';
          try {
            await store.activate(0);
          } catch (error) {
            code = error instanceof Error ? error.message : 'unexpected';
          }
          const after = await store.snapshot();
          store.close();
          const restarted = await module.openMobileRegionalEventsStore();
          const restart = await restarted.snapshot();
          restarted.close();
          result[id] = { before, after, restart, code };
        } finally {
          for (const [method, base] of original)
            Object.defineProperty(prototype, method, { configurable: true, value: base });
        }
      }
      await remove(names.eventDatabase);
      return result;
    },
    { names: g3020RegionalEventsStoreHarness, candidate },
  );
  for (const id of ['S-W', 'S-R', 'S-A', 'R-W', 'R-R', 'R-A', 'R-Q']) {
    const value = result[id] as {
      code: string;
      before: unknown;
      after: { safety: { revision: number } };
      restart: unknown;
    };
    expect(value.code).toBe('storage-failure');
    expect(value.restart).toEqual(value.after);
    if (id.startsWith('S-')) expect(value.after).toEqual(value.before);
    else expect(value.after.safety.revision).toBe(1);
  }
});

test('G3-020 R3-B protects invalid replacements and proves equal plus historical rollback safety coverage', async ({
  page,
}, testInfo) => {
  test.skip(!target(testInfo), 'One deterministic real-IDB project.');
  const missing = await makeBundle(2, 1, [
    { namespace: 'event', id: 'wrn-event-missing', status: 'blocked' },
  ]);
  const wrongNamespace = await makeBundle(2, 1, [
    { namespace: 'continent', id: 'wrn-cont-missing', status: 'blocked' },
  ]);
  const wrongPrefix = await makeBundle(2, 1, [
    { namespace: 'event', id: 'wrong-prefix', status: 'blocked' },
  ]);
  const replaced: Revocation = {
    namespace: 'event',
    id: 'wrn-event-proof',
    status: 'replaced',
    replacementId: 'wrn-event-replacement',
  };
  const historicalReplacement = await makeBundle(
    4,
    4,
    [replaced],
    ['wrn-event-proof', 'wrn-event-replacement'],
  );
  const rollbackEntry: Revocation = {
    namespace: 'continent',
    id: 'wrn-cont-test',
    status: 'blocked',
  };
  const historical = await makeBundle(4, 4, [rollbackEntry]);
  const active = await makeBundle(5, 5, [rollbackEntry]);
  const fullSafety = await makeSafety(
    5,
    [rollbackEntry],
    [{ namespace: 'continent', id: 'wrn-cont-test' }],
  );
  const incomplete = await makeBundle(4, 4, [
    { namespace: 'event', id: 'wrn-event-proof', status: 'blocked' },
  ]);
  const equalEntry: Revocation = { namespace: 'continent', id: 'wrn-cont-test', status: 'blocked' };
  const equal = await makeBundle(2, 1, [equalEntry]);
  const equalSafety = await makeSafety(
    1,
    [equalEntry],
    [{ namespace: 'continent', id: 'wrn-cont-test' }],
  );
  const conflict = await makeBundle(2, 1, [
    { namespace: 'event', id: 'wrn-event-proof', status: 'blocked' },
  ]);
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(
    async ({
      names,
      missing,
      wrongNamespace,
      wrongPrefix,
      historicalReplacement,
      historical,
      incomplete,
      active,
      fullSafety,
      equal,
      equalSafety,
      conflict,
    }) => {
      const pointer = (record: BundleRecord) => ({
        bundleRevision: record.bundleRevision,
        taxonomyRevision: record.taxonomyRevision,
        transportSha256: record.transportSha256,
      });
      const remove = (name: string) =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.deleteDatabase(name);
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        });
      const seed = (records: readonly unknown[], control: unknown, storedSafety: unknown) =>
        new Promise<void>((resolve, reject) => {
          const r = indexedDB.open(names.eventDatabase, 1);
          r.onupgradeneeded = () => {
            r.result.createObjectStore('eventBundles', { keyPath: 'slot' });
            r.result.createObjectStore('eventControl', { keyPath: 'key' });
            r.result.createObjectStore('eventSafety', { keyPath: 'key' });
          };
          r.onsuccess = () => {
            const db = r.result;
            const tx = db.transaction(['eventBundles', 'eventControl', 'eventSafety'], 'readwrite');
            for (const record of records) tx.objectStore('eventBundles').put(record);
            tx.objectStore('eventControl').put(control);
            if (storedSafety) tx.objectStore('eventSafety').put(storedSafety);
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = tx.onabort = () => reject(tx.error);
          };
          r.onerror = () => reject(r.error);
        });
      const activate = async (candidate: BundleRecord, storedSafety: unknown = null) => {
        await remove(names.eventDatabase);
        await seed(
          [candidate],
          {
            storeSchema: 1,
            key: 'control',
            generation: 0,
            active: null,
            candidate: pointer(candidate),
            previous: null,
            safetyRevision: storedSafety ? 1 : 0,
          },
          storedSafety,
        );
        const module = await import('/src/mobile-regional-events-store.ts');
        let store;
        try {
          store = await module.openMobileRegionalEventsStore();
          const before = await store.snapshot();
          let code = 'ready';
          try {
            await store.activate(0);
          } catch (error) {
            code = error instanceof Error ? error.message : 'unexpected';
          }
          const after = await store.snapshot();
          store.close();
          const restarted = await module.openMobileRegionalEventsStore();
          const restart = await restarted.snapshot();
          restarted.close();
          return { before, after, restart, code };
        } catch (error) {
          store?.close();
          return {
            before: null,
            after: null,
            restart: null,
            code: error instanceof Error ? error.message : 'unexpected',
          };
        }
      };
      const invalid = [
        await activate(missing.record),
        await activate(wrongNamespace.record),
        await activate(wrongPrefix.record),
      ];
      const replacement = await activate(historicalReplacement.record);
      const equalReady = await activate(equal.record, equalSafety);
      const equalConflict = await activate(conflict.record, equalSafety);
      await remove(names.eventDatabase);
      await seed(
        [
          { ...active.record, slot: 'active' },
          { ...historical.record, slot: 'previous' },
        ],
        {
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: pointer(active.record),
          candidate: null,
          previous: pointer(historical.record),
          safetyRevision: 5,
        },
        fullSafety,
      );
      const module = await import('/src/mobile-regional-events-store.ts');
      const store = await module.openMobileRegionalEventsStore();
      let rollback = 'ready';
      try {
        await store.rollback(0);
      } catch (error) {
        rollback = error instanceof Error ? error.message : 'unexpected';
      }
      const rollbackAfter = await store.snapshot();
      store.close();
      await remove(names.eventDatabase);
      await seed(
        [
          { ...active.record, slot: 'active' },
          { ...incomplete.record, slot: 'previous' },
        ],
        {
          storeSchema: 1,
          key: 'control',
          generation: 0,
          active: pointer(active.record),
          candidate: null,
          previous: pointer(incomplete.record),
          safetyRevision: 5,
        },
        fullSafety,
      );
      const incompleteStore = await module.openMobileRegionalEventsStore();
      const incompleteBefore = await incompleteStore.snapshot();
      let incompleteRollback = 'ready';
      try {
        await incompleteStore.rollback(0);
      } catch (error) {
        incompleteRollback = error instanceof Error ? error.message : 'unexpected';
      }
      const incompleteAfter = await incompleteStore.snapshot();
      incompleteStore.close();
      await remove(names.eventDatabase);
      return {
        invalid,
        replacement,
        equalReady,
        equalConflict,
        rollback,
        rollbackAfter,
        incompleteRollback,
        incompleteBefore,
        incompleteAfter,
      };
    },
    {
      names: g3020RegionalEventsStoreHarness,
      missing,
      wrongNamespace,
      wrongPrefix,
      historicalReplacement,
      historical,
      incomplete,
      active,
      fullSafety,
      equal,
      equalSafety,
      conflict,
    },
  );
  for (const value of result.invalid) {
    expect(value.code).toBe('protected');
    if (value.before !== null) {
      expect(value.after).toEqual(value.before);
      expect(value.restart).toEqual(value.before);
    }
  }
  expect(result.replacement.code).toBe('protected');
  expect(result.replacement.after.safety.revision).toBe(4);
  expect(result.equalReady.code).toBe('ready');
  expect(result.equalConflict.code).toBe('protected');
  expect(result.rollback).toBe('ready');
  expect(result.rollbackAfter.bundles.active?.bundleRevision).toBe(4);
  expect(result.incompleteRollback).toBe('protected');
  expect(result.incompleteAfter).toEqual(result.incompleteBefore);
});

test('G3-020 R3-B fails closed for future records, extra or missing stores, unknown keys and corrupt records', async ({
  page,
}, testInfo) => {
  test.skip(!target(testInfo), 'One deterministic browser-IDB corruption matrix.');
  await page.goto('http://127.0.0.1:43173');
  const result = await page.evaluate(async (names) => {
    const remove = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.deleteDatabase(name);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
      });
    const protectedOpen = async () => {
      const module = await import('/src/mobile-regional-events-store.ts');
      try {
        const store = await module.openMobileRegionalEventsStore();
        await store.snapshot();
        store.close();
        return false;
      } catch (error) {
        return error instanceof Error && error.message === 'protected';
      }
    };
    const create = (
      stores: readonly string[],
      recordStore?: string,
      record?: unknown,
      version = 1,
    ) =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open(names.eventDatabase, version);
        r.onupgradeneeded = () => {
          for (const store of stores)
            r.result.createObjectStore(store, {
              keyPath: store === 'eventBundles' ? 'slot' : 'key',
            });
        };
        r.onsuccess = () => {
          const db = r.result;
          if (!recordStore) {
            db.close();
            resolve();
            return;
          }
          const tx = db.transaction(recordStore, 'readwrite');
          tx.objectStore(recordStore).put(record);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = tx.onabort = () => reject(tx.error);
        };
        r.onerror = () => reject(r.error);
      });
    const corrupt: Record<string, boolean> = {};
    for (const store of ['eventBundles', 'eventControl', 'eventSafety']) {
      await remove(names.eventDatabase);
      await create(
        ['eventBundles', 'eventControl', 'eventSafety'],
        store,
        store === 'eventBundles'
          ? { slot: 'unknown', storeSchema: 2 }
          : { key: 'unknown', storeSchema: 2 },
      );
      corrupt[store] = await protectedOpen();
    }
    await remove(names.eventDatabase);
    await create(['eventBundles', 'eventControl', 'eventSafety', 'extra']);
    const extra = await protectedOpen();
    await remove(names.eventDatabase);
    await create(['eventBundles', 'eventControl']);
    const missing = await protectedOpen();
    await remove(names.eventDatabase);
    await create(['eventBundles', 'eventControl', 'eventSafety'], 'eventControl', {
      key: 'unknown',
      storeSchema: 1,
    });
    const unknown = await protectedOpen();
    await remove(names.eventDatabase);
    await create(['eventBundles', 'eventControl', 'eventSafety'], undefined, undefined, 2);
    const future = await protectedOpen();
    await remove(names.eventDatabase);
    return { corrupt, extra, missing, unknown, future };
  }, g3020RegionalEventsStoreHarness);
  expect(result.corrupt).toEqual({ eventBundles: true, eventControl: true, eventSafety: true });
  expect(result.extra).toBe(true);
  expect(result.missing).toBe(true);
  expect(result.unknown).toBe(true);
  expect(result.future).toBe(true);
});
