// Shared internal implementation; public V1 is a fixed facade.
// @ts-expect-error Node 24 executes this contract source directly.
import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.ts';
import {
  hasExactProductionKeys,
  isPlainProductionRecord,
  isProductionArticleIdV1,
  isProductionSha256,
  isProductionUtcTimestamp,
  isSafeProductionHttpsUrl,
  isSafeProductionReaderText,
  isSortedUniqueStrings,
  sameSortedProductionIds,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './content-release-core-v1.ts';
import {
  productionContentPilotPolicy,
  type ProductionContentCapacityPolicy,
  // @ts-expect-error Node 24 executes this production contract source directly.
} from './production-content-capacity-policy.ts';
import {
  mergeProductionContentOfflineSafetyV1,
  // @ts-expect-error Node 24 executes this production contract source directly.
} from './production-content-offline-v1.ts';

export const productionContentReleaseSchemaV1 = 'wrn.production-content-release.v1' as const;
export const productionContentDescriptorSchemaV1 =
  'wrn.production-content-release-descriptor.v1' as const;
export const productionArticleAdmissionSchemaV1 = 'wrn.production-article-admission.v1' as const;
export const productionReadingDetailsSchemaV1 = 'wrn.production-reader-details.v1' as const;
export const productionDiscoverIndexSchemaV1 = 'wrn.production-discover-index.v1' as const;
export const productionArchiveLifecycleSchemaV1 = 'wrn.production-archive-lifecycle.v1' as const;
export const productionWebsitePublicationSchemaV1 =
  'wrn.production-website-publication.v1' as const;
export const productionContractVersionV1 = '1.0.0' as const;

export type ProductionArticleIdV1 = `wrn-art-${string}`;
export type ProductionReaderBlockV1 =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'heading'; readonly level: 2 | 3; readonly text: string }
  | { readonly kind: 'quote'; readonly text: string; readonly attribution?: string }
  | {
      readonly kind: 'list';
      readonly style: 'ordered' | 'unordered';
      readonly items: readonly string[];
    };

export interface ProductionArticleV1 {
  readonly id: ProductionArticleIdV1;
  readonly title: string;
  readonly teaser: string;
  readonly publishedAt: string;
  readonly originalUrl: string;
  readonly source: {
    readonly id: string;
    readonly name: string;
    readonly authors: readonly string[];
  };
  readonly originalLanguage: string;
  readonly tags: readonly string[];
  readonly contentCompleteness: 'full' | 'partial';
  readonly rights: {
    readonly licenseId: string;
    readonly licenseUrl: string;
    readonly evidenceUrl: string;
    readonly checkedAt: string;
    readonly scope: string;
    readonly thirdPartyMaterialReviewed: true;
  };
  readonly transformation: {
    readonly status: 'original' | 'transformed';
    readonly reference: string;
  };
}

export interface ProductionArticleAdmissionV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionArticleAdmissionSchemaV1;
  readonly revision: string;
  readonly entries: readonly {
    readonly articleId: ProductionArticleIdV1;
    readonly originalUrl: string;
    readonly sourceId: string;
    readonly authors: readonly string[];
    readonly sourceSnapshotSha256: string;
    readonly sourceSnapshotBytes: number;
    readonly admittedContentSha256: string;
    readonly licenseId: string;
    readonly licenseUrl: string;
    readonly evidenceUrl: string;
    readonly checkedAt: string;
    readonly scope: string;
    readonly thirdPartyMaterialReviewed: true;
    readonly transformation: {
      readonly status: 'original' | 'transformed';
      readonly reference: string;
    };
  }[];
}

