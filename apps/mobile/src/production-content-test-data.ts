// Authored test-only production data; never imported by an application entry.
import { makeProductionOfflineFixture } from '../../../tests/e2e/production-content-offline-harness';
import {
  canonicalJson,
  createValidatedProductionContentReleaseV1,
  sha256Utf8,
  utf8ByteLength,
  type ProductionReaderBlockV1,
} from '@wrn/content-contracts';
import { createEmptyProductionContentOfflineControlV1 } from '@wrn/content-contracts/production-content-offline-v1';
import type { ProductionContentOfflineControllerResult } from './production-content-offline-controller';

export const testProductionId = 'wrn-art-0123456789abcdef0123456789abcdef';
export const testAliasId = 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export const testGoneId = 'wrn-art-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
export const authoredProductionBlocks: readonly ProductionReaderBlockV1[] = [
  { kind: 'paragraph', text: 'A locally authored paragraph for reader verification.' },
  { kind: 'heading', level: 2, text: 'Authored section' },
  { kind: 'heading', level: 3, text: 'Authored subsection' },
  { kind: 'quote', text: 'An authored quote.', attribution: 'Test author' },
  { kind: 'list', style: 'ordered', items: ['First step', 'Second step'] },
  { kind: 'list', style: 'unordered', items: ['One point', 'Another point'] },
];
export async function productionTestResult(
  now = Date.now(),
): Promise<ProductionContentOfflineControllerResult> {
  const base = await makeProductionOfflineFixture();
  const readerDetails = {
    ...base.documents.readerDetails,
    entries: base.documents.readerDetails.entries.map((entry) => ({
      ...entry,
      blocks: authoredProductionBlocks,
    })),
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
      aliases: [{ sourceId: testAliasId, targetId: testProductionId }],
      gone: [{ id: testGoneId, category: 'removed' }],
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
  const runtime = await createValidatedProductionContentReleaseV1({
    descriptor,
    manifest,
    documents,
  });
  if (runtime === null) throw new Error('Authored production UI fixture failed Core admission');
  return {
    status: 'active',
    reason: 'ready',
    runtime,
    activeKey: 'a'.repeat(64),
    expiresAt: now + 86_400_000,
    safety: runtime.safetyLedger,
    storageFailure: null,
    confirmedWrites: [],
    control: {
      ...createEmptyProductionContentOfflineControlV1(),
      generation: 3,
      activeKey: 'a'.repeat(64),
      lastSuccessfulSourceCheckAt: now,
      lastObservedAt: now,
      safety: runtime.safetyLedger,
      highestAcceptedSequence: 1,
      acceptedIdentities: [
        { revision: descriptor.releaseRevision, sequence: 1, key: 'a'.repeat(64) },
      ],
    },
  };
}

export async function productionTestPacket(): Promise<Map<string, unknown>> {
  const { runtime: ready } = await productionTestResult();
  if (ready === null) throw new Error('Missing authored test release');
  const revision = ready.descriptor.releaseRevision;
  const base = `/wrn-production-content/${revision}`;
  return new Map<string, unknown>([
    [
      '/wrn-production-content/current.json',
      {
        schema: 'wrn.production-content-current.v1',
        releaseRevision: revision,
        sequence: ready.descriptor.sequence,
        descriptorPath: `${revision}/release-descriptor.json`,
        descriptorSha256: await sha256Utf8(canonicalJson(ready.descriptor)),
      },
    ],
    [`${base}/release-descriptor.json`, ready.descriptor],
    [`${base}/manifest.json`, ready.manifest],
    [`${base}/articles.json`, ready.documents.articles],
    [`${base}/admission.json`, ready.documents.admission],
    [`${base}/archive-lifecycle.json`, ready.documents.archiveLifecycle],
    [`${base}/discover-index.json`, ready.documents.discoverIndex],
    [`${base}/reader-details.json`, ready.documents.readerDetails],
  ]);
}
