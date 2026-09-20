import {
  createValidatedProductionContentReleaseV1,
  createProductionArticleShareUrlV1,
  resolveProductionContentArticleV1,
  isProductionContentDescriptorV1,
  isProductionContentManifestV1,
  validateProductionWebsitePublicationV1,
  type ProductionContentReadyV1,
  type ProductionContentReleaseDescriptorV1,
  type ProductionContentManifestV1,
  type ProductionContentReleaseDocumentsV1,
  type ProductionContentReleaseInputV1,
  type ProductionContentResolutionV1,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-release-v1.ts';
import {
  createValidatedProductionContentReleaseV2,
  createProductionArticleShareUrlV2,
  resolveProductionContentArticleV2,
  isProductionContentDescriptorV2,
  isProductionContentManifestV2,
  validateProductionContentSafetyEvidenceV2,
  validateProductionWebsitePublicationV2,
  type ProductionContentReadyV2,
  type ProductionContentReleaseDescriptorV2,
  type ProductionContentManifestV2,
  type ProductionContentReleaseDocumentsV2,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-release-v2.ts';
import {
  createValidatedProductionContentReleaseV3,
  createProductionArticleShareUrlV3,
  resolveProductionContentArticleV3,
  isProductionContentDescriptorV3,
  isProductionContentManifestV3,
  validateProductionContentSafetyEvidenceV3,
  validateProductionWebsitePublicationV3,
  type ProductionContentReadyV3,
  type ProductionContentReleaseDescriptorV3,
  type ProductionContentManifestV3,
  type ProductionContentReleaseDocumentsV3,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-release-v3.ts';
import {
  validateProductionContentSafetyEvidenceV1,
  // @ts-expect-error Node 24 runs the production builder directly.
} from './production-content-offline-v1.ts';

export type ProductionContentReady =
  ProductionContentReadyV1 | ProductionContentReadyV2 | ProductionContentReadyV3;
export type ProductionContentReleaseDescriptor =
  | ProductionContentReleaseDescriptorV1
  | ProductionContentReleaseDescriptorV2
  | ProductionContentReleaseDescriptorV3;
export type ProductionContentManifest =
  ProductionContentManifestV1 | ProductionContentManifestV2 | ProductionContentManifestV3;
export type ProductionContentReleaseDocuments =
  | ProductionContentReleaseDocumentsV1
  | ProductionContentReleaseDocumentsV2
  | ProductionContentReleaseDocumentsV3;

export const isProductionContentDescriptor = (
  value: unknown,
): value is ProductionContentReleaseDescriptor =>
  isProductionContentDescriptorV1(value) ||
  isProductionContentDescriptorV2(value) ||
  isProductionContentDescriptorV3(value);
export const isProductionContentManifest = (value: unknown): value is ProductionContentManifest =>
  isProductionContentManifestV1(value) ||
  isProductionContentManifestV2(value) ||
  isProductionContentManifestV3(value);
export async function createValidatedProductionContentRelease(
  input: ProductionContentReleaseInputV1,
): Promise<ProductionContentReady | null> {
  if (isProductionContentDescriptorV1(input.descriptor))
    return createValidatedProductionContentReleaseV1(input);
  if (isProductionContentDescriptorV2(input.descriptor))
    return createValidatedProductionContentReleaseV2(input);
  if (isProductionContentDescriptorV3(input.descriptor))
    return createValidatedProductionContentReleaseV3(input);
  return null;
}
export async function validateProductionContentSafetyEvidence(
  input: Parameters<typeof validateProductionContentSafetyEvidenceV1>[0],
) {
  if (isProductionContentDescriptorV1(input.descriptor))
    return validateProductionContentSafetyEvidenceV1(input);
  if (isProductionContentDescriptorV2(input.descriptor))
    return validateProductionContentSafetyEvidenceV2(input);
  if (isProductionContentDescriptorV3(input.descriptor))
    return validateProductionContentSafetyEvidenceV3(input);
  return null;
}
export function resolveProductionContentArticle(
  ready: ProductionContentReady,
  id: unknown,
): ProductionContentResolutionV1 {
  return isProductionContentDescriptorV3(ready.descriptor)
    ? resolveProductionContentArticleV3(ready as ProductionContentReadyV3, id)
    : isProductionContentDescriptorV2(ready.descriptor)
      ? resolveProductionContentArticleV2(ready as ProductionContentReadyV2, id)
      : resolveProductionContentArticleV1(ready as ProductionContentReadyV1, id);
}
export function createProductionArticleShareUrl(
  ready: ProductionContentReady,
  resolution: ProductionContentResolutionV1,
): string | null {
  return isProductionContentDescriptorV3(ready.descriptor)
    ? createProductionArticleShareUrlV3(ready as ProductionContentReadyV3, resolution)
    : isProductionContentDescriptorV2(ready.descriptor)
      ? createProductionArticleShareUrlV2(ready as ProductionContentReadyV2, resolution)
      : createProductionArticleShareUrlV1(ready as ProductionContentReadyV1, resolution);
}

export function validateProductionWebsitePublication(
  publication: unknown,
  ready: ProductionContentReady,
) {
  return isProductionContentDescriptorV3(ready.descriptor)
    ? validateProductionWebsitePublicationV3(publication, ready as ProductionContentReadyV3)
    : isProductionContentDescriptorV2(ready.descriptor)
      ? validateProductionWebsitePublicationV2(publication, ready as ProductionContentReadyV2)
      : validateProductionWebsitePublicationV1(publication, ready as ProductionContentReadyV1);
}
