// @ts-expect-error Node executes this production contract source directly.
import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.ts';
import {
  createProductionContentSafetyLedger,
  createValidatedProductionContentReleaseV1,
  isProductionContentSafetyLedgerV1,
  isProductionContentDescriptorV1,
  isProductionContentManifestV1,
  isProductionArchiveLifecycleV1,
  isConsistentProductionArchiveLifecycleV1,
  isProductionContentRevisionV1,
  type ProductionContentManifestV1,
  type ProductionContentReadyV1,
  type ProductionContentReleaseDescriptorV1,
  type ProductionContentReleaseDocumentsV1,
  type ProductionContentSafetyLedgerV1,
  // @ts-expect-error Node executes this production contract source directly.
} from './production-content-release-v1.ts';
import {
  productionContentPilotPolicy,
  type ProductionContentCapacityPolicy,
  // @ts-expect-error Node 24 executes this production contract source directly.
} from './production-content-capacity-policy.ts';

export const productionContentOfflineFormatV1 = 'wrn.production-content-offline.v1' as const;
export const productionContentOfflineBundleFormatV1 =
  'wrn.production-content-offline-bundle.v1' as const;
export const productionContentOfflineTtlMs = 24 * 60 * 60 * 1000;
export const productionContentOfflineBundleMaxBytes = 4 * 1024 * 1024;
export const productionContentOfflineTotalBundleMaxBytes = 12 * 1024 * 1024;
export const productionContentOfflineControlMaxBytes = 256 * 1024;
export const productionContentOfflineMaxBundles = 3 as const;
export const productionContentOfflineMaxIdentities = 512 as const;

export type ProductionContentAcceptedIdentityV1 = Readonly<{
  revision: string;
  sequence: number;
  key: string;
}>;

export type ProductionContentCurrentPointerV1 = Readonly<{
  schema: 'wrn.production-content-current.v1';
  releaseRevision: string;
  sequence: number;
  descriptorPath: string;
  descriptorSha256: string;
}>;

export type ProductionContentOfflineControlV1 = Readonly<{
  format: typeof productionContentOfflineFormatV1;
  generation: number;
  clearEpoch: number;
  activeKey: string | null;
  previousKey: string | null;
  candidateKey: string | null;
  pendingRecheck: Readonly<{
    operationId: string;
    generation: number;
    clearEpoch: number;
  }> | null;
  lastSuccessfulSourceCheckAt: number | null;
  lastObservedAt: number | null;
  safety: ProductionContentSafetyLedgerV1;
  /** This floor never decreases, including on explicit rollback and clear. */
  highestAcceptedSequence: number;
  /** Immutable revision identities outlive content clear and slot replacement. */
  acceptedIdentities: readonly ProductionContentAcceptedIdentityV1[];
}>;

export type ProductionContentOfflineBundleV1 = Readonly<{
  format: typeof productionContentOfflineBundleFormatV1;
  key: string;
  byteLength: number;
  checkedAt: number;
  descriptor: ProductionContentReleaseDescriptorV1;
  manifest: ProductionContentManifestV1;
  documents: ProductionContentReleaseDocumentsV1;
}>;

export type ProductionContentReleasePathsV1 = Readonly<{
  descriptor: string;
  manifest: string;
  admission: string;
  archiveLifecycle: string;
  articles: string;
  discoverIndex: string;
  readerDetails: string;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function nonEmpty(value: unknown, maximum = 4096): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= maximum
  );
}

function integer(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function sha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function snapshot<T>(value: T): T {
  const cloned = JSON.parse(canonicalJson(value)) as T;
  const freeze = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) candidate.forEach(freeze);
    else if (record(candidate)) Object.values(candidate).forEach(freeze);
    return Object.freeze(candidate);
  };
  return freeze(cloned) as T;
}

function isKey(value: unknown): value is string | null {
  return value === null || (nonEmpty(value, 256) && !/\s/.test(value));
}

function hasDistinctSlots(control: ProductionContentOfflineControlV1): boolean {
  const slots = [control.activeKey, control.previousKey, control.candidateKey].filter(
    (value): value is string => value !== null,
  );
  return new Set(slots).size === slots.length;
}

function isOfflineSafety(value: unknown): value is ProductionContentSafetyLedgerV1 {
  return (
    isProductionContentSafetyLedgerV1(value) ||
    (record(value) &&
      exactKeys(value, ['revision', 'revokedIds']) &&
      value.revision === 0 &&
      Array.isArray(value.revokedIds) &&
      value.revokedIds.length === 0)
  );
}

