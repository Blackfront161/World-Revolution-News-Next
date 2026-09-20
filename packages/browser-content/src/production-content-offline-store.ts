import {
  canonicalJson,
  type ProductionContentReady,
  type ProductionContentOfflineBundle,
  type ProductionContentSafetyLedgerV1,
} from '@wrn/content-contracts';
import type { ProductionContentOfflineControlV1 } from '@wrn/content-contracts/production-content-offline-v1';
import { productionContentOfflineMaxIdentities } from '@wrn/content-contracts/production-content-offline-v1';
import { createOfflineIdbCore, type OfflineCandidateSave } from './content-offline-store-core';
import {
  patchProductionOfflineControl,
  createProductionOfflinePersistenceProfile,
  type ProductionOfflineBundleInput,
} from './production-content-offline-profile';

const databaseVersion = 1;
const bundlesStore = 'bundles';
const controlStore = 'control';
const controlKey = 'control';

export type ProductionContentOfflineStoreFailure =
  | 'unavailable'
  | 'incompatible-storage'
  | 'timeout'
  | 'aborted'
  | 'stale-operation'
  | 'quota-or-write-failure'
  | 'invalid-bundle'
  | 'safety-conflict'
  | 'identity-conflict';
export class ProductionContentOfflineStoreError extends Error {
  constructor(readonly code: ProductionContentOfflineStoreFailure) {
    super(`Production offline store: ${code}`);
  }
}

export type ProductionContentOfflineSnapshot = Readonly<{
  control: ProductionContentOfflineControlV1;
  bundles: readonly Readonly<
    Pick<ProductionContentOfflineBundle, 'key' | 'byteLength' | 'checkedAt'>
  >[];
}>;
export type ProductionContentOfflineActiveSnapshot = Readonly<{
  ready: ProductionContentReady;
  generation: number;
  clearEpoch: number;
  checkedAt: number;
}>;
export type ProductionContentOfflinePreparedRecheck = Readonly<{
  generation: number;
  clearEpoch: number;
}>;
export type ProductionContentRecheckOutcome =
  'unverified' | 'unverified-preserve-check-time' | 'safety-verified-payload-failed' | 'ready';

