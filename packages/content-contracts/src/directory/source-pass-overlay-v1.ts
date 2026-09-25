import type { MobileContentDirectory } from './mobile-content-directory-v1.js';
// @ts-expect-error Node 24 executes the TypeScript contract source directly.
import { normaliseDirectoryUrl } from './mobile-content-directory-v1.ts';

export const sourcePassOverlaySchema = 'wrn.source-pass-overlay.v1' as const;
export const sourcePassOverlayMaxBytes = 512 * 1024;

export type SourcePassEvidenceKind =
  'direct-observation' | 'source-self-description' | 'rights' | 'editorial-inference';
export type SourcePassRightMedium = 'metadata' | 'text' | 'image' | 'audio' | 'logo';
export type SourcePassRightStatus = 'allowed' | 'link-only' | 'unknown' | 'prohibited';
export type SourcePassHealth = 'healthy' | 'degraded' | 'inactive' | 'unchecked' | 'not-applicable';

export type SourcePassEvidence = Readonly<{
  id: string;
  kind: SourcePassEvidenceKind;
  url: string;
  observedAt: string;
  note: string;
}>;
export type SourcePassDescription = Readonly<{
  text: string;
  language: string;
  evidenceIds: readonly string[];
}>;
export type SourcePassEndpoint = Readonly<{
  kind: 'directory' | 'direct';
  endpointId: string;
  url: string | null;
  role: 'homepage' | 'feed';
  health: SourcePassHealth;
  checkedAt: string;
  lastSuccessfulAt: string | null;
  evidenceIds: readonly string[];
}>;
export type SourcePassRight = Readonly<{
  medium: SourcePassRightMedium;
  status: SourcePassRightStatus;
  evidenceIds: readonly string[];
}>;
export type SourcePassLogo = Readonly<{
  path: string;
  mimeType: 'image/png' | 'image/webp';
  byteLength: number;
  sha256: string;
  alt: string;
}>;
export type SourcePassCorrectionContact =
  | Readonly<{
      status: 'verified-url';
      url: string;
      checkedAt: string;
      evidenceIds: readonly string[];
    }>
  | Readonly<{
      status: 'checked-not-found';
      url: null;
      checkedAt: string;
      evidenceIds: readonly string[];
    }>;
export type SourcePassRecord = Readonly<{
  id: string;
  canonicalName: string;
  aliasNames: readonly string[];
  curationStatus: 'active' | 'rare' | 'archive' | 'organization';
  selfDescription: SourcePassDescription;
  editorialDescription: SourcePassDescription;
  endpoints: readonly SourcePassEndpoint[];
  preferenceAnchorEndpointId: string;
  originalEndpointId: string;
  regions: readonly string[];
  countries: readonly string[];
  languages: readonly string[];
  topics: readonly string[];
  tendencies: readonly string[];
  mediaTypes: readonly string[];
  rights: readonly SourcePassRight[];
  logo: SourcePassLogo | null;
  correctionContact: SourcePassCorrectionContact;
  evidenceIds: readonly string[];
}>;
export type SourcePassRelation = Readonly<{
  fromId: string;
  toId: string;
  type: 'alias' | 'successor';
  evidenceIds: readonly string[];
}>;
export type SourcePassOverlayV1 = Readonly<{
  schema: typeof sourcePassOverlaySchema;
  contractVersion: '1.1.0';
  revision: string;
  sequence: number;
  reviewedAt: string;
  records: readonly SourcePassRecord[];
  relations: readonly SourcePassRelation[];
  evidence: readonly SourcePassEvidence[];
}>;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const text = (value: unknown, max = 512): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  ![...value].some((character) => (character.codePointAt(0) ?? 0) < 32);
const https = (value: unknown): value is string => {
  if (!text(value, 2048)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
const iso = (value: unknown): value is string => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value)
  )
    return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return false;
  const expected = value.includes('.') ? value : value.replace('Z', '.000Z');
  return parsed.toISOString() === expected;
};
const uniqueText = (value: unknown, max = 64): value is string[] =>
  Array.isArray(value) &&
  value.length <= max &&
  value.every((entry) => text(entry, 128)) &&
  new Set(value).size === value.length;
