import { canonicalJson } from '@wrn/content-contracts';
import { createOfflineIdbCore } from './content-offline-store-core';

export const productionMediaResumeDatabaseNames = Object.freeze([
  'wrn.mobile-production-media-resume.v1',
  'wrn.website-production-media-resume.v1',
] as const);
export const productionMediaResumeStoreName = 'mediaResume';
const maxRecords = 64,
  maxRecordBytes = 4096,
  maxTotalBytes = 65536;
type DatabaseName = (typeof productionMediaResumeDatabaseNames)[number];
export type ProductionMediaResumeRecord = Readonly<{
  recordVersion: 1;
  key: string;
  episodeId: string;
  streamId: string;
  releaseRevision: string;
  streamRevision: string;
  positionMs: number;
  durationMs: number;
}>;
type Control = Readonly<{ recordVersion: 1; key: 'control'; generation: number }>;
export type ProductionMediaResumeState = Readonly<{
  generation: number;
  records: readonly ProductionMediaResumeRecord[];
}>;
export type ProductionMediaResumeMutation = Readonly<{
  kind: 'saved' | 'deleted' | 'no-op';
  state: ProductionMediaResumeState;
}>;
export class ProductionMediaResumeStoreError extends Error {
  constructor(
    readonly code:
      'unavailable' | 'protected' | 'conflict' | 'storage-failure' | 'aborted' | 'timeout',
  ) {
    super(code);
  }
}
export type ProductionMediaResumeStore = Readonly<{
  snapshot(signal?: AbortSignal): Promise<ProductionMediaResumeState>;
  save(
    record: ProductionMediaResumeRecord,
    expectedGeneration: number,
    signal?: AbortSignal,
  ): Promise<ProductionMediaResumeMutation>;
  deleteIfExact(
    key: string,
    expected: ProductionMediaResumeRecord,
    expectedGeneration: number,
    signal?: AbortSignal,
  ): Promise<ProductionMediaResumeMutation>;
  clearExact(
    expected: readonly ProductionMediaResumeRecord[],
    expectedGeneration: number,
    signal?: AbortSignal,
  ): Promise<ProductionMediaResumeMutation>;
  close(): void;
}>;
const recordKeys = [
  'recordVersion',
  'key',
  'episodeId',
  'streamId',
  'releaseRevision',
  'streamRevision',
  'positionMs',
  'durationMs',
];
const controlKeys = ['recordVersion', 'key', 'generation'];
const exact = (v: unknown, keys: readonly string[]): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.keys(v).length === keys.length &&
  keys.every((key) => Object.hasOwn(v, key));
const opaque = (v: unknown) => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(v);
const integer = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v);
const bytes = (v: unknown) => new TextEncoder().encode(canonicalJson(v)).byteLength;
const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
const clone = <T>(v: T): T => JSON.parse(canonicalJson(v)) as T;
const freeze = <T>(v: T): T => {
  if (v && typeof v === 'object') {
    for (const child of Object.values(v as Record<string, unknown>)) freeze(child);
    Object.freeze(v);
  }
  return v;
};
export const isProductionMediaResumeRecord = (v: unknown): v is ProductionMediaResumeRecord =>
  exact(v, recordKeys) &&
  v.recordVersion === 1 &&
  typeof v.key === 'string' &&
  v.key === `episode:${v.episodeId}` &&
  opaque(v.episodeId) &&
  opaque(v.streamId) &&
  opaque(v.releaseRevision) &&
  typeof v.streamRevision === 'string' &&
  /^[a-f0-9]{64}$/.test(v.streamRevision) &&
  integer(v.positionMs) &&
  integer(v.durationMs) &&
  (v.positionMs as number) >= 0 &&
  (v.durationMs as number) >= 1000 &&
  (v.durationMs as number) <= 14_400_000 &&
  (v.positionMs as number) < (v.durationMs as number) &&
  bytes(v) <= maxRecordBytes;