export function isProductionContentCurrentPointerV1(
  value: unknown,
): value is ProductionContentCurrentPointerV1 {
  return (
    record(value) &&
    exactKeys(value, [
      'schema',
      'releaseRevision',
      'sequence',
      'descriptorPath',
      'descriptorSha256',
    ]) &&
    value.schema === 'wrn.production-content-current.v1' &&
    isProductionContentRevisionV1(value.releaseRevision) &&
    integer(value.sequence) &&
    value.sequence > 0 &&
    nonEmpty(value.descriptorPath, 512) &&
    sha256(value.descriptorSha256)
  );
}

/** Only the hash-bound immutable local path is accepted; no publisher URL is followed. */
export function deriveProductionContentReleasePathsV1(
  pointer: ProductionContentCurrentPointerV1,
): ProductionContentReleasePathsV1 | null {
  if (!isProductionContentCurrentPointerV1(pointer)) return null;
  const root = `/wrn-production-content/${pointer.releaseRevision}`;
  if (
    pointer.descriptorPath !== `${root}/release-descriptor.json` &&
    pointer.descriptorPath !== `${pointer.releaseRevision}/release-descriptor.json`
  )
    return null;
  return Object.freeze({
    descriptor: `${root}/release-descriptor.json`,
    manifest: `${root}/manifest.json`,
    admission: `${root}/admission.json`,
    archiveLifecycle: `${root}/archive-lifecycle.json`,
    articles: `${root}/articles.json`,
    discoverIndex: `${root}/discover-index.json`,
    readerDetails: `${root}/reader-details.json`,
  });
}

export function createEmptyProductionContentOfflineControlV1(): ProductionContentOfflineControlV1 {
  return Object.freeze({
    format: productionContentOfflineFormatV1,
    generation: 0,
    clearEpoch: 0,
    activeKey: null,
    previousKey: null,
    candidateKey: null,
    pendingRecheck: null,
    lastSuccessfulSourceCheckAt: null,
    lastObservedAt: null,
    safety: Object.freeze({ revision: 0, revokedIds: Object.freeze([]) }),
    highestAcceptedSequence: 0,
    acceptedIdentities: Object.freeze([]),
  });
}

export function isProductionContentOfflineControlV1(
  value: unknown,
): value is ProductionContentOfflineControlV1 {
  if (
    !record(value) ||
    !exactKeys(value, [
      'format',
      'generation',
      'clearEpoch',
      'activeKey',
      'previousKey',
      'candidateKey',
      'pendingRecheck',
      'lastSuccessfulSourceCheckAt',
      'lastObservedAt',
      'safety',
      'highestAcceptedSequence',
      'acceptedIdentities',
    ]) ||
    value.format !== productionContentOfflineFormatV1 ||
    !integer(value.generation) ||
    !integer(value.clearEpoch) ||
    !integer(value.highestAcceptedSequence) ||
    !isKey(value.activeKey) ||
    !isKey(value.previousKey) ||
    !isKey(value.candidateKey) ||
    ![value.lastSuccessfulSourceCheckAt, value.lastObservedAt].every(
      (candidate) => candidate === null || integer(candidate),
    ) ||
    !isOfflineSafety(value.safety) ||
    !Array.isArray(value.acceptedIdentities) ||
    value.acceptedIdentities.length > productionContentOfflineMaxIdentities ||
    !value.acceptedIdentities.every(
      (entry) =>
        record(entry) &&
        exactKeys(entry, ['revision', 'sequence', 'key']) &&
        isProductionContentRevisionV1(entry.revision) &&
        integer(entry.sequence) &&
        entry.sequence > 0 &&
        sha256(entry.key),
    )
  )
    return false;
  const identities = value.acceptedIdentities as ProductionContentAcceptedIdentityV1[];
  if (
    identities.some(
      (entry, index) => index > 0 && entry.sequence <= identities[index - 1]!.sequence,
    ) ||
    new Set(identities.map((entry) => entry.revision)).size !== identities.length ||
    new Set(identities.map((entry) => entry.key)).size !== identities.length ||
    value.highestAcceptedSequence !== (identities.at(-1)?.sequence ?? 0)
  )
    return false;
  if (
    value.pendingRecheck !== null &&
    (!record(value.pendingRecheck) ||
      !exactKeys(value.pendingRecheck, ['operationId', 'generation', 'clearEpoch']) ||
      !nonEmpty(value.pendingRecheck.operationId, 128) ||
      !integer(value.pendingRecheck.generation) ||
      !integer(value.pendingRecheck.clearEpoch))
  )
    return false;
  return hasDistinctSlots(value as ProductionContentOfflineControlV1);
}

