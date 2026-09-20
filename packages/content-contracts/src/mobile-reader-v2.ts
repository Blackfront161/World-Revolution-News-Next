/**
 * Mobile-only Reader-v2 sidecar contract.  It intentionally does not alter
 * the shared Reader-v1 release contract: v1 remains the original text source
 * and this module can only describe a validated projection of it.
 */
import {
  canonicalJson,
  sha256Utf8,
  utf8ByteLength,
  type LocalReaderContentBlock,
  type LocalReaderDetailEntryV1,
  type LocalArticle,
} from './index.js';

export const mobileReaderV2Schema = 'wrn.mobile-reader-v2.v1' as const;
export const mobileReaderV2ContractVersion = '1.0.0' as const;
export const mobileReaderV2MaxTransportBytes = 512 * 1024;
export const mobileReaderV2MaxDecodedJsonBytes = 512 * 1024;
export const mobileReaderV2MaxArticles = 64;
export const mobileReaderV2MaxSectionsPerArticle = 64;
export const mobileReaderV2MaxBlockReferencesPerArticle = 256;
export const mobileReaderV2MaxMediaPerArticle = 8;
export const mobileReaderV2MaxMedia = 64;
export const mobileReaderV2MaxMediaBytes = 256 * 1024;
export const mobileReaderV2MaxDecodedMediaBytesPerArticle = 1024 * 1024;
export const mobileReaderV2MaxMediaDimension = 2048;
export const mobileReaderV2MaxMediaPixels = 4_194_304;
export const mobileReaderV2MaxTranslationBytes = 32 * 1024;
export const mobileReaderV2MaxLedgerBytes = 64 * 1024;
export const mobileReaderV2MaxLedgerEntries = 512;
export const mobileReaderV2MaxIdLength = 128;

export const mobileReaderV2ProjectionKinds = [
  'original',
  'structured',
  'ambiguous',
  'rejected',
] as const;
export type MobileReaderV2ProjectionKind = (typeof mobileReaderV2ProjectionKinds)[number];
export const mobileReaderV2Delivery = 'self-authored-local-fixture' as const;
/** The only media-rights value admitted by the provider-free local fixture contract. */
export const mobileReaderV2Rights = 'self-authored-local-fixture' as const;

export interface MobileReaderV2SnapshotIdentity {
  readonly releaseRevision: string;
  readonly manifestSha256: string;
  readonly readerDetailsRevision: string;
  readonly readerDetailsWholeDocumentSha256: string;
  readonly readerDetailsIntegritySha256: string;
}

export interface MobileReaderV2BlockReference {
  readonly blockId: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly sourceFragmentSha256: string;
}

export interface MobileReaderV2Section {
  readonly sectionId: string;
  readonly blockReferences: readonly MobileReaderV2BlockReference[];
  /** A non-destructive, v1-bound relation to a predecessor article fragment. */
  readonly predecessor?: MobileReaderV2Predecessor;
}

export interface MobileReaderV2Predecessor {
  readonly articleId: string;
  readonly beforeBlockId: string;
  readonly sourceFragmentSha256: string;
  readonly label: string;
}

export interface MobileReaderV2ArticleProjection {
  readonly articleId: string;
  readonly projection: MobileReaderV2ProjectionKind;
  readonly transformerId: string;
  readonly transformerVersion: string;
  readonly sections: readonly MobileReaderV2Section[];
}

export interface MobileReaderV2SourceProfile {
  readonly sourceId: string;
  readonly selfDescription: string;
  readonly editorialContext: string;
  readonly sourceType: string;
  readonly regions: readonly string[];
  readonly languages: readonly string[];
  readonly freshness: {
    readonly status: 'current' | 'stale' | 'unknown';
    readonly reviewedAt: string | null;
  };
  readonly correctionContact: { readonly label: string; readonly value: string } | null;
}

