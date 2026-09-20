/**
 * Lokaler, browserfaehiger Manifest-v1-Vertrag fuer WRN-G3-002.
 * Er beschreibt keine HTTP-Auslieferung und fuehrt keine Requests aus.
 */
// The V1 public surface deliberately excludes policy-parameterized internals.
export {
  productionContentReleaseSchemaV1,
  productionContentDescriptorSchemaV1,
  productionArticleAdmissionSchemaV1,
  productionReadingDetailsSchemaV1,
  productionDiscoverIndexSchemaV1,
  productionArchiveLifecycleSchemaV1,
  productionWebsitePublicationSchemaV1,
  productionContractVersionV1,
  isProductionContentDescriptorV1,
  isProductionContentManifestV1,
  isProductionArchiveLifecycleV1,
  isConsistentProductionArchiveLifecycleV1,
  isProductionContentRevisionV1,
  resolveProductionContentLifecycleV1,
  createProductionContentSafetyLedger,
  isProductionContentSafetyLedgerV1,
  validateProductionContentReleaseV1,
  createValidatedProductionContentReleaseV1,
  resolveProductionContentArticleV1,
  createProductionArticleShareUrlV1,
  isProductionWebsitePublicationV1,
  validateProductionWebsitePublicationV1,
  // @ts-expect-error Node 24 executes the deterministic builder from source.
} from './production-content-release-v1.ts';
export type {
  ProductionArticleIdV1,
  ProductionReaderBlockV1,
  ProductionArticleV1,
  ProductionArticleAdmissionV1,
  ProductionReaderDetailsV1,
  ProductionDiscoverIndexV1,
  ProductionArchiveLifecycleV1,
  ProductionContentReleaseDocumentsV1,
  ProductionContentReleaseDescriptorV1,
  ProductionContentManifestV1,
  ProductionWebsitePublicationV1,
  ProductionContentReleaseInputV1,
  ProductionContentValidationResultV1,
  ProductionContentReadyV1,
  ProductionContentSafetyLedgerV1,
  ProductionContentResolutionV1,
  ProductionContentLifecycleResolutionInputV1,
} from './production-content-release-v1.ts';
// @ts-expect-error Node 24 executes the versioned production contract directly.
export * from './production-content-release-v3.ts';
// The V1 offline public surface deliberately excludes policy-parameterized internals.
export {
  productionContentOfflineFormatV1,
  productionContentOfflineBundleFormatV1,
  productionContentOfflineTtlMs,
  productionContentOfflineBundleMaxBytes,
  productionContentOfflineTotalBundleMaxBytes,
  productionContentOfflineControlMaxBytes,
  productionContentOfflineMaxBundles,
  productionContentOfflineMaxIdentities,
  isProductionContentCurrentPointerV1,
  deriveProductionContentReleasePathsV1,
  createEmptyProductionContentOfflineControlV1,
  isProductionContentOfflineControlV1,
  sameProductionContentOfflineSafetyV1,
  mergeProductionContentOfflineSafetyV1,
  validateProductionContentSafetyEvidenceV1,
  createProductionContentOfflineBundleV1,
  validateProductionContentOfflineBundleV1,
  // @ts-expect-error Node 24 executes the deterministic builder from source.
} from './production-content-offline-v1.ts';
export type {
  ProductionContentAcceptedIdentityV1,
  ProductionContentCurrentPointerV1,
  ProductionContentOfflineControlV1,
  ProductionContentOfflineBundleV1,
  ProductionContentReleasePathsV1,
} from './production-content-offline-v1.ts';
export const localManifestContractVersion = '1.0.0' as const;
// @ts-expect-error Node 24 executes the versioned production builder directly.
export * from './source-preferences-v1.ts';
export const localArticleResourceSchema = 'wrn.local-article-records.v1' as const;
export const localEmptyResourceSchema = 'wrn.local-empty-items.v1' as const;
/**
 * Separater, rein lokaler Klassifikationsvertrag fuer WRN-G3-005. Der
 * bestehende Artikel- und Manifest-v1-Vertrag bleibt bewusst unveraendert.
 */
export const localDiscoverIndexSchema = 'wrn.local-discover-index.v1' as const;
export const localDiscoverIndexContractVersion = '1.0.0' as const;
/**
 * Additiver, rein lokaler Readerdetailvertrag fuer WRN-G3-006. Er erweitert
 * weder LocalArticle noch Manifest-v1 oder den Discover-Index.
 */
export const localReaderDetailsSchema = 'wrn.local-reader-details.v1' as const;
export const localReaderDetailsContractVersion = '1.0.0' as const;
/**
 * Additiver, lokaler Publikationsvertrag fuer WRN-G3-007. Er verweist auf
 * bereits validierte Artikel- und Readerfixtures; Inhalte werden nicht erneut
 * als zweite Quelle kopiert.
 */
export const localWebsitePublicationSchema = 'wrn.local-website-publication.v1' as const;
export const localWebsitePublicationContractVersion = '1.0.0' as const;
/**
 * Additiver, lokaler Lifecycle-Vertrag fuer WRN-G3-008. Er besitzt eine
 * eigene, hashgebundene Fixture und veraendert weder Manifest-v1 noch die
 * akzeptierten G3-002/G3-006/G3-007-Vertraege.
 */
export const localArchiveLifecycleSchema = 'wrn.local-archive-lifecycle.v1' as const;
export const localArchiveLifecycleContractVersion = '1.0.0' as const;
/**
 * Additive, release-bound presentation metadata for the anonymous mobile
 * home. It carries only opaque roles, category codes and freshness evidence;
 * article records remain the sole source for all visible article metadata.
 */
export const localHomePresentationSchema = 'wrn.local-home-presentation.v1' as const;
export const localHomePresentationContractVersion = '1.0.0' as const;
export const localHomeSportCategories = ['football', 'fanculture', 'women'] as const;
export type LocalHomeSportCategory = (typeof localHomeSportCategories)[number];
export const localDiscoverFormats = [
  'news',
  'analysis',
  'commentary',
  'interview',
  'press-release',
] as const;
export type LocalDiscoverFormat = (typeof localDiscoverFormats)[number];

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

export interface LocalDiscoverIndexEntryV1 {
  readonly articleId: string;
  readonly region: string;
  readonly topics: readonly string[];
  readonly format: LocalDiscoverFormat;
}

export interface LocalDiscoverIndexV1 {
  readonly contractVersion: typeof localDiscoverIndexContractVersion;
  readonly schema: typeof localDiscoverIndexSchema;
  readonly revision: string;
  readonly entries: readonly LocalDiscoverIndexEntryV1[];
  /** SHA-256 ueber den kanonischen Index ohne dieses Feld. */
  readonly integritySha256: string;
}

export interface DiscoverIndexValidationResult extends ManifestValidationResult {
  readonly articleIds: readonly string[];
}

export interface ReaderParagraphBlock {
  readonly kind: 'paragraph';
  readonly text: string;
}

export interface ReaderHeadingBlock {
  readonly kind: 'heading';
  readonly level: 2 | 3;
  readonly text: string;
}

export interface ReaderQuoteBlock {
  readonly kind: 'quote';
  readonly text: string;
  readonly attribution?: string;
}

export interface ReaderListBlock {
  readonly kind: 'list';
  readonly style: 'ordered' | 'unordered';
  readonly items: readonly string[];
}

/**
 * Der erste Reader-Slice kennt ausschliesslich strukturierten Text. Es gibt
 * absichtlich keine HTML-, Markdown-, Link-, Medien- oder Scriptfelder.
 */
export type LocalReaderContentBlock =
  ReaderParagraphBlock | ReaderHeadingBlock | ReaderQuoteBlock | ReaderListBlock;

export interface LocalReaderDetailEntryV1 {
  readonly articleId: string;
  readonly blocks: readonly LocalReaderContentBlock[];
}

export interface LocalReaderDetailsV1 {
  readonly contractVersion: typeof localReaderDetailsContractVersion;
  readonly schema: typeof localReaderDetailsSchema;
  readonly revision: string;
  readonly entries: readonly LocalReaderDetailEntryV1[];
  /** SHA-256 ueber die kanonische Ressource ohne dieses Feld. */
  readonly integritySha256: string;
}

export interface ReaderDetailsValidationResult extends ManifestValidationResult {
  readonly articleIds: readonly string[];
}

export interface LocalWebsitePublicationV1 {
  readonly contractVersion: typeof localWebsitePublicationContractVersion;
  readonly schema: typeof localWebsitePublicationSchema;
  readonly revision: string;
  /** Feste Quellzeit aus der Fixture, niemals die Uhr des Publishers. */
  readonly generatedAt: string;
  readonly siteOrigin: string;
  readonly sourceManifest: {
    readonly revision: string;
    /** SHA-256 ueber den kanonischen Manifestwert. */
    readonly integritySha256: string;
    readonly articleSetHashes: LocalManifestV1['articleSetHashes'];
  };
  readonly readerDetails: {
    readonly revision: string;
    readonly integritySha256: string;
  };
  readonly landingIds: readonly string[];
  readonly sitemapArticleIds: readonly string[];
  readonly generatorVersion: string;
}

export interface WebsitePublicationValidationResult extends ManifestValidationResult {
  readonly articleIds: readonly string[];
}

export const localRevocationStatuses = ['blocked', 'replaced'] as const;
export type LocalRevocationStatus = (typeof localRevocationStatuses)[number];

export interface LocalArticleAliasV1 {
  readonly sourceId: string;
  readonly targetId: string;
}

/** Enthält bewusst weder Titel noch Rechte- oder Sperrgrunddetails. */
export interface LocalGoneEntryV1 {
  readonly id: string;
  readonly category: 'removed';
}

/**
 * Ein Revocationrecord enthält nur den minimalen, sicheren Auflösungsstatus.
 * Er trägt absichtlich keinen Artikel-, Medien- oder Quellpayload.
 */
export interface LocalRevocationEntryV1 {
  readonly id: string;
  readonly status: LocalRevocationStatus;
  readonly category: 'rights-or-safety';
}