export function sameProductionContentOfflineSafetyV1(
  left: ProductionContentSafetyLedgerV1,
  right: ProductionContentSafetyLedgerV1,
): boolean {
  return (
    left.revision === right.revision &&
    canonicalJson(left.revokedIds) === canonicalJson(right.revokedIds)
  );
}

/** Revocations are append-only: a lower revision or a forgotten ID fails closed. */
export function mergeProductionContentOfflineSafetyV1(
  existing: ProductionContentSafetyLedgerV1,
  incoming: ProductionContentSafetyLedgerV1,
): ProductionContentSafetyLedgerV1 | null {
  if (!isOfflineSafety(existing) || !isOfflineSafety(incoming)) return null;
  if (incoming.revision < existing.revision) return null;
  if (!existing.revokedIds.every((id) => incoming.revokedIds.includes(id))) return null;
  if (
    incoming.revision === existing.revision &&
    !sameProductionContentOfflineSafetyV1(existing, incoming)
  )
    return null;
  return Object.freeze({
    revision: incoming.revision,
    revokedIds: Object.freeze([...incoming.revokedIds]),
  });
}

/** Uses the unchanged Core predicates for the partial, pre-payload safety phase. */
/**
 * Internal pre-payload safety validation. The public V1 function fixes the
 * pilot policy; later versions can supply their own already-bound manifest
 * shape without weakening the V1 acceptance surface.
 */