const sourcePassId = (value: unknown): value is string =>
  typeof value === 'string' && /^wrn-source-pass-[a-f0-9]{32}$/u.test(value);
const endpointId = (value: unknown): value is string =>
  typeof value === 'string' && /^source-[a-f0-9]{64}$/u.test(value);
const evidenceId = (value: unknown): value is string =>
  typeof value === 'string' && /^evidence-[a-z0-9-]{1,64}$/u.test(value);

function validEvidence(value: unknown): value is SourcePassEvidence {
  return (
    record(value) &&
    exact(value, ['id', 'kind', 'url', 'observedAt', 'note']) &&
    evidenceId(value.id) &&
    ['direct-observation', 'source-self-description', 'rights', 'editorial-inference'].includes(
      value.kind as string,
    ) &&
    https(value.url) &&
    iso(value.observedAt) &&
    text(value.note, 1200)
  );
}
function validDescription(value: unknown): value is SourcePassDescription {
  return (
    record(value) &&
    exact(value, ['text', 'language', 'evidenceIds']) &&
    text(value.text, 1200) &&
    text(value.language, 16) &&
    uniqueText(value.evidenceIds)
  );
}
function validEndpoint(value: unknown): value is SourcePassEndpoint {
  return (
    record(value) &&
    exact(value, [
      'kind',
      'endpointId',
      'url',
      'role',
      'health',
      'checkedAt',
      'lastSuccessfulAt',
      'evidenceIds',
    ]) &&
    ['directory', 'direct'].includes(value.kind as string) &&
    endpointId(value.endpointId) &&
    (value.kind === 'directory'
      ? value.url === null
      : https(value.url) && normaliseDirectoryUrl(value.url) === value.url) &&
    ['homepage', 'feed'].includes(value.role as string) &&
    ['healthy', 'degraded', 'inactive', 'unchecked', 'not-applicable'].includes(
      value.health as string,
    ) &&
    iso(value.checkedAt) &&
    (value.lastSuccessfulAt === null || iso(value.lastSuccessfulAt)) &&
    (value.health === 'healthy' ? value.lastSuccessfulAt !== null : true) &&
    uniqueText(value.evidenceIds)
  );
}
function validRight(value: unknown): value is SourcePassRight {
  return (
    record(value) &&
    exact(value, ['medium', 'status', 'evidenceIds']) &&
    ['metadata', 'text', 'image', 'audio', 'logo'].includes(value.medium as string) &&
    ['allowed', 'link-only', 'unknown', 'prohibited'].includes(value.status as string) &&
    uniqueText(value.evidenceIds)
  );
}
function validLogo(value: unknown): value is SourcePassLogo | null {
  return (
    value === null ||
    (record(value) &&
      exact(value, ['path', 'mimeType', 'byteLength', 'sha256', 'alt']) &&
      typeof value.path === 'string' &&
      /^assets\/source-logos\/[a-z0-9-]+\.(?:png|webp)$/u.test(value.path) &&
      ['image/png', 'image/webp'].includes(value.mimeType as string) &&
      Number.isSafeInteger(value.byteLength) &&
      (value.byteLength as number) > 0 &&
      (value.byteLength as number) <= 256 * 1024 &&
      typeof value.sha256 === 'string' &&
      /^[a-f0-9]{64}$/u.test(value.sha256) &&
      text(value.alt, 200))
  );
}
function validContact(value: unknown): value is SourcePassCorrectionContact {
  if (
    !record(value) ||
    !exact(value, ['status', 'url', 'checkedAt', 'evidenceIds']) ||
    !iso(value.checkedAt) ||
    !uniqueText(value.evidenceIds)
  )
    return false;
  return value.status === 'verified-url'
    ? https(value.url)
    : value.status === 'checked-not-found' && value.url === null;
}
function validRecord(value: unknown): value is SourcePassRecord {
  if (
    !record(value) ||
    !exact(value, [
      'id',
      'canonicalName',
      'aliasNames',
      'curationStatus',
      'selfDescription',
      'editorialDescription',
      'endpoints',
      'preferenceAnchorEndpointId',
      'originalEndpointId',
      'regions',
      'countries',
      'languages',
      'topics',
      'tendencies',
      'mediaTypes',
      'rights',
      'logo',
      'correctionContact',
      'evidenceIds',
    ]) ||
    !sourcePassId(value.id) ||
    !text(value.canonicalName, 160) ||
    !uniqueText(value.aliasNames) ||
    !['active', 'rare', 'archive', 'organization'].includes(value.curationStatus as string) ||
    !validDescription(value.selfDescription) ||
    !validDescription(value.editorialDescription) ||
    !Array.isArray(value.endpoints) ||
    value.endpoints.length === 0 ||
    !value.endpoints.every(validEndpoint) ||
    !endpointId(value.preferenceAnchorEndpointId) ||
    !endpointId(value.originalEndpointId) ||
    !uniqueText(value.regions) ||
    !uniqueText(value.countries) ||
    !uniqueText(value.languages) ||
    !uniqueText(value.topics) ||
    !uniqueText(value.tendencies) ||
    !uniqueText(value.mediaTypes) ||
    !Array.isArray(value.rights) ||
    value.rights.length !== 5 ||
    !value.rights.every(validRight) ||
    !validLogo(value.logo) ||
    !validContact(value.correctionContact) ||
    !uniqueText(value.evidenceIds)
  )
    return false;
  const endpoints = value.endpoints as SourcePassEndpoint[];
  const endpointIds = endpoints.map((entry) => entry.endpointId);
  const rights = value.rights as SourcePassRight[];
  return (
    new Set(endpointIds).size === endpointIds.length &&
    endpointIds.includes(value.preferenceAnchorEndpointId as string) &&
    endpointIds.includes(value.originalEndpointId as string) &&
    new Set(rights.map((entry) => entry.medium)).size === 5 &&
    (value.logo === null || rights.find((entry) => entry.medium === 'logo')?.status === 'allowed')
  );
}