export interface LocalArchiveLifecycleV1 {
  readonly contractVersion: typeof localArchiveLifecycleContractVersion;
  readonly schema: typeof localArchiveLifecycleSchema;
  readonly revision: string;
  readonly sourceContent: {
    readonly articlePayloadSha256: string;
    readonly readerDetailsRevision: string;
    readonly readerDetailsIntegritySha256: string;
  };
  readonly activeArticleIds: readonly string[];
  readonly archiveArticleIds: readonly string[];
  readonly shareableArticleIds: readonly string[];
  readonly aliases: readonly LocalArticleAliasV1[];
  readonly gone: readonly LocalGoneEntryV1[];
  readonly revocations: {
    /** Monoton steigende Nummer; ein Ruecksprung wird fail-closed abgelehnt. */
    readonly revision: number;
    readonly previousRevision: number;
    readonly entries: readonly LocalRevocationEntryV1[];
  };
  /** SHA-256 ueber den kanonischen Vertrag ohne dieses Feld. */
  readonly integritySha256: string;
}

export interface ArchiveLifecycleValidationResult extends ManifestValidationResult {
  readonly archiveArticleIds: readonly string[];
  readonly revocationRevision: number;
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
  /**
   * Optional for v1 compatibility. When present, it is covered by the
   * canonical manifest hash pinned by the release descriptor.
   */
  readonly homePresentation?: LocalHomePresentationV1;
}

export interface LocalHomePresentationV1 {
  readonly contractVersion: typeof localHomePresentationContractVersion;
  readonly schema: typeof localHomePresentationSchema;
  readonly revision: string;
  readonly leadId: string;
  readonly mainIds: readonly string[];
  readonly sport: {
    readonly featureId: string;
    readonly secondaryIds: readonly string[];
    readonly categories: readonly string[];
    readonly checkedAt: string;
    readonly validUntil: string;
  };
}

export interface LocalHomePresentationReadyV1 {
  readonly kind: 'ready';
  readonly revision: string;
  readonly leadId: string;
  readonly mainIds: readonly string[];
  readonly sport: {
    readonly featureId: string;
    readonly secondaryIds: readonly string[];
    readonly categories: readonly LocalHomeSportCategory[];
  };
}

export interface LocalHomePresentationSportNotCurrentV1 {
  readonly kind: 'sport-not-current';
  readonly revision: string | null;
  readonly leadId: string | null;
  readonly mainIds: readonly string[];
  readonly sport: null;
}

export type LocalHomePresentationProjectionV1 =
  LocalHomePresentationReadyV1 | LocalHomePresentationSportNotCurrentV1;

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

function isDiscoverEntry(value: unknown): value is LocalDiscoverIndexEntryV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['articleId', 'region', 'topics', 'format']) &&
    isOpaqueArticleId(value.articleId) &&
    isNonEmptyString(value.region) &&
    isStringArray(value.topics) &&
    value.topics.length > 0 &&
    value.topics.every(isNonEmptyString) &&
    new Set(value.topics).size === value.topics.length &&
    localDiscoverFormats.includes(value.format as LocalDiscoverFormat)
  );
}

/**
 * Der Vertrag erlaubt reinen, lokalen Text, aber keine HTML-Fragmente oder
 * externe Inhaltslinks. Dadurch kann ein Client ohne Inhaltsausfuehrung
 * rendern und die Originalquelle bleibt ausschliesslich am Artikelrecord.
 */
function isSafeReaderText(value: unknown): value is string {
  return (
    isNonEmptyString(value) &&
    value === value.trim() &&
    !/[<>]/.test(value) &&
    !/\bhttps?:\/\//iu.test(value) &&
    !/\bwww\./iu.test(value) &&
    !/\[[^\]]+\]\([^)]*\)/u.test(value)
  );
}

function isReaderContentBlock(value: unknown): value is LocalReaderContentBlock {
  if (!isPlainRecord(value) || typeof value.kind !== 'string') {
    return false;
  }

  if (value.kind === 'paragraph') {
    return hasExactKeys(value, ['kind', 'text']) && isSafeReaderText(value.text);
  }

  if (value.kind === 'heading') {
    return (
      hasExactKeys(value, ['kind', 'level', 'text']) &&
      (value.level === 2 || value.level === 3) &&
      isSafeReaderText(value.text)
    );
  }

  if (value.kind === 'quote') {
    const keys = Object.keys(value).sort();
    const expectedKeys =
      value.attribution === undefined ? ['kind', 'text'] : ['attribution', 'kind', 'text'];
    return (
      keys.length === expectedKeys.length &&
      keys.every((key, index) => key === expectedKeys[index]) &&
      isSafeReaderText(value.text) &&
      (value.attribution === undefined || isSafeReaderText(value.attribution))
    );
  }

  return (
    value.kind === 'list' &&
    hasExactKeys(value, ['kind', 'style', 'items']) &&
    (value.style === 'ordered' || value.style === 'unordered') &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.every(isSafeReaderText)
  );
}

function isReaderDetailEntry(value: unknown): value is LocalReaderDetailEntryV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['articleId', 'blocks']) &&
    isOpaqueArticleId(value.articleId) &&
    Array.isArray(value.blocks) &&
    value.blocks.length > 0 &&
    value.blocks.every(isReaderContentBlock)
  );
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

/** Exportiert fuer additive lokale Fixtures dieselbe strenge Artikelpruefung. */
export function isLocalArticleResourcePayload(
  value: unknown,
): value is LocalArticleResourcePayload {
  return isArticlePayload(value);
}

/**
 * The manifest accepts a deliberately narrow envelope, but keeps detailed
 * role admission separate so a bad sport mapping can hide only that additive
 * presentation instead of invalidating the already safe core release.
 */
export function isLocalHomePresentationV1(value: unknown): value is LocalHomePresentationV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['contractVersion', 'leadId', 'mainIds', 'revision', 'schema', 'sport']) &&
    value.contractVersion === localHomePresentationContractVersion &&
    value.schema === localHomePresentationSchema &&
    isNonEmptyString(value.revision) &&
    isOpaqueArticleId(value.leadId) &&
    isStringArray(value.mainIds) &&
    value.mainIds.every(isOpaqueArticleId) &&
    isPlainRecord(value.sport) &&
    hasExactKeys(value.sport, [
      'categories',
      'checkedAt',
      'featureId',
      'secondaryIds',
      'validUntil',
    ]) &&
    isOpaqueArticleId(value.sport.featureId) &&
    isStringArray(value.sport.secondaryIds) &&
    value.sport.secondaryIds.every(isOpaqueArticleId) &&
    isStringArray(value.sport.categories) &&
    value.sport.categories.every(isNonEmptyString) &&
    isUtcTimestamp(value.sport.checkedAt) &&
    isUtcTimestamp(value.sport.validUntil)
  );
}

function projectSportNotCurrent(
  presentation: LocalHomePresentationV1 | undefined,
  leadId: string | null = null,
  mainIds: readonly string[] = [],
): LocalHomePresentationSportNotCurrentV1 {
  return Object.freeze({
    kind: 'sport-not-current',
    revision: presentation?.revision ?? null,
    leadId,
    mainIds: Object.freeze([...mainIds]),
    sport: null,
  });
}

/**
 * Resolves home positions only from article IDs already admitted by the same
 * manifest revision. The explicit clock makes freshness checks deterministic
 * in tests and keeps a stale sport mapping visibly empty rather than guessed.
 */
export function projectLocalHomePresentationV1(
  manifest: Pick<LocalManifestV1, 'homePresentation'>,
  articles: readonly Pick<LocalArticle, 'id'>[],
  now: unknown,
): LocalHomePresentationProjectionV1 {
  const presentation = manifest.homePresentation;
  if (
    presentation === undefined ||
    !isLocalHomePresentationV1(presentation) ||
    !Number.isFinite(now) ||
    typeof now !== 'number'
  ) {
    return projectSportNotCurrent(presentation);
  }

  const articleIds = new Set(articles.map((article) => article.id));
  const primaryIds = [presentation.leadId, ...presentation.mainIds];
  if (
    presentation.mainIds.length !== 5 ||
    new Set(primaryIds).size !== 6 ||
    !primaryIds.every((id) => articleIds.has(id))
  ) {
    return projectSportNotCurrent(presentation);
  }

  const sportIds = [presentation.sport.featureId, ...presentation.sport.secondaryIds];
  const categorySet = new Set(presentation.sport.categories);
  const checkedAt = Date.parse(presentation.sport.checkedAt);
  const validUntil = Date.parse(presentation.sport.validUntil);
  if (
    presentation.sport.secondaryIds.length !== 2 ||
    new Set(sportIds).size !== 3 ||
    sportIds.some((id) => primaryIds.includes(id) || !articleIds.has(id)) ||
    presentation.sport.categories.length !== localHomeSportCategories.length ||
    categorySet.size !== localHomeSportCategories.length ||
    !localHomeSportCategories.every((category) => categorySet.has(category)) ||
    !Number.isFinite(checkedAt) ||
    !Number.isFinite(validUntil) ||
    checkedAt > now ||
    checkedAt > validUntil ||
    now > validUntil
  ) {
    return projectSportNotCurrent(presentation, presentation.leadId, presentation.mainIds);
  }

  return Object.freeze({
    kind: 'ready',
    revision: presentation.revision,
    leadId: presentation.leadId,
    mainIds: Object.freeze([...presentation.mainIds]),
    sport: Object.freeze({
      featureId: presentation.sport.featureId,
      secondaryIds: Object.freeze([...presentation.sport.secondaryIds]),
      categories: Object.freeze(presentation.sport.categories as readonly LocalHomeSportCategory[]),
    }),
  });
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

/** Nur die fachlichen Indexfelder werden gehasht; keine Objekt-Reihenfolge ist relevant. */
export function discoverIndexIntegrityPayload(
  index: Omit<LocalDiscoverIndexV1, 'integritySha256'>,
): Omit<LocalDiscoverIndexV1, 'integritySha256'> {
  return {
    contractVersion: index.contractVersion,
    schema: index.schema,
    revision: index.revision,
    entries: index.entries,
  };
}

export function isLocalDiscoverIndexV1(value: unknown): value is LocalDiscoverIndexV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['contractVersion', 'schema', 'revision', 'entries', 'integritySha256']) &&
    value.contractVersion === localDiscoverIndexContractVersion &&
    value.schema === localDiscoverIndexSchema &&
    isNonEmptyString(value.revision) &&
    Array.isArray(value.entries) &&
    value.entries.length > 0 &&
    value.entries.every(isDiscoverEntry) &&
    new Set(value.entries.map((entry) => entry.articleId)).size === value.entries.length &&
    typeof value.integritySha256 === 'string' &&
    sha256Pattern.test(value.integritySha256)
  );
}

