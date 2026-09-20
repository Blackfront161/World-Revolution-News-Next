import { sha256Utf8, utf8ByteLength } from '@wrn/content-contracts';
import {
  canonicalRegionalEventsSafety,
  compareRevocation,
  compareSafetyReference,
  type RegionalEventBundleV1,
  type Revocation,
  type SafetyReference,
  validateRegionalEventBundle,
  validateRegionalEventsRevocation,
  validateRegionalEventsSafetyReference,
} from '@wrn/content-contracts/mobile-regional-events-v1';
import { decodePinnedMobileRegionalEventsTransport } from './mobile-regional-events';

export const mobileRegionalEventsDatabaseName = 'wrn-mobile-regional-events-v1';
type Slot = 'active' | 'candidate' | 'previous';
const eventStores = ['eventBundles', 'eventControl', 'eventSafety'] as const;
const slotNames = ['active', 'candidate', 'previous'] as const;
const safetyEntryCap = 512;
const safetyReferenceCap = 1024;
const safetyByteCap = 64 * 1024;

export interface BundleRecord {
  readonly storeSchema: 1;
  readonly slot: Slot;
  readonly bundleRevision: number;
  readonly taxonomyRevision: number;
  readonly transportSha256: string;
  readonly rawJson: string;
}
export interface ControlRecord {
  readonly storeSchema: 1;
  readonly key: 'control';
  readonly generation: number;
  readonly active: Pointer | null;
  readonly candidate: Pointer | null;
  readonly previous: Pointer | null;
  readonly safetyRevision: number;
}
interface Pointer {
  readonly bundleRevision: number;
  readonly taxonomyRevision: number;
  readonly transportSha256: string;
}
export interface SafetyRecord {
  readonly storeSchema: 1;
  readonly key: 'safety';
  readonly revision: number;
  readonly sha256: string;
  readonly entries: readonly Revocation[];
  readonly references: readonly SafetyReference[];
}
export type RegionalEventsStoreSnapshot = Readonly<{
  control: ControlRecord;
  safety: SafetyRecord;
  bundles: Readonly<Record<Slot, BundleRecord | null>>;
}>;
export class RegionalEventsStoreError extends Error {
  constructor(
    readonly code:
      'protected' | 'conflict' | 'invalid-bundle' | 'safety-conflict' | 'storage-failure',
  ) {
    super(code);
  }
}

const bundleKeys = [
  'storeSchema',
  'slot',
  'bundleRevision',
  'taxonomyRevision',
  'transportSha256',
  'rawJson',
] as const;
const controlKeys = [
  'storeSchema',
  'key',
  'generation',
  'active',
  'candidate',
  'previous',
  'safetyRevision',
] as const;
const safetyKeys = ['storeSchema', 'key', 'revision', 'sha256', 'entries', 'references'] as const;
const exact = (value: unknown, keys: readonly string[]) =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key, index) => Object.keys(value)[index] === key);
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const req = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const done = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(transaction.error ?? new DOMException('AbortError'));
  });
const pointer = (value: unknown): value is Pointer =>
  exact(value, ['bundleRevision', 'taxonomyRevision', 'transportSha256']) &&
  Number.isSafeInteger((value as Pointer).bundleRevision) &&
  (value as Pointer).bundleRevision > 0 &&
  Number.isSafeInteger((value as Pointer).taxonomyRevision) &&
  (value as Pointer).taxonomyRevision > 0 &&
  /^[a-f0-9]{64}$/.test((value as Pointer).transportSha256);
const pointerFor = (record: BundleRecord): Pointer => ({
  bundleRevision: record.bundleRevision,
  taxonomyRevision: record.taxonomyRevision,
  transportSha256: record.transportSha256,
});
const validControl = (value: unknown): value is ControlRecord =>
  exact(value, controlKeys) &&
  (value as ControlRecord).storeSchema === 1 &&
  (value as ControlRecord).key === 'control' &&
  Number.isSafeInteger((value as ControlRecord).generation) &&
  (value as ControlRecord).generation >= 0 &&
  slotNames.every((slot) => {
    const entry = (value as ControlRecord)[slot];
    return entry === null || pointer(entry);
  }) &&
  Number.isSafeInteger((value as ControlRecord).safetyRevision) &&
  (value as ControlRecord).safetyRevision >= 0;