export interface MobileReaderV2Media {
  readonly mediaId: string;
  readonly articleId: string;
  readonly sectionId: string;
  readonly blockId: string;
  readonly provenance: string;
  readonly rights: typeof mobileReaderV2Rights;
  readonly license: string;
  readonly attribution: string;
  readonly delivery: typeof mobileReaderV2Delivery;
  /** Opaque package identifier; it is deliberately not a path, URL or storage value. */
  readonly localAssetId: string;
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly byteLength: number;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly revision: string;
  readonly altTextProvenance: string;
  readonly altText: string;
}

export interface MobileReaderV2MediaRevocation {
  readonly mediaId: string;
  readonly sha256: string;
}

export interface MobileReaderV2Document {
  readonly contractVersion: typeof mobileReaderV2ContractVersion;
  readonly schema: typeof mobileReaderV2Schema;
  readonly revision: string;
  readonly snapshot: MobileReaderV2SnapshotIdentity;
  readonly articles: readonly MobileReaderV2ArticleProjection[];
  readonly sources: readonly MobileReaderV2SourceProfile[];
  readonly media: readonly MobileReaderV2Media[];
  readonly revocations: {
    readonly revision: number;
    readonly previousRevision: number;
    readonly entries: readonly MobileReaderV2MediaRevocation[];
  };
}

export interface MobileReaderV2SidecarPin {
  readonly path: string;
  readonly revision: string;
  readonly wholeDocumentSha256: string;
  readonly snapshot: MobileReaderV2SnapshotIdentity;
}

export interface MobileReaderV2ValidatedDocument {
  readonly document: MobileReaderV2Document;
  readonly mediaById: ReadonlyMap<string, MobileReaderV2Media>;
}

const opaqueIdPattern = /^[A-Za-z0-9._:-]+$/;
const localAssetIdPattern = /^wrn-local-asset-[A-Za-z0-9_-]{1,112}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const exactDocumentKeys = [
  'articles',
  'contractVersion',
  'media',
  'revocations',
  'revision',
  'schema',
  'snapshot',
  'sources',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isOpaqueId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= mobileReaderV2MaxIdLength &&
    opaqueIdPattern.test(value)
  );
}

function isHash(value: unknown): value is string {
  return typeof value === 'string' && sha256Pattern.test(value);
}

function isFixtureText(value: unknown, maxBytes: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && utf8ByteLength(value) <= maxBytes;
}

function isSortedUniqueOpaqueIds(value: unknown, max: number): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= max &&
    value.every(isOpaqueId) &&
    value.every((item, index) => index === 0 || value[index - 1]! < item)
  );
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isLocalAssetId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= mobileReaderV2MaxIdLength &&
    localAssetIdPattern.test(value)
  );
}

function isSafeInt(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
}

function equalsSnapshot(
  a: MobileReaderV2SnapshotIdentity,
  b: MobileReaderV2SnapshotIdentity,
): boolean {
  return (
    a.releaseRevision === b.releaseRevision &&
    a.manifestSha256 === b.manifestSha256 &&
    a.readerDetailsRevision === b.readerDetailsRevision &&
    a.readerDetailsWholeDocumentSha256 === b.readerDetailsWholeDocumentSha256 &&
    a.readerDetailsIntegritySha256 === b.readerDetailsIntegritySha256
  );
}

function isSnapshot(value: unknown): value is MobileReaderV2SnapshotIdentity {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      'releaseRevision',
      'manifestSha256',
      'readerDetailsRevision',
      'readerDetailsWholeDocumentSha256',
      'readerDetailsIntegritySha256',
    ]) &&
    isOpaqueId(value.releaseRevision) &&
    isHash(value.manifestSha256) &&
    isOpaqueId(value.readerDetailsRevision) &&
    isHash(value.readerDetailsWholeDocumentSha256) &&
    isHash(value.readerDetailsIntegritySha256)
  );
}

function isBlockReference(value: unknown): value is MobileReaderV2BlockReference {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['blockId', 'endIndex', 'sourceFragmentSha256', 'startIndex']) &&
    isOpaqueId(value.blockId) &&
    isSafeInt(value.startIndex, mobileReaderV2MaxBlockReferencesPerArticle) &&
    isSafeInt(value.endIndex, mobileReaderV2MaxBlockReferencesPerArticle) &&
    value.startIndex <= value.endIndex &&
    isHash(value.sourceFragmentSha256)
  );
}

