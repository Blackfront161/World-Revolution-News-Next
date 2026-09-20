/* eslint-disable @typescript-eslint/no-explicit-any -- authored contract fixtures are mutable by design. */
import { canonicalJson, sha256Utf8, utf8ByteLength } from '../src/index.js';

export type V3Input = {
  descriptor: Record<string, any>;
  manifest: Record<string, any>;
  documents: Record<string, any>;
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
} as const;
export type V3ResourceId = (typeof names)[number];
const pngPrefix = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0,
  0, 31, 21, 196, 137,
]);

function articleId(index: number): string {
  return `wrn-art-${index.toString(16).padStart(32, '0')}`;
}

async function rebind(input: V3Input): Promise<void> {
  const { documents, manifest, descriptor } = input;
  for (const admission of documents.admission.entries) {
    const article = documents.articles.articles.find(
      (entry: any) => entry.id === admission.articleId,
    );
    const detail = documents.readerDetails.entries.find(
      (entry: any) => entry.articleId === admission.articleId,
    );
    admission.admittedContentSha256 = await sha256Utf8(canonicalJson({ article, detail }));
  }
  const payloads = {
    articles: documents.articles,
    admission: documents.admission,
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
  } as const;
  manifest.resources = await Promise.all(
    names.map(async (id) => ({
      id,
      path: paths[id],
      sha256: await sha256Utf8(canonicalJson(payloads[id])),
      bytes: utf8ByteLength(canonicalJson(payloads[id])),
      recordCount:
        id === 'articles'
          ? payloads.articles.articles.length
          : id === 'archiveLifecycle'
            ? payloads.archiveLifecycle.archiveArticleIds.length
            : payloads[id as keyof typeof payloads].entries.length,
    })),
  );
  descriptor.expectedComponents = Object.fromEntries(
    await Promise.all(
      (['admission', 'discoverIndex', 'readerDetails', 'archiveLifecycle'] as const).map(
        async (id) => [
          id,
          {
            revision: descriptor.releaseRevision,
            sha256: await sha256Utf8(canonicalJson(payloads[id])),
          },
        ],
      ),
    ),
  );
  descriptor.expectedManifest = {
    revision: descriptor.releaseRevision,
    sha256: await sha256Utf8(canonicalJson(manifest)),
  };
}

async function rebindManifest(input: V3Input): Promise<void> {
  input.descriptor.expectedManifest = {
    revision: input.descriptor.releaseRevision,
    sha256: await sha256Utf8(canonicalJson(input.manifest)),
  };
}

function appendToFields(
  fields: readonly {
    readonly value: () => string;
    readonly set: (value: string) => void;
    readonly maximum: number;
  }[],
  bytes: number,
): void {
  let remaining = bytes;
  for (const field of fields) {
    const room = field.maximum - field.value().length;
    const addition = Math.min(room, remaining);
    if (addition > 0) field.set(`${field.value()}${'x'.repeat(addition)}`);
    remaining -= addition;
    if (remaining === 0) return;
  }
  throw new Error(`Unable to add ${bytes} valid padding bytes.`);
}

function resourceBytes(input: V3Input, id: V3ResourceId): number {
  return utf8ByteLength(canonicalJson(input.documents[id]));
}

function setRevision(input: V3Input, value: string): void {
  input.descriptor.releaseRevision = value;
  input.manifest.revision = value;
  input.documents.articles.revision = value;
  input.documents.admission.revision = value;
  input.documents.discoverIndex.revision = value;
  input.documents.readerDetails.revision = value;
  input.documents.archiveLifecycle.revision = value;
}

function aliases(
  count: number,
  targetId: string,
): readonly { readonly sourceId: string; readonly targetId: string }[] {
  return Array.from({ length: count }, (_, index) => ({
    sourceId: `wrn-art-e${index.toString(16).padStart(31, '0')}`,
    targetId,
  }));
}

async function padArchiveLifecycleToExactBytes(input: V3Input, target: number): Promise<void> {
  const lifecycle = input.documents.archiveLifecycle;
  const upper = 2_048;
  for (let revisionLength = 1; revisionLength <= 128; revisionLength++) {
    const candidateRevision = `r${'x'.repeat(revisionLength - 1)}`;
    lifecycle.revision = candidateRevision;
    let low = 0;
    let high = upper;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      lifecycle.aliases = aliases(middle, lifecycle.archiveArticleIds[0]!);
      const actual = resourceBytes(input, 'archiveLifecycle');
      if (actual === target) {
        setRevision(input, candidateRevision);
        return;
      }
      if (actual < target) low = middle + 1;
      else high = middle - 1;
    }
  }
  throw new Error(`Unable to construct archiveLifecycle at ${target} bytes.`);
}