/**
 * Fail-closed-Pruefung fuer den separaten Discover-Index. Die exakte
 * Artikel-ID-Menge wird gegen die bereits validierte Artikelresource gebunden.
 */
export async function validateLocalDiscoverIndexV1(
  index: unknown,
  articles: readonly Pick<LocalArticle, 'id'>[],
): Promise<DiscoverIndexValidationResult> {
  if (!isLocalDiscoverIndexV1(index)) {
    return {
      ok: false,
      errors: ['Discover-Index v1 verletzt mindestens eine Vertragsregel.'],
      articleIds: [],
    };
  }

  const errors: string[] = [];
  const expectedHash = await sha256Utf8(canonicalJson(discoverIndexIntegrityPayload(index)));
  if (expectedHash !== index.integritySha256) {
    errors.push('Discover-Index-Hashabweichung.');
  }

  const indexIds = index.entries.map((entry) => entry.articleId).sort();
  const articleIds = articles.map((article) => article.id).sort();
  if (
    new Set(articleIds).size !== articleIds.length ||
    JSON.stringify(indexIds) !== JSON.stringify(articleIds)
  ) {
    errors.push('Discover-Index-ID-Menge entspricht nicht den Artikelrecords.');
  }

  return { ok: errors.length === 0, errors, articleIds: Object.freeze(indexIds) };
}

/** Hashpayload ohne selbstreferenzielles Integritaetsfeld. */
export function readerDetailsIntegrityPayload(
  details: Omit<LocalReaderDetailsV1, 'integritySha256'>,
): Omit<LocalReaderDetailsV1, 'integritySha256'> {
  return {
    contractVersion: details.contractVersion,
    schema: details.schema,
    revision: details.revision,
    entries: details.entries,
  };
}

export function isLocalReaderDetailsV1(value: unknown): value is LocalReaderDetailsV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['contractVersion', 'schema', 'revision', 'entries', 'integritySha256']) &&
    value.contractVersion === localReaderDetailsContractVersion &&
    value.schema === localReaderDetailsSchema &&
    isNonEmptyString(value.revision) &&
    Array.isArray(value.entries) &&
    value.entries.length > 0 &&
    value.entries.every(isReaderDetailEntry) &&
    new Set(value.entries.map((entry) => entry.articleId)).size === value.entries.length &&
    typeof value.integritySha256 === 'string' &&
    sha256Pattern.test(value.integritySha256)
  );
}

/**
 * Fail-closed-Pruefung fuer lokale Readerdetails. Bereits validierte
 * Artikelrecords bleiben die alleinige Quelle fuer Herkunftsmetadaten; der
 * Detailvertrag bindet sich deshalb nur an deren exakte ID-Menge.
 */
export async function validateLocalReaderDetailsV1(
  details: unknown,
  articles: readonly Pick<LocalArticle, 'id'>[],
): Promise<ReaderDetailsValidationResult> {
  if (!isLocalReaderDetailsV1(details)) {
    return {
      ok: false,
      errors: ['Readerdetails v1 verletzen mindestens eine Vertragsregel.'],
      articleIds: [],
    };
  }

  const errors: string[] = [];
  const expectedHash = await sha256Utf8(canonicalJson(readerDetailsIntegrityPayload(details)));
  if (expectedHash !== details.integritySha256) {
    errors.push('Readerdetails-Hashabweichung.');
  }

  const detailIds = details.entries.map((entry) => entry.articleId).sort();
  const articleIds = articles.map((article) => article.id).sort();
  if (
    new Set(articleIds).size !== articleIds.length ||
    JSON.stringify(detailIds) !== JSON.stringify(articleIds)
  ) {
    errors.push('Readerdetails-ID-Menge entspricht nicht den Artikelrecords.');
  }

  return { ok: errors.length === 0, errors, articleIds: Object.freeze(detailIds) };
}

function isSafeWebsiteOrigin(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.pathname === '/' &&
      url.search.length === 0 &&
      url.hash.length === 0 &&
      value === url.origin
    );
  } catch {
    return false;
  }
}

function isPublicationIdSet(value: unknown): value is readonly string[] {
  return isStringArray(value) && value.every(isOpaqueArticleId) && isSortedUnique(value);
}

/**
 * Strukturcheck ohne I/O. Die Publikationsfixture enthaelt bewusst weder HTML
 * noch Artikeltext und kann daher keine zweite Inhaltsquelle werden.
 */
export function isLocalWebsitePublicationV1(value: unknown): value is LocalWebsitePublicationV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'generatedAt',
      'siteOrigin',
      'sourceManifest',
      'readerDetails',
      'landingIds',
      'sitemapArticleIds',
      'generatorVersion',
    ]) ||
    value.contractVersion !== localWebsitePublicationContractVersion ||
    value.schema !== localWebsitePublicationSchema ||
    !isNonEmptyString(value.revision) ||
    !isUtcTimestamp(value.generatedAt) ||
    !isSafeWebsiteOrigin(value.siteOrigin) ||
    !isPlainRecord(value.sourceManifest) ||
    !hasExactKeys(value.sourceManifest, ['revision', 'integritySha256', 'articleSetHashes']) ||
    !isNonEmptyString(value.sourceManifest.revision) ||
    typeof value.sourceManifest.integritySha256 !== 'string' ||
    !sha256Pattern.test(value.sourceManifest.integritySha256) ||
    !isArticleSetHashes(value.sourceManifest.articleSetHashes) ||
    !isPlainRecord(value.readerDetails) ||
    !hasExactKeys(value.readerDetails, ['revision', 'integritySha256']) ||
    !isNonEmptyString(value.readerDetails.revision) ||
    typeof value.readerDetails.integritySha256 !== 'string' ||
    !sha256Pattern.test(value.readerDetails.integritySha256) ||
    !isPublicationIdSet(value.landingIds) ||
    !isPublicationIdSet(value.sitemapArticleIds) ||
    JSON.stringify(value.landingIds) !== JSON.stringify(value.sitemapArticleIds) ||
    value.landingIds.length === 0 ||
    !isNonEmptyString(value.generatorVersion)
  ) {
    return false;
  }

  return true;
}

/**
 * Verbindet die reine Publikationsprojektion mit den drei bereits geprueften
 * lokalen Verträgen. Jede Drift stoppt vor HTML- oder Dateierzeugung.
 */
export async function validateLocalWebsitePublicationV1(
  publication: unknown,
  manifest: LocalManifestV1,
  articles: readonly Pick<LocalArticle, 'id'>[],
  details: LocalReaderDetailsV1,
): Promise<WebsitePublicationValidationResult> {
  if (!isLocalWebsitePublicationV1(publication)) {
    return {
      ok: false,
      errors: ['Website-Publikationsvertrag v1 verletzt mindestens eine fail-closed Regel.'],
      articleIds: [],
    };
  }

  const errors: string[] = [];
  const articleIds = articles.map((article) => article.id).sort();
  const detailIds = details.entries.map((entry) => entry.articleId).sort();
  const manifestHash = await sha256Utf8(canonicalJson(manifest));
  const expectedLandingHash = await sha256Utf8(canonicalJson(publication.landingIds));
  const expectedSitemapHash = await sha256Utf8(canonicalJson(publication.sitemapArticleIds));

  if (publication.sourceManifest.revision !== manifest.revision) {
    errors.push('Publikationsvertrag referenziert eine andere Manifestrevision.');
  }
  if (publication.sourceManifest.integritySha256 !== manifestHash) {
    errors.push('Publikationsvertrag-Manifesthashabweichung.');
  }
  if (
    JSON.stringify(publication.sourceManifest.articleSetHashes) !==
    JSON.stringify(manifest.articleSetHashes)
  ) {
    errors.push('Publikationsvertrag-Mengenhashabweichung.');
  }
  if (
    publication.readerDetails.revision !== details.revision ||
    publication.readerDetails.integritySha256 !== details.integritySha256
  ) {
    errors.push('Publikationsvertrag-Readerdetailsabweichung.');
  }
  if (JSON.stringify(publication.landingIds) !== JSON.stringify(manifest.articleSets.landingIds)) {
    errors.push('Publikations-Landing-ID-Menge weicht vom Manifest ab.');
  }
  if (
    JSON.stringify(publication.sitemapArticleIds) !==
    JSON.stringify(manifest.articleSets.sitemapArticleIds)
  ) {
    errors.push('Publikations-Sitemap-ID-Menge weicht vom Manifest ab.');
  }
  if (
    manifest.articleSetHashes.landingIds !== expectedLandingHash ||
    manifest.articleSetHashes.sitemapArticleIds !== expectedSitemapHash
  ) {
    errors.push('Publikations-ID-Mengenhash ist nicht kanonisch gebunden.');
  }
  if (
    JSON.stringify(articleIds) !== JSON.stringify(publication.landingIds) ||
    JSON.stringify(detailIds) !== JSON.stringify(publication.landingIds)
  ) {
    errors.push('Publikations-ID-Menge entspricht nicht den validierten lokalen Inhalten.');
  }

  return {
    ok: errors.length === 0,
    errors,
    articleIds: Object.freeze([...publication.landingIds]),
  };
}

