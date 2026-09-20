// @ts-expect-error Node 24 executes this production builder source directly.
import { canonicalJson, sha256Utf8, utf8ByteLength } from './index.ts';
import {
  hasExactProductionKeys,
  isPlainProductionRecord,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './content-release-core-v1.ts';
import {
  productionContentCapacityPolicyV3,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './production-content-capacity-policy.ts';
import {
  createProductionArticleShareUrlV1,
  isProductionContentDescriptorV1,
  isProductionWebsitePublicationV1,
  resolveProductionContentArticleV1,
  validateProductionWebsitePublicationV1,
  productionContentDescriptorSchemaV1,
  productionContentReleaseSchemaV1,
  productionReadingDetailsSchemaV1,
  type ProductionContentManifestV1,
  type ProductionContentReadyV1,
  type ProductionContentReleaseDescriptorV1,
  type ProductionContentReleaseInputV1,
  type ProductionContentResolutionV1,
  type ProductionContentSafetyLedgerV1,
  type ProductionReaderBlockV1,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './production-content-release-v1.ts';
import {
  productionReadingDetailsSchemaV2,
  type ProductionContentReleaseDocumentsV2,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './production-content-release-v2.ts';
import {
  createValidatedProductionContentWithPolicyInternal,
  isProductionContentManifestWithPolicy,
  validateProductionContentSafetyWithPolicyInternal,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './production-content-validation-internal.ts';
import {
  validateProductionReaderImageBlockV2,
  type ProductionReaderImageBlockV2,
  // @ts-expect-error Node 24 executes this production builder source directly.
} from './production-reader-media-v2.ts';

export const productionContentDescriptorSchemaV3 =
  'wrn.production-content-release-descriptor.v3' as const;
export const productionContentReleaseSchemaV3 = 'wrn.production-content-release.v3' as const;
export const productionContentContractVersionV3 = '3.0.0' as const;
/** Frozen transport view of the already validated V3 capacity policy. */
export const productionContentResourceCapsV3 = productionContentCapacityPolicyV3.maxResourceBytes;

export type ProductionContentReleaseDescriptorV3 = Omit<
  ProductionContentReleaseDescriptorV1,
  'schema' | 'contractVersion'
> & {
  readonly schema: typeof productionContentDescriptorSchemaV3;
  readonly contractVersion: typeof productionContentContractVersionV3;
};
export type ProductionContentManifestV3 = Omit<
  ProductionContentManifestV1,
  'schema' | 'contractVersion'
> & {
  readonly schema: typeof productionContentReleaseSchemaV3;
  readonly contractVersion: typeof productionContentContractVersionV3;
};
/** V3 changes only descriptor/manifest capacity; reader and media remain V2. */
export type ProductionContentReleaseDocumentsV3 = ProductionContentReleaseDocumentsV2;
export type ProductionContentReadyV3 = Omit<
  ProductionContentReadyV1,
  'descriptor' | 'manifest' | 'documents'
> & {
  readonly descriptor: ProductionContentReleaseDescriptorV3;
  readonly manifest: ProductionContentManifestV3;
  readonly documents: ProductionContentReleaseDocumentsV3;
};

const textProofs = new WeakMap<ProductionContentReadyV3, ProductionContentReadyV1>();

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
function descriptorProjection(
  value: ProductionContentReleaseDescriptorV3,
): ProductionContentReleaseDescriptorV1 {
  return { ...value, schema: productionContentDescriptorSchemaV1, contractVersion: '1.0.0' };
}
function manifestProjection(value: ProductionContentManifestV3): ProductionContentManifestV1 {
  return { ...value, schema: productionContentReleaseSchemaV1, contractVersion: '1.0.0' };
}

export function isProductionContentDescriptorV3(
  value: unknown,
): value is ProductionContentReleaseDescriptorV3 {
  return (
    isPlainProductionRecord(value) &&
    value.schema === productionContentDescriptorSchemaV3 &&
    value.contractVersion === productionContentContractVersionV3 &&
    isProductionContentDescriptorV1(
      descriptorProjection(value as ProductionContentReleaseDescriptorV3),
    )
  );
}
export function isProductionContentManifestV3(
  value: unknown,
): value is ProductionContentManifestV3 {
  return (
    isPlainProductionRecord(value) &&
    value.schema === productionContentReleaseSchemaV3 &&
    value.contractVersion === productionContentContractVersionV3 &&
    isProductionContentManifestWithPolicy(
      manifestProjection(value as ProductionContentManifestV3),
      productionContentCapacityPolicyV3,
    )
  );
}

/** Phase one validates the V3 descriptor, manifest and lifecycle before payload acceptance. */
export async function validateProductionContentSafetyEvidenceV3(input: {
  readonly descriptor: unknown;
  readonly manifest: unknown;
  readonly archiveLifecycle: unknown;
  readonly knownSafety: ProductionContentSafetyLedgerV1;
}): Promise<ProductionContentSafetyLedgerV1 | null> {
  return validateProductionContentSafetyWithPolicyInternal(
    input,
    productionContentCapacityPolicyV3,
    isProductionContentManifestV3,
    isProductionContentDescriptorV3,
  );
}

/**
 * The V3 factory validates original resources first, then creates a private
 * V1-shaped text proof under the capacity policy. Ready never exposes that
 * projection, so the V3 manifest hash and media bytes remain authoritative.
 */
export async function createValidatedProductionContentReleaseV3(
  input: ProductionContentReleaseInputV1,
): Promise<ProductionContentReadyV3 | null> {
  try {
    const raw = snapshot(input);
    if (
      !isProductionContentDescriptorV3(raw.descriptor) ||
      !isProductionContentManifestV3(raw.manifest) ||
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
    const descriptor = raw.descriptor;
    const manifest = raw.manifest;
    const documents = raw.documents as unknown as ProductionContentReleaseDocumentsV3;
    const reader = documents.readerDetails;
    if (
      !isPlainProductionRecord(reader) ||
      !hasExactProductionKeys(reader, ['schema', 'contractVersion', 'revision', 'entries']) ||
      reader.schema !== productionReadingDetailsSchemaV2 ||
      reader.contractVersion !== '2.0.0' ||
      !Array.isArray(reader.entries) ||
      reader.revision !== descriptor.releaseRevision ||
      !Array.isArray(documents.articles.articles) ||
      documents.articles.articles.length === 0 ||
      documents.articles.articles.length > productionContentCapacityPolicyV3.maxArticles ||
      !Array.isArray(documents.admission.entries) ||
      !Array.isArray(documents.discoverIndex.entries)
    )
      return null;
    const safety = await validateProductionContentSafetyEvidenceV3({
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
    let totalResourceBytes = 0;
    for (const resource of manifest.resources) {
      const document = documents[resource.id];
      const encoded = canonicalJson(document);
      const bytes = utf8ByteLength(encoded);
      const digest = await sha256Utf8(encoded);
      totalResourceBytes += bytes;
      if (
        bytes > productionContentCapacityPolicyV3.maxResourceBytes[resource.id] ||
        resource.bytes !== bytes ||
        resource.sha256 !== digest ||
        resource.recordCount !== counts[resource.id] ||
        document.revision !== descriptor.releaseRevision ||
        (resource.id !== 'articles' && descriptor.expectedComponents[resource.id].sha256 !== digest)
      )
        return null;
    }
    if (totalResourceBytes > productionContentCapacityPolicyV3.maxBundleBytes) return null;

    let imageCount = 0;
    let rawImageBytes = 0;
    let encodedImageCharacters = 0;
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
          // These aggregate checks intentionally precede decoding in the V2 image validator.
          if (
            typeof image.byteLength !== 'number' ||
            !Number.isSafeInteger(image.byteLength) ||
            image.byteLength < 1 ||
            typeof image.base64 !== 'string' ||
            ++perArticle > productionContentCapacityPolicyV3.maxImagesPerArticle ||
            ++imageCount > productionContentCapacityPolicyV3.maxImagesPerRelease ||
            (rawImageBytes += image.byteLength) >
              productionContentCapacityPolicyV3.maxRawImageBytesPerRelease ||
            (encodedImageCharacters += image.base64.length) >
              productionContentCapacityPolicyV3.maxEncodedImageCharactersPerRelease ||
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
    const projectedManifest: ProductionContentManifestV1 = {
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
    const proof = await createValidatedProductionContentWithPolicyInternal(
      {
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
      },
      productionContentCapacityPolicyV3,
    );
    if (proof === null) return null;
    const ready: ProductionContentReadyV3 = freeze({
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

export function resolveProductionContentArticleV3(
  ready: ProductionContentReadyV3,
  id: unknown,
): ProductionContentResolutionV1 {
  const proof = textProofs.get(ready);
  return proof
    ? resolveProductionContentArticleV1(proof, id)
    : { kind: 'invalid', message: 'Unverified production release.' };
}
export function createProductionArticleShareUrlV3(
  ready: ProductionContentReadyV3,
  resolution: ProductionContentResolutionV1,
): string | null {
  const proof = textProofs.get(ready);
  return proof ? createProductionArticleShareUrlV1(proof, resolution) : null;
}
export function validateProductionWebsitePublicationV3(
  publication: unknown,
  ready: ProductionContentReadyV3,
): ReturnType<typeof validateProductionWebsitePublicationV1> {
  const proof = textProofs.get(ready);
  if (
    !proof ||
    !isProductionWebsitePublicationV1(publication) ||
    publication.sourceManifest.sha256 !== ready.manifestSha256
  )
    return { ok: false, errors: ['v3-source-manifest-binding'], articleIds: [] };
  return validateProductionWebsitePublicationV1(
    {
      ...publication,
      sourceManifest: { ...publication.sourceManifest, sha256: proof.manifestSha256 },
    },
    proof,
  );
}
