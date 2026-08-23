/**
 * Lokaler, browserfaehiger Manifest-v1-Vertrag fuer WRN-G3-002.
 * Er beschreibt keine HTTP-Auslieferung und fuehrt keine Requests aus.
 */
export const localManifestContractVersion = '1.0.0' as const;
export const localArticleResourceSchema = 'wrn.local-article-records.v1' as const;
export const localEmptyResourceSchema = 'wrn.local-empty-items.v1' as const;

export const resourceAvailabilities = ['required', 'optional-empty', 'optional-absent'] as const;
export type ResourceAvailability = (typeof resourceAvailabilities)[number];

export const fallbackClasses = ['fail-closed', 'render-empty', 'render-optional-absent'] as const;
export type FallbackClass = (typeof fallbackClasses)[number];

export interface LocalArticle {
  readonly id: string;
  readonly title: string;
  readonly teaser: string;
  readonly publishedAt: string;
  readonly originalUrl: string;
  readonly source: {
    readonly id: string;
    readonly name: string;
  };
  readonly originalLanguage: string;
  readonly tags: readonly string[];
  readonly rights: {
    readonly status: string;
    readonly reference: string;
  };
  readonly transformation: {
    readonly status: 'original' | 'transformed' | 'unknown';
    readonly reference: string;
  };
  readonly translation: {
    readonly status: 'not-requested' | 'available' | 'unknown';
    readonly reference: string;
  };
}

export interface LocalArticleResourcePayload {
  readonly articles: readonly LocalArticle[];
}

export interface LocalEmptyResourcePayload {
  readonly items: readonly never[];
}

export type LocalResourcePayload = LocalArticleResourcePayload | LocalEmptyResourcePayload;

interface ResourceBase {
  readonly id: string;
  readonly path: string;
  readonly schema: typeof localArticleResourceSchema | typeof localEmptyResourceSchema;
  readonly owner: string;
  readonly fallbackClass: FallbackClass;
}

export interface PresentResource extends ResourceBase {
  readonly availability: 'required' | 'optional-empty';
  readonly sha256: string;
  readonly bytes: number;
  readonly recordCount: number;
}

export interface AbsentResource extends ResourceBase {
  readonly availability: 'optional-absent';
  readonly absence: {
    readonly reason: string;
    readonly uiState: 'optional-absent';
    readonly nextReviewAt: string;
  };
}

export type LocalManifestResource = PresentResource | AbsentResource;

export interface LocalManifestV1 {
  readonly contractVersion: typeof localManifestContractVersion;
  readonly revision: string;
  readonly generatedAt: string;
  readonly sourceCommit: string;
  readonly resources: readonly LocalManifestResource[];
  readonly articleSets: {
    readonly activeFeedIds: readonly string[];
    readonly archiveIds: readonly string[];
    readonly landingIds: readonly string[];
    readonly redirectSourceIds: readonly string[];
    readonly sitemapArticleIds: readonly string[];
  };
  readonly articleSetHashes: {
    readonly activeFeedIds: string;
    readonly archiveIds: string;
    readonly landingIds: string;
    readonly redirectSourceIds: string;
    readonly sitemapArticleIds: string;
  };
  readonly compatibility: {
    readonly minContractVersion: typeof localManifestContractVersion;
    readonly maxContractVersion: typeof localManifestContractVersion;
  };
  readonly provenance: {
    readonly generatorVersion: string;
    readonly fixtureSeedCommit: string;
    readonly sourceKind: 'self-authored-local-fixture';
  };
  readonly revocationRevision: string;
}

export interface ManifestValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export interface ManifestIntegrityInput {
  readonly manifest: LocalManifestV1;
  /** Untrusted local values werden erst im Validator auf ihr Schema geprueft. */
  readonly payloads: Readonly<Record<string, unknown>>;
}

export interface ManifestIntegrityResult extends ManifestValidationResult {
  readonly resourceHashes: Readonly<Record<string, string>>;
}