function isSortedUniqueIds(value: unknown): value is readonly string[] {
  return isStringArray(value) && value.every(isOpaqueArticleId) && isSortedUnique(value);
}

function isAliasEntry(value: unknown): value is LocalArticleAliasV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['sourceId', 'targetId']) &&
    isOpaqueArticleId(value.sourceId) &&
    isOpaqueArticleId(value.targetId) &&
    value.sourceId !== value.targetId
  );
}

function isGoneEntry(value: unknown): value is LocalGoneEntryV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['id', 'category']) &&
    isOpaqueArticleId(value.id) &&
    value.category === 'removed'
  );
}

function isRevocationEntry(value: unknown): value is LocalRevocationEntryV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['id', 'status', 'category']) &&
    isOpaqueArticleId(value.id) &&
    localRevocationStatuses.includes(value.status as LocalRevocationStatus) &&
    value.category === 'rights-or-safety'
  );
}

function hasSortedUniqueEntryIds(entries: readonly { readonly id: string }[]): boolean {
  return entries.every((entry, index) => index === 0 || entries[index - 1]!.id < entry.id);
}

function hasSortedUniqueAliasSources(entries: readonly LocalArticleAliasV1[]): boolean {
  return entries.every(
    (entry, index) => index === 0 || entries[index - 1]!.sourceId < entry.sourceId,
  );
}

/** Hashpayload ohne das selbstreferenzielle Integritaetsfeld. */
export function archiveLifecycleIntegrityPayload(
  lifecycle: Omit<LocalArchiveLifecycleV1, 'integritySha256'>,
): Omit<LocalArchiveLifecycleV1, 'integritySha256'> {
  return {
    contractVersion: lifecycle.contractVersion,
    schema: lifecycle.schema,
    revision: lifecycle.revision,
    sourceContent: lifecycle.sourceContent,
    activeArticleIds: lifecycle.activeArticleIds,
    archiveArticleIds: lifecycle.archiveArticleIds,
    shareableArticleIds: lifecycle.shareableArticleIds,
    aliases: lifecycle.aliases,
    gone: lifecycle.gone,
    revocations: lifecycle.revocations,
  };
}

/**
 * Strukturpruefung des kleinen, lokalen Archiv-Lifecyclevertrags. Sie liest
 * keine Dateien und erlaubt keine stillen Alias- oder Revocationfallbacks.
 */
export function isLocalArchiveLifecycleV1(value: unknown): value is LocalArchiveLifecycleV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'sourceContent',
      'activeArticleIds',
      'archiveArticleIds',
      'shareableArticleIds',
      'aliases',
      'gone',
      'revocations',
      'integritySha256',
    ]) ||
    value.contractVersion !== localArchiveLifecycleContractVersion ||
    value.schema !== localArchiveLifecycleSchema ||
    !isNonEmptyString(value.revision) ||
    !isPlainRecord(value.sourceContent) ||
    !hasExactKeys(value.sourceContent, [
      'articlePayloadSha256',
      'readerDetailsRevision',
      'readerDetailsIntegritySha256',
    ]) ||
    typeof value.sourceContent.articlePayloadSha256 !== 'string' ||
    !sha256Pattern.test(value.sourceContent.articlePayloadSha256) ||
    !isNonEmptyString(value.sourceContent.readerDetailsRevision) ||
    typeof value.sourceContent.readerDetailsIntegritySha256 !== 'string' ||
    !sha256Pattern.test(value.sourceContent.readerDetailsIntegritySha256) ||
    !isSortedUniqueIds(value.activeArticleIds) ||
    !isSortedUniqueIds(value.archiveArticleIds) ||
    !isSortedUniqueIds(value.shareableArticleIds) ||
    !Array.isArray(value.aliases) ||
    !value.aliases.every(isAliasEntry) ||
    !hasSortedUniqueAliasSources(value.aliases) ||
    !Array.isArray(value.gone) ||
    !value.gone.every(isGoneEntry) ||
    !hasSortedUniqueEntryIds(value.gone) ||
    !isPlainRecord(value.revocations) ||
    !hasExactKeys(value.revocations, ['revision', 'previousRevision', 'entries']) ||
    !Number.isSafeInteger(value.revocations.revision as number) ||
    !Number.isSafeInteger(value.revocations.previousRevision as number) ||
    (value.revocations.revision as number) < 1 ||
    (value.revocations.previousRevision as number) < 0 ||
    (value.revocations.revision as number) <= (value.revocations.previousRevision as number) ||
    !Array.isArray(value.revocations.entries) ||
    !value.revocations.entries.every(isRevocationEntry) ||
    !hasSortedUniqueEntryIds(value.revocations.entries) ||
    typeof value.integritySha256 !== 'string' ||
    !sha256Pattern.test(value.integritySha256)
  ) {
    return false;
  }

  const archiveIds = value.archiveArticleIds;
  const aliasSources = value.aliases.map((entry) => entry.sourceId);
  const goneIds = value.gone.map((entry) => entry.id);
  const revokedIds = value.revocations.entries.map((entry) => entry.id);
  const targetIds = value.aliases.map((entry) => entry.targetId);

  return (
    isSubset(value.activeArticleIds, archiveIds) &&
    isSubset(value.shareableArticleIds, archiveIds) &&
    isDisjoint(aliasSources, archiveIds) &&
    isDisjoint(goneIds, archiveIds) &&
    isDisjoint(revokedIds, archiveIds) &&
    isDisjoint(goneIds, aliasSources) &&
    isDisjoint(goneIds, revokedIds) &&
    new Set(aliasSources).size === aliasSources.length &&
    new Set(goneIds).size === goneIds.length &&
    new Set(revokedIds).size === revokedIds.length &&
    targetIds.every((id) => archiveIds.includes(id))
  );
}

/**
 * Bindet den Lifecycle fail-closed an bereits lokale Artikel- und
 * Readerdetailfixtures. `knownRevocationRevision` simuliert den dauerhaft
 * gemerkten hoechsten Tombstone-Stand eines Clients ohne Storagezugriff.
 */
export async function validateLocalArchiveLifecycleV1(
  lifecycle: unknown,
  articles: readonly LocalArticle[],
  details: LocalReaderDetailsV1,
  knownRevocationRevision = 0,
): Promise<ArchiveLifecycleValidationResult> {
  if (!isLocalArchiveLifecycleV1(lifecycle)) {
    return {
      ok: false,
      errors: ['Archiv-Lifecycle v1 verletzt mindestens eine fail-closed Vertragsregel.'],
      archiveArticleIds: [],
      revocationRevision: 0,
    };
  }

  const errors: string[] = [];
  if (!articles.every(isArticle)) {
    errors.push('Archiv-Lifecycle-Artikelrecords verletzen den lokalen Artikelvertrag.');
  }
  if (!isLocalReaderDetailsV1(details)) {
    errors.push('Archiv-Lifecycle-Readerdetails verletzen den lokalen Readervertrag.');
  }
  const expectedIntegrity = await sha256Utf8(
    canonicalJson(archiveLifecycleIntegrityPayload(lifecycle)),
  );
  if (expectedIntegrity !== lifecycle.integritySha256) {
    errors.push('Archiv-Lifecycle-Hashabweichung.');
  }
  if (!Number.isSafeInteger(knownRevocationRevision) || knownRevocationRevision < 0) {
    errors.push('Bekannte Revocationrevision ist ungueltig.');
  } else if (lifecycle.revocations.revision < knownRevocationRevision) {
    errors.push('Archiv-Lifecycle liefert eine niedrigere Revocationrevision.');
  }

  const articleIds = articles.map((article) => article.id).sort();
  const detailIds = details.entries.map((entry) => entry.articleId).sort();
  if (
    new Set(articleIds).size !== articleIds.length ||
    JSON.stringify(articleIds) !== JSON.stringify(lifecycle.archiveArticleIds)
  ) {
    errors.push('Archiv-Lifecycle-ID-Menge entspricht nicht den Artikelrecords.');
  }
  if (
    new Set(detailIds).size !== detailIds.length ||
    JSON.stringify(detailIds) !== JSON.stringify(lifecycle.archiveArticleIds)
  ) {
    errors.push('Archiv-Lifecycle-ID-Menge entspricht nicht den Readerdetails.');
  }

  const expectedArticleHash = await sha256Utf8(canonicalJson({ articles }));
  if (expectedArticleHash !== lifecycle.sourceContent.articlePayloadSha256) {
    errors.push('Archiv-Lifecycle-Artikelhashabweichung.');
  }
  if (
    lifecycle.sourceContent.readerDetailsRevision !== details.revision ||
    lifecycle.sourceContent.readerDetailsIntegritySha256 !== details.integritySha256
  ) {
    errors.push('Archiv-Lifecycle-Readerdetailbindung weicht ab.');
  }

  return {
    ok: errors.length === 0,
    errors,
    archiveArticleIds: Object.freeze([...lifecycle.archiveArticleIds]),
    revocationRevision: lifecycle.revocations.revision,
  };
}

/**
 * Additiver, rein lokaler Lesestatusvertrag fuer WRN-G3-011. Der Zustand
 * referenziert ausschliesslich stabile Artikel-IDs und traegt bewusst weder
 * Titel, URLs, Texte, Bilder noch andere Artikelpayloads.
 */
export const localReadingStateSchema = 'wrn.local-reading-state.v1' as const;
export const localReadingStateContractVersion = '1.0.0' as const;
export const localReadingStateRevision = 'wrn-g3-011-local-reading-state-v1' as const;
export const localReadingStateMaxEntries = 200 as const;
export const localReadingStateMaxBytes = 32 * 1024;
export const localReadingStateMinimumProgress = 0.01 as const;
export const localReadingStateReadThreshold = 0.9 as const;

export interface LocalReadingProgressV1 {
  /** Normalisierter Anteil im geschlossenen Intervall [0, 1]. */
  readonly fraction: number;
  readonly updatedAt: string;
}

