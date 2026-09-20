import {
  hasMobileMediaJsonByteCap,
  mobileMediaCaps,
  mobileMediaContractVersion,
  mobileMediaDocumentClasses,
  mobileMediaReleaseSchema,
  mobileMediaRuntimePaths,
  validateMobileMediaCandidate,
  validateMobileMediaDocument,
  validateMobileMediaRelease,
  type MediaDocumentClass,
  type MobileMediaCandidate,
  type MobileMediaClock,
} from '@wrn/content-contracts/mobile-media-v1';
import {
  mobileMediaBuildPin,
  type MobileMediaRawBundle,
  type MobileMediaRootPin,
} from './mobile-media-release';

export const mobileMediaCatalogDatabaseName = 'wrn-mobile-media-catalog-v1';
const stores = ['mediaBundles', 'mediaControl', 'mediaSafety'] as const;
type Slot = 'active' | 'candidate' | 'previous';
type SafetyEntry = Readonly<{
  targetKind: 'source' | 'series' | 'episode' | 'asset';
  targetId: string;
  targetHash: string | null;
  status: 'blocked' | 'gone' | 'replaced';
  replacementKind: 'source' | 'series' | 'episode' | 'asset' | null;
  replacementId: string | null;
}>;
type SafetyReference = Readonly<{ kind: SafetyEntry['targetKind']; id: string }>;
type Bundle = Readonly<{
  recordVersion: 1;
  slot: Slot;
  rawBundle: MobileMediaRawBundle;
  transportSha256: string;
  revision: number;
}>;
type Control = Readonly<{
  recordVersion: 1;
  key: 'control';
  generation: number;
  highestAcceptedRevision: number;
  active: Slot | null;
  candidate: Slot | null;
  previous: Slot | null;
}>;
type Safety = Readonly<{
  recordVersion: 1;
  key: 'safety';
  generation: number;
  revision: number;
  raw: string;
  entries: readonly SafetyEntry[];
  references: readonly SafetyReference[];
}>;
type CatalogState = Readonly<{
  bundles: Readonly<Record<Slot, Bundle | null>>;
  control: Control;
  safety: Safety;
}>;
const emptyControl: Control = Object.freeze({
  recordVersion: 1,
  key: 'control',
  generation: 0,
  highestAcceptedRevision: 0,
  active: null,
  candidate: null,
  previous: null,
});
const emptySafety: Safety = Object.freeze({
  recordVersion: 1,
  key: 'safety',
  generation: 0,
  revision: 0,
  raw: '',
  entries: [],
  references: [],
});

export class MobileMediaCatalogError extends Error {
  constructor(
    readonly code:
      'unavailable' | 'protected' | 'conflict' | 'invalid-candidate' | 'storage-failure',
  ) {
    super(code);
  }
}
const req = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const done = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => reject(transaction.error);
  });
const eq = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const validClock = (clock: MobileMediaClock): number | null => {
  const now = clock();
  return Number.isSafeInteger(now) && Number.isFinite(now) ? now : null;
};
async function digest(raw: string) {
  const value = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key, index) => Object.keys(value)[index] === key)
  );
}
const nonNegative = (value: unknown): value is number =>
  Number.isSafeInteger(value) && typeof value === 'number' && value >= 0;