function resourcePaddingFields(input: V3Input, id: Exclude<V3ResourceId, 'archiveLifecycle'>) {
  if (id === 'articles')
    return input.documents.articles.articles.flatMap((article: any) => [
      {
        value: () => article.title,
        set: (value: string) => (article.title = value),
        maximum: 4_096,
      },
      {
        value: () => article.teaser,
        set: (value: string) => (article.teaser = value),
        maximum: 4_096,
      },
      {
        value: () => article.source.name,
        set: (value: string) => (article.source.name = value),
        maximum: 4_096,
      },
      {
        value: () => article.originalLanguage,
        set: (value: string) => (article.originalLanguage = value),
        maximum: 32,
      },
      {
        value: () => article.tags[0],
        set: (value: string) => (article.tags[0] = value),
        maximum: 96,
      },
    ]);
  if (id === 'admission') {
    return input.documents.admission.entries.flatMap((entry: any, index: number) => {
      const article = input.documents.articles.articles[index]!;
      entry.authors = [...article.source.authors];
      entry.transformation = { ...article.transformation };
      return [
        {
          value: () => article.originalUrl,
          set: (value: string) => {
            article.originalUrl = value;
            entry.originalUrl = value;
          },
          maximum: 2_048,
        },
        {
          value: () => article.source.id,
          set: (value: string) => {
            article.source.id = value;
            entry.sourceId = value;
          },
          maximum: 4_096,
        },
        {
          value: () => article.source.authors[0],
          set: (value: string) => {
            article.source.authors[0] = value;
            entry.authors[0] = value;
          },
          maximum: 4_096,
        },
        {
          value: () => article.rights.licenseId,
          set: (value: string) => {
            article.rights.licenseId = value;
            entry.licenseId = value;
          },
          maximum: 4_096,
        },
        {
          value: () => article.rights.licenseUrl,
          set: (value: string) => {
            article.rights.licenseUrl = value;
            entry.licenseUrl = value;
          },
          maximum: 2_048,
        },
        {
          value: () => article.rights.evidenceUrl,
          set: (value: string) => {
            article.rights.evidenceUrl = value;
            entry.evidenceUrl = value;
          },
          maximum: 2_048,
        },
        {
          value: () => article.rights.scope,
          set: (value: string) => {
            article.rights.scope = value;
            entry.scope = value;
          },
          maximum: 4_096,
        },
        {
          value: () => article.transformation.reference,
          set: (value: string) => {
            article.transformation.reference = value;
            entry.transformation.reference = value;
          },
          maximum: 4_096,
        },
      ];
    });
  }
  if (id === 'discoverIndex')
    return input.documents.discoverIndex.entries.flatMap((entry: any) => [
      { value: () => entry.region, set: (value: string) => (entry.region = value), maximum: 4_096 },
      { value: () => entry.format, set: (value: string) => (entry.format = value), maximum: 4_096 },
      {
        value: () => entry.topics[0],
        set: (value: string) => (entry.topics[0] = value),
        maximum: 4_096,
      },
    ]);
  return input.documents.readerDetails.entries.map((entry: any) => ({
    value: () => entry.blocks[0].text,
    set: (value: string) => (entry.blocks[0].text = value),
    maximum: 64 * 1_024,
  }));
}

function minimizeArticleOnlyFields(input: V3Input): void {
  for (const article of input.documents.articles.articles) {
    article.title = 'x';
    article.teaser = 'x';
    article.source.name = 'x';
    article.originalLanguage = 'x';
    article.tags = ['x'];
  }
}

export async function createV3Input(articleCount: number): Promise<V3Input> {
  const revision = `capacity-${articleCount}`;
  const articles = Array.from({ length: articleCount }, (_, offset) => {
    const id = articleId(offset + 1);
    return {
      id,
      title: `Synthetic capacity article ${offset + 1}`,
      teaser: 'Authorised synthetic contract test metadata.',
      publishedAt: '2026-09-11T00:00:00.000Z',
      originalUrl: `https://example.org/original/${id}`,
      source: { id: `source-${offset + 1}`, name: 'Example source', authors: ['Example author'] },
      originalLanguage: 'en',
      tags: ['test'],
      contentCompleteness: 'full' as const,
      rights: {
        licenseId: 'CC-BY-4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        evidenceUrl: 'https://example.org/rights',
        checkedAt: '2026-09-11T00:00:00.000Z',
        scope: 'Synthetic contract test scope.',
        thirdPartyMaterialReviewed: true as const,
      },
      transformation: { status: 'original' as const, reference: 'Synthetic record.' },
    };
  });
  const ids = articles.map((article) => article.id);
  const details = articles.map((article) => ({
    articleId: article.id,
    blocks: [{ kind: 'paragraph' as const, text: 'Synthetic reader text.' }],
  }));
  const documents: Record<string, any> = {
    articles: { revision, articles },
    admission: {
      contractVersion: '1.0.0',
      schema: 'wrn.production-article-admission.v1',
      revision,
      entries: [],
    },
    discoverIndex: {
      contractVersion: '1.0.0',
      schema: 'wrn.production-discover-index.v1',
      revision,
      entries: articles.map((article) => ({
        articleId: article.id,
        region: 'global',
        topics: ['test'],
        format: 'news',
      })),
    },
    readerDetails: {
      contractVersion: '2.0.0',
      schema: 'wrn.production-reader-details.v2',
      revision,
      entries: details,
    },
    archiveLifecycle: {
      contractVersion: '1.0.0',
      schema: 'wrn.production-archive-lifecycle.v1',
      revision,
      activeArticleIds: ids,
      archiveArticleIds: ids,
      shareableArticleIds: ids,
      aliases: [],
      gone: [],
      revocations: { revision: 1, previousRevision: 0, entries: [] },
    },
  };
  documents.admission.entries = await Promise.all(
    articles.map(async (article, index) => ({
      articleId: article.id,
      originalUrl: article.originalUrl,
      sourceId: article.source.id,
      authors: article.source.authors,
      sourceSnapshotSha256: (index + 10).toString(16).padStart(64, '0'),
      sourceSnapshotBytes: 42,
      admittedContentSha256: await sha256Utf8(
        canonicalJson({ article, detail: documents.readerDetails.entries[index] }),
      ),
      licenseId: article.rights.licenseId,
      licenseUrl: article.rights.licenseUrl,
      evidenceUrl: article.rights.evidenceUrl,
      checkedAt: article.rights.checkedAt,
      scope: article.rights.scope,
      thirdPartyMaterialReviewed: true as const,
      transformation: article.transformation,
    })),
  );
  const manifest: Record<string, any> = {
    contractVersion: '3.0.0',
    schema: 'wrn.production-content-release.v3',
    revision,
    resources: [],
    articleIds: ids,
  };
  const descriptor: Record<string, any> = {
    contractVersion: '3.0.0',
    schema: 'wrn.production-content-release-descriptor.v3',
    releaseRevision: revision,
    sequence: 3,
    expectedManifest: {},
    expectedComponents: {},
  };
  const input = { descriptor, manifest, documents };
  await rebind(input);
  return input;
}