export interface LocalReadingStateEntryV1 {
  readonly articleId: string;
  readonly savedAt?: string;
  readonly readAt?: string;
  readonly progress?: LocalReadingProgressV1;
}

export interface LocalReadingStateV1 {
  readonly contractVersion: typeof localReadingStateContractVersion;
  readonly schema: typeof localReadingStateSchema;
  readonly revision: typeof localReadingStateRevision;
  /** Nach Artikel-ID sortiert, damit Speicherinhalt und Tests deterministisch bleiben. */
  readonly entries: readonly LocalReadingStateEntryV1[];
}

export interface ReadingStateValidationResult extends ManifestValidationResult {
  readonly articleIds: readonly string[];
  readonly bytes: number;
}

function isReadingProgress(value: unknown): value is LocalReadingProgressV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, ['fraction', 'updatedAt']) &&
    typeof value.fraction === 'number' &&
    Number.isFinite(value.fraction) &&
    value.fraction >= localReadingStateMinimumProgress &&
    value.fraction <= 1 &&
    isUtcTimestamp(value.updatedAt)
  );
}

function isReadingStateEntry(value: unknown): value is LocalReadingStateEntryV1 {
  if (!isPlainRecord(value) || !isOpaqueArticleId(value.articleId)) {
    return false;
  }

  const allowedKeys = ['articleId', 'savedAt', 'readAt', 'progress'];
  if (!Object.keys(value).every((key) => allowedKeys.includes(key))) {
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'articleId')) {
    return false;
  }
  if (value.savedAt !== undefined && !isUtcTimestamp(value.savedAt)) {
    return false;
  }
  if (value.readAt !== undefined && !isUtcTimestamp(value.readAt)) {
    return false;
  }
  if (value.progress !== undefined && !isReadingProgress(value.progress)) {
    return false;
  }

  return value.savedAt !== undefined || value.readAt !== undefined || value.progress !== undefined;
}

/**
 * Strenge, synchrone Struktur- und Groessenpruefung fuer einen aus Storage
 * gelesenen Wert. Fremde Felder und ungueltige Werte werden nicht repariert,
 * damit der Client sichtbar fail-closed behandeln kann.
 */
export function isLocalReadingStateV1(value: unknown): value is LocalReadingStateV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, ['contractVersion', 'schema', 'revision', 'entries']) ||
    value.contractVersion !== localReadingStateContractVersion ||
    value.schema !== localReadingStateSchema ||
    value.revision !== localReadingStateRevision ||
    !Array.isArray(value.entries)
  ) {
    return false;
  }
  const entries = value.entries;
  if (
    entries.length > localReadingStateMaxEntries ||
    !entries.every(isReadingStateEntry) ||
    !entries.every((entry, index) => index === 0 || entries[index - 1]!.articleId < entry.articleId)
  ) {
    return false;
  }

  try {
    return utf8ByteLength(canonicalJson(value)) <= localReadingStateMaxBytes;
  } catch {
    return false;
  }
}

export function validateLocalReadingStateV1(value: unknown): ReadingStateValidationResult {
  if (!isLocalReadingStateV1(value)) {
    return {
      ok: false,
      errors: ['Lokaler Lesestatus v1 verletzt mindestens eine fail-closed Vertragsregel.'],
      articleIds: Object.freeze([]),
      bytes: 0,
    };
  }

  return {
    ok: true,
    errors: Object.freeze([]),
    articleIds: Object.freeze(value.entries.map((entry) => entry.articleId)),
    bytes: utf8ByteLength(canonicalJson(value)),
  };
}

/**
 * Additiver, rein lokaler Personalisierungsvertrag fuer WRN-G3-017. Er ist
 * absichtlich von Lesestatus, UI-Sprache, Theme und Offlinecontent getrennt.
 * Die geschlossenen IDs sind keine redaktionelle oder personenbezogene
 * Klassifikation.
 */
export const localPersonalizationSchema = 'wrn.local-personalization' as const;
export const localPersonalizationContractVersion = 1 as const;
export const localPersonalizationRevision = 'wrn-local-personalization-v1' as const;
export const localPersonalizationMaxBytes = 4096 as const;
export const localPersonalizationInterestIds = [
  'fan-culture',
  'football',
  'local-organizing',
  'media-technology',
  'movement-news',
  'sport',
  'women-feminist',
] as const;
export const localPersonalizationRegionIds = [
  'africa',
  'asia',
  'europe',
  'global',
  'latin-america-caribbean',
  'middle-east-north-africa',
  'north-america',
  'oceania',
] as const;
export const localPersonalizationContentLanguageIds = [
  'de',
  'el',
  'en',
  'es',
  'fr',
  'it',
  'pt',
  'ru',
  'tr',
] as const;

export type LocalPersonalizationInterestId = (typeof localPersonalizationInterestIds)[number];
export type LocalPersonalizationRegionId = (typeof localPersonalizationRegionIds)[number];
export type LocalPersonalizationContentLanguageId =
  (typeof localPersonalizationContentLanguageIds)[number];

export interface LocalPersonalizationStateV1 {
  readonly contractVersion: typeof localPersonalizationContractVersion;
  readonly schema: typeof localPersonalizationSchema;
  readonly revision: typeof localPersonalizationRevision;
  readonly interestIds: readonly LocalPersonalizationInterestId[];
  readonly regionIds: readonly LocalPersonalizationRegionId[];
  readonly contentLanguageIds: readonly LocalPersonalizationContentLanguageId[];
}

export interface PersonalizationValidationResult extends ManifestValidationResult {
  readonly bytes: number;
}

function isCanonicalPersonalizationList<T extends string>(
  value: unknown,
  catalog: readonly T[],
): value is readonly T[] {
  return (
    isStringArray(value) &&
    value.length <= catalog.length &&
    isSortedUnique(value) &&
    value.every((entry) => catalog.includes(entry as T))
  );
}

/**
 * Strenge Struktur- und Groessenpruefung. Ein unbekannter oder nicht
 * kanonischer Wert bleibt beim Storage-Adapter bytegleich geschuetzt und wird
 * niemals hier repariert.
 */
export function isLocalPersonalizationStateV1(
  value: unknown,
): value is LocalPersonalizationStateV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'interestIds',
      'regionIds',
      'contentLanguageIds',
    ]) ||
    value.contractVersion !== localPersonalizationContractVersion ||
    value.schema !== localPersonalizationSchema ||
    value.revision !== localPersonalizationRevision ||
    !isCanonicalPersonalizationList(value.interestIds, localPersonalizationInterestIds) ||
    !isCanonicalPersonalizationList(value.regionIds, localPersonalizationRegionIds) ||
    !isCanonicalPersonalizationList(
      value.contentLanguageIds,
      localPersonalizationContentLanguageIds,
    ) ||
    value.interestIds.length + value.regionIds.length + value.contentLanguageIds.length === 0
  ) {
    return false;
  }

  try {
    return utf8ByteLength(canonicalJson(value)) <= localPersonalizationMaxBytes;
  } catch {
    return false;
  }
}

