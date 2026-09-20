export const mobileMediaResumeDatabaseName = 'wrn-mobile-media-resume-v1';
export const mobileMediaResumeStoreName = 'mediaResume';
const maximumRecords = 64;
const maximumRecordBytes = 4096;
const maximumTotalBytes = 65536;

export type MobileMediaResumeRecord = Readonly<{
  recordVersion: 1;
  key: string;
  episodeId: string;
  audioAssetId: string;
  releaseRevision: number;
  audioAssetHash: string;
  positionMs: number;
  durationMs: number;
}>;
type Control = Readonly<{ recordVersion: 1; key: 'control'; generation: number }>;
export type MobileMediaResumeState = Readonly<{
  generation: number;
  records: readonly MobileMediaResumeRecord[];
}>;
export type MobileMediaResumeMutation = Readonly<{
  kind: 'saved' | 'deleted' | 'no-op';
  state: MobileMediaResumeState;
}>;
export type MobileMediaResumeStore = Readonly<{
  snapshot(): Promise<MobileMediaResumeState>;
  save(
    record: MobileMediaResumeRecord,
    expectedGeneration: number,
  ): Promise<MobileMediaResumeMutation>;
  deleteIfExact(
    key: string,
    expected: MobileMediaResumeRecord,
    expectedGeneration: number,
  ): Promise<MobileMediaResumeMutation>;
  clearExact(
    expected: readonly MobileMediaResumeRecord[],
    expectedGeneration: number,
  ): Promise<MobileMediaResumeMutation>;
  close(): void;
}>;
export class MobileMediaResumeError extends Error {
  constructor(readonly code: 'unavailable' | 'protected' | 'conflict' | 'storage-failure') {
    super(code);
  }
}

const recordKeys = [
  'recordVersion',
  'key',
  'episodeId',
  'audioAssetId',
  'releaseRevision',
  'audioAssetHash',
  'positionMs',
  'durationMs',
] as const;
const controlKeys = ['recordVersion', 'key', 'generation'] as const;
const utf8 = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key, index) => Object.keys(value)[index] === key);
const text = (value: unknown) => typeof value === 'string' && value.length > 0;
const safe = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && Number.isFinite(value);
export const isMobileMediaResumeRecord = (value: unknown): value is MobileMediaResumeRecord =>
  exact(value, recordKeys) &&
  value.recordVersion === 1 &&
  text(value.key) &&
  value.key !== 'control' &&
  text(value.episodeId) &&
  text(value.audioAssetId) &&
  typeof value.audioAssetHash === 'string' &&
  /^[a-f0-9]{64}$/.test(value.audioAssetHash) &&
  safe(value.releaseRevision) &&
  (value.releaseRevision as number) > 0 &&
  safe(value.positionMs) &&
  safe(value.durationMs) &&
  (value.positionMs as number) >= 0 &&
  (value.durationMs as number) > 0 &&
  (value.positionMs as number) < (value.durationMs as number) &&
  utf8(value) <= maximumRecordBytes;
const isControl = (value: unknown): value is Control =>
  exact(value, controlKeys) &&
  value.recordVersion === 1 &&
  value.key === 'control' &&
  safe(value.generation) &&
  (value.generation as number) >= 0;
const request = <T>(value: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => reject(transaction.error);
  });
const abort = (transaction: IDBTransaction) => {
  try {
    transaction.abort();
  } catch {
    /* settled */
  }
};
const freezeState = (
  generation: number,
  records: readonly MobileMediaResumeRecord[],
): MobileMediaResumeState =>
  Object.freeze({
    generation,
    records: Object.freeze([...records].sort((left, right) => left.key.localeCompare(right.key))),
  });
const equalRecords = (
  left: readonly MobileMediaResumeRecord[],
  right: readonly MobileMediaResumeRecord[],
) => {
  const orderedLeft = [...left].sort((first, second) => first.key.localeCompare(second.key));
  const orderedRight = [...right].sort((first, second) => first.key.localeCompare(second.key));
  return (
    orderedLeft.length === orderedRight.length &&
    orderedLeft.every((record, index) => same(record, orderedRight[index]))
  );
};

async function readState(transaction: IDBTransaction): Promise<MobileMediaResumeState> {
  const values = (await request(
    transaction.objectStore(mobileMediaResumeStoreName).getAll(),
  )) as unknown[];
  const controls = values.filter((value): value is Control => isControl(value));
  const records = values.filter((value): value is MobileMediaResumeRecord =>
    isMobileMediaResumeRecord(value),
  );
  if (
    controls.length !== 1 ||
    controls.length + records.length !== values.length ||
    records.length > maximumRecords ||
    new Set(records.map((record) => record.key)).size !== records.length ||
    records.reduce((sum, record) => sum + utf8(record), 0) > maximumTotalBytes
  )
    throw new MobileMediaResumeError('protected');
  return freezeState(controls[0]!.generation, records);
}

