// Authored test text only, kept outside both client source graphs.
import {
  canonicalJson,
  createValidatedProductionContentReleaseV1,
  sha256Utf8,
  utf8ByteLength,
  type ProductionReaderBlockV1,
} from '../../packages/content-contracts/src/index';
import { makeProductionOfflineFixture } from './production-content-offline-harness';

export const websiteTestId = 'wrn-art-0123456789abcdef0123456789abcdef';
export const websiteAliasId = 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export const websiteGoneId = 'wrn-art-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

export async function makeWebsiteTestPacket(
  options: Parameters<typeof makeProductionOfflineFixture>[0] = {},
) {
  const base = await makeProductionOfflineFixture(options);
  const blocks: readonly ProductionReaderBlockV1[] = [
    { kind: 'paragraph', text: 'A locally authored paragraph for Website verification.' },
    { kind: 'heading', level: 2, text: 'Authored section' },
    { kind: 'heading', level: 3, text: 'Authored subsection' },
    { kind: 'quote', text: 'An authored quote.', attribution: 'Test author' },
    { kind: 'list', style: 'ordered', items: ['First step', 'Second step'] },
    { kind: 'list', style: 'unordered', items: ['One point', 'Another point'] },
  ];
  const readerDetails = {
    ...base.documents.readerDetails,
    entries: base.documents.readerDetails.entries.map((entry) => ({ ...entry, blocks })),
  };
  const documents = {
    ...base.documents,
    readerDetails,
    admission: {
      ...base.documents.admission,
      entries: await Promise.all(
        base.documents.admission.entries.map(async (entry, index) => ({
          ...entry,
          admittedContentSha256: await sha256Utf8(
            canonicalJson({
              article: base.documents.articles.articles[index],
              detail: readerDetails.entries[index],
            }),
          ),
        })),
      ),
    },
    archiveLifecycle: {
      ...base.documents.archiveLifecycle,
      aliases: options.omitFirst ? [] : [{ sourceId: websiteAliasId, targetId: websiteTestId }],
      gone: [{ id: websiteGoneId, category: 'removed' }],
    },
  };
  const manifest = {
    ...base.manifest,
    resources: await Promise.all(
      base.manifest.resources.map(async (resource) => ({
        ...resource,
        sha256: await sha256Utf8(canonicalJson(documents[resource.id])),
        bytes: utf8ByteLength(canonicalJson(documents[resource.id])),
      })),
    ),
  };
  const component = async (value: unknown) => ({
    revision: base.descriptor.releaseRevision,
    sha256: await sha256Utf8(canonicalJson(value)),
  });
  const descriptor = {
    ...base.descriptor,
    expectedManifest: await component(manifest),
    expectedComponents: {
      admission: await component(documents.admission),
      archiveLifecycle: await component(documents.archiveLifecycle),
      discoverIndex: await component(documents.discoverIndex),
      readerDetails: await component(documents.readerDetails),
    },
  };
  const ready = await createValidatedProductionContentReleaseV1({
    descriptor,
    manifest,
    documents,
  });
  if (!ready) throw new Error('Website authored packet failed actual admission');
  const revision = descriptor.releaseRevision;
  const prefix = `/wrn-production-content/${revision}`;
  return new Map<string, unknown>([
    [
      '/wrn-production-content/current.json',
      {
        schema: 'wrn.production-content-current.v1',
        releaseRevision: revision,
        sequence: descriptor.sequence,
        descriptorPath: `${revision}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(canonicalJson(descriptor)),
      },
    ],
    [`${prefix}/release-descriptor.json`, descriptor],
    [`${prefix}/manifest.json`, manifest],
    [`${prefix}/articles.json`, documents.articles],
    [`${prefix}/admission.json`, documents.admission],
    [`${prefix}/archive-lifecycle.json`, documents.archiveLifecycle],
    [`${prefix}/discover-index.json`, documents.discoverIndex],
    [`${prefix}/reader-details.json`, documents.readerDetails],
  ]);
}
