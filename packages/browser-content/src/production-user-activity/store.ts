import { createOfflineIdbCore } from '../content-offline-store-core';
import {
  emptyActivityState,
  freezeActivityState,
  isActivityState,
  ProductionUserActivityError,
  type ActivityState,
} from './state';

export type ActivityClient = 'mobile' | 'website';
export interface ActivityStore {
  snapshot(signal?: AbortSignal): Promise<ActivityState>;
  save(next: ActivityState, generation: number, signal?: AbortSignal): Promise<ActivityState>;
  clear(generation: number, signal?: AbortSignal): Promise<ActivityState>;
  close(): void;
}
/** One bounded row, isolated per client; existing local stores are never opened. */
export async function openProductionUserActivityStore(
  client: ActivityClient,
  signal?: AbortSignal,
): Promise<ActivityStore> {
  if (client !== 'mobile' && client !== 'website') throw new ProductionUserActivityError('invalid');
  const core = createOfflineIdbCore({
    databaseName: `wrn.${client}-production-user-activity.v1`,
    databaseVersion: 1,
    error: (code) =>
      new ProductionUserActivityError(code === 'incompatible-storage' ? 'protected' : code),
    upgrade(database, oldVersion) {
      if (oldVersion !== 0) throw new ProductionUserActivityError('protected');
      database.createObjectStore('activity').put(emptyActivityState(), 'state');
    },
    expectedSchema(database) {
      try {
        if (
          database.objectStoreNames.length !== 1 ||
          !database.objectStoreNames.contains('activity')
        )
          return false;
        const store = database.transaction('activity', 'readonly').objectStore('activity');
        return store.keyPath === null && !store.autoIncrement && store.indexNames.length === 0;
      } catch {
        return false;
      }
    },
  });
  const database = await core.open(signal);
  let closed = false;
  const transactions = new Set<IDBTransaction>();
  const close = () => {
    closed = true;
    for (const transaction of transactions)
      try {
        transaction.abort();
      } catch {
        /* Already settled. */
      }
    database.close();
  };
  database.onversionchange = close;
  const assertOpen = (current?: AbortSignal) => {
    if (closed) throw new ProductionUserActivityError('unavailable');
    if (current?.aborted || signal?.aborted) throw new ProductionUserActivityError('aborted');
  };
  if (signal?.aborted) {
    close();
    throw new ProductionUserActivityError('aborted');
  }
  signal?.addEventListener('abort', close, { once: true });
  const read = async (transaction: IDBTransaction) => {
    const store = transaction.objectStore('activity');
    const [keys, rows] = await Promise.all([
      core.request(store.getAllKeys(undefined, 2)),
      core.request(store.getAll(undefined, 2)),
    ]);
    if (keys.length !== 1 || keys[0] !== 'state' || rows.length !== 1 || !isActivityState(rows[0]))
      throw new ProductionUserActivityError('protected');
    return freezeActivityState(rows[0]);
  };
  const run = async <T>(
    mode: IDBTransactionMode,
    action: (transaction: IDBTransaction) => Promise<T>,
    current?: AbortSignal,
  ): Promise<T> => {
    assertOpen(current);
    const transaction = database.transaction('activity', mode);
    transactions.add(transaction);
    const completion = core.transaction(transaction, current).then(
      () => null,
      (error: unknown) => error,
    );
    try {
      const value = await action(transaction);
      const error = await completion;
      if (error) throw error;
      assertOpen(current);
      return value;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        /* Already settled. */
      }
      await completion;
      if (error instanceof ProductionUserActivityError) throw error;
      throw new ProductionUserActivityError('quota-or-write-failure');
    } finally {
      transactions.delete(transaction);
    }
  };
  const snapshot = (current?: AbortSignal) => run('readonly', read, current);
  const save: ActivityStore['save'] = async (input, generation, current) => {
    if (
      !isActivityState(input) ||
      !Number.isSafeInteger(generation) ||
      generation < 0 ||
      generation >= Number.MAX_SAFE_INTEGER ||
      input.generation !== generation + 1
    )
      throw new ProductionUserActivityError('invalid');
    const next = freezeActivityState(input);
    await run(
      'readwrite',
      async (transaction) => {
        const previous = await read(transaction);
        if (previous.generation !== generation) throw new ProductionUserActivityError('conflict');
        assertOpen(current);
        await core.request(transaction.objectStore('activity').put(next, 'state'));
        if (JSON.stringify(await read(transaction)) !== JSON.stringify(next))
          throw new ProductionUserActivityError('quota-or-write-failure');
      },
      current,
    );
    const after = await snapshot(current);
    if (JSON.stringify(after) !== JSON.stringify(next))
      throw new ProductionUserActivityError('conflict');
    return after;
  };
  return Object.freeze({
    snapshot,
    save,
    clear: (generation: number, current?: AbortSignal) =>
      save(emptyActivityState(generation + 1), generation, current),
    close() {
      signal?.removeEventListener('abort', close);
      close();
    },
  });
}