export async function openMobileMediaResumeStore(): Promise<MobileMediaResumeStore> {
  if (typeof indexedDB === 'undefined') throw new MobileMediaResumeError('unavailable');
  const opened = indexedDB.open(mobileMediaResumeDatabaseName, 1);
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    opened.onupgradeneeded = (event) => {
      if (event.oldVersion !== 0) {
        opened.transaction?.abort();
        return;
      }
      const store = opened.result.createObjectStore(mobileMediaResumeStoreName, {
        keyPath: 'key',
        autoIncrement: false,
      });
      store.put({ recordVersion: 1, key: 'control', generation: 0 } satisfies Control);
    };
    opened.onblocked = () => reject(new MobileMediaResumeError('storage-failure'));
    opened.onerror = () =>
      reject(
        opened.error?.name === 'VersionError'
          ? new MobileMediaResumeError('protected')
          : opened.error,
      );
    opened.onsuccess = () => resolve(opened.result);
  }).catch((error) => {
    if (error instanceof MobileMediaResumeError) throw error;
    throw new MobileMediaResumeError('storage-failure');
  });
  database.onversionchange = () => database.close();
  try {
    const transaction = database.transaction(mobileMediaResumeStoreName, 'readonly');
    const store = transaction.objectStore(mobileMediaResumeStoreName);
    const schemaOk =
      database.version === 1 &&
      database.objectStoreNames.length === 1 &&
      database.objectStoreNames.item(0) === mobileMediaResumeStoreName &&
      store.keyPath === 'key' &&
      !store.autoIncrement &&
      store.indexNames.length === 0;
    await complete(transaction);
    if (!schemaOk) throw new MobileMediaResumeError('protected');
  } catch (error) {
    database.close();
    if (error instanceof MobileMediaResumeError) throw error;
    throw new MobileMediaResumeError('storage-failure');
  }
  const snapshot = async () => {
    try {
      const transaction = database.transaction(mobileMediaResumeStoreName, 'readonly');
      const value = await readState(transaction);
      await complete(transaction);
      return value;
    } catch (error) {
      if (error instanceof MobileMediaResumeError) throw error;
      throw new MobileMediaResumeError('storage-failure');
    }
  };
  const mutate = async (
    expectedGeneration: number,
    plan: (before: MobileMediaResumeState) => Readonly<{
      kind: 'saved' | 'deleted' | 'no-op';
      records: readonly MobileMediaResumeRecord[];
    }>,
  ): Promise<MobileMediaResumeMutation> => {
    let transaction: IDBTransaction | null = null;
    try {
      transaction = database.transaction(mobileMediaResumeStoreName, 'readwrite');
      const before = await readState(transaction);
      if (before.generation !== expectedGeneration)
        return Object.freeze({ kind: 'no-op', state: before });
      const intended = plan(before);
      if (intended.kind === 'no-op') {
        await complete(transaction);
        return Object.freeze({ kind: 'no-op', state: before });
      }
      if (
        intended.records.length > maximumRecords ||
        intended.records.reduce((sum, record) => sum + utf8(record), 0) > maximumTotalBytes
      )
        throw new MobileMediaResumeError('protected');
      const store = transaction.objectStore(mobileMediaResumeStoreName);
      const beforeByKey = new Map(before.records.map((record) => [record.key, record]));
      const nextByKey = new Map(intended.records.map((record) => [record.key, record]));
      for (const record of before.records)
        if (!nextByKey.has(record.key)) await request(store.delete(record.key));
      for (const record of intended.records)
        if (!same(beforeByKey.get(record.key), record)) await request(store.put(record));
      const control: Control = Object.freeze({
        recordVersion: 1,
        key: 'control',
        generation: before.generation + 1,
      });
      await request(store.put(control));
      const checked = await readState(transaction);
      if (
        checked.generation !== control.generation ||
        !equalRecords(checked.records, intended.records)
      )
        throw new MobileMediaResumeError('storage-failure');
      await complete(transaction);
      return Object.freeze({ kind: intended.kind, state: checked });
    } catch (error) {
      if (transaction !== null) abort(transaction);
      if (error instanceof MobileMediaResumeError) throw error;
      throw new MobileMediaResumeError('storage-failure');
    }
  };
  const save = async (record: MobileMediaResumeRecord, expectedGeneration: number) => {
    if (!isMobileMediaResumeRecord(record)) throw new MobileMediaResumeError('protected');
    return mutate(expectedGeneration, (before) => {
      const current = before.records.find((value) => value.key === record.key);
      if (current !== undefined && same(current, record))
        return { kind: 'no-op', records: before.records };
      const records =
        current === undefined
          ? [...before.records, record]
          : before.records.map((value) => (value.key === record.key ? record : value));
      return { kind: 'saved', records };
    });
  };
  const deleteIfExact = async (
    key: string,
    expected: MobileMediaResumeRecord,
    expectedGeneration: number,
  ) => {
    if (!isMobileMediaResumeRecord(expected) || key !== expected.key)
      throw new MobileMediaResumeError('protected');
    return mutate(expectedGeneration, (before) => {
      const current = before.records.find((value) => value.key === key);
      if (current === undefined || !same(current, expected))
        return { kind: 'no-op', records: before.records };
      return { kind: 'deleted', records: before.records.filter((value) => value.key !== key) };
    });
  };
  const clearExact = async (
    expected: readonly MobileMediaResumeRecord[],
    expectedGeneration: number,
  ) => {
    if (expected.some((record) => !isMobileMediaResumeRecord(record)))
      throw new MobileMediaResumeError('protected');
    return mutate(expectedGeneration, (before) => {
      const keys = new Set(expected.map((record) => record.key));
      if (
        !expected.every((record) =>
          same(
            before.records.find((value) => value.key === record.key),
            record,
          ),
        )
      )
        return { kind: 'no-op', records: before.records };
      const records = before.records.filter((record) => !keys.has(record.key));
      return { kind: records.length === before.records.length ? 'no-op' : 'deleted', records };
    });
  };
  return Object.freeze({
    snapshot,
    save,
    deleteIfExact,
    clearExact,
    close: () => database.close(),
  });
}
