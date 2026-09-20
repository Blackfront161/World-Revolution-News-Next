import { utf8ByteLength } from '@wrn/content-contracts';

export const mobileRegionalEventsSelectionDatabaseName = 'wrn-mobile-regional-events-selection-v1';
export const mobileRegionalEventsSelectionKey = 'wrn.mobile-regional-events-selection.v1';
export const mobileRegionalEventsSelectionSchema = 'wrn.mobile-regional-events-selection' as const;
export interface RegionalEventsSelectionRecord {
  readonly storeSchema: 1;
  readonly key: typeof mobileRegionalEventsSelectionKey;
  readonly generation: number;
  readonly contractVersion: 1;
  readonly schema: typeof mobileRegionalEventsSelectionSchema;
  readonly revision: typeof mobileRegionalEventsSelectionKey;
  readonly regionId: string;
}
export type RegionalEventsSelectionRead =
  | Readonly<{ kind: 'inactive'; generation: 0 }>
  | Readonly<{ kind: 'ready'; record: RegionalEventsSelectionRecord }>
  | Readonly<{ kind: 'protected' }>;
export class RegionalEventsSelectionError extends Error {
  constructor(readonly code: 'conflict' | 'protected' | 'storage-failure' | 'invalid-region') {
    super(code);
  }
}
const exact = (v: unknown, keys: readonly string[]) =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.keys(v).length === keys.length &&
  keys.every((key, i) => Object.keys(v)[i] === key);
const selectionRecordByteCap = 4096;
function validRecord(value: unknown): value is RegionalEventsSelectionRecord {
  return (
    exact(value, [
      'storeSchema',
      'key',
      'generation',
      'contractVersion',
      'schema',
      'revision',
      'regionId',
    ]) &&
    (value as RegionalEventsSelectionRecord).storeSchema === 1 &&
    (value as RegionalEventsSelectionRecord).key === mobileRegionalEventsSelectionKey &&
    Number.isSafeInteger((value as RegionalEventsSelectionRecord).generation) &&
    (value as RegionalEventsSelectionRecord).generation >= 1 &&
    (value as RegionalEventsSelectionRecord).contractVersion === 1 &&
    (value as RegionalEventsSelectionRecord).schema === mobileRegionalEventsSelectionSchema &&
    (value as RegionalEventsSelectionRecord).revision === mobileRegionalEventsSelectionKey &&
    typeof (value as RegionalEventsSelectionRecord).regionId === 'string' &&
    utf8ByteLength(JSON.stringify(value)) <= selectionRecordByteCap
  );
}
function request<T>(r: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function complete(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new DOMException('AbortError'));
  });
}
export async function openMobileRegionalEventsSelection(): Promise<{
  read(): Promise<RegionalEventsSelectionRead>;
  save(
    regionId: string,
    expectedGeneration: number,
    validRegions: ReadonlySet<string>,
  ): Promise<RegionalEventsSelectionRecord>;
  clear(expectedGeneration: number): Promise<void>;
  close(): void;
}> {
  const open = indexedDB.open(mobileRegionalEventsSelectionDatabaseName);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    open.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) {
        open.result.createObjectStore('selection', { keyPath: 'key' });
      } else {
        open.transaction?.abort();
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(new RegionalEventsSelectionError('storage-failure'));
  });
  db.onversionchange = () => db.close();
  if (
    db.version > 1 ||
    JSON.stringify(Array.from(db.objectStoreNames)) !== JSON.stringify(['selection'])
  ) {
    db.close();
    throw new RegionalEventsSelectionError('protected');
  }
  const read = async (): Promise<RegionalEventsSelectionRead> => {
    try {
      const tx = db.transaction('selection', 'readonly');
      const records = (await request(tx.objectStore('selection').getAll())) as unknown[];
      await complete(tx);
      if (records.length === 0) return Object.freeze({ kind: 'inactive', generation: 0 });
      if (records.length !== 1) return Object.freeze({ kind: 'protected' });
      return validRecord(records[0])
        ? Object.freeze({ kind: 'ready', record: records[0] })
        : Object.freeze({ kind: 'protected' });
    } catch {
      return Object.freeze({ kind: 'protected' });
    }
  };
  const save = async (
    regionId: string,
    expectedGeneration: number,
    validRegions: ReadonlySet<string>,
  ) => {
    if (!validRegions.has(regionId)) throw new RegionalEventsSelectionError('invalid-region');
    const tx = db.transaction('selection', 'readwrite');
    try {
      const store = tx.objectStore('selection');
      const before = await request(store.get(mobileRegionalEventsSelectionKey));
      if (before !== undefined && !validRecord(before))
        throw new RegionalEventsSelectionError('protected');
      const generation = before === undefined ? 0 : before.generation;
      if (generation !== expectedGeneration) throw new RegionalEventsSelectionError('conflict');
      const next: RegionalEventsSelectionRecord = Object.freeze({
        storeSchema: 1,
        key: mobileRegionalEventsSelectionKey,
        generation: generation + 1,
        contractVersion: 1,
        schema: mobileRegionalEventsSelectionSchema,
        revision: mobileRegionalEventsSelectionKey,
        regionId,
      });
      if (!validRecord(next)) throw new RegionalEventsSelectionError('storage-failure');
      await request(store.put(next));
      const readback = await request(store.get(mobileRegionalEventsSelectionKey));
      if (JSON.stringify(readback) !== JSON.stringify(next))
        throw new RegionalEventsSelectionError('storage-failure');
      await complete(tx);
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        // A transaction may already be settled; no retry or recovery write is safe.
      }
      if (error instanceof RegionalEventsSelectionError) throw error;
      throw new RegionalEventsSelectionError('storage-failure');
    }
  };
  const clear = async (expectedGeneration: number) => {
    const tx = db.transaction('selection', 'readwrite');
    try {
      const store = tx.objectStore('selection');
      const before = await request(store.get(mobileRegionalEventsSelectionKey));
      if (before !== undefined && !validRecord(before))
        throw new RegionalEventsSelectionError('protected');
      const generation = before === undefined ? 0 : before.generation;
      if (generation !== expectedGeneration) throw new RegionalEventsSelectionError('conflict');
      await request(store.delete(mobileRegionalEventsSelectionKey));
      if ((await request(store.get(mobileRegionalEventsSelectionKey))) !== undefined)
        throw new RegionalEventsSelectionError('storage-failure');
      await complete(tx);
    } catch (error) {
      try {
        tx.abort();
      } catch {
        // A transaction may already be settled; no retry or recovery write is safe.
      }
      if (error instanceof RegionalEventsSelectionError) throw error;
      throw new RegionalEventsSelectionError('storage-failure');
    }
  };
  return Object.freeze({ read, save, clear, close: () => db.close() });
}