const sha256Pattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
const opaqueIdPattern = /^wrn-test-art-[a-z0-9-]+$/;
const utcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const languagePattern = /^(?:und|[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/;
const localFixturePathPattern = /^local-fixture:\/\/wrn-g3-002\/[a-z0-9][a-z0-9-]*\.json$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUtcTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    utcTimestampPattern.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isSortedUnique(values: readonly string[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1]! < value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isSubset(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right);
  return left.every((entry) => rightSet.has(entry));
}

function isDisjoint(left: readonly string[], right: readonly string[]): boolean {
  const rightSet = new Set(right);
  return left.every((entry) => !rightSet.has(entry));
}

function isOpaqueArticleId(value: unknown): value is string {
  return typeof value === 'string' && opaqueIdPattern.test(value);
}

/** Der lokale Slice kennt keine HTTP-, Datei- oder relativen Resourcepfade. */
function isLocalFixturePath(value: unknown): value is string {
  return typeof value === 'string' && localFixturePathPattern.test(value);
}

/** Der lokale Teaser ist ein vollstaendiger, sichtbarer erster Satz. */
function isCompleteFixtureTeaser(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const trimmed = value.trim();
  return !trimmed.endsWith('...') && !trimmed.endsWith('…') && /[.!?]$/.test(trimmed);
}

function isArticle(value: unknown): value is LocalArticle {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'teaser',
      'publishedAt',
      'originalUrl',
      'source',
      'originalLanguage',
      'tags',
      'rights',
      'transformation',
      'translation',
    ]) ||
    !isOpaqueArticleId(value.id) ||
    !isNonEmptyString(value.title) ||
    !isCompleteFixtureTeaser(value.teaser) ||
    !isUtcTimestamp(value.publishedAt) ||
    !isNonEmptyString(value.originalUrl) ||
    !isPlainRecord(value.source) ||
    !hasExactKeys(value.source, ['id', 'name']) ||
    !isNonEmptyString(value.source.id) ||
    !isNonEmptyString(value.source.name) ||
    typeof value.originalLanguage !== 'string' ||
    !languagePattern.test(value.originalLanguage) ||
    !isStringArray(value.tags) ||
    value.tags.length === 0 ||
    !value.tags.every(isNonEmptyString) ||
    !isPlainRecord(value.rights) ||
    !hasExactKeys(value.rights, ['status', 'reference']) ||
    !isNonEmptyString(value.rights.status) ||
    !isNonEmptyString(value.rights.reference) ||
    !isPlainRecord(value.transformation) ||
    !hasExactKeys(value.transformation, ['status', 'reference']) ||
    !['original', 'transformed', 'unknown'].includes(value.transformation.status as string) ||
    !isNonEmptyString(value.transformation.reference) ||
    !isPlainRecord(value.translation) ||
    !hasExactKeys(value.translation, ['status', 'reference']) ||
    !['not-requested', 'available', 'unknown'].includes(value.translation.status as string) ||
    !isNonEmptyString(value.translation.reference)
  ) {
    return false;
  }

  try {
    const url = new URL(value.originalUrl);
    return url.protocol === 'https:' && url.hostname.endsWith('.invalid');
  } catch {
    return false;
  }
}

function isArticlePayload(value: unknown): value is LocalArticleResourcePayload {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['articles']) &&
    Array.isArray(value.articles) &&
    value.articles.every(isArticle) &&
    new Set(value.articles.map((article) => article.id)).size === value.articles.length
  );
}

function isEmptyPayload(value: unknown): value is LocalEmptyResourcePayload {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['items']) &&
    Array.isArray(value.items) &&
    value.items.length === 0
  );
}

function isResource(value: unknown): value is LocalManifestResource {
  if (!isPlainRecord(value) || !isNonEmptyString(value.id) || !isLocalFixturePath(value.path)) {
    return false;
  }

  if (value.schema !== localArticleResourceSchema && value.schema !== localEmptyResourceSchema) {
    return false;
  }

  if (
    !isNonEmptyString(value.owner) ||
    !fallbackClasses.includes(value.fallbackClass as FallbackClass)
  ) {
    return false;
  }

  if (value.availability === 'optional-absent') {
    return (
      hasExactKeys(value, [
        'id',
        'path',
        'schema',
        'owner',
        'fallbackClass',
        'availability',
        'absence',
      ]) &&
      value.fallbackClass === 'render-optional-absent' &&
      isPlainRecord(value.absence) &&
      hasExactKeys(value.absence, ['reason', 'uiState', 'nextReviewAt']) &&
      isNonEmptyString(value.absence.reason) &&
      value.absence.uiState === 'optional-absent' &&
      isUtcTimestamp(value.absence.nextReviewAt)
    );
  }

  return (
    (value.availability === 'required' || value.availability === 'optional-empty') &&
    hasExactKeys(value, [
      'id',
      'path',
      'schema',
      'owner',
      'fallbackClass',
      'availability',
      'sha256',
      'bytes',
      'recordCount',
    ]) &&
    (value.availability === 'required'
      ? value.fallbackClass === 'fail-closed'
      : value.fallbackClass === 'render-empty') &&
    typeof value.sha256 === 'string' &&
    sha256Pattern.test(value.sha256) &&
    typeof value.bytes === 'number' &&
    Number.isSafeInteger(value.bytes) &&
    value.bytes >= 0 &&
    typeof value.recordCount === 'number' &&
    Number.isSafeInteger(value.recordCount) &&
    value.recordCount >= 0
  );
}

