import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  createValidatedLocalContentReleaseV1,
  discoverIndexIntegrityPayload,
  localArchiveLifecycleContractVersion,
  localArchiveLifecycleSchema,
  localContentReleaseDescriptorContractVersion,
  localContentReleaseDescriptorSchema,
  localManifestContractVersion,
  readerDetailsIntegrityPayload,
  sha256Utf8,
  utf8ByteLength,
  type LocalArchiveLifecycleV1,
  type LocalArticle,
  type LocalArticleResourcePayload,
  type LocalContentReleaseDescriptorV1,
  type LocalContentReleaseDocumentsV1,
  type LocalDiscoverIndexV1,
  type LocalEmptyResourcePayload,
  type LocalManifestV1,
  type LocalReaderDetailsV1,
  type LocalWebsitePublicationV1,
} from '@wrn/content-contracts';

import { createPinnedLocalContentReleaseFixture } from './index.js';

const g3016SourceCommit = '4ae0dfaf08b84cbfa51c91216957c386b3730917';

const newArticles: readonly LocalArticle[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((suffix, index) =>
  Object.freeze({
    id: `wrn-test-art-g3-016-${suffix}`,
    title: `Lokaler Layoutplatzhalter ${index + 1}`,
    teaser:
      'Diese selbst erstellte lokale Fixture prueft nur eine Startseitenposition und beschreibt keine reale Sportmeldung.',
    publishedAt: `2026-08-30T${String(9 + index).padStart(2, '0')}:00:00.000Z`,
    originalUrl: `https://fixture.invalid/articles/g3-016-${suffix}`,
    source: { id: 'wrn-test-source-local', name: 'Lokale Testquelle' },
    originalLanguage: 'de',
    tags: ['fixture', 'layout'],
    rights: {
      status: 'fixture-authored-no-third-party-media',
      reference: 'wrn-g3-016-local-home-fixture',
    },
    transformation: { status: 'original' as const, reference: 'self-authored-fixture' },
    translation: { status: 'not-requested' as const, reference: 'not-applicable' },
  }),
);

const defaultG3016DiscoverTopics = Object.freeze(['Fixture', 'Layout']);
const neutralG3016SportDiscoverTopics = new Map<string, readonly string[]>([
  ['wrn-test-art-g3-016-d', Object.freeze(['Sport', 'Fussball'])],
  ['wrn-test-art-g3-016-e', Object.freeze(['Sport', 'Fankultur'])],
  ['wrn-test-art-g3-016-f', Object.freeze(['Sport', 'Frauen'])],
]);

export interface G3016MobileHomeFixture {
  readonly descriptor: LocalContentReleaseDescriptorV1;
  readonly documents: G3016MobileHomeDocuments;
}

export interface G3016MobileHomeDocuments {
  readonly manifest: LocalManifestV1;
  readonly payloads: {
    readonly articles: LocalArticleResourcePayload;
    readonly 'supplemental-items': LocalEmptyResourcePayload;
  };
  readonly discoverIndex: LocalDiscoverIndexV1;
  readonly readerDetails: LocalReaderDetailsV1;
  readonly archiveLifecycle: LocalArchiveLifecycleV1;
  readonly websitePublication: LocalWebsitePublicationV1;
}

/**
 * One self-authored mobile-only source for the G3-016 public release files.
 * It deliberately has no media, real sport source, person, group or claim.
 */
export async function createPinnedG3016MobileHomeFixture(): Promise<G3016MobileHomeFixture> {
  const base = await createPinnedLocalContentReleaseFixture();
  const baseDocuments = base.documents as unknown as G3016MobileHomeDocuments;
  const articles: LocalArticleResourcePayload = Object.freeze({
    articles: Object.freeze([...baseDocuments.payloads.articles.articles, ...newArticles]),
  });
  const ids = Object.freeze(articles.articles.map((article) => article.id).sort());
  const activeFeedIds = ids;
  const articleSetHashes = Object.freeze({
    activeFeedIds: await sha256Utf8(canonicalJson(activeFeedIds)),
    archiveIds: await sha256Utf8(canonicalJson(ids)),
    landingIds: await sha256Utf8(canonicalJson(ids)),
    redirectSourceIds: await sha256Utf8(canonicalJson([])),
    sitemapArticleIds: await sha256Utf8(canonicalJson(ids)),
  });
  const homePresentation = Object.freeze({
    contractVersion: '1.0.0' as const,
    schema: 'wrn.local-home-presentation.v1' as const,
    revision: 'wrn-g3-016-local-home-presentation-v1',
    leadId: 'wrn-test-art-cedar',
    mainIds: Object.freeze([
      'wrn-test-art-ember',
      'wrn-test-art-fern',
      'wrn-test-art-g3-016-a',
      'wrn-test-art-g3-016-b',
      'wrn-test-art-g3-016-c',
    ]),
    sport: Object.freeze({
      featureId: 'wrn-test-art-g3-016-d',
      secondaryIds: Object.freeze(['wrn-test-art-g3-016-e', 'wrn-test-art-g3-016-f']),
      categories: Object.freeze(['football', 'fanculture', 'women']),
      checkedAt: '2026-08-30T10:00:00.000Z',
      validUntil: '2026-09-06T10:00:00.000Z',
    }),
  });
  const manifestDraft = {
    ...baseDocuments.manifest,
    revision: 'wrn-g3-016-mobile-home-manifest-v1',
    generatedAt: '2026-08-30T10:00:00.000Z',
    sourceCommit: g3016SourceCommit,
    resources: await Promise.all(
      baseDocuments.manifest.resources.map(async (resource) =>
        resource.id === 'articles' && resource.availability !== 'optional-absent'
          ? {
              ...resource,
              owner: 'wrn-g3-016-local-home-fixture',
              sha256: await sha256Utf8(canonicalJson(articles)),
              bytes: utf8ByteLength(canonicalJson(articles)),
              recordCount: articles.articles.length,
            }
          : resource,
      ),
    ),
    articleSets: {
      activeFeedIds,
      archiveIds: ids,
      landingIds: ids,
      redirectSourceIds: [],
      sitemapArticleIds: ids,
    },
    articleSetHashes,
    provenance: {
      generatorVersion: 'wrn-g3-016-local-home-fixture/1',
      fixtureSeedCommit: g3016SourceCommit,
      sourceKind: 'self-authored-local-fixture' as const,
    },
    homePresentation,
  };
  const manifest = Object.freeze(manifestDraft) as LocalManifestV1;
  const discoverDraft = {
    ...baseDocuments.discoverIndex,
    revision: 'wrn-g3-016-local-home-discover-v1',
    entries: Object.freeze([
      ...baseDocuments.discoverIndex.entries,
      ...newArticles.map((article) => ({
        articleId: article.id,
        region: 'Local test region',
        topics: neutralG3016SportDiscoverTopics.get(article.id) ?? defaultG3016DiscoverTopics,
        format: 'news' as const,
      })),
    ]),
  };
  const discoverIndex = Object.freeze({
    ...discoverDraft,
    integritySha256: await sha256Utf8(canonicalJson(discoverIndexIntegrityPayload(discoverDraft))),
  }) as LocalDiscoverIndexV1;
  const readerDraft = {
    ...baseDocuments.readerDetails,
    revision: 'wrn-g3-016-local-home-reader-v1',
    entries: Object.freeze([
      ...baseDocuments.readerDetails.entries,
      ...newArticles.map((article) => ({
        articleId: article.id,
        blocks: [
          {
            kind: 'paragraph' as const,
            text: 'Dieser selbst verfasste lokale Platzhalter prueft nur die stabile Zuordnung einer Kartenposition ohne reale Aussage oder externe Quelle.',
          },
        ],
      })),
    ]),
  };
  const readerDetails = Object.freeze({
    ...readerDraft,
    integritySha256: await sha256Utf8(canonicalJson(readerDetailsIntegrityPayload(readerDraft))),
  }) as LocalReaderDetailsV1;
  const lifecycleDraft = {
    contractVersion: localArchiveLifecycleContractVersion,
    schema: localArchiveLifecycleSchema,
    revision: 'wrn-g3-016-mobile-home-lifecycle-v1',
    sourceContent: {
      articlePayloadSha256: await sha256Utf8(canonicalJson(articles)),
      readerDetailsRevision: readerDetails.revision,
      readerDetailsIntegritySha256: readerDetails.integritySha256,
    },
    activeArticleIds: ids,
    archiveArticleIds: ids,
    shareableArticleIds: ids,
    aliases: [],
    gone: baseDocuments.archiveLifecycle.gone,
    revocations: baseDocuments.archiveLifecycle.revocations,
  };
  const archiveLifecycle = Object.freeze({
    ...lifecycleDraft,
    integritySha256: await sha256Utf8(
      canonicalJson(archiveLifecycleIntegrityPayload(lifecycleDraft)),
    ),
  }) as LocalArchiveLifecycleV1;
  const websitePublicationDraft = {
    ...baseDocuments.websitePublication,
    revision: 'wrn-g3-016-mobile-home-publication-v1',
    generatedAt: '2026-08-30T10:00:00.000Z',
    sourceManifest: {
      revision: manifest.revision,
      integritySha256: await sha256Utf8(canonicalJson(manifest)),
      articleSetHashes: manifest.articleSetHashes,
    },
    readerDetails: {
      revision: readerDetails.revision,
      integritySha256: readerDetails.integritySha256,
    },
    landingIds: ids,
    sitemapArticleIds: ids,
    generatorVersion: 'wrn-g3-016-mobile-home-fixture/1',
  };
  const websitePublication = Object.freeze(websitePublicationDraft) as LocalWebsitePublicationV1;
  const documents: G3016MobileHomeDocuments = Object.freeze({
    manifest,
    payloads: Object.freeze({
      articles,
      'supplemental-items': baseDocuments.payloads['supplemental-items'],
    }),
    discoverIndex,
    readerDetails,
    archiveLifecycle,
    websitePublication,
  });
  const descriptor: LocalContentReleaseDescriptorV1 = Object.freeze({
    contractVersion: localContentReleaseDescriptorContractVersion,
    schema: localContentReleaseDescriptorSchema,
    releaseRevision: 'wrn-g3-016-mobile-home-release-v1',
    expectedManifest: {
      revision: manifest.revision,
      sha256: await sha256Utf8(canonicalJson(manifest)),
    },
    expectedComponents: {
      discoverIndex: {
        revision: discoverIndex.revision,
        sha256: await sha256Utf8(canonicalJson(discoverIndex)),
      },
      readerDetails: {
        revision: readerDetails.revision,
        sha256: await sha256Utf8(canonicalJson(readerDetails)),
      },
      archiveLifecycle: {
        revision: archiveLifecycle.revision,
        sha256: await sha256Utf8(canonicalJson(archiveLifecycle)),
      },
      websitePublication: {
        revision: websitePublication.revision,
        sha256: await sha256Utf8(canonicalJson(websitePublication)),
      },
    },
    compatibility: {
      minManifestContractVersion: localManifestContractVersion,
      maxManifestContractVersion: localManifestContractVersion,
    },
  });
  await createValidatedLocalContentReleaseV1(
    descriptor,
    documents as unknown as LocalContentReleaseDocumentsV1,
  );
  return Object.freeze({ descriptor, documents });
}
