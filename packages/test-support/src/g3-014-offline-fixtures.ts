import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  createValidatedLocalContentReleaseV1,
  discoverIndexIntegrityPayload,
  readerDetailsIntegrityPayload,
  sha256Utf8,
  utf8ByteLength,
  type LocalArchiveLifecycleV1,
  type LocalArticleResourcePayload,
  type LocalContentReleaseDescriptorV1,
  type LocalContentReleaseDocumentsV1,
  type LocalContentReleaseReadyV1,
  type LocalDiscoverIndexV1,
  type LocalEmptyResourcePayload,
  type LocalManifestV1,
  type LocalReaderDetailsV1,
  type LocalWebsitePublicationV1,
} from '@wrn/content-contracts';

import { createPinnedLocalContentReleaseFixture } from './index.js';

type OfflineDocuments = {
  readonly manifest: LocalManifestV1;
  readonly payloads: {
    readonly articles: LocalArticleResourcePayload;
    readonly 'supplemental-items': LocalEmptyResourcePayload;
  };
  readonly discoverIndex: LocalDiscoverIndexV1;
  readonly readerDetails: LocalReaderDetailsV1;
  readonly archiveLifecycle: LocalArchiveLifecycleV1;
  readonly websitePublication: LocalWebsitePublicationV1;
};

function releaseDocuments(value: OfflineDocuments): LocalContentReleaseDocumentsV1 {
  return value as unknown as LocalContentReleaseDocumentsV1;
}

export interface G3014OfflineReleaseFixture {
  readonly descriptor: LocalContentReleaseDescriptorV1;
  readonly documents: OfflineDocuments;
  readonly ready: LocalContentReleaseReadyV1;
}

export interface G3014OfflineFixtures {
  readonly a: G3014OfflineReleaseFixture;
  readonly b: G3014OfflineReleaseFixture;
  readonly c: G3014OfflineReleaseFixture;
  /** C revokes this article which is deliberately absent from C's archive. */
  readonly cRevokedAId: string;
}

async function descriptorFor(
  base: LocalContentReleaseDescriptorV1,
  releaseRevision: string,
  documents: OfflineDocuments,
): Promise<LocalContentReleaseDescriptorV1> {
  return Object.freeze({
    ...base,
    releaseRevision,
    expectedManifest: {
      revision: documents.manifest.revision,
      sha256: await sha256Utf8(canonicalJson(documents.manifest)),
    },
    expectedComponents: {
      discoverIndex: {
        revision: documents.discoverIndex.revision,
        sha256: await sha256Utf8(canonicalJson(documents.discoverIndex)),
      },
      readerDetails: {
        revision: documents.readerDetails.revision,
        sha256: await sha256Utf8(canonicalJson(documents.readerDetails)),
      },
      archiveLifecycle: {
        revision: documents.archiveLifecycle.revision,
        sha256: await sha256Utf8(canonicalJson(documents.archiveLifecycle)),
      },
      websitePublication: {
        revision: documents.websitePublication.revision,
        sha256: await sha256Utf8(canonicalJson(documents.websitePublication)),
      },
    },
  });
}

async function lifecycleFor(
  base: LocalArchiveLifecycleV1,
  documents: OfflineDocuments,
  revision: string,
  revocationRevision: number,
  previousRevision: number,
  revokedId?: string,
): Promise<LocalArchiveLifecycleV1> {
  const articleIds = documents.payloads.articles.articles.map((article) => article.id).sort();
  const draft = {
    ...base,
    revision,
    sourceContent: {
      articlePayloadSha256: await sha256Utf8(canonicalJson(documents.payloads.articles)),
      readerDetailsRevision: documents.readerDetails.revision,
      readerDetailsIntegritySha256: documents.readerDetails.integritySha256,
    },
    activeArticleIds: articleIds,
    archiveArticleIds: articleIds,
    shareableArticleIds: articleIds,
    revocations: {
      revision: revocationRevision,
      previousRevision,
      entries:
        revokedId === undefined
          ? base.revocations.entries
          : [
              ...base.revocations.entries,
              { id: revokedId, status: 'blocked' as const, category: 'rights-or-safety' as const },
            ].sort((left, right) => left.id.localeCompare(right.id)),
    },
  };
  return Object.freeze({
    ...draft,
    integritySha256: await sha256Utf8(canonicalJson(archiveLifecycleIntegrityPayload(draft))),
  });
}

async function publicationFor(
  base: LocalWebsitePublicationV1,
  documents: OfflineDocuments,
  revision: string,
): Promise<LocalWebsitePublicationV1> {
  const ids = documents.manifest.articleSets.landingIds;
  return Object.freeze({
    ...base,
    revision,
    sourceManifest: {
      revision: documents.manifest.revision,
      integritySha256: await sha256Utf8(canonicalJson(documents.manifest)),
      articleSetHashes: documents.manifest.articleSetHashes,
    },
    readerDetails: {
      revision: documents.readerDetails.revision,
      integritySha256: documents.readerDetails.integritySha256,
    },
    landingIds: ids,
    sitemapArticleIds: ids,
  });
}

async function readyFixture(
  descriptor: LocalContentReleaseDescriptorV1,
  documents: OfflineDocuments,
): Promise<G3014OfflineReleaseFixture> {
  return Object.freeze({
    descriptor,
    documents,
    ready: await createValidatedLocalContentReleaseV1(descriptor, releaseDocuments(documents)),
  });
}