export function validateSourcePassOverlayV1(value: unknown): value is SourcePassOverlayV1 {
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > sourcePassOverlayMaxBytes)
      return false;
  } catch {
    return false;
  }
  if (
    !record(value) ||
    !exact(value, [
      'schema',
      'contractVersion',
      'revision',
      'sequence',
      'reviewedAt',
      'records',
      'relations',
      'evidence',
    ]) ||
    value.schema !== sourcePassOverlaySchema ||
    value.contractVersion !== '1.1.0' ||
    !text(value.revision, 128) ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) < 1 ||
    !iso(value.reviewedAt) ||
    !Array.isArray(value.records) ||
    value.records.length > 100 ||
    !value.records.every(validRecord) ||
    !Array.isArray(value.relations) ||
    !Array.isArray(value.evidence) ||
    !value.evidence.every(validEvidence)
  )
    return false;
  const records = value.records as SourcePassRecord[];
  const relations = value.relations as SourcePassRelation[];
  const evidence = value.evidence as SourcePassEvidence[];
  const recordIds = records.map((entry) => entry.id);
  const allEndpointIds = records.flatMap((entry) => entry.endpoints.map((item) => item.endpointId));
  const evidenceIds = evidence.map((entry) => entry.id);
  if (
    new Set(recordIds).size !== recordIds.length ||
    new Set(allEndpointIds).size !== allEndpointIds.length ||
    new Set(evidenceIds).size !== evidenceIds.length
  )
    return false;
  const knownEvidence = new Set(evidenceIds);
  const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));
  const refs = records.flatMap((entry) => [
    ...entry.evidenceIds,
    ...entry.selfDescription.evidenceIds,
    ...entry.editorialDescription.evidenceIds,
    ...entry.endpoints.flatMap((endpoint) => endpoint.evidenceIds),
    ...entry.rights.flatMap((right) => right.evidenceIds),
    ...entry.correctionContact.evidenceIds,
  ]);
  if (!refs.every((id) => knownEvidence.has(id))) return false;
  if (
    !records.every(
      (entry) =>
        entry.endpoints.every((endpoint) =>
          endpoint.evidenceIds.some(
            (id) => evidenceById.get(id)?.observedAt === endpoint.checkedAt,
          ),
        ) &&
        entry.correctionContact.evidenceIds.some(
          (id) => evidenceById.get(id)?.observedAt === entry.correctionContact.checkedAt,
        ),
    )
  )
    return false;
  const knownRecords = new Set(recordIds);
  const graph = new Map<string, string[]>();
  for (const relation of relations) {
    if (
      !record(relation) ||
      !exact(relation, ['fromId', 'toId', 'type', 'evidenceIds']) ||
      !sourcePassId(relation.fromId) ||
      !sourcePassId(relation.toId) ||
      relation.fromId === relation.toId ||
      !['alias', 'successor'].includes(relation.type) ||
      !uniqueText(relation.evidenceIds) ||
      !knownRecords.has(relation.fromId) ||
      !knownRecords.has(relation.toId) ||
      !relation.evidenceIds.every((id) => knownEvidence.has(id))
    )
      return false;
    graph.set(relation.fromId, [...(graph.get(relation.fromId) ?? []), relation.toId]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cyclic = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    if ((graph.get(id) ?? []).some(cyclic)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return !recordIds.some(cyclic);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function validateSourcePassOverlayEndpointIdsV1(
  overlay: SourcePassOverlayV1,
): Promise<boolean> {
  if (!validateSourcePassOverlayV1(overlay)) return false;
  try {
    const direct = overlay.records.flatMap((record) =>
      record.endpoints.filter(
        (endpoint): endpoint is SourcePassEndpoint & { kind: 'direct'; url: string } =>
          endpoint.kind === 'direct' && endpoint.url !== null,
      ),
    );
    return (
      await Promise.all(
        direct.map(
          async (endpoint) => endpoint.endpointId === `source-${await sha256(endpoint.url)}`,
        ),
      )
    ).every(Boolean);
  } catch {
    return false;
  }
}

export async function projectSourcePassOverlayV1(
  overlay: SourcePassOverlayV1,
  directory: MobileContentDirectory,
  {
    revokedEndpointIds = [],
    allowDirect = true,
  }: Readonly<{ revokedEndpointIds?: readonly string[]; allowDirect?: boolean }> = {},
): Promise<SourcePassOverlayV1 | null> {
  if (!(await validateSourcePassOverlayEndpointIdsV1(overlay))) return null;
  const available = new Set(directory.sources.map((entry) => entry.id));
  const withdrawn = new Set(directory.withdrawals.endpointIds);
  const revoked = new Set(revokedEndpointIds);
  const endpointAvailable = (endpoint: SourcePassEndpoint) =>
    !revoked.has(endpoint.endpointId) &&
    !withdrawn.has(endpoint.endpointId) &&
    ((endpoint.kind === 'direct' && allowDirect) ||
      (available.has(endpoint.endpointId) && !withdrawn.has(endpoint.endpointId)));
  const records = overlay.records.filter(
    (entry) =>
      !revoked.has(entry.originalEndpointId) &&
      !revoked.has(entry.preferenceAnchorEndpointId) &&
      entry.endpoints.every(endpointAvailable),
  );
  const ids = new Set(records.map((entry) => entry.id));
  return Object.freeze({
    ...overlay,
    records: Object.freeze(records),
    relations: Object.freeze(
      overlay.relations.filter((relation) => ids.has(relation.fromId) && ids.has(relation.toId)),
    ),
  });
}
