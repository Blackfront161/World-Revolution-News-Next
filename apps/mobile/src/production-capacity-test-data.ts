// Authored test-only packets; never imported by an application entry.
import { makeProductionOfflineFixture } from '../../../tests/e2e/production-content-offline-harness';
import {
  canonicalJson,
  createValidatedProductionContentRelease,
  sha256Utf8,
  utf8ByteLength,
  type ProductionReaderBlockV1,
} from '@wrn/content-contracts';

export const capacityFirstId = 'wrn-art-00000000000000000000000000000001';
export async function makeCapacityTestPacket(
  options: {
    version?: 1 | 2 | 3;
    sequence?: number;
    count?: number;
    readerBytes?: number;
    revokedFirst?: boolean;
    safetyRevision?: number;
  } = {},
) {
  const version = options.version ?? 3;
  const sequence = options.sequence ?? 1;
  const count = options.count ?? (version === 3 ? 6 : 2);
  const revision = `authored-capacity-v${version}-${sequence}`;
  const base = await makeProductionOfflineFixture({ sequence, revision });
  const ids = Array.from(
    { length: count },
    (_, index) => `wrn-art-${(index + 1).toString(16).padStart(32, '0')}` as `wrn-art-${string}`,
  ).filter((id) => !options.revokedFirst || id !== capacityFirstId);
  const articles = ids.map((id, index) => ({
    ...base.documents.articles.articles[0]!,
    id,
    title: `Authored capacity test ${index + 1}`,
    originalUrl: `https://example.org/capacity/${id}`,
  }));
  const details = ids.map((articleId) => ({
    articleId,
    blocks: [
      { kind: 'paragraph', text: 'Authored versioned capacity test text.' },
    ] as ProductionReaderBlockV1[],
  }));
  const readerDetails = {
    contractVersion: version === 1 ? '1.0.0' : '2.0.0',
    schema: version === 1 ? 'wrn.production-reader-details.v1' : 'wrn.production-reader-details.v2',
    revision,
    entries: details,
  };
  if (options.readerBytes !== undefined) {
    const blocks = details[0]!.blocks;
    while (utf8ByteLength(canonicalJson(readerDetails)) < options.readerBytes) {
      const remaining = options.readerBytes - utf8ByteLength(canonicalJson(readerDetails));
      if (remaining <= 65_536 - (blocks[0] as { text: string }).text.length) {
        (blocks[0] as { text: string }).text += 'x'.repeat(remaining);
      } else blocks.push({ kind: 'paragraph', text: 'x'.repeat(Math.min(60_000, remaining - 31)) });
    }
    if (utf8ByteLength(canonicalJson(readerDetails)) !== options.readerBytes)
      throw Error('Authored exact byte target failed');
  }
  const safetyRevision = options.safetyRevision ?? (options.revokedFirst ? 2 : 1);
  const documents = {
    articles: { revision, articles },
    readerDetails,
    admission: {
      ...base.documents.admission,
      entries: await Promise.all(
        articles.map(async (article, index) => ({
          ...base.documents.admission.entries[0]!,
          articleId: article.id,
          originalUrl: article.originalUrl,
          admittedContentSha256: await sha256Utf8(
            canonicalJson({ article, detail: details[index] }),
          ),
        })),
      ),
    },
    discoverIndex: {
      ...base.documents.discoverIndex,
      entries: ids.map((articleId) => ({ ...base.documents.discoverIndex.entries[0]!, articleId })),
    },
    archiveLifecycle: {
      ...base.documents.archiveLifecycle,
      activeArticleIds: ids,
      archiveArticleIds: ids,
      shareableArticleIds: ids,
      revocations: {
        revision: safetyRevision,
        previousRevision: safetyRevision - 1,
        entries: options.revokedFirst
          ? [{ id: capacityFirstId, status: 'blocked', category: 'rights-or-safety' }]
          : [],
      },
    },
  };
  const manifest = {
    ...base.manifest,
    contractVersion: `${version}.0.0`,
    schema: `wrn.production-content-release.v${version}`,
    articleIds: ids,
    resources: await Promise.all(
      base.manifest.resources.map(async (resource) => ({
        ...resource,
        recordCount: ids.length,
        sha256: await sha256Utf8(canonicalJson(documents[resource.id])),
        bytes: utf8ByteLength(canonicalJson(documents[resource.id])),
      })),
    ),
  };
  const component = async (value: unknown) => ({
    revision,
    sha256: await sha256Utf8(canonicalJson(value)),
  });
  const descriptor = {
    ...base.descriptor,
    contractVersion: `${version}.0.0`,
    schema: `wrn.production-content-release-descriptor.v${version}`,
    expectedManifest: await component(manifest),
    expectedComponents: {
      admission: await component(documents.admission),
      discoverIndex: await component(documents.discoverIndex),
      readerDetails: await component(documents.readerDetails),
      archiveLifecycle: await component(documents.archiveLifecycle),
    },
  };
  const input = { descriptor, manifest, documents };
  const ready = await createValidatedProductionContentRelease(input);
  if (!ready) throw Error('Authored packet failed compatible production admission');
  const prefix = `/wrn-production-content/${revision}`;
  const packet = new Map<string, unknown>([
    [
      '/wrn-production-content/current.json',
      {
        schema: 'wrn.production-content-current.v1',
        releaseRevision: revision,
        sequence,
        descriptorPath: `${prefix}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(canonicalJson(descriptor)),
      },
    ],
    [`${prefix}/release-descriptor.json`, descriptor],
    [`${prefix}/manifest.json`, manifest],
    [`${prefix}/archive-lifecycle.json`, documents.archiveLifecycle],
    [`${prefix}/articles.json`, documents.articles],
    [`${prefix}/admission.json`, documents.admission],
    [`${prefix}/discover-index.json`, documents.discoverIndex],
    [`${prefix}/reader-details.json`, readerDetails],
  ]);
  return { input, ready, packet };
}
