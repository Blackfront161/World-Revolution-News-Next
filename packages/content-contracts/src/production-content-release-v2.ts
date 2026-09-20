// @ts-expect-error Node 24 executes the builder's contract modules directly.
import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.ts';
import {
  hasExactProductionKeys,
  isPlainProductionRecord,
  productionContentMaxBundleBytes,
  productionContentMaxResourceBytes,
  // @ts-expect-error Node 24 executes the builder's contract modules directly.
} from './content-release-core-v1.ts';
import {
  createValidatedProductionContentReleaseV1,
  createProductionArticleShareUrlV1,
  resolveProductionContentArticleV1,
  isProductionWebsitePublicationV1,
  validateProductionWebsitePublicationV1,
  isProductionContentDescriptorV1,
  isProductionContentManifestV1,
  productionContentDescriptorSchemaV1,
  productionContentReleaseSchemaV1,
  productionReadingDetailsSchemaV1,
  type ProductionArticleIdV1,
  type ProductionContentReadyV1,
  type ProductionContentReleaseDescriptorV1,
  type ProductionContentManifestV1,
  type ProductionContentReleaseDocumentsV1,
  type ProductionContentReleaseInputV1,
  type ProductionContentResolutionV1,
  type ProductionContentSafetyLedgerV1,
  type ProductionReaderBlockV1,
  // @ts-expect-error Node 24 executes the builder's contract modules directly.
} from './production-content-release-v1.ts';
import {
  validateProductionContentSafetyEvidenceV1,
  // @ts-expect-error Node 24 executes the builder's contract modules directly.
} from './production-content-offline-v1.ts';
import {
  validateProductionReaderImageBlockV2,
  type ProductionReaderImageBlockV2,
  // @ts-expect-error Node 24 executes the builder's contract modules directly.
} from './production-reader-media-v2.ts';

export const productionContentDescriptorSchemaV2 =
  'wrn.production-content-release-descriptor.v2' as const;
export const productionContentReleaseSchemaV2 = 'wrn.production-content-release.v2' as const;
export const productionReadingDetailsSchemaV2 = 'wrn.production-reader-details.v2' as const;
export type ProductionReaderBlockV2 = ProductionReaderBlockV1 | ProductionReaderImageBlockV2;
export type ProductionContentReleaseDescriptorV2 = Omit<
  ProductionContentReleaseDescriptorV1,
  'schema' | 'contractVersion'
> & {
  readonly schema: typeof productionContentDescriptorSchemaV2;
  readonly contractVersion: '2.0.0';
};
export type ProductionContentManifestV2 = Omit<
  ProductionContentManifestV1,
  'schema' | 'contractVersion'
> & { readonly schema: typeof productionContentReleaseSchemaV2; readonly contractVersion: '2.0.0' };
export type ProductionContentReleaseDocumentsV2 = Omit<
  ProductionContentReleaseDocumentsV1,
  'readerDetails'
> & {
  readonly readerDetails: {
    readonly schema: typeof productionReadingDetailsSchemaV2;
    readonly contractVersion: '2.0.0';
    readonly revision: string;
    readonly entries: readonly {
      readonly articleId: ProductionArticleIdV1;
      readonly blocks: readonly ProductionReaderBlockV2[];
    }[];
  };
};
export type ProductionContentReadyV2 = Omit<
  ProductionContentReadyV1,
  'descriptor' | 'manifest' | 'documents'
> & {
  readonly descriptor: ProductionContentReleaseDescriptorV2;
  readonly manifest: ProductionContentManifestV2;
  readonly documents: ProductionContentReleaseDocumentsV2;
};

// A projection is a private structural proof, never a receipt or stored content.
const textProofs = new WeakMap<ProductionContentReadyV2, ProductionContentReadyV1>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function snapshot<T>(value: T): T {
  return freeze(JSON.parse(canonicalJson(value)) as T);
}
function manifestProjection(value: ProductionContentManifestV2): ProductionContentManifestV1 {
  return { ...value, schema: productionContentReleaseSchemaV1, contractVersion: '1.0.0' };
}
function descriptorProjection(
  value: ProductionContentReleaseDescriptorV2,
): ProductionContentReleaseDescriptorV1 {
  return { ...value, schema: productionContentDescriptorSchemaV1, contractVersion: '1.0.0' };
}
export function isProductionContentDescriptorV2(
  value: unknown,
): value is ProductionContentReleaseDescriptorV2 {
  return (
    isPlainProductionRecord(value) &&
    value.schema === productionContentDescriptorSchemaV2 &&
    value.contractVersion === '2.0.0' &&
    isProductionContentDescriptorV1({
      ...value,
      schema: productionContentDescriptorSchemaV1,
      contractVersion: '1.0.0',
    })
  );
}
export function isProductionContentManifestV2(
  value: unknown,
): value is ProductionContentManifestV2 {
  return (
    isPlainProductionRecord(value) &&
    value.schema === productionContentReleaseSchemaV2 &&
    value.contractVersion === '2.0.0' &&
    isProductionContentManifestV1({
      ...value,
      schema: productionContentReleaseSchemaV1,
      contractVersion: '1.0.0',
    })
  );
}

