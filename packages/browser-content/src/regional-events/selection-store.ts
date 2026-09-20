import type { ProductionRegionalSelectionV1 } from '@wrn/content-contracts/production-regional-events-v1';
import { createOfflineIdbCore } from '../content-offline-store-core';

export type RegionalClient = 'mobile' | 'website';
export const emptyRegionalSelection: ProductionRegionalSelectionV1 = Object.freeze({
  continentId: null,
  countryId: null,
  regionId: null,
});
export type RegionalSelectionSnapshot = Readonly<{
  format: 'wrn.regional-selection.v1';
  key: 'choice';
  generation: number;
  selection: ProductionRegionalSelectionV1;
}>;
type Failure =
  | 'unavailable'
  | 'incompatible-storage'
  | 'timeout'
  | 'aborted'
  | 'quota-or-write-failure'
  | 'stale-operation'
  | 'invalid-selection';
export class RegionalSelectionError extends Error {
  constructor(readonly code: Failure) {
    super(`Regional selection: ${code}`);
  }
}
export interface RegionalSelectionStore {
  snapshot(signal?: AbortSignal): Promise<RegionalSelectionSnapshot>;
  save(
    selection: ProductionRegionalSelectionV1,
    expectedGeneration: number,
    signal?: AbortSignal,
  ): Promise<RegionalSelectionSnapshot>;
  clear(expectedGeneration: number, signal?: AbortSignal): Promise<RegionalSelectionSnapshot>;
  close(): void;
}
const keys = (value: unknown, expected: readonly string[]): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key));
export function isRegionalSelection(value: unknown): value is ProductionRegionalSelectionV1 {
  return (
    keys(value, ['continentId', 'countryId', 'regionId']) &&
    Object.values(value).every(
      (id) =>
        id === null ||
        (typeof id === 'string' && id.length <= 128 && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(id)),
    ) &&
    (value.continentId !== null || (value.countryId === null && value.regionId === null)) &&
    (value.countryId !== null || value.regionId === null)
  );
}
function isSnapshot(value: unknown): value is RegionalSelectionSnapshot {
  return (
    keys(value, ['format', 'key', 'generation', 'selection']) &&
    value.format === 'wrn.regional-selection.v1' &&
    value.key === 'choice' &&
    Number.isSafeInteger(value.generation) &&
    (value.generation as number) >= 0 &&
    isRegionalSelection(value.selection)
  );
}
function freeze(value: RegionalSelectionSnapshot): RegionalSelectionSnapshot {
  return Object.freeze({ ...value, selection: Object.freeze({ ...value.selection }) });
}
function same(left: RegionalSelectionSnapshot, right: RegionalSelectionSnapshot): boolean {
  return (
    left.generation === right.generation &&
    left.selection.continentId === right.selection.continentId &&
    left.selection.countryId === right.selection.countryId &&
    left.selection.regionId === right.selection.regionId
  );
}
const empty = (): RegionalSelectionSnapshot =>
  freeze({
    format: 'wrn.regional-selection.v1',
    key: 'choice',
    generation: 0,
    selection: emptyRegionalSelection,
  });
function translate(error: unknown): RegionalSelectionError {
  if (error instanceof RegionalSelectionError) return error;
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return new RegionalSelectionError('aborted');
    if (['QuotaExceededError', 'UnknownError'].includes(error.name))
      return new RegionalSelectionError('quota-or-write-failure');
    if (['InvalidStateError', 'VersionError'].includes(error.name))
      return new RegionalSelectionError('incompatible-storage');
  }
  return new RegionalSelectionError('unavailable');
}

