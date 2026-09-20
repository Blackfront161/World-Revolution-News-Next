export type ProductionContentResourceId =
  'articles' | 'admission' | 'discoverIndex' | 'readerDetails' | 'archiveLifecycle';

export type ProductionContentCapacityPolicy = Readonly<{
  readonly name: 'pilot-v1-v2' | 'capacity-v3';
  readonly maxArticles: number;
  readonly maxBundleBytes: number;
  readonly maxResourceBytes: Readonly<Record<ProductionContentResourceId, number>>;
  /** Phase-one V1/V2 behavior is frozen; V3 validates its declared cap early. */
  readonly enforceSafetyResourceCaps: boolean;
  readonly maxImagesPerArticle: number;
  readonly maxImagesPerRelease: number;
  readonly maxRawImageBytesPerRelease: number;
  readonly maxEncodedImageCharactersPerRelease: number;
}>;

const kib = 1024;

export const productionContentPilotPolicy: ProductionContentCapacityPolicy = Object.freeze({
  name: 'pilot-v1-v2',
  maxArticles: 3,
  maxBundleBytes: 4 * 1024 * 1024,
  maxResourceBytes: Object.freeze({
    articles: 512 * kib,
    admission: 512 * kib,
    discoverIndex: 512 * kib,
    readerDetails: 512 * kib,
    archiveLifecycle: 512 * kib,
  }),
  enforceSafetyResourceCaps: false,
  maxImagesPerArticle: 8,
  maxImagesPerRelease: 32,
  maxRawImageBytesPerRelease: 0,
  maxEncodedImageCharactersPerRelease: 0,
});

export const productionContentCapacityPolicyV3: ProductionContentCapacityPolicy = Object.freeze({
  name: 'capacity-v3',
  maxArticles: 64,
  maxBundleBytes: 3_840 * kib,
  maxResourceBytes: Object.freeze({
    articles: 384 * kib,
    admission: 384 * kib,
    discoverIndex: 128 * kib,
    archiveLifecycle: 128 * kib,
    readerDetails: 2_816 * kib,
  }),
  enforceSafetyResourceCaps: true,
  maxImagesPerArticle: 8,
  maxImagesPerRelease: 32,
  maxRawImageBytesPerRelease: 1_536 * kib,
  maxEncodedImageCharactersPerRelease: 2_048 * kib,
});