const validRecord = (value: unknown): value is BundleRecord =>
  exact(value, bundleKeys) &&
  (value as BundleRecord).storeSchema === 1 &&
  slotNames.includes((value as BundleRecord).slot) &&
  pointer(pointerFor(value as BundleRecord)) &&
  typeof (value as BundleRecord).rawJson === 'string' &&
  utf8ByteLength((value as BundleRecord).rawJson) <= 512 * 1024;
const referenceKey = (reference: SafetyReference) => `${reference.namespace}\u0000${reference.id}`;
const safetyKey = (entry: Revocation) =>
  `${entry.namespace}\u0000${entry.id}\u0000${entry.objectSha256 ?? ''}`;
const requiredReferences = (entries: readonly Revocation[]) =>
  entries.flatMap((entry) => [
    { namespace: entry.namespace, id: entry.id },
    ...(entry.status === 'replaced'
      ? [{ namespace: entry.namespace, id: entry.replacementId! }]
      : []),
  ]) as SafetyReference[];
const sortedUnique = <T>(values: readonly T[], compare: (left: T, right: T) => number) =>
  values.every((value, index) => index === 0 || compare(values[index - 1]!, value) < 0);
const hasEntryReferenceCoverage = (
  entries: readonly Revocation[],
  references: readonly SafetyReference[],
) => {
  const keys = new Set(references.map(referenceKey));
  return requiredReferences(entries).every((reference) => keys.has(referenceKey(reference)));
};
const validSafetyShape = (value: unknown): value is SafetyRecord =>
  exact(value, safetyKeys) &&
  (value as SafetyRecord).storeSchema === 1 &&
  (value as SafetyRecord).key === 'safety' &&
  Number.isSafeInteger((value as SafetyRecord).revision) &&
  (value as SafetyRecord).revision >= 0 &&
  /^[a-f0-9]{64}$/.test((value as SafetyRecord).sha256) &&
  Array.isArray((value as SafetyRecord).entries) &&
  Array.isArray((value as SafetyRecord).references) &&
  (value as SafetyRecord).entries.length <= safetyEntryCap &&
  (value as SafetyRecord).references.length <= safetyReferenceCap &&
  (value as SafetyRecord).entries.every(validateRegionalEventsRevocation) &&
  (value as SafetyRecord).references.every(validateRegionalEventsSafetyReference) &&
  sortedUnique((value as SafetyRecord).entries, compareRevocation) &&
  sortedUnique((value as SafetyRecord).references, compareSafetyReference) &&
  hasEntryReferenceCoverage((value as SafetyRecord).entries, (value as SafetyRecord).references) &&
  utf8ByteLength(JSON.stringify(value)) <= safetyByteCap;