/** Phase one binds the declared reader digest without downloading any reader bytes. */
export async function validateProductionContentSafetyEvidenceV2(input: {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly archiveLifecycle: unknown;
  readonly knownSafety: ProductionContentSafetyLedgerV1;
}): Promise<ProductionContentSafetyLedgerV1 | null> {
  try {
    const bound = snapshot(input);
    if (
      !isProductionContentDescriptorV2(bound.descriptor) ||
      !isProductionContentManifestV2(bound.manifest) ||
      bound.descriptor.expectedManifest.sha256 !== (await sha256Utf8(canonicalJson(bound.manifest)))
    )
      return null;
    const manifest = manifestProjection(bound.manifest);
    const descriptor = {
      ...descriptorProjection(bound.descriptor),
      expectedManifest: {
        ...bound.descriptor.expectedManifest,
        sha256: await sha256Utf8(canonicalJson(manifest)),
      },
    };
    return await validateProductionContentSafetyEvidenceV1({ ...bound, descriptor, manifest });
  } catch {
    return null;
  }
}

/** Original V2 binding is verified before any internally rehashed V1 projection. */
export async function createValidatedProductionContentReleaseV2(
  input: ProductionContentReleaseInputV1,
): Promise<ProductionContentReadyV2 | null> {
  try {
    const raw = snapshot(input);
    if (
      !isProductionContentDescriptorV2(raw.descriptor) ||
      !isProductionContentManifestV2(raw.manifest) ||
      !isPlainProductionRecord(raw.documents) ||
      !hasExactProductionKeys(raw.documents, [
        'articles',
        'admission',
        'discoverIndex',
        'readerDetails',
        'archiveLifecycle',
      ])
    )
      return null;
    const descriptor = raw.descriptor,
      manifest = raw.manifest;
    const documents = raw.documents as unknown as ProductionContentReleaseDocumentsV2;
    const reader = documents.readerDetails;
    if (
      !isPlainProductionRecord(reader) ||
      !hasExactProductionKeys(reader, ['schema', 'contractVersion', 'revision', 'entries']) ||
      reader.schema !== productionReadingDetailsSchemaV2 ||
      reader.contractVersion !== '2.0.0' ||
      !Array.isArray(reader.entries) ||
      reader.revision !== descriptor.releaseRevision ||
      !Array.isArray(documents.articles.articles) ||
      !Array.isArray(documents.admission.entries) ||
      !Array.isArray(documents.discoverIndex.entries)
    )
      return null;
    const safety = await validateProductionContentSafetyEvidenceV2({
      descriptor,
      manifest,
      archiveLifecycle: documents.archiveLifecycle,
      knownSafety: (raw.knownSafety ?? {
        revision: 0,
        revokedIds: [],
      }) as ProductionContentSafetyLedgerV1,
    });
    if (safety === null || documents.articles.revision !== descriptor.releaseRevision) return null;
    const counts = {
      articles: documents.articles.articles.length,
      admission: documents.admission.entries.length,
      discoverIndex: documents.discoverIndex.entries.length,
      readerDetails: reader.entries.length,
      archiveLifecycle: documents.archiveLifecycle.archiveArticleIds.length,
    };
    let bytes = 0;
    for (const resource of manifest.resources) {
      const document = documents[resource.id];
      const encoded = canonicalJson(document);
      const byteLength = utf8ByteLength(encoded);
      const digest = await sha256Utf8(encoded);
      bytes += byteLength;
      if (
        byteLength > productionContentMaxResourceBytes ||
        resource.bytes !== byteLength ||
        resource.sha256 !== digest ||
        resource.recordCount !== counts[resource.id] ||
        document.revision !== descriptor.releaseRevision
      )
        return null;
      if (
        resource.id !== 'articles' &&
        descriptor.expectedComponents[resource.id].sha256 !== digest
      )
        return null;
    }
    if (bytes > productionContentMaxBundleBytes) return null;
    let imageCount = 0;
    const mediaIds = new Set<string>();
    for (const detail of reader.entries) {
      if (
        !isPlainProductionRecord(detail) ||
        !hasExactProductionKeys(detail, ['articleId', 'blocks']) ||
        !Array.isArray(detail.blocks) ||
        detail.blocks.length === 0 ||
        detail.blocks.length > 512
      )
        return null;
      const article = documents.articles.articles.find((entry) => entry.id === detail.articleId);
      const admission = documents.admission.entries.find(
        (entry) => entry.articleId === detail.articleId,
      );
      if (
        !article ||
        !admission ||
        admission.admittedContentSha256 !== (await sha256Utf8(canonicalJson({ article, detail })))
      )
        return null;
      let perArticle = 0;
      for (const block of detail.blocks) {
        if (isPlainProductionRecord(block) && block.kind === 'image') {
          const image = block as unknown as ProductionReaderImageBlockV2;
          if (
            ++perArticle > 8 ||
            ++imageCount > 32 ||
            !(await validateProductionReaderImageBlockV2(image)) ||
            image.sourcePageUrl !== article.originalUrl ||
            image.sourceSnapshotSha256 !== admission.sourceSnapshotSha256 ||
            mediaIds.has(image.mediaId)
          )
            return null;
          mediaIds.add(image.mediaId);
        }
      }
    }
    const projectedReader = {
      ...reader,
      schema: productionReadingDetailsSchemaV1,
      contractVersion: '1.0.0' as const,
      entries: reader.entries.map((entry) => ({
        ...entry,
        blocks: entry.blocks.filter(
          (block: unknown) => !isPlainProductionRecord(block) || block.kind !== 'image',
        ) as readonly ProductionReaderBlockV1[],
      })),
    };
    const projectedDocuments = {
      ...documents,
      readerDetails: projectedReader,
      admission: {
        ...documents.admission,
        entries: await Promise.all(
          documents.admission.entries.map(async (entry) => ({
            ...entry,
            admittedContentSha256: await sha256Utf8(
              canonicalJson({
                article: documents.articles.articles.find(
                  (article) => article.id === entry.articleId,
                ),
                detail: projectedReader.entries.find(
                  (detail) => detail.articleId === entry.articleId,
                ),
              }),
            ),
          })),
        ),
      },
    };
    const projectedManifest = {
      ...manifestProjection(manifest),
      resources: await Promise.all(
        manifest.resources.map(async (resource) => {
          const encoded = canonicalJson(projectedDocuments[resource.id]);
          return { ...resource, sha256: await sha256Utf8(encoded), bytes: utf8ByteLength(encoded) };
        }),
      ),
    };
    const expectedComponents = { ...descriptor.expectedComponents };
    for (const name of ['admission', 'discoverIndex', 'readerDetails', 'archiveLifecycle'] as const)
      expectedComponents[name] = {
        ...expectedComponents[name],
        sha256: await sha256Utf8(canonicalJson(projectedDocuments[name])),
      };
    const proof = await createValidatedProductionContentReleaseV1({
      ...raw,
      documents: projectedDocuments,
      manifest: projectedManifest,
      descriptor: {
        ...descriptorProjection(descriptor),
        expectedComponents,
        expectedManifest: {
          ...descriptor.expectedManifest,
          sha256: await sha256Utf8(canonicalJson(projectedManifest)),
        },
      },
    });
    if (proof === null) return null;
    const ready: ProductionContentReadyV2 = freeze({
      kind: 'ready',
      descriptor,
      manifest,
      documents,
      manifestSha256: await sha256Utf8(canonicalJson(manifest)),
      articleIds: proof.articleIds,
      safetyLedger: proof.safetyLedger,
    });
    textProofs.set(ready, proof);
    return ready;
  } catch {
    return null;
  }
}