function recordSnapshot(value: unknown): ProductionMediaResumeRecord {
  try {
    if (!isProductionMediaResumeRecord(value)) throw new Error();
    const detached = freeze(clone(value));
    if (!isProductionMediaResumeRecord(detached)) throw new Error();
    return detached;
  } catch {
    throw new ProductionMediaResumeStoreError('protected');
  }
}
function recordsSnapshot(value: unknown): readonly ProductionMediaResumeRecord[] {
  try {
    if (!Array.isArray(value) || value.length > maxRecords) throw new Error();
    return freeze([...value].map(recordSnapshot));
  } catch {
    throw new ProductionMediaResumeStoreError('protected');
  }
}
const isControl = (v: unknown): v is Control =>
  exact(v, controlKeys) &&
  v.recordVersion === 1 &&
  v.key === 'control' &&
  integer(v.generation) &&
  (v.generation as number) >= 0;
const state = (generation: number, records: readonly ProductionMediaResumeRecord[]) =>
  freeze({ generation, records: [...records].sort((a, b) => a.key.localeCompare(b.key)) });
export function createProductionMediaResumeStoreFactory(name: DatabaseName) {
  if (!(productionMediaResumeDatabaseNames as readonly string[]).includes(name))
    throw new ProductionMediaResumeStoreError('protected');
  const core = createOfflineIdbCore({
    databaseName: name,
    databaseVersion: 1,
    error: (code) =>
      new ProductionMediaResumeStoreError(
        code === 'incompatible-storage'
          ? 'protected'
          : code === 'quota-or-write-failure'
            ? 'storage-failure'
            : code,
      ),
    upgrade: (db, old) => {
      if (old !== 0) throw new ProductionMediaResumeStoreError('protected');
      const store = db.createObjectStore(productionMediaResumeStoreName, {
        keyPath: 'key',
        autoIncrement: false,
      });
      store.put({ recordVersion: 1, key: 'control', generation: 0 } satisfies Control);
    },
    expectedSchema: (db) => {
      try {
        const tx = db.transaction(productionMediaResumeStoreName, 'readonly');
        const store = tx.objectStore(productionMediaResumeStoreName);
        return (
          db.version === 1 &&
          db.objectStoreNames.length === 1 &&
          db.objectStoreNames.item(0) === productionMediaResumeStoreName &&
          store.keyPath === 'key' &&
          !store.autoIncrement &&
          store.indexNames.length === 0
        );
      } catch {
        return false;
      }
    },
  });
  return async (signal?: AbortSignal): Promise<ProductionMediaResumeStore> => {
    const db = await core.open(signal);
    let closed = false;
    const transactions = new Set<IDBTransaction>();
    const close = () => {
      if (closed) return;
      closed = true;
      for (const transaction of transactions) {
        try {
          transaction.abort();
        } catch {
          // transaction may already be settled
        }
      }
      db.close();
    };
    db.onversionchange = close;
    const fail = (code: ProductionMediaResumeStoreError['code']): never => {
      throw new ProductionMediaResumeStoreError(code);
    };
    const read = async (tx: IDBTransaction) => {
      // One control, at most 64 records, and one witness are sufficient to
      // reject a corrupted oversized store without allocating all of it.
      const values = (await core.request(
        tx.objectStore(productionMediaResumeStoreName).getAll(undefined, maxRecords + 2),
      )) as unknown[];
      const controls = values.filter(isControl),
        records = values.filter(isProductionMediaResumeRecord);
      if (
        controls.length !== 1 ||
        controls.length + records.length !== values.length ||
        records.length > maxRecords ||
        new Set(records.map((r) => r.key)).size !== records.length ||
        records.reduce((sum, r) => sum + bytes(r), 0) > maxTotalBytes
      )
        fail('protected');
      return state(controls[0]!.generation, records);
    };
    const transact = async (mode: IDBTransactionMode, signal?: AbortSignal) => {
      if (closed) fail('protected');
      if (signal?.aborted) fail('aborted');
      const tx = db.transaction(productionMediaResumeStoreName, mode);
      transactions.add(tx);
      const done = core.transaction(tx, signal).finally(() => transactions.delete(tx));
      void done.catch(() => undefined);
      return { tx, done };
    };
    const snapshot = async (signal?: AbortSignal) => {
      const { tx, done } = await transact('readonly', signal);
      try {
        const value = await read(tx);
        await done;
        return value;
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // transaction may already be settled
        }
        if (error instanceof ProductionMediaResumeStoreError) throw error;
        if (signal?.aborted) throw new ProductionMediaResumeStoreError('aborted');
        throw new ProductionMediaResumeStoreError('storage-failure');
      }
    };
    const mutate = async (
      expectedGeneration: number,
      planned: (before: ProductionMediaResumeState) => {
        kind: ProductionMediaResumeMutation['kind'];
        records: readonly ProductionMediaResumeRecord[];
      },
      signal?: AbortSignal,
    ) => {
      if (!integer(expectedGeneration) || expectedGeneration < 0) fail('protected');
      const before = await snapshot(signal);
      if (before.generation !== expectedGeneration)
        return freeze({ kind: 'no-op' as const, state: before });
      const plan = planned(before);
      if (
        plan.records.length > maxRecords ||
        plan.records.reduce((sum, r) => sum + bytes(r), 0) > maxTotalBytes
      )
        fail('protected');
      if (plan.kind === 'no-op') return freeze({ kind: 'no-op' as const, state: before });
      const { tx, done } = await transact('readwrite', signal);
      try {
        const current = await read(tx);
        if (current.generation !== before.generation || !same(current.records, before.records))
          fail('conflict');
        const store = tx.objectStore(productionMediaResumeStoreName);
        const next = state(before.generation + 1, plan.records);
        for (const old of current.records)
          if (!next.records.some((r) => r.key === old.key))
            await core.request(store.delete(old.key));
        for (const value of next.records) await core.request(store.put(clone(value)));
        await core.request(
          store.put({
            recordVersion: 1,
            key: 'control',
            generation: next.generation,
          } satisfies Control),
        );
        const checked = await read(tx);
        if (!same(checked, next)) fail('storage-failure');
        await done;
        return freeze({ kind: plan.kind, state: checked });
      } catch (error) {
        try {
          tx.abort();
        } catch {
          // transaction may already be settled
        }
        if (error instanceof ProductionMediaResumeStoreError) throw error;
        if (signal?.aborted) throw new ProductionMediaResumeStoreError('aborted');
        throw new ProductionMediaResumeStoreError('storage-failure');
      }
    };
    return freeze({
      snapshot,
      save: async (record, generation, signal) => {
        const value = recordSnapshot(record);
        return mutate(
          generation,
          (before) => {
            const current = before.records.find((r) => r.key === value.key);
            return current && same(current, value)
              ? { kind: 'no-op', records: before.records }
              : {
                  kind: 'saved',
                  records: current
                    ? before.records.map((r) => (r.key === value.key ? value : r))
                    : [...before.records, value],
                };
          },
          signal,
        );
      },
      deleteIfExact: async (key, expected, generation, signal) => {
        const value = recordSnapshot(expected);
        if (key !== value.key) fail('protected');
        return mutate(
          generation,
          (before) => {
            const current = before.records.find((r) => r.key === key);
            return !current || !same(current, value)
              ? { kind: 'no-op', records: before.records }
              : { kind: 'deleted', records: before.records.filter((r) => r.key !== key) };
          },
          signal,
        );
      },
      clearExact: async (expected, generation, signal) => {
        const values = recordsSnapshot(expected);
        return mutate(
          generation,
          (before) => {
            if (
              !values.every((value) => {
                const current = before.records.find((r) => r.key === value.key);
                return current !== undefined && same(current, value);
              })
            )
              return { kind: 'no-op', records: before.records };
            const keys = new Set(values.map((v) => v.key));
            const records = before.records.filter((r) => !keys.has(r.key));
            return {
              kind: records.length === before.records.length ? 'no-op' : 'deleted',
              records,
            };
          },
          signal,
        );
      },
      close,
    });
  };
}