/** Self-authored A/B/C releases; all hashes and cross-document bindings are regenerated locally. */
export async function createG3014OfflineFixtures(): Promise<G3014OfflineFixtures> {
  const base = await createPinnedLocalContentReleaseFixture();
  const baseDocuments = base.documents as unknown as OfflineDocuments;
  const a = await readyFixture(base.descriptor, baseDocuments);
  const changedArticles = {
    articles: baseDocuments.payloads.articles.articles.map((article, index) =>
      index === 0 ? { ...article, title: `${article.title} — B` } : article,
    ),
  };
  const bManifest = {
    ...baseDocuments.manifest,
    revision: 'wrn-g3-014-offline-b-manifest-v1',
    resources: await Promise.all(
      baseDocuments.manifest.resources.map(async (resource) =>
        resource.id === 'articles' && resource.availability !== 'optional-absent'
          ? {
              ...resource,
              sha256: await sha256Utf8(canonicalJson(changedArticles)),
              bytes: utf8ByteLength(canonicalJson(changedArticles)),
            }
          : resource,
      ),
    ),
  };
  const bDocumentsWithoutLifecycle: OfflineDocuments = {
    ...baseDocuments,
    manifest: bManifest,
    payloads: { ...baseDocuments.payloads, articles: changedArticles },
  };
  const bLifecycle = await lifecycleFor(
    baseDocuments.archiveLifecycle,
    bDocumentsWithoutLifecycle,
    'wrn-g3-014-offline-b-lifecycle-v1',
    1,
    0,
  );
  const bDocumentsBeforePublication: OfflineDocuments = {
    ...bDocumentsWithoutLifecycle,
    archiveLifecycle: bLifecycle,
  };
  const bDocuments: OfflineDocuments = {
    ...bDocumentsBeforePublication,
    websitePublication: await publicationFor(
      baseDocuments.websitePublication,
      bDocumentsBeforePublication,
      'wrn-g3-014-offline-b-publication-v1',
    ),
  };
  const b = await readyFixture(
    await descriptorFor(base.descriptor, 'wrn-g3-014-offline-b-release-v1', bDocuments),
    bDocuments,
  );

  const cRevokedAId = b.documents.payloads.articles.articles[0]!.id;
  const cArticles = { articles: b.documents.payloads.articles.articles.slice(1) };
  const ids = cArticles.articles.map((article) => article.id).sort();
  const cDiscoverDraft = {
    ...b.documents.discoverIndex,
    revision: 'wrn-g3-014-offline-c-discover-v1',
    entries: b.documents.discoverIndex.entries.filter((entry) => entry.articleId !== cRevokedAId),
  };
  const cDiscover: LocalDiscoverIndexV1 = Object.freeze({
    ...cDiscoverDraft,
    integritySha256: await sha256Utf8(canonicalJson(discoverIndexIntegrityPayload(cDiscoverDraft))),
  });
  const cReaderDraft = {
    ...b.documents.readerDetails,
    revision: 'wrn-g3-014-offline-c-reader-v1',
    entries: b.documents.readerDetails.entries.filter((entry) => entry.articleId !== cRevokedAId),
  };
  const cReader: LocalReaderDetailsV1 = Object.freeze({
    ...cReaderDraft,
    integritySha256: await sha256Utf8(canonicalJson(readerDetailsIntegrityPayload(cReaderDraft))),
  });
  const cArticleSetHashes = Object.freeze({
    activeFeedIds: await sha256Utf8(canonicalJson(ids)),
    archiveIds: await sha256Utf8(canonicalJson(ids)),
    landingIds: await sha256Utf8(canonicalJson(ids)),
    redirectSourceIds: await sha256Utf8(canonicalJson([])),
    sitemapArticleIds: await sha256Utf8(canonicalJson(ids)),
  });
  const cManifest = {
    ...b.documents.manifest,
    revision: 'wrn-g3-014-offline-c-manifest-v1',
    resources: await Promise.all(
      b.documents.manifest.resources.map(async (resource) =>
        resource.id === 'articles' && resource.availability !== 'optional-absent'
          ? {
              ...resource,
              sha256: await sha256Utf8(canonicalJson(cArticles)),
              bytes: utf8ByteLength(canonicalJson(cArticles)),
              recordCount: cArticles.articles.length,
            }
          : resource,
      ),
    ),
    articleSets: {
      activeFeedIds: ids,
      archiveIds: ids,
      landingIds: ids,
      redirectSourceIds: [],
      sitemapArticleIds: ids,
    },
    articleSetHashes: cArticleSetHashes,
  };
  const cBeforeLifecycle: OfflineDocuments = {
    ...b.documents,
    manifest: cManifest,
    payloads: { ...b.documents.payloads, articles: cArticles },
    discoverIndex: cDiscover,
    readerDetails: cReader,
  };
  const cLifecycle = await lifecycleFor(
    b.documents.archiveLifecycle,
    cBeforeLifecycle,
    'wrn-g3-014-offline-c-lifecycle-v1',
    2,
    1,
    cRevokedAId,
  );
  const cBeforePublication = { ...cBeforeLifecycle, archiveLifecycle: cLifecycle };
  const cDocuments: OfflineDocuments = {
    ...cBeforePublication,
    websitePublication: await publicationFor(
      b.documents.websitePublication,
      cBeforePublication,
      'wrn-g3-014-offline-c-publication-v1',
    ),
  };
  const c = await readyFixture(
    await descriptorFor(base.descriptor, 'wrn-g3-014-offline-c-release-v1', cDocuments),
    cDocuments,
  );
  return Object.freeze({ a, b, c, cRevokedAId });
}