function isSection(value: unknown): value is MobileReaderV2Section {
  if (!isRecord(value)) return false;
  const allowed = ['sectionId', 'blockReferences', 'predecessor'];
  if (!Object.keys(value).every((key) => allowed.includes(key)) || !isOpaqueId(value.sectionId))
    return false;
  if (!Array.isArray(value.blockReferences) || value.blockReferences.length === 0) return false;
  if (!value.blockReferences.every(isBlockReference)) return false;
  return value.predecessor === undefined || isPredecessor(value.predecessor);
}

function isPredecessor(value: unknown): value is MobileReaderV2Predecessor {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['articleId', 'beforeBlockId', 'label', 'sourceFragmentSha256']) &&
    isOpaqueId(value.articleId) &&
    isOpaqueId(value.beforeBlockId) &&
    isHash(value.sourceFragmentSha256) &&
    isFixtureText(value.label, 256)
  );
}

function isArticle(value: unknown): value is MobileReaderV2ArticleProjection {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      'articleId',
      'projection',
      'sections',
      'transformerId',
      'transformerVersion',
    ]) &&
    isOpaqueId(value.articleId) &&
    typeof value.projection === 'string' &&
    (mobileReaderV2ProjectionKinds as readonly string[]).includes(value.projection) &&
    isOpaqueId(value.transformerId) &&
    isOpaqueId(value.transformerVersion) &&
    Array.isArray(value.sections) &&
    (value.projection === 'rejected' || value.sections.length > 0) &&
    value.sections.length <= mobileReaderV2MaxSectionsPerArticle &&
    value.sections.every(isSection)
  );
}

function isMedia(value: unknown): value is MobileReaderV2Media {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      'altTextProvenance',
      'altText',
      'articleId',
      'attribution',
      'blockId',
      'byteLength',
      'delivery',
      'height',
      'license',
      'localAssetId',
      'mediaId',
      'mimeType',
      'provenance',
      'revision',
      'rights',
      'sectionId',
      'sha256',
      'width',
    ]) &&
    isOpaqueId(value.mediaId) &&
    isOpaqueId(value.articleId) &&
    isOpaqueId(value.sectionId) &&
    isOpaqueId(value.blockId) &&
    isOpaqueId(value.provenance) &&
    value.rights === mobileReaderV2Rights &&
    isOpaqueId(value.license) &&
    isOpaqueId(value.attribution) &&
    isOpaqueId(value.revision) &&
    isOpaqueId(value.altTextProvenance) &&
    isFixtureText(value.altText, 1024) &&
    value.delivery === mobileReaderV2Delivery &&
    isLocalAssetId(value.localAssetId) &&
    (value.mimeType === 'image/png' ||
      value.mimeType === 'image/jpeg' ||
      value.mimeType === 'image/webp') &&
    isSafeInt(value.byteLength, mobileReaderV2MaxMediaBytes) &&
    isSafeInt(value.width, mobileReaderV2MaxMediaDimension) &&
    isSafeInt(value.height, mobileReaderV2MaxMediaDimension) &&
    value.width > 0 &&
    value.height > 0 &&
    value.width * value.height <= mobileReaderV2MaxMediaPixels &&
    isHash(value.sha256)
  );
}