export function validateLocalPersonalizationStateV1(
  value: unknown,
): PersonalizationValidationResult {
  if (!isLocalPersonalizationStateV1(value)) {
    return {
      ok: false,
      errors: ['Lokale Personalisierung v1 verletzt mindestens eine fail-closed Vertragsregel.'],
      bytes: 0,
    };
  }
  return {
    ok: true,
    errors: Object.freeze([]),
    bytes: utf8ByteLength(canonicalJson(value)),
  };
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
  const manifestKeys = [
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
  ];
  const hasAcceptedKeys =
    isPlainRecord(value) &&
    (hasExactKeys(value, manifestKeys) ||
      hasExactKeys(value, [...manifestKeys, 'homePresentation']));
  if (
    !hasAcceptedKeys ||
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
    !isNonEmptyString(value.revocationRevision) ||
    (Object.hasOwn(value, 'homePresentation') && !isLocalHomePresentationV1(value.homePresentation))
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

/**
 * WRN-G3-012 beschreibt keinen zweiten Manifestvertrag. Der Descriptor ist
 * ausschliesslich die ausserhalb des Manifests liegende, unveraenderliche
 * Vertrauensgrenze fuer eine vollstaendige lokale Inhaltsrevision.
 */
export const localContentReleaseDescriptorSchema =
  'wrn.local-content-release-descriptor.v1' as const;
export const localContentReleaseDescriptorContractVersion = '1.0.0' as const;
export const localContentReleaseBasePath = '/wrn-local-release/v1' as const;

export const localContentReleaseResourceIds = [
  'manifest',
  'articles',
  'supplemental-items',
  'discover-index',
  'reader-details',
  'archive-lifecycle',
  'website-publication',
] as const;
export type LocalContentReleaseResourceId = (typeof localContentReleaseResourceIds)[number];

/** Die Pfade sind Code- und nicht Manifestdaten. Sie erlauben keine URLs. */
export const localContentReleaseResourcePaths: Readonly<
  Record<LocalContentReleaseResourceId, string>
> = Object.freeze({
  manifest: `${localContentReleaseBasePath}/manifest.json`,
  articles: `${localContentReleaseBasePath}/articles.json`,
  'supplemental-items': `${localContentReleaseBasePath}/supplemental-items.json`,
  'discover-index': `${localContentReleaseBasePath}/discover-index.json`,
  'reader-details': `${localContentReleaseBasePath}/reader-details.json`,
  'archive-lifecycle': `${localContentReleaseBasePath}/archive-lifecycle.json`,
  'website-publication': `${localContentReleaseBasePath}/website-publication.json`,
});

export interface LocalContentReleaseDescriptorV1 {
  readonly contractVersion: typeof localContentReleaseDescriptorContractVersion;
  readonly schema: typeof localContentReleaseDescriptorSchema;
  /** Eine Releasekennung bindet alle darunterliegenden, alten Teilvertraege. */
  readonly releaseRevision: string;
  readonly expectedManifest: {
    readonly revision: string;
    /** SHA-256 ueber den kanonischen kompletten Manifestwert. */
    readonly sha256: string;
  };
  /**
   * Jeder additive Teilvertrag wird ausserhalb seines selbst beschriebenen
   * Integritaetsfeldes nochmals gepinnt. Dadurch kann ein ausgetauschtes,
   * intern konsistentes Teilbundle keinen Mischstand aktivieren.
   */
  readonly expectedComponents: Readonly<
    Record<
      'discoverIndex' | 'readerDetails' | 'archiveLifecycle' | 'websitePublication',
      Readonly<{ readonly revision: string; readonly sha256: string }>
    >
  >;
  readonly compatibility: {
    readonly minManifestContractVersion: typeof localManifestContractVersion;
    readonly maxManifestContractVersion: typeof localManifestContractVersion;
  };
}

export interface LocalContentReleaseDocumentsV1 {
  readonly manifest: unknown;
  readonly payloads: Readonly<Record<string, unknown>>;
  readonly discoverIndex: unknown;
  readonly readerDetails: unknown;
  readonly archiveLifecycle: unknown;
  readonly websitePublication: unknown;
}

export const localContentReleaseFailureCodes = [
  'descriptor-invalid',
  'compatibility',
  'revision',
  'manifest-hash',
  'component-revision',
  'component-hash',
  'manifest-integrity',
  'discover-integrity',
  'reader-integrity',
  'lifecycle-integrity',
  'publication-integrity',
] as const;
export type LocalContentReleaseFailureCode = (typeof localContentReleaseFailureCodes)[number];

export interface LocalContentReleaseValidationResult extends ManifestValidationResult {
  readonly failureCodes: readonly LocalContentReleaseFailureCode[];
  readonly manifestSha256: string | null;
  readonly articleIds: readonly string[];
}

export interface LocalContentReleaseReadyV1 {
  readonly descriptor: LocalContentReleaseDescriptorV1;
  readonly manifest: LocalManifestV1;
  readonly payloads: Readonly<Record<string, LocalResourcePayload>>;
  readonly discoverIndex: LocalDiscoverIndexV1;
  readonly readerDetails: LocalReaderDetailsV1;
  readonly archiveLifecycle: LocalArchiveLifecycleV1;
  readonly websitePublication: LocalWebsitePublicationV1;
  readonly manifestSha256: string;
  readonly articleIds: readonly string[];
}

function isLocalContentReleaseDescriptorV1(
  value: unknown,
): value is LocalContentReleaseDescriptorV1 {
  return (
    isPlainRecord(value) &&
    hasExactKeys(value, [
      'compatibility',
      'contractVersion',
      'expectedComponents',
      'expectedManifest',
      'releaseRevision',
      'schema',
    ]) &&
    value.contractVersion === localContentReleaseDescriptorContractVersion &&
    value.schema === localContentReleaseDescriptorSchema &&
    isNonEmptyString(value.releaseRevision) &&
    isPlainRecord(value.expectedManifest) &&
    hasExactKeys(value.expectedManifest, ['revision', 'sha256']) &&
    isNonEmptyString(value.expectedManifest.revision) &&
    typeof value.expectedManifest.sha256 === 'string' &&
    sha256Pattern.test(value.expectedManifest.sha256) &&
    isPlainRecord(value.expectedComponents) &&
    hasExactKeys(value.expectedComponents, [
      'archiveLifecycle',
      'discoverIndex',
      'readerDetails',
      'websitePublication',
    ]) &&
    Object.values(value.expectedComponents).every(
      (component) =>
        isPlainRecord(component) &&
        hasExactKeys(component, ['revision', 'sha256']) &&
        isNonEmptyString(component.revision) &&
        typeof component.sha256 === 'string' &&
        sha256Pattern.test(component.sha256),
    ) &&
    isPlainRecord(value.compatibility) &&
    hasExactKeys(value.compatibility, [
      'maxManifestContractVersion',
      'minManifestContractVersion',
    ]) &&
    value.compatibility.minManifestContractVersion === localManifestContractVersion &&
    value.compatibility.maxManifestContractVersion === localManifestContractVersion
  );
}

export { isLocalContentReleaseDescriptorV1 };

export function resolveLocalContentReleaseResourcePath(resourceId: unknown): string | null {
  return typeof resourceId === 'string' &&
    localContentReleaseResourceIds.includes(resourceId as LocalContentReleaseResourceId)
    ? localContentReleaseResourcePaths[resourceId as LocalContentReleaseResourceId]
    : null;
}

/**
 * Der Adapter darf nur diesen Plan verwenden. Optional abwesende
 * Manifestressourcen sind nicht Teil des Plans und erzeugen damit null I/O.
 */
export function createLocalContentReleaseRequestPlan(): readonly {
  readonly id: LocalContentReleaseResourceId;
  readonly path: string;
}[] {
  return Object.freeze(
    localContentReleaseResourceIds.map((id) =>
      Object.freeze({
        id,
        path: localContentReleaseResourcePaths[id],
      }),
    ),
  );
}

export const localContentReleaseMaxTransportBytes = 512 * 1024;

export interface LocalContentReleaseTransportReceipt {
  readonly resourceId: unknown;
  readonly path: unknown;
  readonly status: unknown;
  readonly mimeType: unknown;
  readonly redirected: unknown;
  readonly byteLength: unknown;
}

export const localContentReleaseTransportFailureCodes = [
  'resource-not-allowed',
  'path-not-allowed',
  'http-status',
  'mime-type',
  'redirect',
  'transport-too-large',
] as const;
export type LocalContentReleaseTransportFailureCode =
  (typeof localContentReleaseTransportFailureCodes)[number];

export const localContentReleaseTransportOutcomeCodes = [
  'offline',
  'timeout',
  'aborted',
  'transport-error',
] as const;
export type LocalContentReleaseTransportOutcomeCode =
  (typeof localContentReleaseTransportOutcomeCodes)[number];

/**
 * Ein Fetch-Adapter reicht nur diese bereits kategorisierte Ursache weiter.
 * Keine native Fehlermeldung, URL oder Response darf in die sichtbare Domain
 * gelangen.
 */
export function classifyLocalContentReleaseTransportOutcome(
  outcome: unknown,
): LocalContentReleaseTransportOutcomeCode {
  return typeof outcome === 'string' &&
    localContentReleaseTransportOutcomeCodes.includes(
      outcome as LocalContentReleaseTransportOutcomeCode,
    )
    ? (outcome as LocalContentReleaseTransportOutcomeCode)
    : 'transport-error';
}

/**
 * Reine Vorpruefung fuer spaetere Fetch-Adapter. Sie fuehrt selbst kein HTTP
 * aus und nimmt keine URL aus dem Manifest entgegen.
 */
export function validateLocalContentReleaseTransportReceipt(
  receipt: LocalContentReleaseTransportReceipt,
): { readonly ok: boolean; readonly failureCode: LocalContentReleaseTransportFailureCode | null } {
  const expectedPath = resolveLocalContentReleaseResourcePath(receipt.resourceId);
  if (expectedPath === null) return { ok: false, failureCode: 'resource-not-allowed' };
  if (receipt.path !== expectedPath) return { ok: false, failureCode: 'path-not-allowed' };
  if (receipt.status !== 200) return { ok: false, failureCode: 'http-status' };
  if (receipt.redirected !== false) return { ok: false, failureCode: 'redirect' };
  if (receipt.mimeType !== 'application/json') return { ok: false, failureCode: 'mime-type' };
  if (
    typeof receipt.byteLength !== 'number' ||
    !Number.isSafeInteger(receipt.byteLength) ||
    receipt.byteLength < 0 ||
    receipt.byteLength > localContentReleaseMaxTransportBytes
  ) {
    return { ok: false, failureCode: 'transport-too-large' };
  }
  return { ok: true, failureCode: null };
}

function releaseResult(
  failureCodes: readonly LocalContentReleaseFailureCode[],
  manifestSha256: string | null = null,
  articleIds: readonly string[] = [],
): LocalContentReleaseValidationResult {
  return Object.freeze({
    ok: failureCodes.length === 0,
    errors: Object.freeze(failureCodes.map((code) => `content-release:${code}`)),
    failureCodes: Object.freeze([...new Set(failureCodes)]),
    manifestSha256,
    articleIds: Object.freeze([...articleIds]),
  });
}

/**
 * Validiert die ganze lokale Releasegrenze vor jeder UI-Projektion. Das ist
 * absichtlich ein reiner, vollstaendiger In-Memory-Schritt: keine Requests,
 * kein Storage, kein Fallback und kein partieller Ready-Zustand.
 */
export async function validateLocalContentReleaseV1(
  descriptor: unknown,
  documents: LocalContentReleaseDocumentsV1,
  knownRevocationRevision = 0,
): Promise<LocalContentReleaseValidationResult> {
  if (!isLocalContentReleaseDescriptorV1(descriptor)) {
    return releaseResult(['descriptor-invalid']);
  }
  if (!isLocalManifestV1(documents.manifest)) {
    return releaseResult(['manifest-integrity']);
  }
  if (
    documents.manifest.compatibility.minContractVersion !==
      descriptor.compatibility.minManifestContractVersion ||
    documents.manifest.compatibility.maxContractVersion !==
      descriptor.compatibility.maxManifestContractVersion
  ) {
    return releaseResult(['compatibility']);
  }
  if (documents.manifest.revision !== descriptor.expectedManifest.revision) {
    return releaseResult(['revision']);
  }

  const manifestSha256 = await sha256Utf8(canonicalJson(documents.manifest));
  if (manifestSha256 !== descriptor.expectedManifest.sha256) {
    return releaseResult(['manifest-hash'], manifestSha256);
  }

  const manifestIntegrity = await validateLocalManifestIntegrity({
    manifest: documents.manifest,
    payloads: documents.payloads,
  });
  if (!manifestIntegrity.ok) {
    return releaseResult(['manifest-integrity'], manifestSha256);
  }

  const articleResource = documents.manifest.resources.find(
    (resource): resource is PresentResource =>
      resource.schema === localArticleResourceSchema && resource.availability !== 'optional-absent',
  );
  const articlePayload = articleResource ? documents.payloads[articleResource.id] : undefined;
  if (!isArticlePayload(articlePayload)) {
    return releaseResult(['manifest-integrity'], manifestSha256);
  }
  const articleIds = documents.manifest.articleSets.archiveIds;

  const componentDocuments = {
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
    websitePublication: documents.websitePublication,
  } as const;
  for (const [componentId, component] of Object.entries(componentDocuments) as [
    keyof typeof componentDocuments,
    unknown,
  ][]) {
    if (!isPlainRecord(component) || !isNonEmptyString(component.revision)) {
      return releaseResult(['component-revision'], manifestSha256, articleIds);
    }
    if (component.revision !== descriptor.expectedComponents[componentId].revision) {
      return releaseResult(['component-revision'], manifestSha256, articleIds);
    }
    if (
      (await sha256Utf8(canonicalJson(component))) !==
      descriptor.expectedComponents[componentId].sha256
    ) {
      return releaseResult(['component-hash'], manifestSha256, articleIds);
    }
  }

  const failureCodes: LocalContentReleaseFailureCode[] = [];
  if (
    !isLocalDiscoverIndexV1(documents.discoverIndex) ||
    !(await validateLocalDiscoverIndexV1(documents.discoverIndex, articlePayload.articles)).ok
  ) {
    failureCodes.push('discover-integrity');
  }
  if (
    !isLocalReaderDetailsV1(documents.readerDetails) ||
    !(await validateLocalReaderDetailsV1(documents.readerDetails, articlePayload.articles)).ok
  ) {
    failureCodes.push('reader-integrity');
  }
  if (
    !isLocalArchiveLifecycleV1(documents.archiveLifecycle) ||
    !(
      await validateLocalArchiveLifecycleV1(
        documents.archiveLifecycle,
        articlePayload.articles,
        documents.readerDetails as LocalReaderDetailsV1,
        knownRevocationRevision,
      )
    ).ok
  ) {
    failureCodes.push('lifecycle-integrity');
  }
  if (
    !isLocalWebsitePublicationV1(documents.websitePublication) ||
    !(
      await validateLocalWebsitePublicationV1(
        documents.websitePublication,
        documents.manifest,
        articlePayload.articles,
        documents.readerDetails as LocalReaderDetailsV1,
      )
    ).ok
  ) {
    failureCodes.push('publication-integrity');
  }

  return releaseResult(failureCodes, manifestSha256, articleIds);
}

export async function createValidatedLocalContentReleaseV1(
  descriptor: unknown,
  documents: LocalContentReleaseDocumentsV1,
  knownRevocationRevision = 0,
): Promise<LocalContentReleaseReadyV1> {
  const validation = await validateLocalContentReleaseV1(
    descriptor,
    documents,
    knownRevocationRevision,
  );
  if (
    !validation.ok ||
    !isLocalContentReleaseDescriptorV1(descriptor) ||
    !isLocalManifestV1(documents.manifest) ||
    !isLocalDiscoverIndexV1(documents.discoverIndex) ||
    !isLocalReaderDetailsV1(documents.readerDetails) ||
    !isLocalArchiveLifecycleV1(documents.archiveLifecycle) ||
    !isLocalWebsitePublicationV1(documents.websitePublication)
  ) {
    throw new Error(
      `Lokale Inhaltsrevision ist nicht aktivierbar: ${validation.failureCodes.join(',')}`,
    );
  }

  return Object.freeze({
    descriptor,
    manifest: documents.manifest,
    payloads: Object.freeze(documents.payloads as Record<string, LocalResourcePayload>),
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
    websitePublication: documents.websitePublication,
    manifestSha256: validation.manifestSha256!,
    articleIds: validation.articleIds,
  });
}

/** WRN-G3-014: additive, client-local persistence contract; no browser I/O. */
export const contentOfflineStorageFormat = 'wrn.content-offline.v1' as const;
export const contentOfflineBundleMaxBytes = 4 * 1024 * 1024;
export const contentOfflineTotalBundleMaxBytes = 12 * 1024 * 1024;
export const contentOfflineControlMaxBytes = 256 * 1024;
export const contentOfflineMaxBundles = 3;
export const contentOfflineTtlMs = 24 * 60 * 60 * 1000;

export interface ContentOfflineSafetyEntryV1 {
  readonly id: string;
  readonly status: LocalRevocationStatus;
  readonly category: 'rights-or-safety';
}

/** No titles, URLs, payloads or user activity may enter this ledger. */
export interface ContentOfflineSafetyLedgerV1 {
  readonly floor: number;
  readonly entries: readonly ContentOfflineSafetyEntryV1[];
}

export interface ContentOfflinePendingRecheckV1 {
  readonly operationId: string;
  readonly generation: number;
  readonly clearEpoch: number;
}

export interface ContentOfflineControlV1 {
  readonly format: typeof contentOfflineStorageFormat;
  readonly generation: number;
  readonly clearEpoch: number;
  readonly activeKey: string | null;
  readonly previousKey: string | null;
  readonly candidateKey: string | null;
  readonly lastSuccessfulSourceCheckAt: number | null;
  readonly lastObservedAt: number | null;
  readonly safety: ContentOfflineSafetyLedgerV1;
  readonly pendingRecheck: ContentOfflinePendingRecheckV1 | null;
}

export interface ContentOfflineBundleV1 {
  readonly key: string;
  readonly byteLength: number;
  readonly checkedAt: number;
  readonly descriptor: LocalContentReleaseDescriptorV1;
  readonly documents: LocalContentReleaseDocumentsV1;
}

function isSafeOfflineInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function hasSortedUniqueSafetyEntries(entries: readonly ContentOfflineSafetyEntryV1[]): boolean {
  return entries.every((entry, index) => index === 0 || entries[index - 1]!.id < entry.id);
}

/** Stable, locale-independent order for persisted opaque IDs. */
function compareCanonicalOpaqueIds(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1;
}

function freezeJsonSnapshot<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) freezeJsonSnapshot(item);
  } else if (isPlainRecord(value)) {
    for (const item of Object.values(value)) freezeJsonSnapshot(item);
  }
  return Object.freeze(value);
}