function failure(error: unknown): ProductionContentOfflineStoreError {
  if (error instanceof ProductionContentOfflineStoreError) return error;
  if (error instanceof DOMException && error.name === 'AbortError')
    return new ProductionContentOfflineStoreError('aborted');
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'UnknownError')
  )
    return new ProductionContentOfflineStoreError('quota-or-write-failure');
  if (
    error instanceof DOMException &&
    (error.name === 'VersionError' || error.name === 'InvalidStateError')
  )
    return new ProductionContentOfflineStoreError('incompatible-storage');
  return new ProductionContentOfflineStoreError('unavailable');
}
function assertCurrent(
  control: ProductionContentOfflineControlV1,
  expected: ProductionContentOfflinePreparedRecheck,
): void {
  if (control.generation !== expected.generation || control.clearEpoch !== expected.clearEpoch)
    throw new ProductionContentOfflineStoreError('stale-operation');
}
function validSchema(db: IDBDatabase): boolean {
  try {
    const tx = db.transaction([bundlesStore, controlStore], 'readonly');
    return (
      db.objectStoreNames.contains(bundlesStore) &&
      db.objectStoreNames.contains(controlStore) &&
      db.objectStoreNames.length === 2 &&
      tx.objectStore(bundlesStore).keyPath === 'key' &&
      tx.objectStore(controlStore).keyPath === null &&
      !tx.objectStore(bundlesStore).autoIncrement &&
      !tx.objectStore(controlStore).autoIncrement &&
      tx.objectStore(bundlesStore).indexNames.length === 0 &&
      tx.objectStore(controlStore).indexNames.length === 0
    );
  } catch {
    return false;
  }
}
export interface ProductionContentOfflineStore {
  snapshot(signal?: AbortSignal): Promise<ProductionContentOfflineSnapshot>;
  observeTime(
    now: number,
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  prepareRecheck(
    operationId: string,
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  commitSafety(
    operationId: string,
    safety: ProductionContentSafetyLedgerV1,
    checkedAt: number,
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  finishRecheck(
    operationId: string,
    outcome: ProductionContentRecheckOutcome,
    checkedAt: number,
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  saveCandidate(
    input: ProductionOfflineBundleInput & { expected: ProductionContentOfflinePreparedRecheck },
    signal?: AbortSignal,
  ): Promise<OfflineCandidateSave<ProductionContentOfflineControlV1>>;
  activateCandidate(
    bundleKey: string,
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  rollback(
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  clear(
    expected: ProductionContentOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineControlV1>;
  readActive(signal?: AbortSignal): Promise<ProductionContentOfflineActiveSnapshot | null>;
  close(): void;
}

type StoredState = Readonly<{
  control: ProductionContentOfflineControlV1;
  bundles: readonly ProductionContentOfflineBundle[];
}>;
type Mutation<T> = Readonly<{
  control: ProductionContentOfflineControlV1;
  bundles: readonly ProductionContentOfflineBundle[];
  project: (control: ProductionContentOfflineControlV1) => T;
}>;

export function createProductionContentOfflineStoreFactory(databaseName: string) {
  const profile = createProductionOfflinePersistenceProfile(databaseName);
  function assertControlBytes(control: ProductionContentOfflineControlV1): void {
    if (new TextEncoder().encode(canonicalJson(control)).byteLength > profile.bounds.controlBytes)
      throw new ProductionContentOfflineStoreError('quota-or-write-failure');
  }
  const productionIdb = createOfflineIdbCore({
    databaseName: profile.databaseName,
    databaseVersion,
    error: (code) => new ProductionContentOfflineStoreError(code),
    upgrade: (database, oldVersion) => {
      if (oldVersion !== 0) throw new ProductionContentOfflineStoreError('incompatible-storage');
      database.createObjectStore(bundlesStore, { keyPath: 'key' });
      database.createObjectStore(controlStore);
    },
    expectedSchema: validSchema,
  });
  function request<T>(value: IDBRequest<T>): Promise<T> {
    return productionIdb.request(value);
  }
  function wait(tx: IDBTransaction, signal?: AbortSignal): Promise<void> {
    return productionIdb.transaction(tx, signal);
  }
  async function openDatabase(signal?: AbortSignal): Promise<IDBDatabase> {
    return productionIdb.open(signal);
  }

  return async function openProductionContentOfflineStore(
    signal?: AbortSignal,
  ): Promise<ProductionContentOfflineStore> {
    const db = await openDatabase(signal);
    let closed = false;
    const transactions = new Set<IDBTransaction>();
    const fail = (code: ProductionContentOfflineStoreFailure): never => {
      throw new ProductionContentOfflineStoreError(code);
    };
    const assertOpen = (signal?: AbortSignal) => {
      if (closed) fail('incompatible-storage');
      if (signal?.aborted) fail('aborted');
    };
    const close = () => {
      if (closed) return;
      closed = true;
      for (const tx of transactions) {
        try {
          tx.abort();
        } catch {
          /* completed */
        }
      }
      db.close();
    };
    db.onversionchange = close;
    const tracked = (mode: IDBTransactionMode, signal?: AbortSignal) => {
      assertOpen(signal);
      const tx = db.transaction([bundlesStore, controlStore], mode);
      transactions.add(tx);
      const done = wait(tx, signal).finally(() => transactions.delete(tx));
      void done.catch(() => undefined);
      return { tx, done };
    };
    async function rawState(tx: IDBTransaction) {
      const [value, bundles] = await Promise.all([
        request(tx.objectStore(controlStore).get(controlKey)),
        request(tx.objectStore(bundlesStore).getAll()),
      ]);
      if (value === undefined && bundles.length !== 0) return fail('incompatible-storage');
      const control = value === undefined ? profile.createEmptyControl() : value;
      if (!profile.isControl(control)) return fail('incompatible-storage');
      assertControlBytes(control);
      if (
        bundles.length > profile.bounds.slots ||
        new TextEncoder().encode(canonicalJson(bundles)).byteLength >
          profile.bounds.totalBytes + 4096
      )
        return fail('incompatible-storage');
      const count = await request(tx.objectStore(controlStore).count());
      if (count > (value === undefined ? 0 : 1)) return fail('incompatible-storage');
      return { control, bundles: bundles as unknown[] };
    }
    async function load(signal?: AbortSignal): Promise<StoredState> {
      const { tx, done } = tracked('readonly', signal);
      try {
        const raw = await rawState(tx);
        await done;
        const bundles: ProductionContentOfflineBundle[] = [];
        for (const value of raw.bundles) {
          assertOpen(signal);
          const ready = await profile.validateBundle(value, raw.control.safety);
          if (ready === null) return fail('incompatible-storage');
          // The full exact contract was checked above, including key/bytes/checkedAt.
          const bundle = value as ProductionContentOfflineBundle;
          if (ready.descriptor.sequence > raw.control.highestAcceptedSequence)
            return fail('incompatible-storage');
          if (
            !raw.control.acceptedIdentities.some(
              (identity) =>
                identity.key === bundle.key &&
                identity.revision === ready.descriptor.releaseRevision &&
                identity.sequence === ready.descriptor.sequence,
            )
          )
            return fail('incompatible-storage');
          bundles.push(bundle);
        }
        const keys = [raw.control.activeKey, raw.control.previousKey, raw.control.candidateKey]
          .filter((key): key is string => key !== null)
          .sort();
        if (canonicalJson(keys) !== canonicalJson(bundles.map((bundle) => bundle.key).sort()))
          return fail('incompatible-storage');
        assertOpen(signal);
        return { control: patchProductionOfflineControl(raw.control, {}), bundles };
      } catch (error) {
        try {
          tx.abort();
        } catch {
          /* completed */
        }
        throw failure(error);
      }
    }
    async function mutate<T>(
      expected: ProductionContentOfflinePreparedRecheck,
      plan: (before: StoredState) => Promise<Mutation<T>>,
      signal?: AbortSignal,
    ): Promise<T> {
      expected = Object.freeze({
        generation: expected.generation,
        clearEpoch: expected.clearEpoch,
      });
      const before = await load(signal);
      assertCurrent(before.control, expected);
      // Hashing/contract validation happens before opening the write transaction.
      const prepared = await plan(before);
      assertOpen(signal);
      const next = patchProductionOfflineControl(
        { ...prepared.control, generation: before.control.generation + 1 },
        {},
      );
      assertControlBytes(next);
      if (
        prepared.bundles.length > profile.bounds.slots ||
        prepared.bundles.reduce((sum, bundle) => sum + bundle.byteLength, 0) >
          profile.bounds.totalBytes
      )
        return fail('quota-or-write-failure');
      const { tx, done } = tracked('readwrite', signal);
      try {
        const current = await rawState(tx);
        assertCurrent(current.control, expected);
        if (canonicalJson(current) !== canonicalJson(before)) return fail('stale-operation');
        await request(tx.objectStore(bundlesStore).clear());
        for (const bundle of prepared.bundles)
          await request(tx.objectStore(bundlesStore).put(bundle));
        await request(tx.objectStore(controlStore).put(next, controlKey));
        await done;
        return prepared.project(next);
      } catch (error) {
        try {
          tx.abort();
        } catch {
          /* already completed */
        }
        throw failure(error);
      }
    }
    const transition = (
      control: ProductionContentOfflineControlV1,
      bundles: readonly ProductionContentOfflineBundle[],
    ): Mutation<ProductionContentOfflineControlV1> => ({
      control,
      bundles,
      project: (value) => value,
    });
    const ownsAttempt = (control: ProductionContentOfflineControlV1, operationId: string) => {
      if (
        control.pendingRecheck?.operationId !== operationId ||
        control.pendingRecheck.clearEpoch !== control.clearEpoch
      )
        fail('stale-operation');
    };
    const validTime = (time: number) => {
      if (!Number.isSafeInteger(time) || time < 0) fail('invalid-bundle');
    };
    const store: ProductionContentOfflineStore = {
      async snapshot(signal) {
        const state = await load(signal);
        return Object.freeze({
          control: state.control,
          bundles: Object.freeze(
            state.bundles.map((bundle) =>
              Object.freeze({
                key: bundle.key,
                byteLength: bundle.byteLength,
                checkedAt: bundle.checkedAt,
              }),
            ),
          ),
        });
      },
      observeTime(now, expected, signal) {
        return mutate(
          expected,
          async (before) => {
            validTime(now);
            if (before.control.lastObservedAt !== null && now < before.control.lastObservedAt)
              return fail('stale-operation');
            return transition(
              patchProductionOfflineControl(before.control, { lastObservedAt: now }),
              before.bundles,
            );
          },
          signal,
        );
      },
      prepareRecheck(operationId, expected, signal) {
        if (!operationId || operationId.trim() !== operationId || operationId.length > 128)
          return Promise.reject(new ProductionContentOfflineStoreError('stale-operation'));
        return mutate(
          expected,
          async (before) =>
            transition(
              patchProductionOfflineControl(before.control, {
                pendingRecheck: {
                  operationId,
                  generation: before.control.generation + 1,
                  clearEpoch: before.control.clearEpoch,
                },
              }),
              before.bundles,
            ),
          signal,
        );
      },
      commitSafety(operationId, incoming, checkedAt, expected, signal) {
        const immutableIncoming = JSON.parse(
          canonicalJson(incoming),
        ) as ProductionContentSafetyLedgerV1;
        return mutate(
          expected,
          async (before) => {
            ownsAttempt(before.control, operationId);
            validTime(checkedAt);
            const safety = profile.mergeSafety(before.control.safety, immutableIncoming);
            if (safety === null) return fail('safety-conflict');
            const surviving: ProductionContentOfflineBundle[] = [];
            for (const bundle of before.bundles)
              if (await profile.validateBundle(bundle, safety)) surviving.push(bundle);
            const has = (key: string | null) => surviving.some((bundle) => bundle.key === key);
            return transition(
              patchProductionOfflineControl(before.control, {
                safety,
                lastObservedAt: Math.max(before.control.lastObservedAt ?? 0, checkedAt),
                activeKey: has(before.control.activeKey) ? before.control.activeKey : null,
                previousKey: has(before.control.previousKey) ? before.control.previousKey : null,
                candidateKey: has(before.control.candidateKey) ? before.control.candidateKey : null,
              }),
              surviving,
            );
          },
          signal,
        );
      },
      finishRecheck(operationId, outcome, checkedAt, expected, signal) {
        return mutate(
          expected,
          async (before) => {
            ownsAttempt(before.control, operationId);
            validTime(checkedAt);
            return transition(
              patchProductionOfflineControl(before.control, {
                pendingRecheck: null,
                lastObservedAt: Math.max(before.control.lastObservedAt ?? 0, checkedAt),
                lastSuccessfulSourceCheckAt:
                  outcome === 'ready'
                    ? checkedAt
                    : outcome === 'safety-verified-payload-failed' ||
                        outcome === 'unverified-preserve-check-time'
                      ? before.control.lastSuccessfulSourceCheckAt
                      : null,
              }),
              before.bundles,
            );
          },
          signal,
        );
      },
      async saveCandidate(input, signal) {
        const supplied = JSON.parse(canonicalJson(input)) as typeof input;
        return mutate(
          supplied.expected,
          async (before) => {
            const bundle = await profile.createBundle(supplied, before.control.safety);
            const ready = await profile.validateBundle(bundle, before.control.safety);
            if (ready === null) return fail('invalid-bundle');
            const identity = profile.identity(bundle, ready);
            const accepted = before.control.acceptedIdentities.find(
              (entry) =>
                entry.revision === identity.revision ||
                entry.sequence === identity.sequence ||
                entry.key === identity.key,
            );
            if (
              accepted !== undefined &&
              (accepted.revision !== identity.revision ||
                accepted.sequence !== identity.sequence ||
                accepted.key !== identity.key)
            )
              return fail('identity-conflict');
            if (
              before.bundles.some(
                (stored) =>
                  stored.key !== bundle.key &&
                  (stored.descriptor.releaseRevision === identity.revision ||
                    stored.descriptor.sequence === identity.sequence),
              )
            )
              return fail('identity-conflict');
            const slot = (['activeKey', 'previousKey', 'candidateKey'] as const).find(
              (name) => before.control[name] === bundle.key,
            );
            let control = before.control;
            let disposition: OfflineCandidateSave<ProductionContentOfflineControlV1>['disposition'];
            let bundles: ProductionContentOfflineBundle[];
            if (slot !== undefined) {
              const stored = before.bundles.find((value) => value.key === bundle.key)!;
              if (bundle.checkedAt < stored.checkedAt) return fail('stale-operation');
              disposition =
                slot === 'activeKey'
                  ? 'active-refreshed'
                  : slot === 'previousKey'
                    ? 'previous-refreshed'
                    : 'candidate-refreshed';
              bundles = before.bundles.map((value) => (value.key === bundle.key ? bundle : value));
            } else {
              if (
                identity.sequence === null ||
                (accepted === undefined
                  ? identity.sequence <= control.highestAcceptedSequence
                  : identity.sequence !== control.highestAcceptedSequence)
              )
                return fail('identity-conflict');
              if (
                accepted === undefined &&
                control.acceptedIdentities.length >= productionContentOfflineMaxIdentities
              )
                return fail('quota-or-write-failure');
              disposition = 'candidate-staged';
              bundles = before.bundles
                .filter((value) => value.key !== control.candidateKey)
                .concat(bundle);
              control = patchProductionOfflineControl(
                {
                  ...control,
                  highestAcceptedSequence: identity.sequence,
                  acceptedIdentities:
                    accepted === undefined
                      ? [
                          ...control.acceptedIdentities,
                          {
                            revision: identity.revision,
                            sequence: identity.sequence,
                            key: bundle.key,
                          },
                        ]
                      : control.acceptedIdentities,
                },
                { candidateKey: bundle.key },
              );
            }
            bundles.sort((left, right) => left.key.localeCompare(right.key));
            return {
              control,
              bundles,
              project: (next) =>
                Object.freeze({ control: next, bundleKey: bundle.key, disposition }),
            };
          },
          signal,
        );
      },
      activateCandidate(bundleKey, expected, signal) {
        return mutate(
          expected,
          async (before) => {
            if (
              before.control.candidateKey !== bundleKey ||
              !before.bundles.some((bundle) => bundle.key === bundleKey)
            )
              return fail('stale-operation');
            const bundles = before.bundles.filter(
              (bundle) => bundle.key !== before.control.previousKey,
            );
            return transition(
              patchProductionOfflineControl(before.control, {
                activeKey: bundleKey,
                previousKey: before.control.activeKey,
                candidateKey: null,
              }),
              bundles,
            );
          },
          signal,
        );
      },
      rollback(expected, signal) {
        return mutate(
          expected,
          async (before) => {
            if (
              before.control.activeKey === null ||
              before.control.previousKey === null ||
              before.control.pendingRecheck !== null
            )
              return fail('stale-operation');
            const previous = before.bundles.find(
              (bundle) => bundle.key === before.control.previousKey,
            )!;
            return transition(
              patchProductionOfflineControl(before.control, {
                activeKey: before.control.previousKey,
                previousKey: before.control.activeKey,
                lastSuccessfulSourceCheckAt: previous.checkedAt,
              }),
              before.bundles,
            );
          },
          signal,
        );
      },
      clear(expected, signal) {
        return mutate(
          expected,
          async (before) =>
            transition(
              patchProductionOfflineControl(
                {
                  ...before.control,
                  clearEpoch: before.control.clearEpoch + 1,
                },
                {
                  activeKey: null,
                  previousKey: null,
                  candidateKey: null,
                  pendingRecheck: null,
                  lastSuccessfulSourceCheckAt: null,
                },
              ),
              [],
            ),
          signal,
        );
      },
      async readActive(signal) {
        const before = await load(signal);
        if (before.control.activeKey === null) return null;
        const bundle = before.bundles.find((value) => value.key === before.control.activeKey)!;
        const ready = await profile.validateBundle(bundle, before.control.safety);
        const after = await load(signal);
        if (ready === null || canonicalJson(before) !== canonicalJson(after))
          return fail('stale-operation');
        return Object.freeze({
          ready,
          generation: after.control.generation,
          clearEpoch: after.control.clearEpoch,
          checkedAt: bundle.checkedAt,
        });
      },
      close,
    };
    return Object.freeze(store);
  };
}