export async function addCapacityImages(
  input: V3Input,
  count: number,
  bytesPerImage: number | readonly number[],
): Promise<void> {
  for (let index = 0; index < count; index++) {
    const byteLength = Array.isArray(bytesPerImage) ? bytesPerImage[index]! : bytesPerImage;
    const bytes = new Uint8Array(byteLength);
    bytes.set(pngPrefix);
    const base64 = btoa(String.fromCharCode(...bytes));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const entry = input.documents.readerDetails.entries[Math.floor(index / 8)]!;
    const article = input.documents.articles.articles.find(
      (value: any) => value.id === entry.articleId,
    )!;
    const admission = input.documents.admission.entries.find(
      (value: any) => value.articleId === entry.articleId,
    )!;
    const sourceUrl = `https://example.org/media/${index}.png`;
    const mediaId = `wrn-media-${(await sha256Utf8(sourceUrl)).slice(0, 32)}`;
    entry.blocks.unshift({
      kind: 'image',
      mediaId,
      sourceUrl,
      sourcePageUrl: article.originalUrl,
      sourceSnapshotSha256: admission.sourceSnapshotSha256,
      mime: 'image/png',
      byteLength: bytes.byteLength,
      width: 1,
      height: 1,
      sha256,
      base64,
      altText: 'Synthetic test image.',
      altLanguage: 'en',
      altTextProvenance: 'editorial',
      attribution: 'Example',
      licenseId: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      evidenceUrl: 'https://example.org/rights',
      checkedAt: '2026-09-11T00:00:00.000Z',
      thirdPartyMaterialReviewed: true,
    });
  }
  for (const admission of input.documents.admission.entries) {
    const article = input.documents.articles.articles.find(
      (value: any) => value.id === admission.articleId,
    );
    const detail = input.documents.readerDetails.entries.find(
      (value: any) => value.articleId === admission.articleId,
    );
    admission.admittedContentSha256 = await sha256Utf8(canonicalJson({ article, detail }));
  }
  await rebind(input);
}

export async function rebindV3(input: V3Input): Promise<void> {
  await rebind(input);
}

export async function rebindV3ManifestOnly(input: V3Input): Promise<void> {
  await rebindManifest(input);
}

/** Builds valid V3 resource JSON at an exact canonical UTF-8 byte size. */
export async function padV3ResourceToExactBytes(
  input: V3Input,
  id: V3ResourceId,
  target: number,
): Promise<void> {
  if (id === 'admission') {
    minimizeArticleOnlyFields(input);
    await rebind(input);
  }
  if (!Number.isSafeInteger(target) || target < resourceBytes(input, id))
    throw new Error(`Invalid ${id} padding target ${target}; current ${resourceBytes(input, id)}.`);
  if (id === 'archiveLifecycle') await padArchiveLifecycleToExactBytes(input, target);
  else appendToFields(resourcePaddingFields(input, id), target - resourceBytes(input, id));
  await rebind(input);
  if (resourceBytes(input, id) !== target)
    throw new Error(`${id} did not reach ${target} canonical bytes.`);
}

/** Largest schema-valid construction, ordered so admission receipts settle last. */
export async function padV3ResourcesToMaximumBytes(
  input: V3Input,
  maximums: Readonly<Record<V3ResourceId, number>>,
): Promise<void> {
  for (const id of [
    'archiveLifecycle',
    'admission',
    'articles',
    'readerDetails',
    'discoverIndex',
  ] as const)
    await padV3ResourceToExactBytes(input, id, maximums[id]);
}
