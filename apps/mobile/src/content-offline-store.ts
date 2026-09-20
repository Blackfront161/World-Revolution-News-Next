import {
  contentOfflineControlMaxBytes,
  contentOfflineMaxBundles,
  contentOfflineTotalBundleMaxBytes,
  contentOfflineTtlMs,
  createContentOfflineBundleV1,
  createEmptyContentOfflineControlV1,
  isContentOfflineControlV1,
  mergeContentOfflineSafetyLedger,
  sameContentOfflineSafetyLedger,
  validateContentOfflineBundleV1,
  canonicalJson,
  type ContentOfflineBundleV1,
  type ContentOfflineControlV1,
  type ContentOfflineSafetyLedgerV1,
  type LocalContentReleaseDocumentsV1,
  type LocalContentReleaseReadyV1,
} from '@wrn/content-contracts';
import type { LocalContentReleaseOfflineCheck } from './local-content-release';
import { createOfflineIdbCore } from './content-offline-store-core';

export const mobileContentOfflineDatabaseName = 'wrn.mobile-content-offline';
const databaseVersion = 1;
const bundlesStore = 'bundles';
const controlStore = 'control';
const controlKey = 'control';

export type ContentOfflineStoreFailure =
  | 'unavailable'
  | 'incompatible-storage'
  | 'timeout'
  | 'aborted'
  | 'stale-operation'
  | 'quota-or-write-failure'
  | 'invalid-bundle'
  | 'safety-conflict';

export class ContentOfflineStoreError extends Error {
  constructor(readonly code: ContentOfflineStoreFailure) {
    super(`Offline-Inhaltsspeicher: ${code}`);
  }
}

export interface ContentOfflineStoreSnapshot {
  readonly control: ContentOfflineControlV1;
  readonly bundles: readonly Pick<ContentOfflineBundleV1, 'key' | 'byteLength' | 'checkedAt'>[];
}

/** A revalidated immutable content unit, fenced to the control generation that selected it. */
export interface ContentOfflineActiveSnapshot {
  readonly ready: LocalContentReleaseReadyV1;
  readonly generation: number;
  readonly clearEpoch: number;
  readonly checkedAt: number;
}

/** Metadata is emitted only after bundle validation, fenced to the selecting control. */
export interface ContentOfflineBundleMetadata {
  readonly key: string;
  readonly revision: string;
  readonly checkedAt: number;
  readonly expiresAt: number;
}

export interface ContentOfflineReadProjection {
  readonly control: ContentOfflineControlV1;
  readonly active:
    (ContentOfflineBundleMetadata & { readonly ready: LocalContentReleaseReadyV1 }) | null;
  readonly candidate: ContentOfflineBundleMetadata | null;
  readonly previous: ContentOfflineBundleMetadata | null;
}

export type ContentOfflinePreparedRecheck = Readonly<{
  readonly generation: number;
  readonly clearEpoch: number;
}>;