function canonicalJsonSnapshot<T>(value: T): T {
  return freezeJsonSnapshot(JSON.parse(canonicalJson(value)) as T);
}

function containsAllSafetyEntries(
  candidate: ContentOfflineSafetyLedgerV1,
  known: ContentOfflineSafetyLedgerV1,
): boolean {
  if (candidate.floor < known.floor) return false;
  const candidateById = new Map(candidate.entries.map((entry) => [entry.id, entry]));
  return known.entries.every((entry) => {
    const candidateEntry = candidateById.get(entry.id);
    return (
      candidateEntry !== undefined &&
      candidateEntry.status === entry.status &&
      candidateEntry.category === entry.category
    );
  });
}

function hasNoKnownRevokedArticleIds(
  articles: readonly Pick<LocalArticle, 'id'>[],
  safety: ContentOfflineSafetyLedgerV1,
): boolean {
  const revokedIds = new Set(safety.entries.map((entry) => entry.id));
  return articles.every((article) => !revokedIds.has(article.id));
}

export function isContentOfflineSafetyLedgerV1(
  value: unknown,
): value is ContentOfflineSafetyLedgerV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, ['entries', 'floor']) ||
    !isSafeOfflineInteger(value.floor) ||
    !Array.isArray(value.entries)
  )
    return false;
  return (
    value.entries.every((entry) => isRevocationEntry(entry)) &&
    hasSortedUniqueSafetyEntries(value.entries as ContentOfflineSafetyEntryV1[])
  );
}

export function isContentOfflineControlV1(value: unknown): value is ContentOfflineControlV1 {
  if (
    !isPlainRecord(value) ||
    !hasExactKeys(value, [
      'activeKey',
      'candidateKey',
      'clearEpoch',
      'format',
      'generation',
      'lastObservedAt',
      'lastSuccessfulSourceCheckAt',
      'pendingRecheck',
      'previousKey',
      'safety',
    ]) ||
    value.format !== contentOfflineStorageFormat ||
    !isSafeOfflineInteger(value.generation) ||
    !isSafeOfflineInteger(value.clearEpoch) ||
    !isContentOfflineSafetyLedgerV1(value.safety)
  )
    return false;
  const keys = [value.activeKey, value.previousKey, value.candidateKey];
  if (
    !keys.every(
      (key) => key === null || (typeof key === 'string' && key.length > 0 && key.length <= 256),
    ) ||
    new Set(keys.filter((key) => key !== null)).size !== keys.filter((key) => key !== null).length
  )
    return false;
  if (
    ![value.lastSuccessfulSourceCheckAt, value.lastObservedAt].every(
      (at) => at === null || isSafeOfflineInteger(at),
    )
  )
    return false;
  return (
    value.pendingRecheck === null ||
    (isPlainRecord(value.pendingRecheck) &&
      hasExactKeys(value.pendingRecheck, ['clearEpoch', 'generation', 'operationId']) &&
      typeof value.pendingRecheck.operationId === 'string' &&
      value.pendingRecheck.operationId.length > 0 &&
      value.pendingRecheck.operationId.length <= 128 &&
      isSafeOfflineInteger(value.pendingRecheck.generation) &&
      isSafeOfflineInteger(value.pendingRecheck.clearEpoch))
  );
}

export function createEmptyContentOfflineControlV1(): ContentOfflineControlV1 {
  return Object.freeze({
    format: contentOfflineStorageFormat,
    generation: 0,
    clearEpoch: 0,
    activeKey: null,
    previousKey: null,
    candidateKey: null,
    lastSuccessfulSourceCheckAt: null,
    lastObservedAt: null,
    safety: Object.freeze({ floor: 0, entries: Object.freeze([]) }),
    pendingRecheck: null,
  });
}