async function safetyHash(
  revision: number,
  entries: readonly Revocation[],
  references: readonly SafetyReference[],
) {
  return sha256Utf8(canonicalRegionalEventsSafety(entries, revision, references));
}
async function makeSafety(
  revision: number,
  entries: readonly Revocation[],
  references: readonly SafetyReference[],
): Promise<SafetyRecord> {
  const next: SafetyRecord = {
    storeSchema: 1,
    key: 'safety',
    revision,
    sha256: await safetyHash(revision, entries, references),
    entries: Object.freeze([...entries]),
    references: Object.freeze([...references]),
  };
  if (!validSafetyShape(next)) throw new RegionalEventsStoreError('protected');
  return Object.freeze(next);
}
const emptyControl = (): ControlRecord => ({
  storeSchema: 1,
  key: 'control',
  generation: 0,
  active: null,
  candidate: null,
  previous: null,
  safetyRevision: 0,
});
const parseRecord = async (record: BundleRecord | null): Promise<RegionalEventBundleV1 | null> => {
  if (record === null || !validRecord(record)) return null;
  if ((await sha256Utf8(record.rawJson)) !== record.transportSha256) return null;
  try {
    const bundle = await validateRegionalEventBundle(JSON.parse(record.rawJson));
    return bundle !== null &&
      bundle.bundleRevision === record.bundleRevision &&
      bundle.taxonomyRevision === record.taxonomyRevision
      ? bundle
      : null;
  } catch {
    return null;
  }
};
function referencesFromBundle(bundle: RegionalEventBundleV1): SafetyReference[] {
  const ids: Record<SafetyReference['namespace'], ReadonlySet<string>> = {
    continent: new Set(bundle.continents.map((value) => value.continentId)),
    country: new Set(bundle.countries.map((value) => value.countryId)),
    region: new Set(bundle.regions.map((value) => value.regionId)),
    event: new Set(bundle.events.map((value) => value.eventId)),
    source: new Set(bundle.sources.map((value) => value.sourceId)),
  };
  const references = requiredReferences(bundle.revocations);
  if (
    bundle.revocations.some(
      (entry) => entry.status === 'replaced' && entry.id === entry.replacementId,
    ) ||
    !references.every(
      (reference) =>
        validateRegionalEventsSafetyReference(reference) &&
        ids[reference.namespace].has(reference.id),
    )
  )
    throw new RegionalEventsStoreError('protected');
  return [
    ...new Map(
      references.map((reference) => [referenceKey(reference), reference] as const),
    ).values(),
  ].sort(compareSafetyReference);
}
async function validateState(
  bundles: readonly unknown[],
  controls: readonly unknown[],
  safeties: readonly unknown[],
): Promise<RegionalEventsStoreSnapshot> {
  if (
    !bundles.every(validRecord) ||
    bundles.length > 3 ||
    controls.length > 1 ||
    safeties.length > 1 ||
    (controls.length === 1 && !validControl(controls[0])) ||
    (safeties.length === 1 && !validSafetyShape(safeties[0]))
  )
    throw new RegionalEventsStoreError('protected');
  const control = (controls[0] ?? emptyControl()) as ControlRecord;
  const safety = safeties[0] ? (safeties[0] as SafetyRecord) : await makeSafety(0, [], []);
  if (
    (await safetyHash(safety.revision, safety.entries, safety.references)) !== safety.sha256 ||
    control.safetyRevision !== safety.revision
  )
    throw new RegionalEventsStoreError('protected');
  const slots: Record<Slot, BundleRecord | null> = {
    active: null,
    candidate: null,
    previous: null,
  };
  for (const record of bundles as BundleRecord[]) {
    if (slots[record.slot] !== null || (await parseRecord(record)) === null)
      throw new RegionalEventsStoreError('protected');
    slots[record.slot] = record;
  }
  for (const slot of slotNames) {
    if ((control[slot] === null) !== (slots[slot] === null))
      throw new RegionalEventsStoreError('protected');
    if (control[slot] !== null && !same(control[slot], pointerFor(slots[slot]!)))
      throw new RegionalEventsStoreError('protected');
  }
  return Object.freeze({
    control: Object.freeze(control),
    safety: Object.freeze(safety),
    bundles: Object.freeze(slots),
  });
}
async function transactionState(transaction: IDBTransaction) {
  const bundles = (await req(transaction.objectStore('eventBundles').getAll())) as unknown[];
  const controls = (await req(transaction.objectStore('eventControl').getAll())) as unknown[];
  const safeties = (await req(transaction.objectStore('eventSafety').getAll())) as unknown[];
  return validateState(bundles, controls, safeties);
}
function abort(transaction: IDBTransaction) {
  try {
    transaction.abort();
  } catch {
    // A settled IndexedDB transaction must never trigger a recovery write or retry.
  }
}