export interface ProductionReaderDetailsV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionReadingDetailsSchemaV1;
  readonly revision: string;
  readonly entries: readonly {
    readonly articleId: ProductionArticleIdV1;
    readonly blocks: readonly ProductionReaderBlockV1[];
  }[];
}
export interface ProductionDiscoverIndexV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionDiscoverIndexSchemaV1;
  readonly revision: string;
  readonly entries: readonly {
    readonly articleId: ProductionArticleIdV1;
    readonly region: string;
    readonly topics: readonly string[];
    readonly format: string;
  }[];
}
export interface ProductionArchiveLifecycleV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionArchiveLifecycleSchemaV1;
  readonly revision: string;
  readonly activeArticleIds: readonly ProductionArticleIdV1[];
  readonly archiveArticleIds: readonly ProductionArticleIdV1[];
  readonly shareableArticleIds: readonly ProductionArticleIdV1[];
  readonly aliases: readonly {
    readonly sourceId: ProductionArticleIdV1;
    readonly targetId: ProductionArticleIdV1;
  }[];
  readonly gone: readonly { readonly id: ProductionArticleIdV1; readonly category: 'removed' }[];
  readonly revocations: {
    readonly revision: number;
    readonly previousRevision: number;
    readonly entries: readonly {
      readonly id: ProductionArticleIdV1;
      readonly status: 'blocked' | 'replaced';
      readonly category: 'rights-or-safety';
    }[];
  };
}
export interface ProductionContentReleaseDocumentsV1 {
  readonly articles: {
    readonly revision: string;
    readonly articles: readonly ProductionArticleV1[];
  };
  readonly admission: ProductionArticleAdmissionV1;
  readonly discoverIndex: ProductionDiscoverIndexV1;
  readonly readerDetails: ProductionReaderDetailsV1;
  readonly archiveLifecycle: ProductionArchiveLifecycleV1;
}
export interface ProductionContentReleaseDescriptorV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionContentDescriptorSchemaV1;
  readonly releaseRevision: string;
  readonly sequence: number;
  readonly expectedManifest: { readonly revision: string; readonly sha256: string };
  readonly expectedComponents: Readonly<
    Record<
      'admission' | 'discoverIndex' | 'readerDetails' | 'archiveLifecycle',
      { readonly revision: string; readonly sha256: string }
    >
  >;
}
export interface ProductionContentManifestV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionContentReleaseSchemaV1;
  readonly revision: string;
  readonly resources: readonly {
    readonly id: 'articles' | 'admission' | 'discoverIndex' | 'readerDetails' | 'archiveLifecycle';
    readonly path: string;
    readonly sha256: string;
    readonly bytes: number;
    readonly recordCount: number;
  }[];
  readonly articleIds: readonly ProductionArticleIdV1[];
}
export interface ProductionWebsitePublicationV1 {
  readonly contractVersion: typeof productionContractVersionV1;
  readonly schema: typeof productionWebsitePublicationSchemaV1;
  readonly revision: string;
  readonly generatedAt: string;
  readonly siteOrigin: string;
  readonly sourceManifest: {
    readonly revision: string;
    readonly sha256: string;
    readonly articleIds: readonly ProductionArticleIdV1[];
  };
  readonly landingIds: readonly ProductionArticleIdV1[];
  readonly sitemapArticleIds: readonly ProductionArticleIdV1[];
  readonly generatorVersion: string;
}
export interface ProductionContentReleaseInputV1 {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly documents: unknown;
  readonly knownSafety?: unknown;
}
export interface ProductionContentValidationResultV1 {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly manifestSha256: string | null;
  readonly articleIds: readonly ProductionArticleIdV1[];
}
export interface ProductionContentReadyV1 {
  readonly kind: 'ready';
  readonly descriptor: ProductionContentReleaseDescriptorV1;
  readonly manifest: ProductionContentManifestV1;
  readonly documents: ProductionContentReleaseDocumentsV1;
  readonly manifestSha256: string;
  readonly articleIds: readonly ProductionArticleIdV1[];
  readonly safetyLedger: ProductionContentSafetyLedgerV1;
}
export interface ProductionContentSafetyLedgerV1 {
  readonly revision: number;
  readonly revokedIds: readonly ProductionArticleIdV1[];
}
export type ProductionContentResolutionV1 =
  | {
      readonly kind: 'canonical-active' | 'canonical-archived' | 'redirected';
      readonly canonicalId: ProductionArticleIdV1;
    }
  | { readonly kind: 'gone' | 'revoked' | 'unknown' | 'invalid'; readonly message: string };

/**
 * The small lifecycle-only projection is shared by clients after a release has
 * been validated. It repeats the lifecycle safety boundaries because callers
 * may retain a Ready value longer than the bundle that created it.
 */
export interface ProductionContentLifecycleResolutionInputV1 {
  readonly requestedArticleId: unknown;
  readonly articleIds: readonly ProductionArticleIdV1[];
  readonly activeArticleIds: readonly ProductionArticleIdV1[];
  readonly aliases: readonly {
    readonly sourceId: ProductionArticleIdV1;
    readonly targetId: ProductionArticleIdV1;
  }[];
  readonly goneIds: readonly ProductionArticleIdV1[];
  readonly revokedIds: readonly ProductionArticleIdV1[];
}

