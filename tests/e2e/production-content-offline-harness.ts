// Authored browser-only data. No publication, admission or provider claim.
import {
  canonicalJson,
  sha256Utf8,
  utf8ByteLength,
  createValidatedProductionContentReleaseV1,
  validateProductionContentReleaseV1,
  productionContractVersionV1,
  type ProductionArticleIdV1,
} from '../../packages/content-contracts/src/index';

export const firstProductionTestId = 'wrn-art-0123456789abcdef0123456789abcdef' as const;
const secondId = 'wrn-art-ffffffffffffffffffffffffffffffff' as const;
export async function makeProductionOfflineFixture(
  options: {
    sequence?: number;
    revision?: string;
    safetyRevision?: number;
    omitFirst?: boolean;
    revokedFirst?: boolean;
  } = {},
) {
  const sequence = options.sequence ?? 1;
  const revision = options.revision ?? `authored-release-${sequence}`;
  const safetyRevision = options.safetyRevision ?? 1;
  const ids: ProductionArticleIdV1[] = options.omitFirst
    ? [secondId]
    : [firstProductionTestId, secondId];
  const articles = ids.map((id, index) => ({
    id,
    title: `Authored test ${index}`,
    teaser: 'Test metadata only.',
    publishedAt: '2026-09-10T00:00:00.000Z',
    originalUrl: `https://example.org/${id}`,
    source: { id: 'authored-test', name: 'Authored test', authors: ['Test author'] },
    originalLanguage: 'en',
    tags: ['test'],
    contentCompleteness: 'full' as const,
    rights: {
      licenseId: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      evidenceUrl: 'https://example.org/rights',
      checkedAt: '2026-09-10T00:00:00.000Z',
      scope: 'Self-authored synthetic test only',
      thirdPartyMaterialReviewed: true as const,
    },
    transformation: { status: 'original' as const, reference: 'Authored test input' },
  }));
  const details = ids.map((articleId) => ({
    articleId,
    blocks: [{ kind: 'paragraph' as const, text: 'Self-authored browser test text.' }],
  }));
  const documents = {
    articles: { revision, articles },
    admission: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-article-admission.v1' as const,
      revision,
      entries: await Promise.all(
        articles.map(async (article, index) => ({
          articleId: article.id,
          originalUrl: article.originalUrl,
          sourceId: article.source.id,
          authors: article.source.authors,
          sourceSnapshotSha256: 'a'.repeat(64),
          sourceSnapshotBytes: 42,
          admittedContentSha256: await sha256Utf8(
            canonicalJson({ article, detail: details[index] }),
          ),
          ...article.rights,
          transformation: article.transformation,
        })),
      ),
    },
    discoverIndex: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-discover-index.v1' as const,
      revision,
      entries: ids.map((articleId) => ({
        articleId,
        region: 'global',
        topics: ['test'],
        format: 'news',
      })),
    },
    readerDetails: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-reader-details.v1' as const,
      revision,
      entries: details,
    },
    archiveLifecycle: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-archive-lifecycle.v1' as const,
      revision,
      activeArticleIds: ids,
      archiveArticleIds: ids,
      shareableArticleIds: ids,
      aliases: [],
      gone: [],
      revocations: {
        revision: safetyRevision,
        previousRevision: safetyRevision - 1,
        entries: options.revokedFirst
          ? [
              {
                id: firstProductionTestId,
                status: 'blocked' as const,
                category: 'rights-or-safety' as const,
              },
            ]
          : [],
      },
    },
  };
  const names = [
    'admission',
    'archiveLifecycle',
    'articles',
    'discoverIndex',
    'readerDetails',
  ] as const;
  const paths = {
    admission: 'admission.json',
    archiveLifecycle: 'archive-lifecycle.json',
    articles: 'articles.json',
    discoverIndex: 'discover-index.json',
    readerDetails: 'reader-details.json',
  };
  const manifest = {
    contractVersion: productionContractVersionV1,
    schema: 'wrn.production-content-release.v1' as const,
    revision,
    articleIds: ids,
    resources: await Promise.all(
      names.map(async (id) => ({
        id,
        path: paths[id],
        sha256: await sha256Utf8(canonicalJson(documents[id])),
        bytes: utf8ByteLength(canonicalJson(documents[id])),
        recordCount: ids.length,
      })),
    ),
  };
  const component = async (value: unknown) => ({
    revision,
    sha256: await sha256Utf8(canonicalJson(value)),
  });
  const descriptor = {
    contractVersion: productionContractVersionV1,
    schema: 'wrn.production-content-release-descriptor.v1' as const,
    releaseRevision: revision,
    sequence,
    expectedManifest: await component(manifest),
    expectedComponents: {
      admission: await component(documents.admission),
      discoverIndex: await component(documents.discoverIndex),
      readerDetails: await component(documents.readerDetails),
      archiveLifecycle: await component(documents.archiveLifecycle),
    },
  };
  const ready = await createValidatedProductionContentReleaseV1({
    descriptor,
    manifest,
    documents,
  });
  if (ready === null)
    throw new Error(
      `Authored production fixture failed the real Core validator: ${JSON.stringify(await validateProductionContentReleaseV1({ descriptor, manifest, documents }))}`,
    );
  return ready;
}

export async function makeProductionOfflinePacket(
  options: Parameters<typeof makeProductionOfflineFixture>[0] = {},
) {
  const ready = await makeProductionOfflineFixture(options);
  const base = `/wrn-production-content/${ready.descriptor.releaseRevision}`;
  return new Map<string, unknown>([
    [
      '/wrn-production-content/current.json',
      {
        schema: 'wrn.production-content-current.v1',
        releaseRevision: ready.descriptor.releaseRevision,
        sequence: ready.descriptor.sequence,
        descriptorPath: `${base}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(canonicalJson(ready.descriptor)),
      },
    ],
    [`${base}/release-descriptor.json`, ready.descriptor],
    [`${base}/manifest.json`, ready.manifest],
    [`${base}/archive-lifecycle.json`, ready.documents.archiveLifecycle],
    [`${base}/articles.json`, ready.documents.articles],
    [`${base}/admission.json`, ready.documents.admission],
    [`${base}/discover-index.json`, ready.documents.discoverIndex],
    [`${base}/reader-details.json`, ready.documents.readerDetails],
  ]);
}