/** Equality intentionally covers only relevant revocation facts, not content/lifecycle hashes. */
export function sameContentOfflineSafetyLedger(
  left: ContentOfflineSafetyLedgerV1,
  right: ContentOfflineSafetyLedgerV1,
): boolean {
  return left.floor === right.floor && canonicalJson(left.entries) === canonicalJson(right.entries);
}

/** Monotone union: lower floors, missing IDs, and same-floor contradictions fail closed. */
export function mergeContentOfflineSafetyLedger(
  existing: ContentOfflineSafetyLedgerV1,
  incoming: ContentOfflineSafetyLedgerV1,
): ContentOfflineSafetyLedgerV1 | null {
  if (
    !isContentOfflineSafetyLedgerV1(existing) ||
    !isContentOfflineSafetyLedgerV1(incoming) ||
    incoming.floor < existing.floor ||
    !containsAllSafetyEntries(incoming, existing)
  )
    return null;
  const merged = new Map(existing.entries.map((entry) => [entry.id, entry]));
  for (const entry of incoming.entries) {
    const known = merged.get(entry.id);
    if (known !== undefined && (known.status !== entry.status || known.category !== entry.category))
      return null;
    merged.set(entry.id, entry);
  }
  if (incoming.floor === existing.floor && !sameContentOfflineSafetyLedger(existing, incoming))
    return null;
  return Object.freeze({
    floor: incoming.floor,
    entries: Object.freeze(
      [...merged.values()]
        .sort((a, b) => compareCanonicalOpaqueIds(a.id, b.id))
        .map((entry) => Object.freeze({ ...entry })),
    ),
  });
}

export function createContentOfflineSafetyLedger(
  lifecycle: LocalArchiveLifecycleV1,
): ContentOfflineSafetyLedgerV1 {
  return Object.freeze({
    floor: lifecycle.revocations.revision,
    entries: Object.freeze(
      lifecycle.revocations.entries.map((entry) =>
        Object.freeze({ id: entry.id, status: entry.status, category: entry.category }),
      ),
    ),
  });
}

export async function createContentOfflineBundleV1(input: {
  readonly descriptor: unknown;
  readonly documents: LocalContentReleaseDocumentsV1;
  readonly checkedAt: unknown;
  readonly knownSafety?: ContentOfflineSafetyLedgerV1;
}): Promise<ContentOfflineBundleV1> {
  if (!isSafeOfflineInteger(input.checkedAt))
    throw new Error('Offlinebundle besitzt keine sichere Pruefzeit.');
  if (input.knownSafety !== undefined && !isContentOfflineSafetyLedgerV1(input.knownSafety))
    throw new Error('Offlinebundle besitzt keinen gueltigen bekannten Safety-Ledger.');
  const knownSafety = input.knownSafety ?? Object.freeze({ floor: 0, entries: Object.freeze([]) });
  const descriptor = canonicalJsonSnapshot(input.descriptor);
  const documents = canonicalJsonSnapshot(input.documents) as LocalContentReleaseDocumentsV1;
  const ready = await createValidatedLocalContentReleaseV1(
    descriptor,
    documents,
    knownSafety.floor,
  );
  const candidateSafety = createContentOfflineSafetyLedger(ready.archiveLifecycle);
  const articlePayload = ready.payloads.articles;
  if (
    !containsAllSafetyEntries(candidateSafety, knownSafety) ||
    !isArticlePayload(articlePayload) ||
    !hasNoKnownRevokedArticleIds(articlePayload.articles, knownSafety)
  ) {
    throw new Error('Lokale Inhaltsrevision verletzt den kumulativen Safety-Ledger.');
  }
  const serialized = canonicalJson({ descriptor: ready.descriptor, documents });
  const byteLength = utf8ByteLength(serialized);
  if (byteLength > contentOfflineBundleMaxBytes)
    throw new Error('Offlinebundle ueberschreitet das Produktlimit.');
  const key = await sha256Utf8(
    canonicalJson({
      descriptor: ready.descriptor,
      manifestSha256: ready.manifestSha256,
      components: ready.descriptor.expectedComponents,
    }),
  );
  return Object.freeze({
    key,
    byteLength,
    checkedAt: input.checkedAt,
    descriptor: canonicalJsonSnapshot(ready.descriptor),
    documents: canonicalJsonSnapshot(documents),
  });
}

/** Revalidates a stored bundle and protects the current cumulative safety floor. */
export async function validateContentOfflineBundleV1(
  bundle: unknown,
  safety: ContentOfflineSafetyLedgerV1,
): Promise<LocalContentReleaseReadyV1 | null> {
  if (
    !isPlainRecord(bundle) ||
    !hasExactKeys(bundle, ['byteLength', 'checkedAt', 'descriptor', 'documents', 'key']) ||
    typeof bundle.key !== 'string' ||
    !isSafeOfflineInteger(bundle.byteLength) ||
    !isSafeOfflineInteger(bundle.checkedAt) ||
    !isContentOfflineSafetyLedgerV1(safety) ||
    !isPlainRecord(bundle.documents)
  )
    return null;
  try {
    const descriptor = canonicalJsonSnapshot(bundle.descriptor);
    const documents = canonicalJsonSnapshot(
      bundle.documents,
    ) as unknown as LocalContentReleaseDocumentsV1;
    const ready = await createValidatedLocalContentReleaseV1(descriptor, documents, safety.floor);
    const candidateSafety = createContentOfflineSafetyLedger(ready.archiveLifecycle);
    const articlePayload = ready.payloads.articles;
    if (
      !containsAllSafetyEntries(candidateSafety, safety) ||
      !isArticlePayload(articlePayload) ||
      !hasNoKnownRevokedArticleIds(articlePayload.articles, safety)
    )
      return null;
    const expected = await createContentOfflineBundleV1({
      descriptor,
      documents,
      checkedAt: bundle.checkedAt,
      knownSafety: safety,
    });
    return expected.key === bundle.key && expected.byteLength === bundle.byteLength ? ready : null;
  } catch {
    return null;
  }
}

/**
 * Validates the smallest semantically complete revocation evidence. It is
 * deliberately independent from discover/publication/supplemental payloads so
 * a later unrelated payload failure cannot discard already verified takedowns.
 */
export async function validateLocalContentReleaseSafetyEvidenceV1(input: {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly articles: unknown;
  readonly readerDetails: unknown;
  readonly archiveLifecycle: unknown;
  readonly knownSafety: ContentOfflineSafetyLedgerV1;
}): Promise<ContentOfflineSafetyLedgerV1 | null> {
  let descriptor: unknown;
  let manifest: unknown;
  let articles: unknown;
  let readerDetails: unknown;
  let archiveLifecycle: unknown;
  let knownSafety: unknown;
  try {
    descriptor = canonicalJsonSnapshot(input.descriptor);
    manifest = canonicalJsonSnapshot(input.manifest);
    articles = canonicalJsonSnapshot(input.articles);
    readerDetails = canonicalJsonSnapshot(input.readerDetails);
    archiveLifecycle = canonicalJsonSnapshot(input.archiveLifecycle);
    knownSafety = canonicalJsonSnapshot(input.knownSafety);
  } catch {
    return null;
  }
  if (
    !isLocalContentReleaseDescriptorV1(descriptor) ||
    !isLocalManifestV1(manifest) ||
    !isContentOfflineSafetyLedgerV1(knownSafety)
  )
    return null;
  if (
    manifest.revision !== descriptor.expectedManifest.revision ||
    manifest.compatibility.minContractVersion !==
      descriptor.compatibility.minManifestContractVersion ||
    manifest.compatibility.maxContractVersion !==
      descriptor.compatibility.maxManifestContractVersion ||
    (await sha256Utf8(canonicalJson(manifest))) !== descriptor.expectedManifest.sha256
  )
    return null;
  if (
    !isArticlePayload(articles) ||
    !isLocalReaderDetailsV1(readerDetails) ||
    !isLocalArchiveLifecycleV1(archiveLifecycle)
  )
    return null;
  const manifestArchiveIds = manifest.articleSets.archiveIds;
  const articleIds = articles.articles.map((article) => article.id).sort(compareCanonicalOpaqueIds);
  if (
    JSON.stringify(articleIds) !== JSON.stringify(manifestArchiveIds) ||
    (await sha256Utf8(canonicalJson(manifestArchiveIds))) !==
      manifest.articleSetHashes.archiveIds ||
    !hasNoKnownRevokedArticleIds(articles.articles, knownSafety)
  )
    return null;
  const articleResource = manifest.resources.find(
    (resource): resource is PresentResource =>
      resource.id === 'articles' && resource.availability !== 'optional-absent',
  );
  if (
    articleResource === undefined ||
    articleResource.schema !== localArticleResourceSchema ||
    articleResource.sha256 !== (await sha256Utf8(canonicalJson(articles)))
  )
    return null;
  for (const [key, value] of [
    ['readerDetails', readerDetails],
    ['archiveLifecycle', archiveLifecycle],
  ] as const) {
    if (
      value.revision !== descriptor.expectedComponents[key].revision ||
      (await sha256Utf8(canonicalJson(value))) !== descriptor.expectedComponents[key].sha256
    )
      return null;
  }
  if (!(await validateLocalReaderDetailsV1(readerDetails, articles.articles)).ok) return null;
  const lifecycle = await validateLocalArchiveLifecycleV1(
    archiveLifecycle,
    articles.articles,
    readerDetails,
    knownSafety.floor,
  );
  if (!lifecycle.ok) return null;
  return mergeContentOfflineSafetyLedger(
    knownSafety,
    createContentOfflineSafetyLedger(archiveLifecycle),
  );
}
// @ts-expect-error Node 24 executes the versioned production builder directly.
export * from './production-content-compatible.ts';
// @ts-expect-error Node 24 executes the versioned production builder directly.
export * from './production-content-offline-compatible.ts';
// @ts-expect-error Node 24 executes the versioned production builder directly.
export * from './production-content-release-v2.ts';
// @ts-expect-error Node 24 executes the versioned production builder directly.
export * from './production-reader-media-v2.ts';