function nonEmpty(value: unknown, maximum = 4096): value is string {
  return (
    typeof value === 'string' &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= maximum
  );
}
function productionIds(value: unknown): value is readonly ProductionArticleIdV1[] {
  return isSortedUniqueStrings(value, (id) => isProductionArticleIdV1(id));
}
function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
function revision(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value);
}
function validBlock(value: unknown): value is ProductionReaderBlockV1 {
  if (!isPlainProductionRecord(value) || typeof value.kind !== 'string') return false;
  if (value.kind === 'paragraph')
    return (
      hasExactProductionKeys(value, ['kind', 'text']) && isSafeProductionReaderText(value.text)
    );
  if (value.kind === 'heading')
    return (
      hasExactProductionKeys(value, ['kind', 'level', 'text']) &&
      (value.level === 2 || value.level === 3) &&
      isSafeProductionReaderText(value.text)
    );
  if (value.kind === 'quote')
    return (
      Object.keys(value).every((key) => ['kind', 'text', 'attribution'].includes(key)) &&
      isSafeProductionReaderText(value.text) &&
      (value.attribution === undefined || isSafeProductionReaderText(value.attribution))
    );
  return (
    value.kind === 'list' &&
    hasExactProductionKeys(value, ['kind', 'style', 'items']) &&
    (value.style === 'ordered' || value.style === 'unordered') &&
    Array.isArray(value.items) &&
    value.items.length > 0 &&
    value.items.length <= 128 &&
    value.items.every(isSafeProductionReaderText)
  );
}
function validArticle(value: unknown): value is ProductionArticleV1 {
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'id',
      'title',
      'teaser',
      'publishedAt',
      'originalUrl',
      'source',
      'originalLanguage',
      'tags',
      'contentCompleteness',
      'rights',
      'transformation',
    ])
  )
    return false;
  const source = value.source;
  return (
    isProductionArticleIdV1(value.id) &&
    nonEmpty(value.title) &&
    nonEmpty(value.teaser) &&
    isProductionUtcTimestamp(value.publishedAt) &&
    isSafeProductionHttpsUrl(value.originalUrl) &&
    isPlainProductionRecord(source) &&
    hasExactProductionKeys(source, ['id', 'name', 'authors']) &&
    nonEmpty(source.id) &&
    nonEmpty(source.name) &&
    Array.isArray(source.authors) &&
    source.authors.length > 0 &&
    source.authors.every((author) => nonEmpty(author)) &&
    nonEmpty(value.originalLanguage, 32) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => nonEmpty(tag, 96)) &&
    (value.contentCompleteness === 'full' || value.contentCompleteness === 'partial')
  );
}
function completeArticle(value: unknown): value is ProductionArticleV1 {
  if (
    !validArticle(value) ||
    !isPlainProductionRecord(value) ||
    value.contentCompleteness !== 'full'
  )
    return false;
  const rights = value.rights;
  const transformation = value.transformation;
  return (
    isPlainProductionRecord(rights) &&
    hasExactProductionKeys(rights, [
      'licenseId',
      'licenseUrl',
      'evidenceUrl',
      'checkedAt',
      'scope',
      'thirdPartyMaterialReviewed',
    ]) &&
    nonEmpty(rights.licenseId) &&
    isSafeProductionHttpsUrl(rights.licenseUrl) &&
    isSafeProductionHttpsUrl(rights.evidenceUrl) &&
    isProductionUtcTimestamp(rights.checkedAt) &&
    nonEmpty(rights.scope) &&
    rights.thirdPartyMaterialReviewed === true &&
    isPlainProductionRecord(transformation) &&
    hasExactProductionKeys(transformation, ['status', 'reference']) &&
    (transformation.status === 'original' || transformation.status === 'transformed') &&
    nonEmpty(transformation.reference)
  );
}
function validReaderEntry(value: unknown): value is ProductionReaderDetailsV1['entries'][number] {
  return (
    isPlainProductionRecord(value) &&
    hasExactProductionKeys(value, ['articleId', 'blocks']) &&
    isProductionArticleIdV1(value.articleId) &&
    Array.isArray(value.blocks) &&
    value.blocks.length > 0 &&
    value.blocks.length <= 512 &&
    value.blocks.every(validBlock)
  );
}
function validDiscoverEntry(value: unknown): value is ProductionDiscoverIndexV1['entries'][number] {
  return (
    isPlainProductionRecord(value) &&
    hasExactProductionKeys(value, ['articleId', 'region', 'topics', 'format']) &&
    isProductionArticleIdV1(value.articleId) &&
    nonEmpty(value.region) &&
    Array.isArray(value.topics) &&
    value.topics.length > 0 &&
    value.topics.every((topic) => nonEmpty(topic)) &&
    nonEmpty(value.format)
  );
}
function validLifecycle(value: unknown): value is ProductionArchiveLifecycleV1 {
  const revocations =
    isPlainProductionRecord(value) && isPlainProductionRecord(value.revocations)
      ? value.revocations
      : null;
  const previousRevision = revocations?.previousRevision;
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'activeArticleIds',
      'archiveArticleIds',
      'shareableArticleIds',
      'aliases',
      'gone',
      'revocations',
    ]) ||
    value.contractVersion !== productionContractVersionV1 ||
    value.schema !== productionArchiveLifecycleSchemaV1 ||
    !revision(value.revision) ||
    !productionIds(value.activeArticleIds) ||
    !productionIds(value.archiveArticleIds) ||
    !productionIds(value.shareableArticleIds) ||
    !Array.isArray(value.aliases) ||
    !Array.isArray(value.gone) ||
    revocations === null ||
    !hasExactProductionKeys(revocations, ['revision', 'previousRevision', 'entries']) ||
    !positiveInteger(revocations.revision) ||
    typeof previousRevision !== 'number' ||
    !Number.isSafeInteger(previousRevision) ||
    previousRevision < 0 ||
    previousRevision >= revocations.revision ||
    !Array.isArray(revocations.entries)
  )
    return false;
  return (
    value.aliases.every(
      (entry) =>
        isPlainProductionRecord(entry) &&
        hasExactProductionKeys(entry, ['sourceId', 'targetId']) &&
        isProductionArticleIdV1(entry.sourceId) &&
        isProductionArticleIdV1(entry.targetId),
    ) &&
    value.gone.every(
      (entry) =>
        isPlainProductionRecord(entry) &&
        hasExactProductionKeys(entry, ['id', 'category']) &&
        isProductionArticleIdV1(entry.id) &&
        entry.category === 'removed',
    ) &&
    revocations.entries.every(
      (entry) =>
        isPlainProductionRecord(entry) &&
        hasExactProductionKeys(entry, ['id', 'status', 'category']) &&
        isProductionArticleIdV1(entry.id) &&
        (entry.status === 'blocked' || entry.status === 'replaced') &&
        entry.category === 'rights-or-safety',
    )
  );
}
function documentsShape(
  value: unknown,
  policy: ProductionContentCapacityPolicy = productionContentPilotPolicy,
): value is ProductionContentReleaseDocumentsV1 {
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'articles',
      'admission',
      'discoverIndex',
      'readerDetails',
      'archiveLifecycle',
    ])
  )
    return false;
  const { articles, admission, discoverIndex, readerDetails, archiveLifecycle } = value;
  const articleEntries = isPlainProductionRecord(articles) ? articles.articles : null;
  return (
    isPlainProductionRecord(articles) &&
    hasExactProductionKeys(articles, ['revision', 'articles']) &&
    revision(articles.revision) &&
    Array.isArray(articleEntries) &&
    articleEntries.length > 0 &&
    articleEntries.length <= policy.maxArticles &&
    articleEntries.every(completeArticle) &&
    articleEntries.every(
      (article, index) => index === 0 || articleEntries[index - 1]!.id < article.id,
    ) &&
    isPlainProductionRecord(admission) &&
    hasExactProductionKeys(admission, ['contractVersion', 'schema', 'revision', 'entries']) &&
    admission.contractVersion === productionContractVersionV1 &&
    admission.schema === productionArticleAdmissionSchemaV1 &&
    revision(admission.revision) &&
    Array.isArray(admission.entries) &&
    isPlainProductionRecord(discoverIndex) &&
    hasExactProductionKeys(discoverIndex, ['contractVersion', 'schema', 'revision', 'entries']) &&
    discoverIndex.contractVersion === productionContractVersionV1 &&
    discoverIndex.schema === productionDiscoverIndexSchemaV1 &&
    revision(discoverIndex.revision) &&
    Array.isArray(discoverIndex.entries) &&
    discoverIndex.entries.every(validDiscoverEntry) &&
    isPlainProductionRecord(readerDetails) &&
    hasExactProductionKeys(readerDetails, ['contractVersion', 'schema', 'revision', 'entries']) &&
    readerDetails.contractVersion === productionContractVersionV1 &&
    readerDetails.schema === productionReadingDetailsSchemaV1 &&
    revision(readerDetails.revision) &&
    Array.isArray(readerDetails.entries) &&
    readerDetails.entries.every(validReaderEntry) &&
    validLifecycle(archiveLifecycle)
  );
}
export {
  descriptorShape as isProductionContentDescriptorV1,
  validLifecycle as isProductionArchiveLifecycleV1,
  lifecycleIsConsistent as isConsistentProductionArchiveLifecycleV1,
  revision as isProductionContentRevisionV1,
};