function isArticleSets(value: unknown): value is LocalManifestV1['articleSets'] {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'activeFeedIds',
      'archiveIds',
      'landingIds',
      'redirectSourceIds',
      'sitemapArticleIds',
    ])
  ) {
    return false;
  }

  const activeFeedIds = value.activeFeedIds;
  const archiveIds = value.archiveIds;
  const landingIds = value.landingIds;
  const redirectSourceIds = value.redirectSourceIds;
  const sitemapArticleIds = value.sitemapArticleIds;
  const sets = [activeFeedIds, archiveIds, landingIds, redirectSourceIds, sitemapArticleIds];
  if (!sets.every(isStringArray)) {
    return false;
  }

  const [active, archive, landing, redirects, sitemap] = sets as [
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
  ];

  return (
    [active, archive, landing, redirects, sitemap].every(
      (set) => set.every(isOpaqueArticleId) && isSortedUnique(set),
    ) &&
    isSubset(active, archive) &&
    isSubset(landing, archive) &&
    JSON.stringify(sitemap) === JSON.stringify(landing) &&
    isDisjoint(redirects, archive)
  );
}

function isArticleSetHashes(value: unknown): value is LocalManifestV1['articleSetHashes'] {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, [
      'activeFeedIds',
      'archiveIds',
      'landingIds',
      'redirectSourceIds',
      'sitemapArticleIds',
    ]) &&
    Object.values(value).every((hash) => typeof hash === 'string' && sha256Pattern.test(hash))
  );
}

/** Serialisiert JSON ohne Abhaengigkeit von Objekt-Einfuegereihenfolgen. */
export function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }

  throw new TypeError('Nur JSON-Werte koennen kanonisch serialisiert werden.');
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

/** Hashing erfolgt ausschliesslich lokal ueber die Web-Crypto-Implementierung. */
export async function sha256Utf8(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function resourceRecordCount(payload: LocalResourcePayload): number {
  if (isArticlePayload(payload)) {
    return payload.articles.length;
  }

  if (isEmptyPayload(payload)) {
    return payload.items.length;
  }

  return -1;
}

export function isLocalManifestV1(value: unknown): value is LocalManifestV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'contractVersion',
      'revision',
      'generatedAt',
      'sourceCommit',
      'resources',
      'articleSets',
      'articleSetHashes',
      'compatibility',
      'provenance',
      'revocationRevision',
    ]) ||
    value.contractVersion !== localManifestContractVersion ||
    !isNonEmptyString(value.revision) ||
    !isUtcTimestamp(value.generatedAt) ||
    typeof value.sourceCommit !== 'string' ||
    !commitPattern.test(value.sourceCommit) ||
    !Array.isArray(value.resources) ||
    value.resources.length === 0 ||
    !value.resources.every(isResource) ||
    new Set(value.resources.map((resource) => resource.id)).size !== value.resources.length ||
    new Set(value.resources.map((resource) => resource.path)).size !== value.resources.length ||
    !isArticleSets(value.articleSets) ||
    !isArticleSetHashes(value.articleSetHashes) ||
    !isPlainRecord(value.compatibility) ||
    !hasExactKeys(value.compatibility, ['minContractVersion', 'maxContractVersion']) ||
    value.compatibility.minContractVersion !== localManifestContractVersion ||
    value.compatibility.maxContractVersion !== localManifestContractVersion ||
    !isPlainRecord(value.provenance) ||
    !hasExactKeys(value.provenance, ['generatorVersion', 'fixtureSeedCommit', 'sourceKind']) ||
    !isNonEmptyString(value.provenance.generatorVersion) ||
    value.provenance.fixtureSeedCommit !== value.sourceCommit ||
    value.provenance.sourceKind !== 'self-authored-local-fixture' ||
    !isNonEmptyString(value.revocationRevision)
  ) {
    return false;
  }

  const articleResources = value.resources.filter(
    (resource) => resource.schema === localArticleResourceSchema,
  );
  return (
    articleResources.length === 1 &&
    articleResources[0]!.availability === 'required' &&
    articleResources[0]!.fallbackClass === 'fail-closed'
  );
}