export function resolveProductionContentArticleV2(
  ready: ProductionContentReadyV2,
  id: unknown,
): ProductionContentResolutionV1 {
  const proof = textProofs.get(ready);
  return proof
    ? resolveProductionContentArticleV1(proof, id)
    : { kind: 'invalid', message: 'Unverified production release.' };
}
export function createProductionArticleShareUrlV2(
  ready: ProductionContentReadyV2,
  resolution: ProductionContentResolutionV1,
): string | null {
  const proof = textProofs.get(ready);
  return proof ? createProductionArticleShareUrlV1(proof, resolution) : null;
}

export function validateProductionWebsitePublicationV2(
  publication: unknown,
  ready: ProductionContentReadyV2,
): ReturnType<typeof validateProductionWebsitePublicationV1> {
  const proof = textProofs.get(ready);
  if (
    !proof ||
    !isProductionWebsitePublicationV1(publication) ||
    publication.sourceManifest.sha256 !== ready.manifestSha256
  )
    return { ok: false, errors: ['v2-source-manifest-binding'], articleIds: [] };
  // The website publication has its own unchanged V1 schema. Its original
  // source identity is checked above, never replaced in returned/stored data.
  return validateProductionWebsitePublicationV1(
    {
      ...publication,
      sourceManifest: { ...publication.sourceManifest, sha256: proof.manifestSha256 },
    },
    proof,
  );
}
