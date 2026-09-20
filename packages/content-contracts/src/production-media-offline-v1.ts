import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.js';
import {
  productionMediaDocumentsV1,
  snapshotProductionMediaSafetyV1,
  type ProductionMediaSafetyV1,
} from './production-media-v1.js';

export const productionMediaOfflineFormatV1 = 'wrn.production-media-offline.v1' as const;
export const productionMediaOfflineLimitsV1 = Object.freeze({
  controlBytes: 393_216,
  bundleBytes: 1_048_576,
  totalBytes: 3_538_944,
  bundles: 3,
  identities: 512,
});
type Row = Record<string, unknown>;
type Doc = (typeof productionMediaDocumentsV1)[number];
export type ProductionMediaOfflineIdentityV1 = Readonly<{
  releaseRevision: string;
  sequence: number;
  descriptorSha256: string;
  key: string;
}>;
export type ProductionMediaOfflineControlV1 = Readonly<{
  format: typeof productionMediaOfflineFormatV1;
  generation: number;
  clearEpoch: number;
  activeKey: string | null;
  previousKey: string | null;
  candidateKey: string | null;
  pendingRecheck: Readonly<{ operationId: string; generation: number; clearEpoch: number }> | null;
  lastSuccessfulSourceCheckAt: number | null;
  lastObservedAt: number | null;
  safety: ProductionMediaSafetyV1;
  highestAcceptedSequence: number;
  acceptedIdentities: readonly ProductionMediaOfflineIdentityV1[];
}>;
export type ProductionMediaOfflineBundleV1 = Readonly<{
  format: typeof productionMediaOfflineFormatV1;
  key: string;
  byteLength: number;
  checkedAt: number;
  admittedSafety: ProductionMediaSafetyV1;
  pointerRaw: string;
  descriptorRaw: string;
  documentsRaw: Readonly<Record<Doc, string>>;
}>;
const record = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exact = (value: unknown, keys: readonly string[]): value is Row =>
  record(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const safe = (value: unknown, minimum = 0): value is number =>
  Number.isSafeInteger(value) && (value as number) >= minimum;
const release = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(value);
const sha = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const operation = (value: unknown): value is string =>
  typeof value === 'string' && /^[!-~]{1,128}$/.test(value);
const slot = (value: unknown): value is string | null => value === null || sha(value);
function frozen<T>(value: T): T {
  const copy = JSON.parse(canonicalJson(value)) as T;
  const visit = (candidate: unknown): void => {
    if (candidate !== null && typeof candidate === 'object') {
      Object.values(candidate).forEach(visit);
      Object.freeze(candidate);
    }
  };
  visit(copy);
  return copy;
}
export const productionMediaOfflineUtf8Bytes = (value: unknown): number =>
  utf8ByteLength(canonicalJson(value));
export function productionMediaOfflineFitsLimitV1(
  kind: 'control' | 'bundle' | 'total',
  byteLength: number,
): boolean {
  if (
    !['control', 'bundle', 'total'].includes(kind) ||
    !Number.isSafeInteger(byteLength) ||
    byteLength < 0
  )
    return false;
  const limit =
    kind === 'control'
      ? productionMediaOfflineLimitsV1.controlBytes
      : kind === 'bundle'
        ? productionMediaOfflineLimitsV1.bundleBytes
        : productionMediaOfflineLimitsV1.totalBytes;
  return byteLength <= limit;
}
export function productionMediaOfflineFixedBytes(value: Row): number | null {
  if (!Object.hasOwn(value, 'byteLength')) return null;
  for (let byteLength = 0, round = 0; round < 17; round += 1) {
    const next = productionMediaOfflineUtf8Bytes({ ...value, byteLength });
    if (next === byteLength) return next;
    byteLength = next;
  }
  return null;
}
export async function productionMediaOfflineBundleKeyV1(identity: {
  readonly releaseRevision: string;
  readonly sequence: number;
  readonly descriptorSha256: string;
}): Promise<string | null> {
  if (
    !release(identity.releaseRevision) ||
    !safe(identity.sequence, 1) ||
    !sha(identity.descriptorSha256)
  )
    return null;
  try {
    return await sha256Utf8(
      canonicalJson({
        releaseRevision: identity.releaseRevision,
        sequence: identity.sequence,
        descriptorSha256: identity.descriptorSha256,
      }),
    );
  } catch {
    return null;
  }
}
export function isProductionMediaOfflineIdentityV1(
  value: unknown,
): value is ProductionMediaOfflineIdentityV1 {
  return (
    exact(value, ['releaseRevision', 'sequence', 'descriptorSha256', 'key']) &&
    release(value.releaseRevision) &&
    safe(value.sequence, 1) &&
    sha(value.descriptorSha256) &&
    sha(value.key)
  );
}
function isDocumentsRaw(value: unknown): value is Record<Doc, string> {
  return (
    exact(value, productionMediaDocumentsV1) &&
    productionMediaDocumentsV1.every(
      (name) => typeof value[name] === 'string' && value[name].isWellFormed(),
    )
  );
}
export function createEmptyProductionMediaOfflineControlV1(): ProductionMediaOfflineControlV1 {
  return frozen({
    format: productionMediaOfflineFormatV1,
    generation: 0,
    clearEpoch: 0,
    activeKey: null,
    previousKey: null,
    candidateKey: null,
    pendingRecheck: null,
    lastSuccessfulSourceCheckAt: null,
    lastObservedAt: null,
    safety: { revision: 0, floor: 0, revocationSha256: null, entries: [] },
    highestAcceptedSequence: 0,
    acceptedIdentities: [],
  });
}
export function isProductionMediaOfflineControlV1(
  value: unknown,
): value is ProductionMediaOfflineControlV1 {
  if (
    !exact(value, [
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
    value.format !== productionMediaOfflineFormatV1 ||
    !safe(value.generation) ||
    !safe(value.clearEpoch) ||
    !slot(value.activeKey) ||
    !slot(value.previousKey) ||
    !slot(value.candidateKey) ||
    ![value.lastSuccessfulSourceCheckAt, value.lastObservedAt].every(
      (item) => item === null || safe(item),
    ) ||
    snapshotProductionMediaSafetyV1(value.safety) === null ||
    !safe(value.highestAcceptedSequence) ||
    !Array.isArray(value.acceptedIdentities) ||
    value.acceptedIdentities.length > productionMediaOfflineLimitsV1.identities ||
    !value.acceptedIdentities.every(isProductionMediaOfflineIdentityV1)
  )
    return false;
  const identities = value.acceptedIdentities as ProductionMediaOfflineIdentityV1[];
  if (
    identities.some(
      (entry, index) => index > 0 && entry.sequence <= identities[index - 1]!.sequence,
    ) ||
    new Set(identities.map((entry) => entry.releaseRevision)).size !== identities.length ||
    new Set(identities.map((entry) => entry.sequence)).size !== identities.length ||
    new Set(identities.map((entry) => entry.descriptorSha256)).size !== identities.length ||
    new Set(identities.map((entry) => entry.key)).size !== identities.length ||
    value.highestAcceptedSequence !== (identities.at(-1)?.sequence ?? 0)
  )
    return false;
  const keys = [value.activeKey, value.previousKey, value.candidateKey].filter(
    (item): item is string => item !== null,
  );
  if (new Set(keys).size !== keys.length) return false;
  return (
    value.pendingRecheck === null ||
    (exact(value.pendingRecheck, ['operationId', 'generation', 'clearEpoch']) &&
      operation(value.pendingRecheck.operationId) &&
      safe(value.pendingRecheck.generation) &&
      safe(value.pendingRecheck.clearEpoch) &&
      value.pendingRecheck.generation === value.generation &&
      value.pendingRecheck.clearEpoch === value.clearEpoch)
  );
}
export function isProductionMediaOfflineBundleV1(
  value: unknown,
): value is ProductionMediaOfflineBundleV1 {
  return (
    exact(value, [
      'format',
      'key',
      'byteLength',
      'checkedAt',
      'admittedSafety',
      'pointerRaw',
      'descriptorRaw',
      'documentsRaw',
    ]) &&
    value.format === productionMediaOfflineFormatV1 &&
    sha(value.key) &&
    safe(value.byteLength, 1) &&
    safe(value.checkedAt) &&
    snapshotProductionMediaSafetyV1(value.admittedSafety) !== null &&
    typeof value.pointerRaw === 'string' &&
    value.pointerRaw.isWellFormed() &&
    typeof value.descriptorRaw === 'string' &&
    value.descriptorRaw.isWellFormed() &&
    isDocumentsRaw(value.documentsRaw) &&
    productionMediaOfflineFixedBytes(value) === value.byteLength &&
    value.byteLength <= productionMediaOfflineLimitsV1.bundleBytes
  );
}
export function productionMediaOfflineStateBytesV1(
  control: ProductionMediaOfflineControlV1,
  bundles: readonly ProductionMediaOfflineBundleV1[],
): number | null {
  if (
    !isProductionMediaOfflineControlV1(control) ||
    !bundles.every(isProductionMediaOfflineBundleV1)
  )
    return null;
  const controlBytes = productionMediaOfflineUtf8Bytes(control);
  const bytes = controlBytes + bundles.reduce((total, bundle) => total + bundle.byteLength, 0);
  return productionMediaOfflineFitsLimitV1('control', controlBytes) &&
    bundles.length <= productionMediaOfflineLimitsV1.bundles &&
    productionMediaOfflineFitsLimitV1('total', bytes)
    ? bytes
    : null;
}