function descriptorShape(value: unknown): value is ProductionContentReleaseDescriptorV1 {
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'contractVersion',
      'schema',
      'releaseRevision',
      'sequence',
      'expectedManifest',
      'expectedComponents',
    ])
  )
    return false;
  const component = (candidate: unknown): boolean =>
    isPlainProductionRecord(candidate) &&
    hasExactProductionKeys(candidate, ['revision', 'sha256']) &&
    revision(candidate.revision) &&
    isProductionSha256(candidate.sha256);
  return (
    value.contractVersion === productionContractVersionV1 &&
    value.schema === productionContentDescriptorSchemaV1 &&
    revision(value.releaseRevision) &&
    positiveInteger(value.sequence) &&
    component(value.expectedManifest) &&
    isPlainProductionRecord(value.expectedComponents) &&
    hasExactProductionKeys(value.expectedComponents, [
      'admission',
      'discoverIndex',
      'readerDetails',
      'archiveLifecycle',
    ]) &&
    Object.values(value.expectedComponents).every(component)
  );
}
function manifestShape(
  value: unknown,
  policy: ProductionContentCapacityPolicy = productionContentPilotPolicy,
): value is ProductionContentManifestV1 {
  if (
    !isPlainProductionRecord(value) ||
    !hasExactProductionKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'resources',
      'articleIds',
    ])
  )
    return false;
  if (
    value.contractVersion !== productionContractVersionV1 ||
    value.schema !== productionContentReleaseSchemaV1 ||
    !revision(value.revision) ||
    !productionIds(value.articleIds) ||
    !Array.isArray(value.resources) ||
    value.resources.length !== 5
  )
    return false;
  const expected = ['admission', 'archiveLifecycle', 'articles', 'discoverIndex', 'readerDetails'];
  return value.resources.every(
    (resource, index) =>
      isPlainProductionRecord(resource) &&
      hasExactProductionKeys(resource, ['id', 'path', 'sha256', 'bytes', 'recordCount']) &&
      resource.id === expected[index] &&
      typeof resource.path === 'string' &&
      /^[-a-z]+\.json$/.test(resource.path) &&
      isProductionSha256(resource.sha256) &&
      positiveInteger(resource.bytes) &&
      resource.bytes <=
        policy.maxResourceBytes[resource.id as keyof typeof policy.maxResourceBytes] &&
      typeof resource.recordCount === 'number' &&
      Number.isSafeInteger(resource.recordCount) &&
      resource.recordCount >= 0,
  );
}
/** Public V1 predicate: the pilot resource caps are intentionally not configurable. */
export function isProductionContentManifestV1(
  value: unknown,
): value is ProductionContentManifestV1 {
  return manifestShape(value, productionContentPilotPolicy);
}
function contentIds(
  documents: ProductionContentReleaseDocumentsV1,
): readonly ProductionArticleIdV1[] {
  return [
    ...documents.articles.articles.map((article) => article.id),
  ].sort() as readonly ProductionArticleIdV1[];
}
function failure(
  errors: string[],
  manifestSha256: string | null = null,
  articleIds: readonly ProductionArticleIdV1[] = [],
): ProductionContentValidationResultV1 {
  return Object.freeze({
    ok: false,
    errors: Object.freeze(errors),
    manifestSha256,
    articleIds: Object.freeze([...articleIds]),
  });
}
function freezeProductionSnapshot<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>))
      freezeProductionSnapshot(child);
    Object.freeze(value);
  }
  return value;
}
function snapshotProductionInput(
  input: ProductionContentReleaseInputV1,
): ProductionContentReleaseInputV1 {
  return freezeProductionSnapshot(
    JSON.parse(canonicalJson(input)) as ProductionContentReleaseInputV1,
  );
}
function lifecycleIsConsistent(
  lifecycle: ProductionArchiveLifecycleV1,
  ids: readonly ProductionArticleIdV1[],
): boolean {
  if (!validLifecycle(lifecycle) || !productionIds(ids)) return false;
  const archive = lifecycle.archiveArticleIds;
  const goneIds = lifecycle.gone.map((entry) => entry.id);
  const revokedIds = lifecycle.revocations.entries.map((entry) => entry.id);
  const aliasSources = lifecycle.aliases.map((entry) => entry.sourceId);
  const aliasTargets = lifecycle.aliases.map((entry) => entry.targetId);
  const sortedUnique = (values: readonly string[]) =>
    values.every((value, index) => index === 0 || values[index - 1]! < value);
  const disjoint = (left: readonly string[], right: readonly string[]) =>
    left.every((value) => !right.includes(value));
  return (
    sameSortedProductionIds(archive, ids) &&
    lifecycle.activeArticleIds.every((id) => archive.includes(id)) &&
    lifecycle.shareableArticleIds.every((id) => archive.includes(id)) &&
    sortedUnique(aliasSources) &&
    sortedUnique(goneIds) &&
    sortedUnique(revokedIds) &&
    lifecycle.aliases.every(
      (entry) => entry.sourceId !== entry.targetId && archive.includes(entry.targetId),
    ) &&
    disjoint(aliasSources, archive) &&
    disjoint(aliasSources, aliasTargets) &&
    disjoint(aliasSources, goneIds) &&
    disjoint(aliasSources, revokedIds) &&
    disjoint(aliasTargets, goneIds) &&
    disjoint(aliasTargets, revokedIds) &&
    disjoint(archive, goneIds) &&
    disjoint(archive, revokedIds) &&
    disjoint(goneIds, revokedIds)
  );
}
function lifecycleProjectionIsConsistent(
  input: ProductionContentLifecycleResolutionInputV1,
): boolean {
  if (
    !Array.isArray(input.aliases) ||
    !Array.isArray(input.goneIds) ||
    !Array.isArray(input.revokedIds)
  )
    return false;
  const aliasSources = input.aliases.map((entry) => entry.sourceId);
  const aliasTargets = input.aliases.map((entry) => entry.targetId);
  const sortedUnique = (values: readonly string[]) =>
    values.every((value, index) => index === 0 || values[index - 1]! < value);
  const disjoint = (left: readonly string[], right: readonly string[]) =>
    left.every((value) => !right.includes(value));
  return (
    productionIds(input.articleIds) &&
    productionIds(input.activeArticleIds) &&
    input.activeArticleIds.every((id) => input.articleIds.includes(id)) &&
    input.aliases.every(
      (entry) =>
        isPlainProductionRecord(entry) &&
        hasExactProductionKeys(entry, ['sourceId', 'targetId']) &&
        isProductionArticleIdV1(entry.sourceId) &&
        isProductionArticleIdV1(entry.targetId) &&
        entry.sourceId !== entry.targetId,
    ) &&
    sortedUnique(aliasSources) &&
    productionIds(input.goneIds) &&
    productionIds(input.revokedIds) &&
    input.aliases.every((entry) => input.articleIds.includes(entry.targetId)) &&
    disjoint(aliasSources, input.articleIds) &&
    disjoint(aliasSources, aliasTargets) &&
    disjoint(aliasSources, input.goneIds) &&
    disjoint(aliasSources, input.revokedIds) &&
    disjoint(aliasTargets, input.goneIds) &&
    disjoint(aliasTargets, input.revokedIds) &&
    disjoint(input.articleIds, input.goneIds) &&
    disjoint(input.articleIds, input.revokedIds) &&
    disjoint(input.goneIds, input.revokedIds)
  );
}
export function resolveProductionContentLifecycleV1(
  input: ProductionContentLifecycleResolutionInputV1,
): ProductionContentResolutionV1 {
  if (!lifecycleProjectionIsConsistent(input))
    return Object.freeze({
      kind: 'invalid',
      message: 'Die lokale Artikeladresse konnte nicht sicher validiert werden.',
    });
  if (!isProductionArticleIdV1(input.requestedArticleId))
    return Object.freeze({
      kind: 'invalid',
      message: 'Die angeforderte Artikeladresse ist ungueltig.',
    });
  const requestedArticleId = input.requestedArticleId;
  if (input.revokedIds.includes(requestedArticleId))
    return Object.freeze({ kind: 'revoked', message: 'Dieser Artikel ist nicht verfuegbar.' });
  if (input.goneIds.includes(requestedArticleId))
    return Object.freeze({ kind: 'gone', message: 'Dieser Artikel wurde entfernt.' });
  const alias = input.aliases.find((entry) => entry.sourceId === requestedArticleId);
  if (alias !== undefined) {
    if (
      !input.articleIds.includes(alias.targetId) ||
      input.revokedIds.includes(alias.targetId) ||
      input.goneIds.includes(alias.targetId) ||
      input.aliases.some((entry) => entry.sourceId === alias.targetId)
    )
      return Object.freeze({
        kind: 'invalid',
        message: 'Die lokale Artikeladresse konnte nicht sicher validiert werden.',
      });
    return Object.freeze({ kind: 'redirected', canonicalId: alias.targetId });
  }
  if (!input.articleIds.includes(requestedArticleId))
    return Object.freeze({
      kind: 'unknown',
      message: 'Der angeforderte Artikel wurde nicht gefunden.',
    });
  return Object.freeze({
    kind: input.activeArticleIds.includes(requestedArticleId)
      ? 'canonical-active'
      : 'canonical-archived',
    canonicalId: requestedArticleId,
  });
}
function readyIsSafe(ready: ProductionContentReadyV1): boolean {
  return (
    isProductionContentSafetyLedgerV1(ready.safetyLedger) &&
    sameSortedProductionIds(ready.articleIds, ready.manifest.articleIds) &&
    lifecycleIsConsistent(ready.documents.archiveLifecycle, ready.articleIds) &&
    sameSortedProductionIds(
      ready.safetyLedger.revokedIds,
      ready.documents.archiveLifecycle.revocations.entries
        .map((entry) => entry.id)
        .sort() as ProductionArticleIdV1[],
    )
  );
}
export function createProductionContentSafetyLedger(
  lifecycle: ProductionArchiveLifecycleV1,
): ProductionContentSafetyLedgerV1 {
  const ids = lifecycle.revocations.entries
    .map((entry) => entry.id)
    .sort() as ProductionArticleIdV1[];
  return Object.freeze({
    revision: lifecycle.revocations.revision,
    revokedIds: Object.freeze(ids),
  });
}
export function isProductionContentSafetyLedgerV1(
  value: unknown,
): value is ProductionContentSafetyLedgerV1 {
  return (
    isPlainProductionRecord(value) &&
    hasExactProductionKeys(value, ['revision', 'revokedIds']) &&
    positiveInteger(value.revision) &&
    productionIds(value.revokedIds)
  );
}
/** Internal policy entry point. Public V1 and V2 always bind the pilot policy. */
export async function validateProductionContentReleaseWithPolicyV1(
  input: ProductionContentReleaseInputV1,
  policy: ProductionContentCapacityPolicy,
): Promise<ProductionContentValidationResultV1> {
  let snapshot: ProductionContentReleaseInputV1;
  try {
    snapshot = snapshotProductionInput(input);
  } catch {
    return failure(['snapshot']);
  }
  if (
    !descriptorShape(snapshot.descriptor) ||
    !manifestShape(snapshot.manifest, policy) ||
    !documentsShape(snapshot.documents, policy)
  )
    return failure(['structure']);
  const descriptor = snapshot.descriptor;
  const manifest = snapshot.manifest;
  const documents = snapshot.documents;
  if (
    descriptor.releaseRevision !== manifest.revision ||
    documents.articles.revision !== descriptor.releaseRevision ||
    descriptor.expectedManifest.revision !== descriptor.releaseRevision
  )
    return failure(['revision-binding']);
  const ids = contentIds(documents);
  if (!sameSortedProductionIds(ids, manifest.articleIds) || ids.length > policy.maxArticles)
    return failure(['article-id-set'], null, ids);
  const manifestSha256 = await sha256Utf8(canonicalJson(manifest));
  if (
    descriptor.expectedManifest.revision !== manifest.revision ||
    descriptor.expectedManifest.sha256 !== manifestSha256
  )
    return failure(['manifest-binding'], manifestSha256, ids);
  const components = {
    admission: documents.admission,
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
  } as const;
  if (
    Object.entries(components).some(
      ([name, component]) =>
        component.revision !== descriptor.releaseRevision ||
        descriptor.expectedComponents[name as keyof typeof components].revision !==
          descriptor.releaseRevision,
    )
  )
    return failure(['revision-binding'], manifestSha256, ids);
  for (const [name, component] of Object.entries(components) as [
    keyof typeof components,
    (typeof components)[keyof typeof components],
  ][]) {
    if (
      descriptor.expectedComponents[name].revision !== component.revision ||
      descriptor.expectedComponents[name].sha256 !== (await sha256Utf8(canonicalJson(component)))
    )
      return failure(['component-binding'], manifestSha256, ids);
  }
  const payloads = {
    articles: documents.articles,
    admission: documents.admission,
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
  } as const;
  const recordCounts = {
    articles: documents.articles.articles.length,
    admission: documents.admission.entries.length,
    discoverIndex: documents.discoverIndex.entries.length,
    readerDetails: documents.readerDetails.entries.length,
    archiveLifecycle: documents.archiveLifecycle.archiveArticleIds.length,
  } as const;
  let bundleBytes = 0;
  for (const resource of manifest.resources) {
    const payload = payloads[resource.id];
    const encoded = canonicalJson(payload);
    const bytes = utf8ByteLength(encoded);
    const recordCount = recordCounts[resource.id];
    bundleBytes += bytes;
    if (
      bytes > policy.maxResourceBytes[resource.id] ||
      bytes !== resource.bytes ||
      resource.sha256 !== (await sha256Utf8(encoded)) ||
      resource.recordCount !== recordCount
    )
      return failure(['resource-binding'], manifestSha256, ids);
  }
  if (bundleBytes > policy.maxBundleBytes) return failure(['bundle-size'], manifestSha256, ids);
  const entryIds = (entries: readonly { readonly articleId: ProductionArticleIdV1 }[]) =>
    [...entries.map((entry) => entry.articleId)].sort() as ProductionArticleIdV1[];
  if (
    !sameSortedProductionIds(entryIds(documents.admission.entries), ids) ||
    !sameSortedProductionIds(entryIds(documents.discoverIndex.entries), ids) ||
    !sameSortedProductionIds(entryIds(documents.readerDetails.entries), ids)
  )
    return failure(['component-id-set'], manifestSha256, ids);
  for (const entry of documents.readerDetails.entries)
    if (
      !Array.isArray(entry.blocks) ||
      entry.blocks.length === 0 ||
      entry.blocks.length > 512 ||
      !entry.blocks.every(validBlock)
    )
      return failure(['reader-content'], manifestSha256, ids);
  for (const entry of documents.discoverIndex.entries)
    if (
      !isPlainProductionRecord(entry) ||
      !hasExactProductionKeys(entry, ['articleId', 'region', 'topics', 'format']) ||
      !isProductionArticleIdV1(entry.articleId) ||
      !nonEmpty(entry.region) ||
      !Array.isArray(entry.topics) ||
      entry.topics.length === 0 ||
      !entry.topics.every((topic) => nonEmpty(topic)) ||
      !nonEmpty(entry.format)
    )
      return failure(['discover-content'], manifestSha256, ids);
  const detailById = new Map(
    documents.readerDetails.entries.map((entry) => [entry.articleId, entry]),
  );
  for (const entry of documents.admission.entries) {
    const article = documents.articles.articles.find(
      (candidate) => candidate.id === entry.articleId,
    );
    const detail = detailById.get(entry.articleId);
    if (
      !isPlainProductionRecord(entry) ||
      !hasExactProductionKeys(entry, [
        'articleId',
        'originalUrl',
        'sourceId',
        'authors',
        'sourceSnapshotSha256',
        'sourceSnapshotBytes',
        'admittedContentSha256',
        'licenseId',
        'licenseUrl',
        'evidenceUrl',
        'checkedAt',
        'scope',
        'thirdPartyMaterialReviewed',
        'transformation',
      ]) ||
      article === undefined ||
      detail === undefined ||
      !isProductionArticleIdV1(entry.articleId) ||
      !isSafeProductionHttpsUrl(entry.originalUrl) ||
      !nonEmpty(entry.sourceId) ||
      !Array.isArray(entry.authors) ||
      entry.authors.length === 0 ||
      !entry.authors.every((author) => nonEmpty(author)) ||
      !isProductionSha256(entry.sourceSnapshotSha256) ||
      !positiveInteger(entry.sourceSnapshotBytes) ||
      !isProductionSha256(entry.admittedContentSha256) ||
      !nonEmpty(entry.licenseId) ||
      !isSafeProductionHttpsUrl(entry.licenseUrl) ||
      !isSafeProductionHttpsUrl(entry.evidenceUrl) ||
      !isProductionUtcTimestamp(entry.checkedAt) ||
      !nonEmpty(entry.scope) ||
      entry.thirdPartyMaterialReviewed !== true ||
      !isPlainProductionRecord(entry.transformation) ||
      !hasExactProductionKeys(entry.transformation, ['status', 'reference']) ||
      (entry.transformation.status !== 'original' &&
        entry.transformation.status !== 'transformed') ||
      !nonEmpty(entry.transformation.reference) ||
      article.originalUrl !== entry.originalUrl ||
      article.source.id !== entry.sourceId ||
      canonicalJson(article.source.authors) !== canonicalJson(entry.authors) ||
      article.rights.licenseId !== entry.licenseId ||
      article.rights.licenseUrl !== entry.licenseUrl ||
      article.rights.evidenceUrl !== entry.evidenceUrl ||
      article.rights.checkedAt !== entry.checkedAt ||
      article.rights.scope !== entry.scope ||
      article.rights.thirdPartyMaterialReviewed !== entry.thirdPartyMaterialReviewed ||
      canonicalJson(article.transformation) !== canonicalJson(entry.transformation) ||
      entry.admittedContentSha256 !== (await sha256Utf8(canonicalJson({ article, detail })))
    )
      return failure(['admission-binding'], manifestSha256, ids);
  }
  const lifecycle = documents.archiveLifecycle;
  if (!lifecycleIsConsistent(lifecycle, ids)) return failure(['lifecycle'], manifestSha256, ids);
  const ledger = createProductionContentSafetyLedger(lifecycle);
  if (
    !isProductionContentSafetyLedgerV1(ledger) ||
    (snapshot.knownSafety !== undefined &&
      (!isProductionContentSafetyLedgerV1(snapshot.knownSafety) ||
        snapshot.knownSafety.revision > ledger.revision ||
        !snapshot.knownSafety.revokedIds.every((id) => ledger.revokedIds.includes(id))))
  )
    return failure(['safety-ledger'], manifestSha256, ids);
  return Object.freeze({
    ok: true,
    errors: Object.freeze([]),
    manifestSha256,
    articleIds: Object.freeze([...ids]),
  });
}
export async function validateProductionContentReleaseV1(
  input: ProductionContentReleaseInputV1,
): Promise<ProductionContentValidationResultV1> {
  return validateProductionContentReleaseWithPolicyV1(input, productionContentPilotPolicy);
}