function isSourceProfile(value: unknown): value is MobileReaderV2SourceProfile {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'correctionContact',
      'editorialContext',
      'freshness',
      'languages',
      'regions',
      'selfDescription',
      'sourceId',
      'sourceType',
    ]) ||
    !isOpaqueId(value.sourceId) ||
    !isFixtureText(value.selfDescription, 2048) ||
    !isFixtureText(value.editorialContext, 2048) ||
    !isOpaqueId(value.sourceType) ||
    !isSortedUniqueOpaqueIds(value.regions, 16) ||
    !isSortedUniqueOpaqueIds(value.languages, 16) ||
    !isRecord(value.freshness) ||
    !hasExactKeys(value.freshness, ['reviewedAt', 'status']) ||
    !['current', 'stale', 'unknown'].includes(value.freshness.status as string)
  )
    return false;
  if (
    (value.freshness.status === 'unknown' && value.freshness.reviewedAt !== null) ||
    (value.freshness.status !== 'unknown' && !isIsoTimestamp(value.freshness.reviewedAt))
  )
    return false;
  return (
    value.correctionContact === null ||
    (isRecord(value.correctionContact) &&
      hasExactKeys(value.correctionContact, ['label', 'value']) &&
      isFixtureText(value.correctionContact.label, 256) &&
      isFixtureText(value.correctionContact.value, 256))
  );
}

function isRevocations(value: unknown): value is MobileReaderV2Document['revocations'] {
  if (!isRecord(value) || !hasExactKeys(value, ['entries', 'previousRevision', 'revision']))
    return false;
  if (
    !isSafeInt(value.revision, Number.MAX_SAFE_INTEGER) ||
    !isSafeInt(value.previousRevision, Number.MAX_SAFE_INTEGER)
  )
    return false;
  if (
    value.revision < value.previousRevision ||
    !Array.isArray(value.entries) ||
    value.entries.length > mobileReaderV2MaxLedgerEntries
  )
    return false;
  return value.entries.every(
    (entry) =>
      isRecord(entry) &&
      hasExactKeys(entry, ['mediaId', 'sha256']) &&
      isOpaqueId(entry.mediaId) &&
      isHash(entry.sha256),
  );
}