export async function openRegionalSelectionStore(
  client: RegionalClient,
  signal?: AbortSignal,
): Promise<RegionalSelectionStore> {
  if (client !== 'mobile' && client !== 'website')
    throw new RegionalSelectionError('incompatible-storage');
  const core = createOfflineIdbCore({
    databaseName: `wrn.${client}-regional-selection.v1`,
    databaseVersion: 1,
    error: (code) => new RegionalSelectionError(code),
    upgrade(database, oldVersion) {
      if (oldVersion !== 0) throw new RegionalSelectionError('incompatible-storage');
      database.createObjectStore('selection', { keyPath: 'key' }).put(empty());
    },
    expectedSchema(database) {
      try {
        if (
          database.objectStoreNames.length !== 1 ||
          !database.objectStoreNames.contains('selection')
        )
          return false;
        const store = database.transaction('selection', 'readonly').objectStore('selection');
        return store.keyPath === 'key' && !store.autoIncrement && store.indexNames.length === 0;
      } catch {
        return false;
      }
    },
  });
  const database = await core.open(signal);
  let closed = false;
  const transactions = new Set<IDBTransaction>();
  const assertOpen = (activeSignal?: AbortSignal) => {
    if (closed) throw new RegionalSelectionError('incompatible-storage');
    if (activeSignal?.aborted) throw new RegionalSelectionError('aborted');
  };
  const close = () => {
    closed = true;
    for (const transaction of transactions) {
      try {
        transaction.abort();
      } catch {
        /* already completed */
      }
    }
    database.close();
  };
  database.onversionchange = close;
  const read = async (transaction: IDBTransaction): Promise<RegionalSelectionSnapshot> => {
    const rows: unknown[] = await core.request(
      transaction.objectStore('selection').getAll(undefined, 2),
    );
    if (rows.length !== 1 || !isSnapshot(rows[0]))
      throw new RegionalSelectionError('incompatible-storage');
    return freeze(rows[0]);
  };
  const run = async <T>(
    mode: IDBTransactionMode,
    action: (transaction: IDBTransaction) => Promise<T>,
    activeSignal?: AbortSignal,
  ): Promise<T> => {
    assertOpen(activeSignal);
    const transaction = database.transaction('selection', mode);
    transactions.add(transaction);
    const completed = core.transaction(transaction, activeSignal).then(
      () => null,
      (error: unknown) => translate(error),
    );
    try {
      const result = await action(transaction);
      const error = await completed;
      if (error) throw error;
      assertOpen(activeSignal);
      return result;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        /* already completed */
      }
      await completed;
      throw translate(error);
    } finally {
      transactions.delete(transaction);
    }
  };
  const snapshot = async (activeSignal?: AbortSignal) => {
    try {
      return await run('readonly', read, activeSignal);
    } catch (error) {
      throw translate(error);
    }
  };
  const save: RegionalSelectionStore['save'] = async (
    selection,
    expectedGeneration,
    activeSignal,
  ) => {
    try {
      if (!isRegionalSelection(selection)) throw new RegionalSelectionError('invalid-selection');
      if (
        !Number.isSafeInteger(expectedGeneration) ||
        expectedGeneration < 0 ||
        expectedGeneration >= Number.MAX_SAFE_INTEGER
      )
        throw new RegionalSelectionError('stale-operation');
      const next = freeze({
        ...empty(),
        generation: expectedGeneration + 1,
        selection: { ...selection },
      });
      await run(
        'readwrite',
        async (transaction) => {
          const current = await read(transaction);
          if (current.generation !== expectedGeneration)
            throw new RegionalSelectionError('stale-operation');
          assertOpen(activeSignal);
          await core.request(transaction.objectStore('selection').put(next));
          if (!same(await read(transaction), next))
            throw new RegionalSelectionError('quota-or-write-failure');
        },
        activeSignal,
      );
      const checked = await snapshot(activeSignal);
      if (!same(checked, next)) throw new RegionalSelectionError('stale-operation');
      return checked;
    } catch (error) {
      throw translate(error);
    }
  };
  return Object.freeze({
    snapshot,
    save,
    clear: (generation: number, activeSignal?: AbortSignal) =>
      save(emptyRegionalSelection, generation, activeSignal),
    close,
  });
}