export async function createValidatedProductionContentReleaseWithPolicyV1(
  input: ProductionContentReleaseInputV1,
  policy: ProductionContentCapacityPolicy,
): Promise<ProductionContentReadyV1 | null> {
  let snapshot: ProductionContentReleaseInputV1;
  try {
    snapshot = snapshotProductionInput(input);
  } catch {
    return null;
  }
  const validation = await validateProductionContentReleaseWithPolicyV1(snapshot, policy);
  if (
    !validation.ok ||
    !descriptorShape(snapshot.descriptor) ||
    !manifestShape(snapshot.manifest, policy) ||
    !documentsShape(snapshot.documents, policy)
  )
    return null;
  const ready: ProductionContentReadyV1 = {
    kind: 'ready',
    descriptor: snapshot.descriptor,
    manifest: snapshot.manifest,
    documents: snapshot.documents,
    manifestSha256: validation.manifestSha256!,
    articleIds: validation.articleIds,
    safetyLedger: createProductionContentSafetyLedger(snapshot.documents.archiveLifecycle),
  };
  return Object.freeze(ready);
}
export async function createValidatedProductionContentReleaseV1(
  input: ProductionContentReleaseInputV1,
): Promise<ProductionContentReadyV1 | null> {
  return createValidatedProductionContentReleaseWithPolicyV1(input, productionContentPilotPolicy);
}
export function resolveProductionContentArticleV1(
  ready: ProductionContentReadyV1,
  requestedArticleId: unknown,
): ProductionContentResolutionV1 {
  if (!readyIsSafe(ready))
    return Object.freeze({
      kind: 'invalid',
      message: 'Die lokale Artikeladresse konnte nicht sicher validiert werden.',
    });
  const lifecycle = ready.documents.archiveLifecycle;
  return resolveProductionContentLifecycleV1({
    requestedArticleId,
    articleIds: ready.articleIds,
    activeArticleIds: lifecycle.activeArticleIds,
    aliases: lifecycle.aliases,
    goneIds: lifecycle.gone.map((entry) => entry.id),
    revokedIds: ready.safetyLedger.revokedIds,
  });
}
export function createProductionArticleShareUrlV1(
  ready: ProductionContentReadyV1,
  resolution: ProductionContentResolutionV1,
): string | null {
  if (
    !readyIsSafe(ready) ||
    (resolution.kind !== 'canonical-active' && resolution.kind !== 'canonical-archived') ||
    !ready.documents.archiveLifecycle.shareableArticleIds.includes(resolution.canonicalId)
  )
    return null;
  return `https://solinaridao.com/articles/${resolution.canonicalId}/`;
}