export function validateLocalManifestV1(value: unknown): ManifestValidationResult {
  return isLocalManifestV1(value)
    ? { ok: true, errors: [] }
    : { ok: false, errors: ['Manifest v1 verletzt mindestens eine fail-closed Vertragsregel.'] };
}

function expectedPayloadValidator(schema: LocalManifestResource['schema']) {
  return schema === localArticleResourceSchema ? isArticlePayload : isEmptyPayload;
}

/**
 * Prueft die im Manifest referenzierten lokalen Payloads gegen Hash, Bytezahl,
 * Recordzahl und deklarierte Resourceklasse. Es findet kein I/O statt.
 */
export async function validateLocalManifestIntegrity(
  input: ManifestIntegrityInput,
): Promise<ManifestIntegrityResult> {
  const structural = validateLocalManifestV1(input.manifest);
  if (!structural.ok) {
    return { ...structural, resourceHashes: {} };
  }

  const errors: string[] = [];
  const resourceHashes: Record<string, string> = {};
  const expectedPresentIds = new Set(
    input.manifest.resources
      .filter(
        (resource): resource is PresentResource => resource.availability !== 'optional-absent',
      )
      .map((resource) => resource.id),
  );

  for (const suppliedId of Object.keys(input.payloads)) {
    if (!expectedPresentIds.has(suppliedId)) {
      errors.push(`Unerwarteter Payload: ${suppliedId}`);
    }
  }

  for (const resource of input.manifest.resources) {
    if (resource.availability === 'optional-absent') {
      if (Object.hasOwn(input.payloads, resource.id)) {
        errors.push(`Optional-abwesente Ressource darf keinen Payload haben: ${resource.id}`);
      }
      continue;
    }

    const payload = input.payloads[resource.id];
    if (payload === undefined) {
      errors.push(`Fehlender deklarierter Ressourcenpayload: ${resource.id}`);
      continue;
    }

    if (!expectedPayloadValidator(resource.schema)(payload)) {
      errors.push(`Payload entspricht nicht dem deklarierten Schema: ${resource.id}`);
      continue;
    }

    const typedPayload = payload as LocalResourcePayload;
    const serialized = canonicalJson(typedPayload);
    const hash = await sha256Utf8(serialized);
    resourceHashes[resource.id] = hash;

    if (hash !== resource.sha256) {
      errors.push(`Hashabweichung: ${resource.id}`);
    }
    if (utf8ByteLength(serialized) !== resource.bytes) {
      errors.push(`Bytezahlabweichung: ${resource.id}`);
    }
    if (resourceRecordCount(typedPayload) !== resource.recordCount) {
      errors.push(`Recordzahlabweichung: ${resource.id}`);
    }
  }

  const articleResource = input.manifest.resources.find(
    (resource): resource is PresentResource =>
      resource.schema === localArticleResourceSchema && resource.availability !== 'optional-absent',
  );
  const articlePayload = articleResource ? input.payloads[articleResource.id] : undefined;
  if (
    articleResource === undefined ||
    articlePayload === undefined ||
    !isArticlePayload(articlePayload)
  ) {
    errors.push('Der erforderliche Artikelpayload fehlt oder ist ungueltig.');
  } else {
    const articleIds = [...articlePayload.articles.map((article) => article.id)].sort();
    if (JSON.stringify(articleIds) !== JSON.stringify(input.manifest.articleSets.archiveIds)) {
      errors.push('Archiv-ID-Menge entspricht nicht den Artikelrecords.');
    }

    for (const [setName, ids] of Object.entries(input.manifest.articleSets) as [
      keyof LocalManifestV1['articleSets'],
      readonly string[],
    ][]) {
      const actualHash = await sha256Utf8(canonicalJson(ids));
      if (actualHash !== input.manifest.articleSetHashes[setName]) {
        errors.push(`ID-Mengenhashabweichung: ${setName}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, resourceHashes };
}
