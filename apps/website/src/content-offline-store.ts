import {
  canonicalJson,
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
  type ContentOfflineBundleV1,
  type ContentOfflineControlV1,
  type ContentOfflineSafetyLedgerV1,
  type LocalContentReleaseDocumentsV1,
  type LocalContentReleaseReadyV1,
} from '@wrn/content-contracts';
import type { LocalContentReleaseOfflineCheck } from './local-content-release';

export const websiteContentOfflineDatabaseName = 'wrn.website-content-offline';
const version = 1,
  bundles = 'bundles',
  controls = 'control',
  controlKey = 'control',
  timeoutMs = 5_000;
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
function fail(error: unknown): ContentOfflineStoreError {
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
function request<T>(requestValue: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      callback();
    };
    const timeout = window.setTimeout(
      () => finish(() => reject(new ContentOfflineStoreError('timeout'))),
      timeoutMs,
    );
    requestValue.onsuccess = () => finish(() => resolve(requestValue.result));
    requestValue.onerror = () => finish(() => reject(fail(requestValue.error)));
  });
}
function complete(transaction: IDBTransaction, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      callback();
    };
    const timer = window.setTimeout(() => {
      try {
        transaction.abort();
      } catch {
        void 0;
      }
      finish(() => reject(new ContentOfflineStoreError('timeout')));
    }, timeoutMs);
    const abort = () => {
      try {
        transaction.abort();
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
    transaction.oncomplete = () => {
      finish(resolve);
    };
    transaction.onerror = () => {
      finish(() => reject(fail(transaction.error)));
    };
    transaction.onabort = () => {
      finish(() => reject(fail(transaction.error)));
    };
  });
}
function current(
  control: ContentOfflineControlV1,
  expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
) {
  if (control.generation !== expected.generation || control.clearEpoch !== expected.clearEpoch)
    throw new ContentOfflineStoreError('stale-operation');
}
function controlBytes(control: ContentOfflineControlV1) {
  if (new TextEncoder().encode(canonicalJson(control)).byteLength > contentOfflineControlMaxBytes)
    throw new ContentOfflineStoreError('quota-or-write-failure');
}
function hasExpectedSchema(db: IDBDatabase): boolean {
  try {
    if (!db.objectStoreNames.contains(bundles) || !db.objectStoreNames.contains(controls))
      return false;
    const transaction = db.transaction([bundles, controls], 'readonly');
    return (
      transaction.objectStore(bundles).keyPath === 'key' &&
      transaction.objectStore(controls).keyPath === null
    );
  } catch {
    return false;
  }
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
export async function openWebsiteContentOfflineStore(
  signal?: AbortSignal,
): Promise<ContentOfflineStore> {
  if (typeof indexedDB === 'undefined') throw new ContentOfflineStoreError('unavailable');
  if (signal?.aborted) throw new ContentOfflineStoreError('aborted');
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const opening = indexedDB.open(websiteContentOfflineDatabaseName, version);
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      callback();
    };
    const timer = window.setTimeout(() => {
      try {
        opening.transaction?.abort();
      } catch {
        void 0;
      }
      finish(() => reject(new ContentOfflineStoreError('timeout')));
    }, timeoutMs);
    const abort = () => {
      try {
        opening.transaction?.abort();
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
    opening.onupgradeneeded = (event) => {
      if (settled || signal?.aborted) {
        try {
          opening.transaction?.abort();
        } catch {
          void 0;
        }
        return;
      }
      if (event.oldVersion !== 0) {
        try {
          opening.transaction?.abort();
        } catch {
          void 0;
        }
        return;
      }
      opening.result.createObjectStore(bundles, { keyPath: 'key' });
      opening.result.createObjectStore(controls);
    };
    opening.onblocked = () => {
      finish(() => reject(new ContentOfflineStoreError('incompatible-storage')));
    };
    opening.onerror = () => {
      finish(() => reject(fail(opening.error)));
    };
    opening.onsuccess = () => {
      const value = opening.result;
      if (settled || signal?.aborted || !hasExpectedSchema(value)) {
        value.close();
        finish(() =>
          reject(
            new ContentOfflineStoreError(signal?.aborted ? 'aborted' : 'incompatible-storage'),
          ),
        );
        return;
      }
      finish(() => resolve(value));
    };
  });
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
  async function readControl(tx: IDBTransaction) {
    const raw = await request(tx.objectStore(controls).get(controlKey));
    if (raw !== undefined) {
      if (!isContentOfflineControlV1(raw))
        throw new ContentOfflineStoreError('incompatible-storage');
      return raw;
    }
    if ((await request(tx.objectStore(bundles).count())) !== 0)
      throw new ContentOfflineStoreError('incompatible-storage');
    return createEmptyContentOfflineControlV1();
  }
  async function bundle(key: string, signal?: AbortSignal) {
    assertOpen();
    const tx = track(db.transaction(bundles, 'readonly'));
    const completed = complete(tx, signal);
    void completed.catch(() => undefined);
    try {
      const value = await request(tx.objectStore(bundles).get(key));
      await completed;
      return value === undefined ? null : (value as ContentOfflineBundleV1);
    } catch (error) {
      try {
        tx.abort();
      } catch {
        void 0;
      }
      throw fail(error);
    }
  }
  async function mutate(
    expected: Pick<ContentOfflineControlV1, 'generation' | 'clearEpoch'>,
    edit: (
      control: ContentOfflineControlV1,
      store: IDBObjectStore,
    ) => Promise<ContentOfflineControlV1>,
    signal?: AbortSignal,
  ) {
    assertOpen();
    const tx = track(db.transaction([bundles, controls], 'readwrite'));
    const completed = complete(tx, signal);
    void completed.catch(() => undefined);
    try {
      const control = await readControl(tx);
      current(control, expected);
      const next = await edit(control, tx.objectStore(bundles));
      controlBytes(next);
      await request(tx.objectStore(controls).put(next, controlKey));
      await completed;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        void 0;
      }
      throw fail(error);
    }
  }
  const store: ContentOfflineStore = {
    async readProjection(signal) {
      const before = await this.snapshot(signal);
      const read = async (key: string | null) => {
        if (key === null) return null;
        const stored = await bundle(key, signal);
        const ready = await validateContentOfflineBundleV1(stored, before.control.safety);
        if (stored === null || ready === null || stored.key !== key)
          throw new ContentOfflineStoreError('invalid-bundle');
        return Object.freeze({
          key,
          revision: ready.descriptor.releaseRevision,
          checkedAt: stored.checkedAt,
          expiresAt: stored.checkedAt + contentOfflineTtlMs,
          ready,
        });
      };
      const [active, candidate, previous] = await Promise.all([
        read(before.control.activeKey),
        read(before.control.candidateKey),
        read(before.control.previousKey),
      ]);
      const after = await this.snapshot(signal);
      current(after.control, before.control);
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
      const tx = track(db.transaction([bundles, controls], 'readonly'));
      const completed = complete(tx, signal);
      void completed.catch(() => undefined);
      try {
        const control = await readControl(tx);
        const values = (await request(
          tx.objectStore(bundles).getAll(),
        )) as ContentOfflineBundleV1[];
        await completed;
        if (!values.every(hasStoredBundleShape))
          throw new ContentOfflineStoreError('incompatible-storage');
        const storedKeys = new Set(values.map((item) => item.key));
        if (
          [control.activeKey, control.previousKey, control.candidateKey].some(
            (key) => key !== null && !storedKeys.has(key),
          )
        )
          throw new ContentOfflineStoreError('incompatible-storage');
        return Object.freeze({
          control,
          bundles: Object.freeze(
            values.map(({ key, byteLength, checkedAt }) =>
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
        throw fail(error);
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
      current(before.control, input.expected);
      const candidate = await createContentOfflineBundleV1({
        ...input,
        knownSafety: before.control.safety,
      });
      return mutate(
        input.expected,
        async (control, bundleStore) => {
          if (!sameContentOfflineSafetyLedger(control.safety, before.control.safety))
            throw new ContentOfflineStoreError('stale-operation');
          const all = (await request(bundleStore.getAll())) as ContentOfflineBundleV1[];
          if (
            all.some(
              (item) =>
                item.descriptor.releaseRevision === candidate.descriptor.releaseRevision &&
                item.key !== candidate.key,
            )
          )
            throw new ContentOfflineStoreError('invalid-bundle');
          if (control.activeKey === candidate.key) {
            const currentBundle = all.find((item) => item.key === candidate.key);
            if (currentBundle === undefined || input.checkedAt < currentBundle.checkedAt)
              throw new ContentOfflineStoreError('stale-operation');
            await request(bundleStore.put(candidate));
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
          if (control.previousKey === candidate.key || control.candidateKey === candidate.key) {
            const currentBundle = all.find((item) => item.key === candidate.key);
            if (currentBundle === undefined || input.checkedAt < currentBundle.checkedAt)
              throw new ContentOfflineStoreError('stale-operation');
            await request(bundleStore.put(candidate));
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
            [control.activeKey, control.previousKey, candidate.key].filter(
              (key): key is string => key !== null,
            ),
          );
          const bytes =
            all
              .filter((item) => retained.has(item.key) && item.key !== candidate.key)
              .reduce((sum, item) => sum + item.byteLength, 0) + candidate.byteLength;
          if (bytes > contentOfflineTotalBundleMaxBytes || retained.size > contentOfflineMaxBundles)
            throw new ContentOfflineStoreError('quota-or-write-failure');
          await request(bundleStore.put(candidate));
          for (const item of all)
            if (!retained.has(item.key)) await request(bundleStore.delete(item.key));
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            candidateKey: candidate.key,
            lastObservedAt: input.checkedAt,
          });
        },
        signal,
      );
    },
    async activateCandidate(now, expected, signal) {
      if (!Number.isSafeInteger(now) || now < 0)
        throw new ContentOfflineStoreError('invalid-bundle');
      const before = await store.snapshot(signal);
      if (before.control.candidateKey === null)
        throw new ContentOfflineStoreError('invalid-bundle');
      const candidate = await bundle(before.control.candidateKey, signal);
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
          if (control.candidateKey !== candidate.key || control.pendingRecheck !== null)
            throw new ContentOfflineStoreError('stale-operation');
          return Object.freeze({
            ...control,
            generation: control.generation + 1,
            previousKey: control.activeKey,
            activeKey: candidate.key,
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
      const before = await store.snapshot(signal);
      if (
        before.control.previousKey === null ||
        !Number.isSafeInteger(now) ||
        now < 0 ||
        (before.control.lastObservedAt !== null && now < before.control.lastObservedAt)
      )
        throw new ContentOfflineStoreError('stale-operation');
      const previous = await bundle(before.control.previousKey, signal);
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
            activeKey: previous.key,
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
      current(before.control, expected);
      const safety = mergeContentOfflineSafetyLedger(before.control.safety, incoming);
      if (safety === null) throw new ContentOfflineStoreError('safety-conflict');
      const invalidKeys = new Set(
        await Promise.all(
          before.bundles.map(async ({ key }) => {
            const stored = await bundle(key, signal);
            return stored === null ||
              (await validateContentOfflineBundleV1(stored, safety)) === null
              ? key
              : null;
          }),
        ),
      );
      return mutate(
        expected,
        async (control, bundleStore) => {
          const currentSafety = mergeContentOfflineSafetyLedger(control.safety, incoming);
          if (currentSafety === null || !sameContentOfflineSafetyLedger(currentSafety, safety))
            throw new ContentOfflineStoreError('stale-operation');
          const all = (await request(bundleStore.getAll())) as ContentOfflineBundleV1[];
          if (
            all.length !== before.bundles.length ||
            all.some((item) => !before.bundles.some(({ key }) => key === item.key))
          )
            throw new ContentOfflineStoreError('stale-operation');
          let activeKey = control.activeKey,
            previousKey = control.previousKey,
            candidateKey = control.candidateKey;
          for (const item of all) {
            if (invalidKeys.has(item.key)) {
              await request(bundleStore.delete(item.key));
              if (activeKey === item.key) activeKey = null;
              if (previousKey === item.key) previousKey = null;
              if (candidateKey === item.key) candidateKey = null;
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
        async (control, bundleStore) => {
          await request(bundleStore.clear());
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
        const tx = track(db.transaction([bundles, controls], 'readonly'));
        const completed = complete(tx, signal);
        void completed.catch(() => undefined);
        try {
          const control = await readControl(tx);
          const stored =
            control.activeKey === null
              ? null
              : await request(tx.objectStore(bundles).get(control.activeKey));
          await completed;
          if (stored === null || stored === undefined) return null;
          const ready = await validateContentOfflineBundleV1(stored, control.safety);
          if (ready === null) return null;
          const after = await store.snapshot(signal);
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
              checkedAt: stored.checkedAt,
            });
        } catch (error) {
          try {
            tx.abort();
          } catch {
            void 0;
          }
          throw fail(error);
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
