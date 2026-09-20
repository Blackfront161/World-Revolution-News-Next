import { canonicalJson } from '@wrn/content-contracts';
import {
  activateHistoricalProductionMediaReleaseV1,
  compileProductionMediaProviderPolicyV1,
  isProductionMediaPointerV1,
  mergeProductionMediaSafetyV1,
  sameProductionMediaSafetyV1,
  snapshotProductionMediaSafetyV1,
  retainsHistoricalProductionMediaReleaseV1,
  validateHistoricalProductionMediaReleaseV1,
  type ProductionMediaProviderPolicyV1,
  type ProductionMediaReadyV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import {
  createEmptyProductionMediaOfflineControlV1,
  isProductionMediaOfflineBundleV1,
  isProductionMediaOfflineControlV1,
  productionMediaOfflineLimitsV1,
  productionMediaOfflineBundleKeyV1,
  productionMediaOfflineStateBytesV1,
  type ProductionMediaOfflineBundleV1,
  type ProductionMediaOfflineControlV1,
} from '@wrn/content-contracts/production-media-offline-v1';
import { createOfflineIdbCore } from './content-offline-store-core';
import {
  createProductionMediaOfflineBundle,
  type ProductionMediaOfflineBundleInput,
} from './production-media-offline-profile';

const version = 1;
const bundlesStore = 'mediaBundles';
const controlStore = 'mediaControl';
const controlKey = 'control';
export type ProductionMediaOfflineStoreFailure =
  | 'unavailable'
  | 'incompatible-storage'
  | 'timeout'
  | 'aborted'
  | 'stale-operation'
  | 'quota-or-write-failure'
  | 'invalid-bundle'
  | 'safety-conflict'
  | 'identity-conflict';
export class ProductionMediaOfflineStoreError extends Error {
  constructor(readonly code: ProductionMediaOfflineStoreFailure) {
    super(`Production media offline store: ${code}`);
  }
}
export type ProductionMediaOfflinePreparedRecheck = Readonly<{
  generation: number;
  clearEpoch: number;
}>;
export type ProductionMediaOfflineSnapshot = Readonly<{
  control: ProductionMediaOfflineControlV1;
  bundles: readonly Readonly<
    Pick<ProductionMediaOfflineBundleV1, 'key' | 'byteLength' | 'checkedAt'>
  >[];
}>;
export type ProductionMediaOfflineActiveSnapshot = Readonly<{
  ready: ProductionMediaReadyV1;
  generation: number;
  clearEpoch: number;
  checkedAt: number;
}>;
export type ProductionMediaRecheckOutcome =
  'unverified' | 'unverified-preserve-check-time' | 'safety-verified-payload-failed' | 'ready';
export interface ProductionMediaOfflineStore {
  snapshot(signal?: AbortSignal): Promise<ProductionMediaOfflineSnapshot>;
  prepareRecheck(
    operationId: string,
    expected: ProductionMediaOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  commitSafety(
    operationId: string,
    safety: ProductionMediaSafetyV1,
    checkedAt: number,
    expected: ProductionMediaOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  saveCandidate(
    input: ProductionMediaOfflineBundleInput & {
      operationId: string;
      expected: ProductionMediaOfflinePreparedRecheck;
    },
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  activateCandidate(
    key: string,
    now: number,
    allowedOrigins: ReadonlySet<string>,
    operationId: string,
    expected: ProductionMediaOfflinePreparedRecheck,
    providerPolicy?: ProductionMediaProviderPolicyV1,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  finishRecheck(
    operationId: string,
    outcome: ProductionMediaRecheckOutcome,
    checkedAt: number,
    expected: ProductionMediaOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  rollback(
    now: number,
    allowedOrigins: ReadonlySet<string>,
    expected: ProductionMediaOfflinePreparedRecheck,
    providerPolicy?: ProductionMediaProviderPolicyV1,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  clear(
    expected: ProductionMediaOfflinePreparedRecheck,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineControlV1>;
  readActive(
    now: number,
    allowedOrigins: ReadonlySet<string>,
    providerPolicy?: ProductionMediaProviderPolicyV1,
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineActiveSnapshot | null>;
  close(): void;
}
type State = Readonly<{
  control: ProductionMediaOfflineControlV1;
  bundles: readonly ProductionMediaOfflineBundleV1[];
}>;
const names = new Set([
  'wrn.mobile-production-media-offline.v1',
  'wrn.website-production-media-offline.v1',
]);
function frozen<T>(value: T): T {
  const copy = JSON.parse(canonicalJson(value)) as T;
  const visit = (item: unknown): void => {
    if (item !== null && typeof item === 'object') {
      Object.values(item).forEach(visit);
      Object.freeze(item);
    }
  };
  visit(copy);
  return copy;
}
function failure(error: unknown): ProductionMediaOfflineStoreError {
  if (error instanceof ProductionMediaOfflineStoreError) return error;
  if (error instanceof DOMException && error.name === 'AbortError')
    return new ProductionMediaOfflineStoreError('aborted');
  if (error instanceof DOMException && ['QuotaExceededError', 'UnknownError'].includes(error.name))
    return new ProductionMediaOfflineStoreError('quota-or-write-failure');
  if (error instanceof DOMException && ['VersionError', 'InvalidStateError'].includes(error.name))
    return new ProductionMediaOfflineStoreError('incompatible-storage');
  return new ProductionMediaOfflineStoreError('unavailable');
}
function schema(database: IDBDatabase): boolean {
  try {
    const tx = database.transaction([bundlesStore, controlStore], 'readonly');
    return (
      database.objectStoreNames.length === 2 &&
      database.objectStoreNames.contains(bundlesStore) &&
      database.objectStoreNames.contains(controlStore) &&
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
function checkExpected(
  control: ProductionMediaOfflineControlV1,
  expected: ProductionMediaOfflinePreparedRecheck,
): void {
  if (control.generation !== expected.generation || control.clearEpoch !== expected.clearEpoch)
    throw new ProductionMediaOfflineStoreError('stale-operation');
}
function patch(
  control: ProductionMediaOfflineControlV1,
  changed: Partial<ProductionMediaOfflineControlV1>,
): ProductionMediaOfflineControlV1 {
  const next = { ...control, ...changed };
  if (!isProductionMediaOfflineControlV1(next))
    throw new ProductionMediaOfflineStoreError('incompatible-storage');
  return frozen(next);
}
function owns(control: ProductionMediaOfflineControlV1, operationId: string): boolean {
  return (
    control.pendingRecheck?.operationId === operationId &&
    control.pendingRecheck.generation === control.generation &&
    control.pendingRecheck.clearEpoch === control.clearEpoch
  );
}

function expectedSnapshot(
  value: ProductionMediaOfflinePreparedRecheck,
): ProductionMediaOfflinePreparedRecheck {
  const generation = value.generation;
  const clearEpoch = value.clearEpoch;
  if (
    !Number.isSafeInteger(generation) ||
    generation < 0 ||
    !Number.isSafeInteger(clearEpoch) ||
    clearEpoch < 0
  )
    throw new ProductionMediaOfflineStoreError('stale-operation');
  return Object.freeze({ generation, clearEpoch });
}

const stateText = (state: State): string =>
  canonicalJson({
    control: state.control,
    bundles: [...state.bundles].sort((left, right) => left.key.localeCompare(right.key)),
  });

function pointerIdentity(bundle: ProductionMediaOfflineBundleV1): {
  releaseRevision: string;
  sequence: number;
  descriptorSha256: string;
  key: string;
} | null {
  try {
    const pointer: unknown = JSON.parse(bundle.pointerRaw);
    return isProductionMediaPointerV1(pointer)
      ? {
          releaseRevision: pointer.releaseRevision,
          sequence: pointer.sequence,
          descriptorSha256: pointer.descriptorSha256,
          key: bundle.key,
        }
      : null;
  } catch {
    return null;
  }
}

export function createProductionMediaOfflineStoreFactory(databaseName: string) {
  if (!names.has(databaseName)) throw new ProductionMediaOfflineStoreError('incompatible-storage');
  const core = createOfflineIdbCore({
    databaseName,
    databaseVersion: version,
    error: (code) => new ProductionMediaOfflineStoreError(code),
    upgrade: (database, oldVersion) => {
      if (oldVersion !== 0) throw new ProductionMediaOfflineStoreError('incompatible-storage');
      database.createObjectStore(bundlesStore, { keyPath: 'key' });
      database
        .createObjectStore(controlStore)
        .put(createEmptyProductionMediaOfflineControlV1(), controlKey);
    },
    expectedSchema: schema,
  });
  return async function openProductionMediaOfflineStore(
    signal?: AbortSignal,
  ): Promise<ProductionMediaOfflineStore> {
    const database = await core.open(signal);
    let closed = false;
    const transactions = new Set<IDBTransaction>();
    const assertOpen = (activeSignal?: AbortSignal) => {
      if (closed) throw new ProductionMediaOfflineStoreError('incompatible-storage');
      if (activeSignal?.aborted) throw new ProductionMediaOfflineStoreError('aborted');
    };
    const abortTransactions = () => {
      for (const transaction of transactions) {
        try {
          transaction.abort();
        } catch {
          // A transaction that completed first is already harmless.
        }
      }
      transactions.clear();
    };
    const observe = (transaction: IDBTransaction, activeSignal?: AbortSignal): Promise<void> => {
      transactions.add(transaction);
      const completion = core.transaction(transaction, activeSignal);
      void completion.then(
        () => transactions.delete(transaction),
        () => transactions.delete(transaction),
      );
      return completion;
    };
    database.onversionchange = () => {
      closed = true;
      abortTransactions();
      database.close();
    };
    const readRawState = async (tx: IDBTransaction): Promise<State> => {
      const [controlValue, bundleValues, controlCount] = await Promise.all([
        core.request(tx.objectStore(controlStore).get(controlKey)),
        core.request(
          tx
            .objectStore(bundlesStore)
            .getAll(undefined, productionMediaOfflineLimitsV1.bundles + 1),
        ),
        core.request(tx.objectStore(controlStore).count()),
      ]);
      if (controlValue === undefined || controlCount !== 1)
        throw new ProductionMediaOfflineStoreError('incompatible-storage');
      const control = controlValue;
      if (
        !isProductionMediaOfflineControlV1(control) ||
        !bundleValues.every(isProductionMediaOfflineBundleV1)
      )
        throw new ProductionMediaOfflineStoreError('incompatible-storage');
      const bundles = bundleValues as ProductionMediaOfflineBundleV1[];
      if (
        bundles.length > productionMediaOfflineLimitsV1.bundles ||
        productionMediaOfflineStateBytesV1(control, bundles) === null
      )
        throw new ProductionMediaOfflineStoreError('incompatible-storage');
      const keys = new Set(bundles.map((bundle) => bundle.key));
      const slots = [control.activeKey, control.previousKey, control.candidateKey].filter(
        (key): key is string => key !== null,
      );
      if (
        slots.some((key) => !keys.has(key)) ||
        bundles.some((bundle) => !slots.includes(bundle.key))
      )
        throw new ProductionMediaOfflineStoreError('incompatible-storage');
      return { control, bundles };
    };
    const validateHistoricalState = async (state: State): Promise<State> => {
      for (const bundle of state.bundles) {
        const identity = pointerIdentity(bundle);
        if (!identity) throw new ProductionMediaOfflineStoreError('incompatible-storage');
        const expectedKey = await productionMediaOfflineBundleKeyV1({
          releaseRevision: identity.releaseRevision,
          sequence: identity.sequence,
          descriptorSha256: identity.descriptorSha256,
        });
        if (
          expectedKey !== bundle.key ||
          !state.control.acceptedIdentities.some(
            (entry) => canonicalJson(entry) === canonicalJson(identity),
          ) ||
          !(await validateHistoricalProductionMediaReleaseV1(bundle, bundle.admittedSafety))
        )
          throw new ProductionMediaOfflineStoreError('incompatible-storage');
      }
      return frozen(state);
    };
    const load = async (activeSignal?: AbortSignal): Promise<State> => {
      assertOpen(activeSignal);
      const tx = database.transaction([bundlesStore, controlStore], 'readonly');
      const completion = observe(tx, activeSignal);
      try {
        const state = await readRawState(tx);
        await completion;
        assertOpen(activeSignal);
        return await validateHistoricalState(state);
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // The readonly transaction may already have completed.
        }
        throw failure(error);
      }
    };
    const write = async <T>(
      prepared: State,
      expected: ProductionMediaOfflinePreparedRecheck,
      apply: (state: State) => {
        control: ProductionMediaOfflineControlV1;
        bundles: readonly ProductionMediaOfflineBundleV1[];
        value: T;
      },
      activeSignal?: AbortSignal,
    ): Promise<T> => {
      assertOpen(activeSignal);
      const tx = database.transaction([bundlesStore, controlStore], 'readwrite');
      const completion = observe(tx, activeSignal);
      try {
        const state = await readRawState(tx);
        checkExpected(state.control, expected);
        if (stateText(state) !== stateText(prepared))
          throw new ProductionMediaOfflineStoreError('stale-operation');
        const next = apply(state);
        if (productionMediaOfflineStateBytesV1(next.control, next.bundles) === null)
          throw new ProductionMediaOfflineStoreError('quota-or-write-failure');
        const controls = tx.objectStore(controlStore),
          bundles = tx.objectStore(bundlesStore);
        await core.request(controls.clear());
        await core.request(bundles.clear());
        await core.request(controls.put(next.control, controlKey));
        for (const bundle of next.bundles) await core.request(bundles.put(bundle));
        await completion;
        assertOpen(activeSignal);
        const readback = await load(activeSignal);
        if (stateText(readback) !== stateText(next))
          throw new ProductionMediaOfflineStoreError('stale-operation');
        return next.value;
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // Transaction can already be complete after a failed request.
        }
        throw failure(error);
      }
    };
    const bundleFor = (state: State, key: string | null) =>
      state.bundles.find((bundle) => bundle.key === key) ?? null;
    const active = async (
      bundle: ProductionMediaOfflineBundleV1,
      safety: ProductionMediaSafetyV1,
      now: number,
      origins: ReadonlySet<string>,
      providerPolicy: ProductionMediaProviderPolicyV1,
    ) => {
      const proof = await validateHistoricalProductionMediaReleaseV1(bundle, bundle.admittedSafety);
      return proof
        ? activateHistoricalProductionMediaReleaseV1(proof, safety, now, origins, providerPolicy)
        : null;
    };
    const safetyStillAllows = async (
      bundle: ProductionMediaOfflineBundleV1,
      safety: ProductionMediaSafetyV1,
    ): Promise<boolean> => {
      try {
        const proof = await validateHistoricalProductionMediaReleaseV1(
          bundle,
          bundle.admittedSafety,
        );
        return proof ? retainsHistoricalProductionMediaReleaseV1(proof, safety) : false;
      } catch {
        return false;
      }
    };
    return {
      async snapshot(activeSignal) {
        const state = await load(activeSignal);
        return frozen({
          control: state.control,
          bundles: state.bundles.map(({ key, byteLength, checkedAt }) =>
            frozen({ key, byteLength, checkedAt }),
          ),
        });
      },
      async prepareRecheck(operationId, expected, activeSignal) {
        const operationIdSnapshot = operationId;
        const expectedState = expectedSnapshot(expected);
        if (!/^[!-~]{1,128}$/.test(operationIdSnapshot))
          throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const before = await load(activeSignal);
        return write(
          before,
          expectedState,
          (state) => {
            const generation = state.control.generation + 1;
            const control = patch(state.control, {
              generation,
              pendingRecheck: {
                operationId: operationIdSnapshot,
                generation,
                clearEpoch: state.control.clearEpoch,
              },
            });
            return { control, bundles: state.bundles, value: control };
          },
          activeSignal,
        );
      },
      async commitSafety(operationId, incoming, checkedAt, expected, activeSignal) {
        const operationIdSnapshot = operationId;
        const checkedAtSnapshot = checkedAt;
        const expectedState = expectedSnapshot(expected);
        const incomingSnapshot = snapshotProductionMediaSafetyV1(incoming);
        if (!incomingSnapshot || !Number.isSafeInteger(checkedAtSnapshot) || checkedAtSnapshot < 0)
          throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const before = await load(activeSignal);
        checkExpected(before.control, expectedState);
        if (!owns(before.control, operationIdSnapshot))
          throw new ProductionMediaOfflineStoreError('stale-operation');
        const safety = mergeProductionMediaSafetyV1(before.control.safety, incomingSnapshot);
        if (!safety) throw new ProductionMediaOfflineStoreError('safety-conflict');
        const retained = new Set<string>();
        for (const bundle of before.bundles)
          if (await safetyStillAllows(bundle, safety)) retained.add(bundle.key);
        const committed = await write(
          before,
          expectedState,
          (state) => {
            if (!owns(state.control, operationIdSnapshot))
              throw new ProductionMediaOfflineStoreError('stale-operation');
            const merged = mergeProductionMediaSafetyV1(state.control.safety, incomingSnapshot);
            if (!merged || !sameProductionMediaSafetyV1(merged, safety))
              throw new ProductionMediaOfflineStoreError('safety-conflict');
            const bundles = state.bundles.filter((bundle) => retained.has(bundle.key));
            const retainedSlot = (key: string | null) =>
              key !== null && retained.has(key) ? key : null;
            const control = patch(state.control, {
              generation: state.control.generation + 1,
              pendingRecheck: {
                operationId: operationIdSnapshot,
                generation: state.control.generation + 1,
                clearEpoch: state.control.clearEpoch,
              },
              safety: merged,
              lastObservedAt: checkedAtSnapshot,
              activeKey: retainedSlot(state.control.activeKey),
              previousKey: retainedSlot(state.control.previousKey),
              candidateKey: retainedSlot(state.control.candidateKey),
            });
            return { control, bundles, value: control };
          },
          activeSignal,
        );
        return committed;
      },
      async saveCandidate(input, activeSignal) {
        const detached = {
          pointerRaw: input.pointerRaw,
          descriptorRaw: input.descriptorRaw,
          documentsRaw: Object.freeze({ ...input.documentsRaw }),
          admittedSafety: snapshotProductionMediaSafetyV1(input.admittedSafety),
          checkedAt: input.checkedAt,
          operationId: input.operationId,
          expected: expectedSnapshot(input.expected),
        };
        if (!detached.admittedSafety) throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const before = await load(activeSignal);
        checkExpected(before.control, detached.expected);
        const bundle = await createProductionMediaOfflineBundle({
          pointerRaw: detached.pointerRaw,
          descriptorRaw: detached.descriptorRaw,
          documentsRaw: detached.documentsRaw,
          admittedSafety: detached.admittedSafety,
          checkedAt: detached.checkedAt,
        });
        if (!bundle) throw new ProductionMediaOfflineStoreError('invalid-bundle');
        return write(
          before,
          detached.expected,
          (state) => {
            if (
              !owns(state.control, detached.operationId) ||
              !sameProductionMediaSafetyV1(detached.admittedSafety, state.control.safety)
            )
              throw new ProductionMediaOfflineStoreError('safety-conflict');
            let pointer: { releaseRevision: string; sequence: number; descriptorSha256: string };
            try {
              pointer = JSON.parse(bundle.pointerRaw);
            } catch {
              throw new ProductionMediaOfflineStoreError('invalid-bundle');
            }
            const identity = {
              releaseRevision: pointer.releaseRevision,
              sequence: pointer.sequence,
              descriptorSha256: pointer.descriptorSha256,
              key: bundle.key,
            };
            const collisions = state.control.acceptedIdentities.filter(
              (entry) =>
                entry.key === identity.key ||
                entry.releaseRevision === identity.releaseRevision ||
                entry.sequence === identity.sequence ||
                entry.descriptorSha256 === identity.descriptorSha256,
            );
            const prior = collisions.find(
              (entry) => canonicalJson(entry) === canonicalJson(identity),
            );
            const existing = state.bundles.find((item) => item.key === bundle.key);
            if (
              collisions.some((entry) => canonicalJson(entry) !== canonicalJson(identity)) ||
              (prior !== undefined &&
                existing !== undefined &&
                bundle.checkedAt < existing.checkedAt) ||
              (prior !== undefined &&
                existing === undefined &&
                pointer.sequence !== state.control.highestAcceptedSequence) ||
              (prior === undefined && pointer.sequence <= state.control.highestAcceptedSequence)
            )
              throw new ProductionMediaOfflineStoreError('identity-conflict');
            if (
              prior === undefined &&
              state.control.acceptedIdentities.length >= productionMediaOfflineLimitsV1.identities
            )
              throw new ProductionMediaOfflineStoreError('quota-or-write-failure');
            const identities = prior
              ? state.control.acceptedIdentities
              : [...state.control.acceptedIdentities, identity];
            if (existing !== undefined) {
              const control = patch(state.control, {
                generation: state.control.generation + 1,
                pendingRecheck: {
                  operationId: detached.operationId,
                  generation: state.control.generation + 1,
                  clearEpoch: state.control.clearEpoch,
                },
              });
              return {
                control,
                bundles: state.bundles.map((item) => (item.key === bundle.key ? bundle : item)),
                value: control,
              };
            }
            const others = state.bundles.filter(
              (item) => item.key !== state.control.candidateKey && item.key !== bundle.key,
            );
            const control = patch(state.control, {
              generation: state.control.generation + 1,
              pendingRecheck: {
                operationId: detached.operationId,
                generation: state.control.generation + 1,
                clearEpoch: state.control.clearEpoch,
              },
              candidateKey: bundle.key,
              highestAcceptedSequence: identities.at(-1)?.sequence ?? 0,
              acceptedIdentities: identities,
            });
            return { control, bundles: [...others, bundle], value: control };
          },
          activeSignal,
        );
      },
      async activateCandidate(
        key,
        now,
        origins,
        operationId,
        expected,
        providerPolicy,
        activeSignal,
      ) {
        const keySnapshot = key;
        const nowSnapshot = now;
        const originsSnapshot = new Set(origins);
        const policySnapshot = compileProductionMediaProviderPolicyV1(
          providerPolicy,
          originsSnapshot,
        );
        const operationIdSnapshot = operationId;
        const expectedState = expectedSnapshot(expected);
        if (!policySnapshot) throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const state = await load(activeSignal);
        checkExpected(state.control, expectedState);
        const bundle = bundleFor(state, keySnapshot);
        if (
          !bundle ||
          !owns(state.control, operationIdSnapshot) ||
          ![
            state.control.activeKey,
            state.control.previousKey,
            state.control.candidateKey,
          ].includes(keySnapshot)
        )
          throw new ProductionMediaOfflineStoreError('stale-operation');
        if (
          !(await active(
            bundle,
            state.control.safety,
            nowSnapshot,
            originsSnapshot,
            policySnapshot,
          ))
        )
          throw new ProductionMediaOfflineStoreError('invalid-bundle');
        return write(
          state,
          expectedState,
          (current) => {
            if (
              !owns(current.control, operationIdSnapshot) ||
              ![
                current.control.activeKey,
                current.control.previousKey,
                current.control.candidateKey,
              ].includes(keySnapshot)
            )
              throw new ProductionMediaOfflineStoreError('stale-operation');
            const prior = current.control.activeKey;
            const isActiveRefresh = current.control.activeKey === keySnapshot;
            const nextPrevious = isActiveRefresh ? current.control.previousKey : prior;
            const bundles = current.bundles.filter(
              (item) => item.key === keySnapshot || item.key === nextPrevious,
            );
            const control = patch(current.control, {
              generation: current.control.generation + 1,
              pendingRecheck: {
                operationId: operationIdSnapshot,
                generation: current.control.generation + 1,
                clearEpoch: current.control.clearEpoch,
              },
              activeKey: keySnapshot,
              previousKey: nextPrevious,
              candidateKey: null,
            });
            return { control, bundles, value: control };
          },
          activeSignal,
        );
      },
      async finishRecheck(operationId, outcome, checkedAt, expected, activeSignal) {
        const operationIdSnapshot = operationId;
        const outcomeSnapshot = outcome;
        const checkedAtSnapshot = checkedAt;
        const expectedState = expectedSnapshot(expected);
        if (!Number.isSafeInteger(checkedAtSnapshot) || checkedAtSnapshot < 0)
          throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const before = await load(activeSignal);
        return write(
          before,
          expectedState,
          (state) => {
            if (!owns(state.control, operationIdSnapshot))
              throw new ProductionMediaOfflineStoreError('stale-operation');
            const control = patch(state.control, {
              generation: state.control.generation + 1,
              pendingRecheck: null,
              lastObservedAt: checkedAtSnapshot,
              lastSuccessfulSourceCheckAt:
                outcomeSnapshot === 'ready'
                  ? checkedAtSnapshot
                  : state.control.lastSuccessfulSourceCheckAt,
            });
            return { control, bundles: state.bundles, value: control };
          },
          activeSignal,
        );
      },
      async rollback(now, origins, expected, providerPolicy, activeSignal) {
        const nowSnapshot = now;
        const originsSnapshot = new Set(origins);
        const policySnapshot = compileProductionMediaProviderPolicyV1(
          providerPolicy,
          originsSnapshot,
        );
        const expectedState = expectedSnapshot(expected);
        if (!policySnapshot) throw new ProductionMediaOfflineStoreError('invalid-bundle');
        const state = await load(activeSignal);
        checkExpected(state.control, expectedState);
        const previous = bundleFor(state, state.control.previousKey);
        if (
          state.control.pendingRecheck ||
          !previous ||
          !(await active(
            previous,
            state.control.safety,
            nowSnapshot,
            originsSnapshot,
            policySnapshot,
          ))
        )
          throw new ProductionMediaOfflineStoreError('invalid-bundle');
        return write(
          state,
          expectedState,
          (current) => {
            if (current.control.pendingRecheck || current.control.previousKey !== previous.key)
              throw new ProductionMediaOfflineStoreError('stale-operation');
            const control = patch(current.control, {
              generation: current.control.generation + 1,
              activeKey: previous.key,
              previousKey: current.control.activeKey,
            });
            return { control, bundles: current.bundles, value: control };
          },
          activeSignal,
        );
      },
      async clear(expected, activeSignal) {
        const expectedState = expectedSnapshot(expected);
        const before = await load(activeSignal);
        return write(
          before,
          expectedState,
          (state) => {
            const control = patch(state.control, {
              generation: state.control.generation + 1,
              clearEpoch: state.control.clearEpoch + 1,
              activeKey: null,
              previousKey: null,
              candidateKey: null,
              pendingRecheck: null,
              lastSuccessfulSourceCheckAt: null,
              lastObservedAt: null,
            });
            return { control, bundles: [], value: control };
          },
          activeSignal,
        );
      },
      async readActive(now, origins, providerPolicy, activeSignal) {
        const nowSnapshot = now;
        const originsSnapshot = new Set(origins);
        const policySnapshot = compileProductionMediaProviderPolicyV1(
          providerPolicy,
          originsSnapshot,
        );
        if (!policySnapshot) return null;
        const before = await load(activeSignal);
        const bundle = bundleFor(before, before.control.activeKey);
        if (!bundle) return null;
        const ready = await active(
          bundle,
          before.control.safety,
          nowSnapshot,
          originsSnapshot,
          policySnapshot,
        );
        if (!ready) return null;
        const after = await load(activeSignal);
        if (
          after.control.generation !== before.control.generation ||
          after.control.clearEpoch !== before.control.clearEpoch ||
          !sameProductionMediaSafetyV1(after.control.safety, before.control.safety) ||
          after.control.activeKey !== bundle.key
        )
          return null;
        return Object.freeze({
          ready,
          generation: before.control.generation,
          clearEpoch: before.control.clearEpoch,
          checkedAt: bundle.checkedAt,
        });
      },
      close() {
        if (!closed) {
          closed = true;
          abortTransactions();
          database.close();
        }
      },
    };
  };
}