export async function openMobileRegionalEventsStore(): Promise<{
  snapshot(): Promise<RegionalEventsStoreSnapshot>;
  saveCandidate(
    bytes: Uint8Array,
    expectedGeneration: number,
  ): Promise<RegionalEventsStoreSnapshot>;
  activate(expectedGeneration: number): Promise<RegionalEventsStoreSnapshot>;
  rollback(expectedGeneration: number): Promise<RegionalEventsStoreSnapshot>;
  close(): void;
}> {
  const open = indexedDB.open(mobileRegionalEventsDatabaseName);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    open.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) {
        open.result.createObjectStore('eventBundles', { keyPath: 'slot' });
        open.result.createObjectStore('eventControl', { keyPath: 'key' });
        open.result.createObjectStore('eventSafety', { keyPath: 'key' });
      } else {
        open.transaction?.abort();
      }
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(new RegionalEventsStoreError('storage-failure'));
  });
  db.onversionchange = () => db.close();
  if (db.version > 1 || !same(Array.from(db.objectStoreNames).sort(), eventStores)) {
    db.close();
    throw new RegionalEventsStoreError('protected');
  }
  const snapshot = async (): Promise<RegionalEventsStoreSnapshot> => {
    try {
      const transaction = db.transaction(eventStores, 'readonly');
      const state = await transactionState(transaction);
      await done(transaction);
      return state;
    } catch (error) {
      if (error instanceof RegionalEventsStoreError) throw error;
      throw new RegionalEventsStoreError('storage-failure');
    }
  };
  const persistSourceSafety = async (kind: 'activate' | 'rollback', expected: number) => {
    const sourceSlot = kind === 'activate' ? 'candidate' : 'previous';
    const transaction = db.transaction(eventStores, 'readwrite');
    try {
      const state = await transactionState(transaction);
      if (state.control.generation !== expected) throw new RegionalEventsStoreError('conflict');
      const sourceRecord = state.bundles[sourceSlot];
      const source = await parseRecord(sourceRecord);
      if (sourceRecord === null || source === null) throw new RegionalEventsStoreError('protected');
      const entries = [...source.revocations];
      const incomingReferences = referencesFromBundle(source);
      const old = state.safety;
      if (source.revocationRevision < old.revision) {
        if (kind === 'activate') throw new RegionalEventsStoreError('protected');
        const oldEntries = new Set(old.entries.map(safetyKey));
        const oldReferences = new Set(old.references.map(referenceKey));
        if (
          !entries.every((entry) => oldEntries.has(safetyKey(entry))) ||
          !incomingReferences.every((reference) => oldReferences.has(referenceKey(reference)))
        )
          throw new RegionalEventsStoreError('protected');
        await done(transaction);
        return state;
      }
      if (source.revocationRevision === old.revision) {
        if (!same(entries, old.entries) || !hasEntryReferenceCoverage(entries, old.references))
          throw new RegionalEventsStoreError('protected');
        await done(transaction);
        return state;
      }
      const entriesByKey = new Map(old.entries.map((entry) => [safetyKey(entry), entry]));
      for (const entry of entries) entriesByKey.set(safetyKey(entry), entry);
      const referencesByKey = new Map(
        old.references.map((reference) => [referenceKey(reference), reference]),
      );
      for (const reference of incomingReferences)
        referencesByKey.set(referenceKey(reference), reference);
      const nextEntries = [...entriesByKey.values()].sort(compareRevocation);
      const nextReferences = [...referencesByKey.values()].sort(compareSafetyReference);
      const next = await makeSafety(source.revocationRevision, nextEntries, nextReferences);
      /* All exact-schema, reference, count and byte checks have completed in
       * makeSafety before this first persistence sink. */
      await req(transaction.objectStore('eventSafety').put(next));
      if (!same(await req(transaction.objectStore('eventSafety').get('safety')), next))
        throw new RegionalEventsStoreError('storage-failure');
      const control: ControlRecord = { ...state.control, safetyRevision: next.revision };
      await req(transaction.objectStore('eventControl').put(control));
      if (!same(await req(transaction.objectStore('eventControl').get('control')), control))
        throw new RegionalEventsStoreError('storage-failure');
      await done(transaction);
      return Object.freeze({ ...state, control: Object.freeze(control), safety: next });
    } catch (error) {
      abort(transaction);
      if (error instanceof RegionalEventsStoreError) throw error;
      throw new RegionalEventsStoreError('storage-failure');
    }
  };
  const saveCandidate = async (bytes: Uint8Array, expected: number) => {
    const admitted = await decodePinnedMobileRegionalEventsTransport(bytes);
    if (admitted.kind !== 'ready') throw new RegionalEventsStoreError('invalid-bundle');
    const { bundle, rawJson, transportSha256 } = admitted;
    const transaction = db.transaction(eventStores, 'readwrite');
    try {
      const state = await transactionState(transaction);
      if (state.control.generation !== expected) throw new RegionalEventsStoreError('conflict');
      const active = await parseRecord(state.bundles.active);
      if (state.bundles.active !== null && active === null)
        throw new RegionalEventsStoreError('protected');
      if (active !== null) {
        if (
          bundle.bundleRevision < active.bundleRevision ||
          (bundle.bundleRevision === active.bundleRevision &&
            transportSha256 !== state.bundles.active!.transportSha256)
        )
          throw new RegionalEventsStoreError('invalid-bundle');
        if (bundle.bundleRevision === active.bundleRevision) {
          await done(transaction);
          return state;
        }
        if (
          (bundle.taxonomySha256 === active.taxonomySha256) !==
            (bundle.taxonomyRevision === active.taxonomyRevision) ||
          bundle.taxonomyRevision < active.taxonomyRevision
        )
          throw new RegionalEventsStoreError('invalid-bundle');
        const activeById = new Map(active.events.map((event) => [event.eventId, event]));
        for (const event of bundle.events) {
          const previous = activeById.get(event.eventId);
          if (
            previous &&
            (event.contentRevision < previous.contentRevision ||
              (event.contentRevision === previous.contentRevision &&
                event.contentSha256 !== previous.contentSha256))
          )
            throw new RegionalEventsStoreError('invalid-bundle');
        }
      }
      const candidate: BundleRecord = {
        storeSchema: 1,
        slot: 'candidate',
        bundleRevision: bundle.bundleRevision,
        taxonomyRevision: bundle.taxonomyRevision,
        transportSha256,
        rawJson,
      };
      const control: ControlRecord = {
        ...state.control,
        generation: expected + 1,
        candidate: pointerFor(candidate),
      };
      await req(transaction.objectStore('eventBundles').put(candidate));
      if (!same(await req(transaction.objectStore('eventBundles').get('candidate')), candidate))
        throw new RegionalEventsStoreError('storage-failure');
      await req(transaction.objectStore('eventControl').put(control));
      if (!same(await req(transaction.objectStore('eventControl').get('control')), control))
        throw new RegionalEventsStoreError('storage-failure');
      const checked = await transactionState(transaction);
      if (checked.control.generation !== expected + 1)
        throw new RegionalEventsStoreError('storage-failure');
      await done(transaction);
      return checked;
    } catch (error) {
      abort(transaction);
      if (error instanceof RegionalEventsStoreError) throw error;
      throw new RegionalEventsStoreError('storage-failure');
    }
  };
  const rotate = async (kind: 'activate' | 'rollback', expected: number) => {
    const sourceSlot = kind === 'activate' ? 'candidate' : 'previous';
    const persisted = await persistSourceSafety(kind, expected);
    const sourceBefore = persisted.bundles[sourceSlot];
    const sourceBundle = await parseRecord(sourceBefore);
    if (sourceBefore === null || sourceBundle === null)
      throw new RegionalEventsStoreError('protected');
    const blocked = (event: RegionalEventBundleV1['events'][number]) =>
      persisted.safety.entries.some(
        (entry) =>
          entry.namespace === 'event' &&
          entry.id === event.eventId &&
          (entry.objectSha256 === undefined || entry.objectSha256 === event.contentSha256),
      );
    if (sourceBundle.events.some(blocked)) throw new RegionalEventsStoreError('protected');
    const transaction = db.transaction(eventStores, 'readwrite');
    try {
      const state = await transactionState(transaction);
      if (
        state.control.generation !== expected ||
        !same(state.safety, persisted.safety) ||
        !same(state.bundles[sourceSlot], sourceBefore)
      )
        throw new RegionalEventsStoreError('conflict');
      const source = state.bundles[sourceSlot]!;
      const active = state.bundles.active;
      await req(transaction.objectStore('eventBundles').delete(sourceSlot));
      if (state.bundles.previous !== null)
        await req(transaction.objectStore('eventBundles').delete('previous'));
      if (state.bundles.candidate !== null && kind === 'rollback')
        await req(transaction.objectStore('eventBundles').delete('candidate'));
      if (active !== null)
        await req(transaction.objectStore('eventBundles').put({ ...active, slot: 'previous' }));
      await req(transaction.objectStore('eventBundles').put({ ...source, slot: 'active' }));
      const control: ControlRecord = {
        ...state.control,
        generation: expected + 1,
        active: pointerFor(source),
        candidate: null,
        previous: active === null ? null : pointerFor(active),
      };
      await req(transaction.objectStore('eventControl').put(control));
      const checked = await transactionState(transaction);
      if (
        checked.control.generation !== expected + 1 ||
        !same(checked.safety, state.safety) ||
        checked.bundles.active === null ||
        !same(checked.control.active, pointerFor(checked.bundles.active))
      )
        throw new RegionalEventsStoreError('storage-failure');
      await done(transaction);
      return checked;
    } catch (error) {
      abort(transaction);
      if (error instanceof RegionalEventsStoreError) throw error;
      throw new RegionalEventsStoreError('storage-failure');
    }
  };
  return Object.freeze({
    snapshot,
    saveCandidate,
    activate: (expected: number) => rotate('activate', expected),
    rollback: (expected: number) => rotate('rollback', expected),
    close: () => db.close(),
  });
}