export async function mobileReaderV2FragmentSha256(
  blocks: readonly LocalReaderContentBlock[],
): Promise<string> {
  return sha256Utf8(canonicalJson(blocks));
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

/** Validates the whole sidecar atomically against the already validated v1 reader details. */
export async function validateMobileReaderV2Document(
  candidate: unknown,
  expectedSnapshot: MobileReaderV2SnapshotIdentity,
  v1Entries: readonly LocalReaderDetailEntryV1[],
  v1Articles: readonly Pick<LocalArticle, 'id' | 'source'>[],
): Promise<MobileReaderV2ValidatedDocument | null> {
  if (!isRecord(candidate) || !hasExactKeys(candidate, exactDocumentKeys)) return null;
  if (
    candidate.contractVersion !== mobileReaderV2ContractVersion ||
    candidate.schema !== mobileReaderV2Schema ||
    !isOpaqueId(candidate.revision) ||
    !isSnapshot(candidate.snapshot) ||
    !equalsSnapshot(candidate.snapshot, expectedSnapshot) ||
    !Array.isArray(candidate.articles) ||
    !Array.isArray(candidate.sources) ||
    !Array.isArray(candidate.media) ||
    !isRevocations(candidate.revocations)
  )
    return null;
  if (utf8ByteLength(canonicalJson(candidate)) > mobileReaderV2MaxDecodedJsonBytes) return null;
  if (
    candidate.articles.length > mobileReaderV2MaxArticles ||
    candidate.media.length > mobileReaderV2MaxMedia
  )
    return null;
  if (
    !candidate.articles.every(isArticle) ||
    !candidate.media.every(isMedia) ||
    !candidate.sources.every(isSourceProfile)
  )
    return null;

  const v1ByArticle = new Map(v1Entries.map((entry) => [entry.articleId, entry]));
  const v1ArticleSourceById = new Map(v1Articles.map((article) => [article.id, article.source.id]));
  if (
    v1ArticleSourceById.size !== v1Articles.length ||
    v1ArticleSourceById.size !== v1Entries.length ||
    v1Entries.some((entry) => !v1ArticleSourceById.has(entry.articleId)) ||
    v1Articles.some((article) => !v1ByArticle.has(article.id))
  )
    return null;
  const sidecarArticleIds = candidate.articles.map((article) => article.articleId);
  if (
    new Set(sidecarArticleIds).size !== sidecarArticleIds.length ||
    sidecarArticleIds.length !== v1ByArticle.size ||
    sidecarArticleIds.some((id) => !v1ByArticle.has(id))
  )
    return null;
  const requiredSourceIds = [
    ...new Set(v1Entries.map((entry) => v1ArticleSourceById.get(entry.articleId)!)),
  ].sort();
  const profileSourceIds = candidate.sources.map((source) => source.sourceId);
  if (
    new Set(profileSourceIds).size !== profileSourceIds.length ||
    profileSourceIds.length !== requiredSourceIds.length ||
    requiredSourceIds.some((id) => !profileSourceIds.includes(id))
  )
    return null;

  for (const article of candidate.articles) {
    const original = v1ByArticle.get(article.articleId);
    if (original === undefined) return null;
    if (article.projection === 'rejected') {
      if (
        article.sections.length !== 0 ||
        candidate.media.some((media) => media.articleId === article.articleId)
      )
        return null;
      continue;
    }
    const sectionIds = article.sections.map((section) => section.sectionId);
    if (new Set(sectionIds).size !== sectionIds.length) return null;
    const references = article.sections.flatMap((section) => section.blockReferences);
    if (references.length > mobileReaderV2MaxBlockReferencesPerArticle) return null;
    if (new Set(references.map((reference) => reference.blockId)).size !== references.length)
      return null;
    const covered: number[] = [];
    for (const reference of references) {
      if (reference.endIndex >= original.blocks.length) return null;
      const range = original.blocks.slice(reference.startIndex, reference.endIndex + 1);
      if ((await mobileReaderV2FragmentSha256(range)) !== reference.sourceFragmentSha256)
        return null;
      for (let index = reference.startIndex; index <= reference.endIndex; index++)
        covered.push(index);
    }
    if (
      covered.length !== original.blocks.length ||
      covered.some((index, position) => index !== position)
    )
      return null;
    for (const section of article.sections) {
      const predecessor = section.predecessor;
      if (predecessor === undefined) continue;
      if (predecessor.articleId === article.articleId || !v1ByArticle.has(predecessor.articleId))
        return null;
      const anchor = section.blockReferences.find(
        (reference) => reference.blockId === predecessor.beforeBlockId,
      );
      if (anchor === undefined || anchor.sourceFragmentSha256 !== predecessor.sourceFragmentSha256)
        return null;
    }
  }

  const mediaById = new Map<string, MobileReaderV2Media>();
  const mediaCountByArticle = new Map<string, number>();
  const mediaBytesByArticle = new Map<string, number>();
  for (const media of candidate.media) {
    if (mediaById.has(media.mediaId) || !v1ByArticle.has(media.articleId)) return null;
    const article = candidate.articles.find((item) => item.articleId === media.articleId);
    if (
      article === undefined ||
      !article.sections.some(
        (section) =>
          section.sectionId === media.sectionId &&
          section.blockReferences.some((reference) => reference.blockId === media.blockId),
      )
    )
      return null;
    const nextCount = (mediaCountByArticle.get(media.articleId) ?? 0) + 1;
    if (nextCount > mobileReaderV2MaxMediaPerArticle) return null;
    mediaCountByArticle.set(media.articleId, nextCount);
    const nextBytes = (mediaBytesByArticle.get(media.articleId) ?? 0) + media.byteLength;
    if (nextBytes > mobileReaderV2MaxDecodedMediaBytesPerArticle) return null;
    mediaBytesByArticle.set(media.articleId, nextBytes);
    mediaById.set(media.mediaId, Object.freeze({ ...media }));
  }
  const revokedKeys = new Set(
    candidate.revocations.entries.map((entry) => `${entry.mediaId}:${entry.sha256}`),
  );
  if (revokedKeys.size !== candidate.revocations.entries.length) return null;
  return Object.freeze({
    document: Object.freeze(candidate as unknown as MobileReaderV2Document),
    mediaById,
  });
}