export function isProductionWebsitePublicationV1(
  value: unknown,
): value is ProductionWebsitePublicationV1 {
  return (
    isPlainProductionRecord(value) &&
    hasExactProductionKeys(value, [
      'contractVersion',
      'schema',
      'revision',
      'generatedAt',
      'siteOrigin',
      'sourceManifest',
      'landingIds',
      'sitemapArticleIds',
      'generatorVersion',
    ]) &&
    value.contractVersion === productionContractVersionV1 &&
    value.schema === productionWebsitePublicationSchemaV1 &&
    revision(value.revision) &&
    isProductionUtcTimestamp(value.generatedAt) &&
    isSafeProductionHttpsUrl(value.siteOrigin) &&
    isPlainProductionRecord(value.sourceManifest) &&
    hasExactProductionKeys(value.sourceManifest, ['revision', 'sha256', 'articleIds']) &&
    revision(value.sourceManifest.revision) &&
    isProductionSha256(value.sourceManifest.sha256) &&
    productionIds(value.sourceManifest.articleIds) &&
    productionIds(value.landingIds) &&
    productionIds(value.sitemapArticleIds) &&
    nonEmpty(value.generatorVersion)
  );
}

export function validateProductionWebsitePublicationV1(
  publication: unknown,
  ready: ProductionContentReadyV1,
): {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly articleIds: readonly ProductionArticleIdV1[];
} {
  if (!isProductionWebsitePublicationV1(publication))
    return Object.freeze({
      ok: false,
      errors: Object.freeze(['structure']),
      articleIds: Object.freeze([]),
    });
  if (
    publication.sourceManifest.revision !== ready.manifest.revision ||
    publication.sourceManifest.sha256 !== ready.manifestSha256
  )
    return Object.freeze({
      ok: false,
      errors: Object.freeze(['manifest-binding']),
      articleIds: Object.freeze([]),
    });
  if (
    !sameSortedProductionIds(publication.sourceManifest.articleIds, ready.articleIds) ||
    !sameSortedProductionIds(publication.landingIds, ready.articleIds) ||
    !sameSortedProductionIds(publication.sitemapArticleIds, ready.articleIds)
  )
    return Object.freeze({
      ok: false,
      errors: Object.freeze(['article-id-set']),
      articleIds: Object.freeze([]),
    });
  return Object.freeze({ ok: true, errors: Object.freeze([]), articleIds: ready.articleIds });
}