export interface ContentOfflineStore {
  snapshot(signal?: AbortSignal): Promise<ContentOfflineStoreSnapshot>;
  readProjection(signal?: AbortSignal): Promise<ContentOfflineReadProjection>;
  prepareRecheck(
    operationId: string,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  completeRecheck(
    operationId: string,
    prepared: ContentOfflinePreparedRecheck,
    safety: ContentOfflineSafetyLedgerV1,
    checkedAt: number,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
    sourceKind?: LocalContentReleaseOfflineCheck['kind'],
  ): Promise<ContentOfflineControlV1>;
  saveCandidate(
    input: {
      descriptor: unknown;
      documents: LocalContentReleaseDocumentsV1;
      checkedAt: number;
      expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>;
    },
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  activateCandidate(
    now: number,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  rollback(
    now: number,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  recordSafety(
    safety: ContentOfflineSafetyLedgerV1,
    checkedAt: number,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  observeTime(
    now: number,
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  clear(
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1>;
  readActive(signal?: AbortSignal): Promise<ContentOfflineActiveSnapshot | null>;
  close(): void;
}

function failure(error: unknown): ContentOfflineStoreError {
  if (error instanceof ContentOfflineStoreError) return error;
  if (error instanceof DOMException && error.name === 'AbortError')
    return new ContentOfflineStoreError('aborted');
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'UnknownError')
  )
    return new ContentOfflineStoreError('quota-or-write-failure');
  if (
    error instanceof DOMException &&
    (error.name === 'VersionError' || error.name === 'InvalidStateError')
  )
    return new ContentOfflineStoreError('incompatible-storage');
  return new ContentOfflineStoreError('unavailable');
}

function assertCurrent(
  control: ContentOfflineControlV1,
  expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
): void {
  if (control.generation !== expected.generation || control.clearEpoch !== expected.clearEpoch)
    throw new ContentOfflineStoreError('stale-operation');
}

function assertControlBytes(control: ContentOfflineControlV1): void {
  if (new TextEncoder().encode(canonicalJson(control)).byteLength > contentOfflineControlMaxBytes)
    throw new ContentOfflineStoreError('quota-or-write-failure');
}

function hasExpectedSchema(db: IDBDatabase): boolean {
  try {
    if (!db.objectStoreNames.contains(bundlesStore) || !db.objectStoreNames.contains(controlStore))
      return false;
    const transaction = db.transaction([bundlesStore, controlStore], 'readonly');
    return (
      transaction.objectStore(bundlesStore).keyPath === 'key' &&
      transaction.objectStore(controlStore).keyPath === null
    );
  } catch {
    return false;
  }
}

const fixtureIdb = createOfflineIdbCore({
  databaseName: mobileContentOfflineDatabaseName,
  databaseVersion,
  error: (code) => new ContentOfflineStoreError(code),
  upgrade: (database, oldVersion) => {
    if (oldVersion !== 0) throw new ContentOfflineStoreError('incompatible-storage');
    database.createObjectStore(bundlesStore, { keyPath: 'key' });
    database.createObjectStore(controlStore);
  },
  expectedSchema: hasExpectedSchema,
});
function waitForTransaction(transaction: IDBTransaction, signal?: AbortSignal): Promise<void> {
  return fixtureIdb.transaction(transaction, signal);
}
function request<T>(value: IDBRequest<T>): Promise<T> {
  return fixtureIdb.request(value);
}

function hasStoredBundleShape(value: unknown): value is ContentOfflineBundleV1 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).sort().join(',') === 'byteLength,checkedAt,descriptor,documents,key' &&
    typeof record.key === 'string' &&
    Number.isSafeInteger(record.byteLength) &&
    (record.byteLength as number) >= 0 &&
    Number.isSafeInteger(record.checkedAt) &&
    (record.checkedAt as number) >= 0 &&
    typeof record.descriptor === 'object' &&
    record.descriptor !== null &&
    typeof record.documents === 'object' &&
    record.documents !== null
  );
}

async function openDatabase(name: string, signal?: AbortSignal): Promise<IDBDatabase> {
  if (name !== mobileContentOfflineDatabaseName)
    throw new ContentOfflineStoreError('incompatible-storage');
  return fixtureIdb.open(signal);
  /* legacy implementation retained below only during source extraction
  if (typeof indexedDB === 'undefined') throw new ContentOfflineStoreError('unavailable');
  if (signal?.aborted) throw new ContentOfflineStoreError('aborted');
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(name, databaseVersion);
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
      callback();
    };
    const timeout = window.setTimeout(() => {
      try {
        open.transaction?.abort();
      } catch {
        void 0;
      }
      finish(() => reject(new ContentOfflineStoreError('timeout')));
    }, operationTimeoutMs);
    const abort = () => {
      try {
        open.transaction?.abort();
      } catch {
        void 0;
      }
      finish(() => reject(new ContentOfflineStoreError('aborted')));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    open.onupgradeneeded = (event) => {
      if (settled || signal?.aborted) {
        try {
          open.transaction?.abort();
        } catch {
          void 0;
        }
        return;
      }
      if (event.oldVersion !== 0) {
        try {
          open.transaction?.abort();
        } catch {
          void 0;
        }
        return;
      }
      const db = open.result;
      db.createObjectStore(bundlesStore, { keyPath: 'key' });
      db.createObjectStore(controlStore);
    };
    open.onerror = () => {
      finish(() => reject(failure(open.error)));
    };
    open.onblocked = () => {
      finish(() => reject(new ContentOfflineStoreError('incompatible-storage')));
    };
    open.onsuccess = () => {
      const db = open.result;
      if (settled || signal?.aborted) {
        db.close();
        finish(() => reject(new ContentOfflineStoreError('aborted')));
        return;
      }
      if (!hasExpectedSchema(db)) {
        db.close();
        finish(() => reject(new ContentOfflineStoreError('incompatible-storage')));
        return;
      }
      finish(() => resolve(db));
    };
  });
*/
}

export async function openMobileContentOfflineStore(
  signal?: AbortSignal,
): Promise<ContentOfflineStore> {
  const db = await openDatabase(mobileContentOfflineDatabaseName, signal);
  let closed = false;
  const activeTransactions = new Set<IDBTransaction>();
  db.onversionchange = () => {
    closed = true;
    db.close();
  };
  const assertOpen = () => {
    if (closed) throw new ContentOfflineStoreError('incompatible-storage');
  };
  const track = (transaction: IDBTransaction) => {
    activeTransactions.add(transaction);
    transaction.addEventListener('complete', () => activeTransactions.delete(transaction));
    transaction.addEventListener('abort', () => activeTransactions.delete(transaction));
    return transaction;
  };
  async function readControl(transaction: IDBTransaction): Promise<ContentOfflineControlV1> {
    const raw = await request(transaction.objectStore(controlStore).get(controlKey));
    if (raw === undefined) {
      const count = await request(transaction.objectStore(bundlesStore).count());
      if (count !== 0) throw new ContentOfflineStoreError('incompatible-storage');
      return createEmptyContentOfflineControlV1();
    }
    if (!isContentOfflineControlV1(raw)) throw new ContentOfflineStoreError('incompatible-storage');
    return raw;
  }
  async function writeControl(
    transaction: IDBTransaction,
    control: ContentOfflineControlV1,
  ): Promise<void> {
    assertControlBytes(control);
    await request(transaction.objectStore(controlStore).put(control, controlKey));
  }
  async function mutate(
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    change: (
      control: ContentOfflineControlV1,
      bundles: IDBObjectStore,
    ) => Promise<ContentOfflineControlV1>,
    signal?: AbortSignal,
  ): Promise<ContentOfflineControlV1> {
    assertOpen();
    const tx = track(db.transaction([bundlesStore, controlStore], 'readwrite'));
    const completed = waitForTransaction(tx, signal);
    void completed.catch(() => undefined);
    try {
      const control = await readControl(tx);
      assertCurrent(control, expected);
      const next = await change(control, tx.objectStore(bundlesStore));
      await writeControl(tx, next);
      await completed;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        void 0;
      }
      throw failure(error);
    }
  }
  async function readBundle(
    key: string,
    signal?: AbortSignal,
  ): Promise<ContentOfflineBundleV1 | null> {
    assertOpen();
    const tx = track(db.transaction(bundlesStore, 'readonly'));
    const completed = waitForTransaction(tx, signal);
    void completed.catch(() => undefined);
    try {
      const bundle = await request(tx.objectStore(bundlesStore).get(key));
      await completed;
      return bundle === undefined ? null : (bundle as ContentOfflineBundleV1);
    } catch (error) {
      try {
        tx.abort();
      } catch {
        void 0;
      }
      throw failure(error);
    }
  }
  const store: ContentOfflineStore = {
    async readProjection(signal) {
      const before = await this.snapshot(signal);
      const read = async (key: string | null) => {
        if (key === null) return null;
        const bundle = await readBundle(key, signal);
        const ready = await validateContentOfflineBundleV1(bundle, before.control.safety);
        if (bundle === null || ready === null || bundle.key !== key)
          throw new ContentOfflineStoreError('invalid-bundle');
        return Object.freeze({
          key,
          revision: ready.descriptor.releaseRevision,
          checkedAt: bundle.checkedAt,
          expiresAt: bundle.checkedAt + contentOfflineTtlMs,
          ready,
        });
      };
      const [active, candidate, previous] = await Promise.all([
        read(before.control.activeKey),
        read(before.control.candidateKey),
        read(before.control.previousKey),
      ]);
      const after = await this.snapshot(signal);
      assertCurrent(after.control, before.control);
      if (
        after.control.activeKey !== before.control.activeKey ||
        after.control.candidateKey !== before.control.candidateKey ||
        after.control.previousKey !== before.control.previousKey ||
        !sameContentOfflineSafetyLedger(after.control.safety, before.control.safety)
      )
        throw new ContentOfflineStoreError('stale-operation');
      const metadata = (value: Awaited<ReturnType<typeof read>>) =>
        value === null
          ? null
          : Object.freeze({
              key: value.key,
              revision: value.revision,
              checkedAt: value.checkedAt,
              expiresAt: value.expiresAt,
            });
      return Object.freeze({
        control: after.control,
        active,
        candidate: metadata(candidate),
        previous: metadata(previous),
      });
    },
    async snapshot(signal) {
      assertOpen();
      const tx = track(db.transaction([bundlesStore, controlStore], 'readonly'));
      const completed = waitForTransaction(tx, signal);
      void completed.catch(() => undefined);
      try {
        const control = await readControl(tx);
        const bundles = await request(tx.objectStore(bundlesStore).getAll());
        await completed;
        if (!bundles.every(hasStoredBundleShape))
          throw new ContentOfflineStoreError('incompatible-storage');
        const storedKeys = new Set(bundles.map((bundle) => bundle.key));
        if (
          [control.activeKey, control.previousKey, control.candidateKey].some(
            (key) => key !== null && !storedKeys.has(key),
          )
        )
          throw new ContentOfflineStoreError('incompatible-storage');
        return Object.freeze({
          control,
          bundles: Object.freeze(
            (bundles as ContentOfflineBundleV1[]).map(({ key, byteLength, checkedAt }) =>
              Object.freeze({ key, byteLength, checkedAt }),
            ),
          ),
        });
      } catch (error) {
        try {
          tx.abort();
        } catch {
          void 0;
        }
        throw failure(error);
      }
    },
    prepareRecheck(operationId, expected, signal) {
      if (!operationId || operationId.length > 128)
        return Promise.reject(new ContentOfflineStoreError('invalid-bundle'));
      return mutate(
        expected,
        async (control) => {
          const generation = control.generation + 1;
          return Object.freeze({
            ...control,
            generation,
            pendingRecheck: Object.freeze({
              operationId,
              generation,
              clearEpoch: control.clearEpoch,
            }),
          });
        },
        signal,
      );
    },
    completeRecheck(
      operationId,
      prepared,
      safety,
      checkedAt,
      expected,
      signal,
      sourceKind = 'failed',
    ) {
      if (!Number.isSafeInteger(checkedAt) || checkedAt < 0)
        return Promise.reject(new ContentOfflineStoreError('invalid-bundle'));
      return mutate(
        expected,
        async (control) => {
          if (
            control.pendingRecheck?.operationId !== operationId ||
            control.pendingRecheck.generation !== prepared.generation ||
            control.pendingRecheck.clearEpoch !== prepared.clearEpoch ||
            !sameContentOfflineSafetyLedger(control.safety, safety)
          )
            throw new ContentOfflineStoreError('stale-operation');
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            pendingRecheck: null,
            lastObservedAt:
              sourceKind === 'ready'
                ? checkedAt
                : control.lastObservedAt === null
                  ? checkedAt
                  : Math.max(control.lastObservedAt, checkedAt),
          });
        },
        signal,
      );
    },
    async saveCandidate(input, signal) {
      const before = await store.snapshot(signal);
      assertCurrent(before.control, input.expected);
      const bundle = await createContentOfflineBundleV1({
        ...input,
        knownSafety: before.control.safety,
      });
      return mutate(
        input.expected,
        async (control, bundles) => {
          if (!sameContentOfflineSafetyLedger(control.safety, before.control.safety))
            throw new ContentOfflineStoreError('stale-operation');
          const all = (await request(bundles.getAll())) as ContentOfflineBundleV1[];
          const sameRevision = all.find(
            (entry) =>
              entry.descriptor.releaseRevision === bundle.descriptor.releaseRevision &&
              entry.key !== bundle.key,
          );
          if (sameRevision) throw new ContentOfflineStoreError('invalid-bundle');
          if (control.activeKey === bundle.key) {
            const current = all.find((entry) => entry.key === bundle.key);
            if (current === undefined || input.checkedAt < current.checkedAt)
              throw new ContentOfflineStoreError('stale-operation');
            await request(bundles.put(bundle));
            return Object.freeze({
              ...control,
              generation: control.generation + 1,
              lastSuccessfulSourceCheckAt: input.checkedAt,
              lastObservedAt:
                control.lastObservedAt === null
                  ? input.checkedAt
                  : Math.max(control.lastObservedAt, input.checkedAt),
            });
          }
          if (control.previousKey === bundle.key || control.candidateKey === bundle.key) {
            const current = all.find((entry) => entry.key === bundle.key);
            if (current === undefined || input.checkedAt < current.checkedAt)
              throw new ContentOfflineStoreError('stale-operation');
            await request(bundles.put(bundle));
            return Object.freeze({
              ...control,
              generation: control.generation + 1,
              lastObservedAt:
                control.lastObservedAt === null
                  ? input.checkedAt
                  : Math.max(control.lastObservedAt, input.checkedAt),
            });
          }
          const retained = new Set(
            [control.activeKey, control.previousKey, bundle.key].filter(
              (key): key is string => key !== null,
            ),
          );
          const retainedBytes =
            all
              .filter((entry) => retained.has(entry.key) && entry.key !== bundle.key)
              .reduce((sum, entry) => sum + entry.byteLength, 0) + bundle.byteLength;
          if (
            retainedBytes > contentOfflineTotalBundleMaxBytes ||
            retained.size > contentOfflineMaxBundles
          )
            throw new ContentOfflineStoreError('quota-or-write-failure');
          await request(bundles.put(bundle));
          for (const entry of all)
            if (!retained.has(entry.key)) await request(bundles.delete(entry.key));
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            candidateKey: bundle.key,
            lastObservedAt: input.checkedAt,
          });
        },
        signal,
      );
    },
    async activateCandidate(now, expected, signal) {
      if (!Number.isSafeInteger(now) || now < 0)
        throw new ContentOfflineStoreError('invalid-bundle');
      const before = await this.snapshot(signal);
      if (before.control.candidateKey === null)
        throw new ContentOfflineStoreError('invalid-bundle');
      const candidate = await readBundle(before.control.candidateKey, signal);
      if (
        candidate === null ||
        (await validateContentOfflineBundleV1(candidate, before.control.safety)) === null ||
        now < candidate.checkedAt ||
        now - candidate.checkedAt > contentOfflineTtlMs
      )
        throw new ContentOfflineStoreError('invalid-bundle');
      return mutate(
        expected,
        async (control) => {
          if (control.candidateKey !== candidate.key)
            throw new ContentOfflineStoreError('stale-operation');
          if (control.pendingRecheck !== null)
            throw new ContentOfflineStoreError('stale-operation');
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            previousKey: control.activeKey,
            activeKey: control.candidateKey,
            candidateKey: null,
            lastSuccessfulSourceCheckAt: candidate.checkedAt,
            lastObservedAt:
              control.lastObservedAt === null ? now : Math.max(control.lastObservedAt, now),
          });
        },
        signal,
      );
    },
    async rollback(now, expected, signal) {
      const before = await this.snapshot(signal);
      if (before.control.previousKey === null || !Number.isSafeInteger(now) || now < 0)
        throw new ContentOfflineStoreError('invalid-bundle');
      if (before.control.lastObservedAt !== null && now < before.control.lastObservedAt)
        throw new ContentOfflineStoreError('stale-operation');
      const previous = await readBundle(before.control.previousKey, signal);
      if (
        previous === null ||
        (await validateContentOfflineBundleV1(previous, before.control.safety)) === null ||
        now < previous.checkedAt ||
        now - previous.checkedAt > contentOfflineTtlMs
      )
        throw new ContentOfflineStoreError('invalid-bundle');
      return mutate(
        expected,
        async (control) => {
          if (control.previousKey !== previous.key || control.pendingRecheck !== null)
            throw new ContentOfflineStoreError('stale-operation');
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            activeKey: control.previousKey,
            previousKey: control.activeKey,
            candidateKey: null,
            lastSuccessfulSourceCheckAt: previous.checkedAt,
            lastObservedAt: now,
          });
        },
        signal,
      );
    },
    async recordSafety(incoming, checkedAt, expected, signal) {
      if (!Number.isSafeInteger(checkedAt) || checkedAt < 0)
        throw new ContentOfflineStoreError('invalid-bundle');
      const before = await store.snapshot(signal);
      assertCurrent(before.control, expected);
      const safety = mergeContentOfflineSafetyLedger(before.control.safety, incoming);
      if (safety === null) throw new ContentOfflineStoreError('safety-conflict');
      const invalidKeys = new Set(
        await Promise.all(
          before.bundles.map(async ({ key }) => {
            const bundle = await readBundle(key, signal);
            return bundle === null ||
              (await validateContentOfflineBundleV1(bundle, safety)) === null
              ? key
              : null;
          }),
        ),
      );
      return mutate(
        expected,
        async (control, bundles) => {
          const currentSafety = mergeContentOfflineSafetyLedger(control.safety, incoming);
          if (currentSafety === null || !sameContentOfflineSafetyLedger(currentSafety, safety))
            throw new ContentOfflineStoreError('stale-operation');
          const all = (await request(bundles.getAll())) as ContentOfflineBundleV1[];
          if (
            all.length !== before.bundles.length ||
            all.some((bundle) => !before.bundles.some(({ key }) => key === bundle.key))
          )
            throw new ContentOfflineStoreError('stale-operation');
          let activeKey = control.activeKey;
          let previousKey = control.previousKey;
          let candidateKey = control.candidateKey;
          for (const bundle of all) {
            if (invalidKeys.has(bundle.key)) {
              await request(bundles.delete(bundle.key));
              if (activeKey === bundle.key) activeKey = null;
              if (previousKey === bundle.key) previousKey = null;
              if (candidateKey === bundle.key) candidateKey = null;
            }
          }
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            safety: currentSafety,
            activeKey,
            previousKey,
            candidateKey,
            lastObservedAt:
              control.lastObservedAt === null
                ? checkedAt
                : Math.max(control.lastObservedAt, checkedAt),
          });
        },
        signal,
      );
    },
    observeTime(now, expected, signal) {
      if (!Number.isSafeInteger(now) || now < 0)
        return Promise.reject(new ContentOfflineStoreError('invalid-bundle'));
      return mutate(
        expected,
        async (control) => {
          if (control.lastObservedAt !== null && now < control.lastObservedAt)
            throw new ContentOfflineStoreError('stale-operation');
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            lastObservedAt: now,
          });
        },
        signal,
      );
    },
    clear(expected, signal) {
      return mutate(
        expected,
        async (control, bundles) => {
          await request(bundles.clear());
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            clearEpoch: control.clearEpoch + 1,
            activeKey: null,
            previousKey: null,
            candidateKey: null,
            pendingRecheck:
              control.pendingRecheck === null
                ? null
                : Object.freeze({
                    operationId: control.pendingRecheck.operationId,
                    generation: control.generation + 1,
                    clearEpoch: control.clearEpoch + 1,
                  }),
          });
        },
        signal,
      );
    },
    async readActive(signal) {
      assertOpen();
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const tx = track(db.transaction([bundlesStore, controlStore], 'readonly'));
        const completed = waitForTransaction(tx, signal);
        void completed.catch(() => undefined);
        try {
          const control = await readControl(tx);
          const bundle =
            control.activeKey === null
              ? null
              : await request(tx.objectStore(bundlesStore).get(control.activeKey));
          await completed;
          if (bundle === null || bundle === undefined) return null;
          const ready = await validateContentOfflineBundleV1(bundle, control.safety);
          if (ready === null) return null;
          const after = await this.snapshot(signal);
          if (
            after.control.generation === control.generation &&
            after.control.clearEpoch === control.clearEpoch &&
            after.control.activeKey === control.activeKey &&
            sameContentOfflineSafetyLedger(after.control.safety, control.safety)
          )
            return Object.freeze({
              ready,
              generation: control.generation,
              clearEpoch: control.clearEpoch,
              checkedAt: bundle.checkedAt,
            });
        } catch (error) {
          try {
            tx.abort();
          } catch {
            void 0;
          }
          throw failure(error);
        }
      }
      throw new ContentOfflineStoreError('stale-operation');
    },
    close() {
      closed = true;
      for (const transaction of activeTransactions)
        try {
          transaction.abort();
        } catch {
          void 0;
        }
      db.close();
    },
  };
  return Object.freeze(store);
}