const positive = (value: unknown): value is number => nonNegative(value) && value > 0;
function validControl(value: unknown): value is Control {
  return (
    exactKeys(value, [
      'recordVersion',
      'key',
      'generation',
      'highestAcceptedRevision',
      'active',
      'candidate',
      'previous',
    ]) &&
    value.recordVersion === 1 &&
    value.key === 'control' &&
    nonNegative(value.generation) &&
    nonNegative(value.highestAcceptedRevision) &&
    ['active', 'candidate', 'previous', null].includes(value.active as never) &&
    ['active', 'candidate', 'previous', null].includes(value.candidate as never) &&
    ['active', 'candidate', 'previous', null].includes(value.previous as never)
  );
}
function validSafety(value: unknown): value is Safety {
  return (
    exactKeys(value, [
      'recordVersion',
      'key',
      'generation',
      'revision',
      'raw',
      'entries',
      'references',
    ]) &&
    value.recordVersion === 1 &&
    value.key === 'safety' &&
    nonNegative(value.generation) &&
    nonNegative(value.revision) &&
    typeof value.raw === 'string' &&
    Array.isArray(value.entries) &&
    Array.isArray(value.references)
  );
}
function validBundle(value: unknown, slot: Slot): value is Bundle {
  return (
    exactKeys(value, ['recordVersion', 'slot', 'rawBundle', 'transportSha256', 'revision']) &&
    value.recordVersion === 1 &&
    value.slot === slot &&
    typeof value.transportSha256 === 'string' &&
    positive(value.revision) &&
    exactKeys(value.rawBundle, ['releaseRaw', 'documentsRaw']) &&
    typeof value.rawBundle.releaseRaw === 'string' &&
    isRecord(value.rawBundle.documentsRaw)
  );
}
async function open() {
  if (typeof indexedDB === 'undefined') throw new MobileMediaCatalogError('unavailable');
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(mobileMediaCatalogDatabaseName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (
        db.objectStoreNames.length !== 0 &&
        !stores.every((store) => db.objectStoreNames.contains(store))
      ) {
        request.transaction?.abort();
        return;
      }
      for (const store of stores)
        if (!db.objectStoreNames.contains(store))
          db.createObjectStore(store, { keyPath: store === 'mediaBundles' ? 'slot' : 'key' });
    };
    request.onsuccess = () => {
      const db = request.result;
      if (
        db.version !== 1 ||
        !stores.every((store) => db.objectStoreNames.contains(store)) ||
        db.objectStoreNames.length !== stores.length
      ) {
        db.close();
        reject(new MobileMediaCatalogError('protected'));
      } else resolve(db);
    };
    request.onerror = () => reject(new MobileMediaCatalogError('protected'));
  });
}
async function state(
  transaction: IDBTransaction,
  clock: MobileMediaClock,
  buildPins: readonly MobileMediaRootPin[],
): Promise<CatalogState> {
  const bundles = transaction.objectStore('mediaBundles');
  const control = transaction.objectStore('mediaControl');
  const safety = transaction.objectStore('mediaSafety');
  const [active, candidate, previous, storedControl, storedSafety] = await Promise.all([
    req(bundles.get('active')),
    req(bundles.get('candidate')),
    req(bundles.get('previous')),
    req(control.get('control')),
    req(safety.get('safety')),
  ]);
  if (
    (active !== undefined && !validBundle(active, 'active')) ||
    (candidate !== undefined && !validBundle(candidate, 'candidate')) ||
    (previous !== undefined && !validBundle(previous, 'previous')) ||
    (storedControl !== undefined && !validControl(storedControl)) ||
    (storedSafety !== undefined && !validSafety(storedSafety))
  )
    throw new MobileMediaCatalogError('protected');
  const value = Object.freeze({
    bundles: Object.freeze({
      active: active ?? null,
      candidate: candidate ?? null,
      previous: previous ?? null,
    }),
    control: storedControl ?? emptyControl,
    safety: storedSafety ?? emptySafety,
  });
  if (!(await validState(value, clock, buildPins))) throw new MobileMediaCatalogError('protected');
  return value;
}
function exactRootPin(value: unknown): value is MobileMediaRootPin {
  return (
    exactKeys(value, ['schema', 'contractVersion', 'path', 'revision', 'transportSha256']) &&
    value.schema === mobileMediaReleaseSchema &&
    value.contractVersion === mobileMediaContractVersion &&
    value.path === mobileMediaRuntimePaths.release &&
    positive(value.revision) &&
    typeof value.transportSha256 === 'string'
  );
}
async function parseRawBundle(
  rawBundle: MobileMediaRawBundle,
  clock: MobileMediaClock,
  buildPins: readonly MobileMediaRootPin[],
  requireCurrent = true,
): Promise<MobileMediaCandidate | null> {
  if (
    !isRecord(rawBundle) ||
    typeof rawBundle.releaseRaw !== 'string' ||
    !isRecord(rawBundle.documentsRaw)
  )
    return null;
  if (!hasMobileMediaJsonByteCap(rawBundle.releaseRaw)) return null;
  const transportSha256 = await digest(rawBundle.releaseRaw);
  const documentKeys = Object.keys(rawBundle.documentsRaw);
  if (
    documentKeys.length !== mobileMediaDocumentClasses.length ||
    !mobileMediaDocumentClasses.every((kind, index) => documentKeys[index] === kind)
  )
    return null;
  let release: unknown;
  try {
    release = JSON.parse(rawBundle.releaseRaw);
  } catch {
    return null;
  }
  if (!validateMobileMediaRelease(release)) return null;
  const buildPin = buildPins.find(
    (pin) =>
      exactRootPin(pin) &&
      pin.revision === release.revision &&
      pin.transportSha256 === transportSha256,
  );
  if (buildPin === undefined) return null;
  const documents = {} as Record<MediaDocumentClass, unknown>;
  let total = 0;
  for (const descriptor of release.documents) {
    const raw = rawBundle.documentsRaw[descriptor.documentClass];
    if (
      typeof raw !== 'string' ||
      !hasMobileMediaJsonByteCap(raw) ||
      bytes(raw) !== descriptor.bytes
    )
      return null;
    const encoded = new TextEncoder().encode(raw);
    if ((await digest(raw)) !== descriptor.sha256) return null;
    total += encoded.byteLength;
    if (total > mobileMediaCaps.totalJson) return null;
    try {
      documents[descriptor.documentClass] = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (requireCurrent)
    return validateMobileMediaCandidate(release, documents, rawBundle.documentsRaw, clock);
  const now = validClock(clock);
  if (now === null || Date.parse(release.generatedAt) > now) return null;
  return validateMobileMediaCandidate(release, documents, rawBundle.documentsRaw, () =>
    Date.parse(release.generatedAt),
  );
}
async function validState(
  value: CatalogState,
  clock: MobileMediaClock,
  buildPins: readonly MobileMediaRootPin[],
): Promise<boolean> {
  const bundles = Object.values(value.bundles).filter(
    (bundle): bundle is Bundle => bundle !== null,
  );
  const candidates = new Map<Slot, MobileMediaCandidate>();
  if (bundles.some((bundle) => bundle.revision < 1)) return false;
  for (const [slot, bundle] of Object.entries(value.bundles) as Array<[Slot, Bundle | null]>) {
    if (bundle === null) continue;
    const transportSha256 = await digest(bundle.rawBundle.releaseRaw);
    if (bundle.transportSha256 !== transportSha256) return false;
    const parsed = await parseRawBundle(bundle.rawBundle, clock, buildPins, false);
    if (parsed === null || parsed.release.revision !== bundle.revision) return false;
    candidates.set(slot, parsed);
  }
  const transportByRevision = new Map<number, string>();
  for (const bundle of bundles) {
    const previous = transportByRevision.get(bundle.revision);
    if (previous !== undefined && previous !== bundle.transportSha256) return false;
    transportByRevision.set(bundle.revision, bundle.transportSha256);
  }
  const { control, safety } = value;
  const highestRevision =
    bundles.length === 0 ? 0 : Math.max(...bundles.map((bundle) => bundle.revision));
  const hasActive = value.bundles.active !== null;
  const hasCandidate = value.bundles.candidate !== null;
  const hasPrevious = value.bundles.previous !== null;
  const minimumGeneration =
    !hasActive && !hasCandidate && !hasPrevious
      ? 0
      : !hasActive && hasCandidate && !hasPrevious
        ? 1
        : hasActive && !hasCandidate && !hasPrevious
          ? 2
          : hasActive && hasCandidate && !hasPrevious
            ? 3
            : hasActive && !hasCandidate && hasPrevious
              ? 4
              : hasActive && hasCandidate && hasPrevious
                ? 5
                : null;
  if (
    control.active !== (value.bundles.active === null ? null : 'active') ||
    control.candidate !== (value.bundles.candidate === null ? null : 'candidate') ||
    control.previous !== (value.bundles.previous === null ? null : 'previous') ||
    minimumGeneration === null ||
    control.generation < minimumGeneration ||
    control.highestAcceptedRevision !== highestRevision ||
    (value.bundles.candidate !== null &&
      value.bundles.candidate.revision !== control.highestAcceptedRevision) ||
    (!hasActive && !hasCandidate && !hasPrevious && !eq(control, emptyControl))
  )
    return false;
  if (safety.revision === 0)
    return (
      !hasActive &&
      !hasPrevious &&
      safety.generation === 0 &&
      safety.raw === '' &&
      safety.entries.length === 0 &&
      safety.references.length === 0
    );
  if (!hasMobileMediaJsonByteCap(safety.raw, mobileMediaCaps.safetyBytes)) return false;
  try {
    const parsed = JSON.parse(safety.raw) as Record<string, unknown>;
    if (!(
      validateMobileMediaDocument('revocation', parsed) &&
      parsed.safetyRevision === safety.revision &&
      eq(parsed.entries, safety.entries) &&
      eq(parsed.references, safety.references)
    ))
      return false;
    return (['active', 'previous'] as const).every((slot) => {
      const candidate = candidates.get(slot);
      if (candidate === undefined) return true;
      const revocation = candidate.documents.revocation;
      const safetyEntries = new Map(safety.entries.map((entry) => [safetyKey(entry), entry]));
      const safetyReferences = new Map(
        safety.references.map((reference) => [referenceKey(reference), reference]),
      );
      return (
        safety.revision >= candidate.release.revocationFloor &&
        revocation.entries.every((entry) => eq(safetyEntries.get(safetyKey(entry)), entry)) &&
        revocation.references.every((reference) =>
          eq(safetyReferences.get(referenceKey(reference)), reference),
        )
      );
    });
  } catch {
    return false;
  }
}
function safetyKey(entry: SafetyEntry) {
  return `${entry.targetKind}\0${entry.targetId}\0${entry.targetHash ?? ''}`;
}
function referenceKey(reference: SafetyReference) {
  return `${reference.kind}\0${reference.id}`;
}
function nextSafety(
  candidate: MobileMediaCandidate,
  rawBundle: MobileMediaRawBundle,
  before: Safety,
): Safety | null {
  const revocation = candidate.documents.revocation;
  const raw = rawBundle.documentsRaw.revocation;
  if (typeof raw !== 'string' || !hasMobileMediaJsonByteCap(raw, mobileMediaCaps.safetyBytes))
    return null;
  if (revocation.safetyRevision < before.revision) return null;
  if (revocation.safetyRevision === before.revision) return before.raw === raw ? before : null;
  const incomingEntries = revocation.entries as readonly SafetyEntry[];
  const incomingReferences = revocation.references as readonly SafetyReference[];
  const entries = new Map(incomingEntries.map((entry) => [safetyKey(entry), entry]));
  const references = new Set(incomingReferences.map(referenceKey));
  if (
    before.entries.some((entry) => {
      const incoming = entries.get(safetyKey(entry));
      return incoming === undefined || !eq(incoming, entry);
    }) ||
    before.references.some((reference) => !references.has(referenceKey(reference)))
  )
    return null;
  if (incomingEntries.length > mobileMediaCaps.safetyEntries) return null;
  return Object.freeze({
    recordVersion: 1,
    key: 'safety',
    generation: before.generation + 1,
    revision: revocation.safetyRevision,
    raw,
    entries: incomingEntries,
    references: incomingReferences,
  });
}
function candidateBlocked(candidate: MobileMediaCandidate, safety: Safety): boolean {
  const manifest = candidate.documents.manifest;
  const current = [
    ...candidate.documents.admission.sources.map((source) => ['source', source.id, null] as const),
    ...manifest.series.map((series) => ['series', series.id, null] as const),
    ...manifest.episodes.map((episode) => ['episode', episode.id, null] as const),
    ...manifest.assets.map((asset) => ['asset', asset.id, asset.sha256] as const),
  ];
  return current.some(([targetKind, targetId, targetHash]) =>
    safety.entries.some(
      (entry) =>
        entry.targetKind === targetKind &&
        entry.targetId === targetId &&
        entry.targetHash === targetHash,
    ),
  );
}
function abort(transaction: IDBTransaction) {
  try {
    transaction.abort();
  } catch {
    // The transaction can already have completed; caller still receives a safe error.
  }
}

export async function openMobileMediaCatalogStore(
  clock: MobileMediaClock = Date.now,
  buildPin: MobileMediaRootPin | readonly MobileMediaRootPin[] = mobileMediaBuildPin,
) {
  const buildPins = Array.isArray(buildPin) ? buildPin : [buildPin];
  const db = await open();
  const snapshot = async () => {
    const transaction = db.transaction(stores, 'readonly');
    const value = await state(transaction, clock, buildPins);
    await done(transaction);
    return value;
  };
  const saveCandidate = async (
    input: Readonly<{ rawBundle: MobileMediaRawBundle; expectedGeneration: number }>,
  ) => {
    const candidate = await parseRawBundle(input.rawBundle, clock, buildPins);
    if (candidate === null) throw new MobileMediaCatalogError('invalid-candidate');
    const now = validClock(clock);
    if (
      now === null ||
      validateMobileMediaCandidate(
        candidate.release,
        candidate.documents,
        candidate.raw,
        () => now,
      ) === null
    )
      throw new MobileMediaCatalogError('invalid-candidate');
    const transportSha256 = await digest(input.rawBundle.releaseRaw);
    const transaction = db.transaction(stores, 'readwrite');
    try {
      const before = await state(transaction, clock, buildPins);
      if (before.control.generation !== input.expectedGeneration)
        throw new MobileMediaCatalogError('conflict');
      const freshNow = validClock(clock);
      if (
        freshNow === null ||
        validateMobileMediaCandidate(
          candidate.release,
          candidate.documents,
          candidate.raw,
          () => freshNow,
        ) === null
      )
        throw new MobileMediaCatalogError('invalid-candidate');
      if (candidate.release.revision < before.control.highestAcceptedRevision)
        throw new MobileMediaCatalogError('invalid-candidate');
      if (candidate.release.revision === before.control.highestAcceptedRevision) {
        const matchingBundle = Object.values(before.bundles).some(
          (bundle) =>
            bundle?.revision === candidate.release.revision &&
            bundle.transportSha256 === transportSha256,
        );
        if (!matchingBundle) throw new MobileMediaCatalogError('conflict');
        if (nextSafety(candidate, input.rawBundle, before.safety) === null)
          throw new MobileMediaCatalogError('protected');
        await done(transaction);
        return before;
      }
      if (nextSafety(candidate, input.rawBundle, before.safety) === null)
        throw new MobileMediaCatalogError('protected');
      const bundle: Bundle = Object.freeze({
        recordVersion: 1,
        slot: 'candidate',
        rawBundle: input.rawBundle,
        transportSha256,
        revision: candidate.release.revision,
      });
      await req(transaction.objectStore('mediaBundles').put(bundle));
      const control: Control = Object.freeze({
        ...before.control,
        generation: before.control.generation + 1,
        highestAcceptedRevision: candidate.release.revision,
        candidate: 'candidate',
      });
      await req(transaction.objectStore('mediaControl').put(control));
      let after: CatalogState;
      try {
        after = await state(transaction, clock, buildPins);
      } catch {
        throw new MobileMediaCatalogError('storage-failure');
      }
      if (!eq(after.control, control) || !eq(after.bundles.candidate, bundle))
        throw new MobileMediaCatalogError('storage-failure');
      await done(transaction);
      return after;
    } catch (error) {
      abort(transaction);
      if (error instanceof MobileMediaCatalogError) throw error;
      throw new MobileMediaCatalogError('storage-failure');
    }
  };
  const rotate = async (expectedGeneration: number, target: 'candidate' | 'previous') => {
    const beforeRead = await snapshot();
    const bundle = beforeRead.bundles[target];
    if (bundle === null || beforeRead.control.generation !== expectedGeneration)
      throw new MobileMediaCatalogError('conflict');
    const candidate = await parseRawBundle(bundle.rawBundle, clock, buildPins);
    if (candidate === null) throw new MobileMediaCatalogError('invalid-candidate');
    const transaction = db.transaction(stores, 'readwrite');
    try {
      const before = await state(transaction, clock, buildPins);
      const current = before.bundles[target];
      if (
        before.control.generation !== expectedGeneration ||
        current === null ||
        !eq(current.rawBundle, bundle.rawBundle)
      )
        throw new MobileMediaCatalogError('conflict');
      const freshNow = validClock(clock);
      if (
        freshNow === null ||
        validateMobileMediaCandidate(
          candidate.release,
          candidate.documents,
          candidate.raw,
          () => freshNow,
        ) === null
      )
        throw new MobileMediaCatalogError('invalid-candidate');
      const safety =
        target === 'candidate'
          ? nextSafety(candidate, current.rawBundle, before.safety)
          : before.safety.revision >= candidate.release.revocationFloor
            ? before.safety
            : null;
      if (safety === null || candidateBlocked(candidate, safety))
        throw new MobileMediaCatalogError('protected');
      if (!eq(safety, before.safety)) {
        await req(transaction.objectStore('mediaSafety').put(safety));
        if (!eq(await req(transaction.objectStore('mediaSafety').get('safety')), safety))
          throw new MobileMediaCatalogError('storage-failure');
      }
      const active = before.bundles.active;
      const expectedActive: Bundle = Object.freeze({ ...current, slot: 'active' });
      const expectedPrevious =
        active === null ? null : Object.freeze({ ...active, slot: 'previous' });
      const expectedCandidate = target === 'candidate' ? null : before.bundles.candidate;
      if (target === 'candidate') {
        if (active) await req(transaction.objectStore('mediaBundles').put(expectedPrevious));
        await req(transaction.objectStore('mediaBundles').put(expectedActive));
        await req(transaction.objectStore('mediaBundles').delete('candidate'));
      } else {
        if (active) await req(transaction.objectStore('mediaBundles').put(expectedPrevious));
        await req(transaction.objectStore('mediaBundles').put(expectedActive));
      }
      const control: Control = Object.freeze({
        ...before.control,
        generation: before.control.generation + 1,
        active: 'active',
        candidate: target === 'candidate' ? null : before.control.candidate,
        previous: active ? 'previous' : null,
      });
      await req(transaction.objectStore('mediaControl').put(control));
      let after: CatalogState;
      try {
        after = await state(transaction, clock, buildPins);
      } catch {
        throw new MobileMediaCatalogError('storage-failure');
      }
      if (
        !eq(after.control, control) ||
        !eq(after.bundles.active, expectedActive) ||
        !eq(after.bundles.previous, expectedPrevious) ||
        !eq(after.bundles.candidate, expectedCandidate) ||
        !eq(after.safety, safety)
      )
        throw new MobileMediaCatalogError('storage-failure');
      await done(transaction);
      return after;
    } catch (error) {
      abort(transaction);
      if (error instanceof MobileMediaCatalogError) throw error;
      throw new MobileMediaCatalogError('storage-failure');
    }
  };
  const activate = (expectedGeneration: number) => rotate(expectedGeneration, 'candidate');
  const rollback = (expectedGeneration: number) => rotate(expectedGeneration, 'previous');
  return Object.freeze({ snapshot, saveCandidate, activate, rollback, close: () => db.close() });
}