async function validateProductionContentSafetyEvidenceWithPolicyV1(
  input: {
    readonly descriptor: unknown;
    readonly manifest: unknown;
    readonly archiveLifecycle: unknown;
    readonly knownSafety: ProductionContentSafetyLedgerV1;
  },
  policy: ProductionContentCapacityPolicy,
  isManifest: (value: unknown) => boolean = isProductionContentManifestV1,
  isDescriptor: (value: unknown) => boolean = isProductionContentDescriptorV1,
): Promise<ProductionContentSafetyLedgerV1 | null> {
  let bound: typeof input;
  try {
    bound = snapshot(input);
  } catch {
    return null;
  }
  const { descriptor, manifest, archiveLifecycle, knownSafety } = bound;
  if (
    !isDescriptor(descriptor) ||
    !isManifest(manifest) ||
    !isProductionArchiveLifecycleV1(archiveLifecycle) ||
    !isOfflineSafety(knownSafety)
  )
    return null;
  const typedDescriptor = descriptor as ProductionContentReleaseDescriptorV1;
  const revision = typedDescriptor.releaseRevision;
  const typedManifest = manifest as ProductionContentManifestV1;
  const paths = {
    admission: 'admission.json',
    archiveLifecycle: 'archive-lifecycle.json',
    articles: 'articles.json',
    discoverIndex: 'discover-index.json',
    readerDetails: 'reader-details.json',
  } as const;
  if (
    typedManifest.revision !== revision ||
    typedDescriptor.expectedManifest.revision !== revision ||
    archiveLifecycle.revision !== revision ||
    Object.values(typedDescriptor.expectedComponents).some(
      (component) => component.revision !== revision,
    ) ||
    typedManifest.resources.some((resource) => resource.path !== paths[resource.id]) ||
    (policy.enforceSafetyResourceCaps &&
      (typedManifest.articleIds.length > policy.maxArticles ||
        typedManifest.resources.some(
          (resource) => resource.bytes > policy.maxResourceBytes[resource.id],
        ))) ||
    !isConsistentProductionArchiveLifecycleV1(archiveLifecycle, typedManifest.articleIds)
  )
    return null;
  const archiveResource = typedManifest.resources.find(
    (resource) => resource.id === 'archiveLifecycle',
  );
  if (archiveResource === undefined) return null;
  const archiveText = canonicalJson(archiveLifecycle);
  const archiveHash = await sha256Utf8(archiveText);
  if (
    typedDescriptor.expectedManifest.sha256 !== (await sha256Utf8(canonicalJson(typedManifest))) ||
    typedDescriptor.expectedComponents.archiveLifecycle.sha256 !== archiveHash ||
    archiveResource.sha256 !== archiveHash ||
    archiveResource.bytes !== utf8ByteLength(archiveText) ||
    archiveResource.recordCount !== archiveLifecycle.archiveArticleIds.length
  )
    return null;
  return mergeProductionContentOfflineSafetyV1(
    knownSafety,
    createProductionContentSafetyLedger(archiveLifecycle),
  );
}
export async function validateProductionContentSafetyEvidenceV1(input: {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly archiveLifecycle: unknown;
  readonly knownSafety: ProductionContentSafetyLedgerV1;
}): Promise<ProductionContentSafetyLedgerV1 | null> {
  return validateProductionContentSafetyEvidenceWithPolicyV1(input, productionContentPilotPolicy);
}
export async function createProductionContentOfflineBundleV1(input: {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly documents: unknown;
  readonly checkedAt: unknown;
  readonly knownSafety?: ProductionContentSafetyLedgerV1;
}): Promise<ProductionContentOfflineBundleV1> {
  const checkedAt = input.checkedAt;
  if (!integer(checkedAt)) throw new Error('Production offline bundle needs a safe checked time.');
  const knownSafety = snapshot(
    input.knownSafety ?? createEmptyProductionContentOfflineControlV1().safety,
  );
  if (!isOfflineSafety(knownSafety)) throw new Error('Production safety ledger is invalid.');
  const descriptor = snapshot(input.descriptor);
  const manifest = snapshot(input.manifest);
  const documents = snapshot(input.documents) as ProductionContentReleaseDocumentsV1;
  const ready = await createValidatedProductionContentReleaseV1({
    descriptor,
    manifest,
    documents,
    ...(knownSafety.revision === 0 ? {} : { knownSafety }),
  });
  if (ready === null) throw new Error('Production release cannot be made offline-ready.');
  const safety = mergeProductionContentOfflineSafetyV1(knownSafety, ready.safetyLedger);
  if (safety === null || !ready.articleIds.every((id) => !safety.revokedIds.includes(id)))
    throw new Error('Production release violates cumulative safety.');
  const byteLength = utf8ByteLength(
    canonicalJson({
      descriptor: ready.descriptor,
      manifest: ready.manifest,
      documents: ready.documents,
    }),
  );
  if (byteLength > productionContentOfflineBundleMaxBytes)
    throw new Error('Production offline bundle exceeds its cap.');
  const key = await sha256Utf8(
    canonicalJson({
      revision: ready.descriptor.releaseRevision,
      sequence: ready.descriptor.sequence,
      manifestSha256: ready.manifestSha256,
    }),
  );
  return Object.freeze({
    format: productionContentOfflineBundleFormatV1,
    key,
    byteLength,
    checkedAt,
    descriptor: snapshot(ready.descriptor),
    manifest: snapshot(ready.manifest),
    documents: snapshot(ready.documents),
  });
}

export async function validateProductionContentOfflineBundleV1(
  value: unknown,
  safety: ProductionContentSafetyLedgerV1,
): Promise<ProductionContentReadyV1 | null> {
  if (
    !record(value) ||
    !exactKeys(value, [
      'format',
      'key',
      'byteLength',
      'checkedAt',
      'descriptor',
      'manifest',
      'documents',
    ]) ||
    value.format !== productionContentOfflineBundleFormatV1 ||
    !sha256(value.key) ||
    !integer(value.byteLength) ||
    !integer(value.checkedAt) ||
    !isOfflineSafety(safety)
  )
    return null;
  try {
    const stored = snapshot(value);
    const currentSafety = snapshot(safety);
    const expected = await createProductionContentOfflineBundleV1({
      descriptor: stored.descriptor,
      manifest: stored.manifest,
      documents: stored.documents,
      checkedAt: stored.checkedAt,
    });
    if (expected.key !== stored.key || expected.byteLength !== stored.byteLength) return null;
    const ready = await createValidatedProductionContentReleaseV1({
      descriptor: expected.descriptor,
      manifest: expected.manifest,
      documents: expected.documents,
    });
    // Stored historical content is revalidated in full against its own immutable
    // receipt, then overlaid with the already durable cumulative safety ledger.
    // A newer source check need not destroy an otherwise safe rollback slot.
    if (
      ready === null ||
      mergeProductionContentOfflineSafetyV1(ready.safetyLedger, currentSafety) === null ||
      ready.articleIds.some((id) => currentSafety.revokedIds.includes(id))
    )
      return null;
    return ready;
  } catch {
    return null;
  }
}