/** Internal V3 bridge; public V1 manifest validation is always pilot-bound. */
export function isProductionContentManifestWithPolicy(
  value: unknown,
  policy: ProductionContentCapacityPolicy,
): value is ProductionContentManifestV1 {
  return manifestShape(value, policy);
}
export const createValidatedProductionContentWithPolicyInternal =
  createValidatedProductionContentReleaseWithPolicyV1;

function internalOfflineSafety(value: unknown): value is ProductionContentSafetyLedgerV1 {
  return (
    isProductionContentSafetyLedgerV1(value) ||
    (isPlainProductionRecord(value) &&
      hasExactProductionKeys(value, ['revision', 'revokedIds']) &&
      value.revision === 0 &&
      Array.isArray(value.revokedIds) &&
      value.revokedIds.length === 0)
  );
}

/** Shared V3 pre-payload safety path; V1's public offline facade remains fixed. */
export async function validateProductionContentSafetyWithPolicyInternal(
  input: {
    readonly descriptor: unknown;
    readonly manifest: unknown;
    readonly archiveLifecycle: unknown;
    readonly knownSafety: ProductionContentSafetyLedgerV1;
  },
  policy: ProductionContentCapacityPolicy,
  isManifest: (value: unknown) => boolean,
  isDescriptor: (value: unknown) => boolean,
): Promise<ProductionContentSafetyLedgerV1 | null> {
  try {
    const bound = freezeProductionSnapshot(JSON.parse(canonicalJson(input)) as typeof input);
    if (
      !isDescriptor(bound.descriptor) ||
      !isManifest(bound.manifest) ||
      !validLifecycle(bound.archiveLifecycle) ||
      !internalOfflineSafety(bound.knownSafety)
    )
      return null;
    const descriptor = bound.descriptor as ProductionContentReleaseDescriptorV1;
    const manifest = bound.manifest as ProductionContentManifestV1;
    const lifecycle = bound.archiveLifecycle as ProductionArchiveLifecycleV1;
    const paths = {
      admission: 'admission.json',
      archiveLifecycle: 'archive-lifecycle.json',
      articles: 'articles.json',
      discoverIndex: 'discover-index.json',
      readerDetails: 'reader-details.json',
    } as const;
    if (
      manifest.revision !== descriptor.releaseRevision ||
      descriptor.expectedManifest.revision !== descriptor.releaseRevision ||
      lifecycle.revision !== descriptor.releaseRevision ||
      Object.values(descriptor.expectedComponents).some(
        (entry) => entry.revision !== descriptor.releaseRevision,
      ) ||
      manifest.resources.some((resource) => resource.path !== paths[resource.id]) ||
      manifest.articleIds.length > policy.maxArticles ||
      manifest.resources.some(
        (resource) => resource.bytes > policy.maxResourceBytes[resource.id],
      ) ||
      manifest.resources.some(
        (resource) =>
          resource.id !== 'archiveLifecycle' && resource.recordCount !== manifest.articleIds.length,
      ) ||
      !lifecycleIsConsistent(lifecycle, manifest.articleIds)
    )
      return null;
    const archive = manifest.resources.find((resource) => resource.id === 'archiveLifecycle');
    const text = canonicalJson(lifecycle);
    const hash = await sha256Utf8(text);
    if (
      archive === undefined ||
      descriptor.expectedManifest.sha256 !== (await sha256Utf8(canonicalJson(manifest))) ||
      descriptor.expectedComponents.archiveLifecycle.sha256 !== hash ||
      archive.sha256 !== hash ||
      archive.bytes !== utf8ByteLength(text) ||
      archive.recordCount !== lifecycle.archiveArticleIds.length
    )
      return null;
    return mergeProductionContentOfflineSafetyV1(
      bound.knownSafety,
      createProductionContentSafetyLedger(lifecycle),
    );
  } catch {
    return null;
  }
}
