import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Utf8, utf8ByteLength } from '../src/index.js';
import {
  createProductionArticleShareUrlV1,
  createValidatedProductionContentReleaseV1,
  isProductionWebsitePublicationV1,
  productionContractVersionV1,
  productionContentDescriptorSchemaV1,
  productionContentReleaseSchemaV1,
  resolveProductionContentArticleV1,
  resolveProductionContentLifecycleV1,
  validateProductionContentReleaseV1,
  validateProductionWebsitePublicationV1,
} from '../src/production-content-release-v1.js';
import type { ProductionReaderBlockV1 } from '../src/production-content-release-v1.js';

const articleId = 'wrn-art-0123456789abcdef0123456789abcdef' as const;
async function sample(
  blocks: readonly ProductionReaderBlockV1[] = [
    { kind: 'paragraph', text: 'Synthetic reader text.' },
  ],
) {
  const article = {
    id: articleId,
    title: 'Synthetic admission record',
    teaser: 'Self-authored test metadata.',
    publishedAt: '2026-09-10T00:00:00.000Z',
    originalUrl: 'https://example.org/original',
    source: { id: 'example', name: 'Example source', authors: ['Example author'] },
    originalLanguage: 'en',
    tags: ['test'],
    contentCompleteness: 'full' as 'full' | 'partial',
    rights: {
      licenseId: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      evidenceUrl: 'https://example.org/rights',
      checkedAt: '2026-09-10T00:00:00.000Z',
      scope: 'synthetic test scope',
      thirdPartyMaterialReviewed: true as const,
    },
    transformation: { status: 'original' as const, reference: 'synthetic record' },
  };
  const detail = { articleId, blocks };
  const admission = {
    contractVersion: productionContractVersionV1,
    schema: 'wrn.production-article-admission.v1' as const,
    revision: 'release-1',
    entries: [
      {
        articleId,
        originalUrl: article.originalUrl,
        sourceId: article.source.id,
        authors: article.source.authors,
        sourceSnapshotSha256: 'a'.repeat(64),
        sourceSnapshotBytes: 42,
        admittedContentSha256: await sha256Utf8(canonicalJson({ article, detail })),
        licenseId: article.rights.licenseId,
        licenseUrl: article.rights.licenseUrl,
        evidenceUrl: article.rights.evidenceUrl,
        checkedAt: article.rights.checkedAt,
        scope: article.rights.scope,
        thirdPartyMaterialReviewed: true as const,
        transformation: article.transformation,
      },
    ],
  };
  const documents = {
    articles: { revision: 'release-1', articles: [article] },
    admission,
    discoverIndex: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-discover-index.v1' as const,
      revision: 'release-1',
      entries: [{ articleId, region: 'global', topics: ['test'], format: 'news' }],
    },
    readerDetails: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-reader-details.v1' as const,
      revision: 'release-1',
      entries: [detail],
    },
    archiveLifecycle: {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-archive-lifecycle.v1' as const,
      revision: 'release-1',
      activeArticleIds: [articleId],
      archiveArticleIds: [articleId],
      shareableArticleIds: [articleId],
      aliases: [],
      gone: [],
      revocations: { revision: 1, previousRevision: 0, entries: [] },
    },
  };
  const payloads = {
    articles: documents.articles,
    admission: documents.admission,
    discoverIndex: documents.discoverIndex,
    readerDetails: documents.readerDetails,
    archiveLifecycle: documents.archiveLifecycle,
  } as const;
  const names = [
    'admission',
    'archiveLifecycle',
    'articles',
    'discoverIndex',
    'readerDetails',
  ] as const;
  const manifest = {
    contractVersion: productionContractVersionV1,
    schema: productionContentReleaseSchemaV1,
    revision: 'release-1',
    resources: await Promise.all(
      names.map(async (id) => ({
        id,
        path: `${id === 'archiveLifecycle' ? 'archive-lifecycle' : id === 'discoverIndex' ? 'discover-index' : id === 'readerDetails' ? 'reader-details' : id}.json`,
        sha256: await sha256Utf8(canonicalJson(payloads[id])),
        bytes: utf8ByteLength(canonicalJson(payloads[id])),
        recordCount:
          id === 'articles' ? 1 : id === 'archiveLifecycle' ? 1 : payloads[id].entries.length,
      })),
    ),
    articleIds: [articleId],
  };
  const componentNames = [
    'admission',
    'discoverIndex',
    'readerDetails',
    'archiveLifecycle',
  ] as const;
  const expectedComponents = Object.fromEntries(
    await Promise.all(
      componentNames.map(async (id) => [
        id,
        { revision: 'release-1', sha256: await sha256Utf8(canonicalJson(payloads[id])) },
      ]),
    ),
  ) as {
    admission: { revision: string; sha256: string };
    discoverIndex: { revision: string; sha256: string };
    readerDetails: { revision: string; sha256: string };
    archiveLifecycle: { revision: string; sha256: string };
  };
  const descriptor = {
    contractVersion: productionContractVersionV1,
    schema: productionContentDescriptorSchemaV1,
    releaseRevision: 'release-1',
    sequence: 1,
    expectedManifest: { revision: 'release-1', sha256: await sha256Utf8(canonicalJson(manifest)) },
    expectedComponents,
  };
  return { descriptor, manifest, documents };
}
async function rehash(input: Awaited<ReturnType<typeof sample>>) {
  const payloads = {
    articles: input.documents.articles,
    admission: input.documents.admission,
    discoverIndex: input.documents.discoverIndex,
    readerDetails: input.documents.readerDetails,
    archiveLifecycle: input.documents.archiveLifecycle,
  };
  const resourcePayloads = {
    articles: { payload: payloads.articles, recordCount: payloads.articles.articles.length },
    admission: { payload: payloads.admission, recordCount: payloads.admission.entries.length },
    discoverIndex: {
      payload: payloads.discoverIndex,
      recordCount: payloads.discoverIndex.entries.length,
    },
    readerDetails: {
      payload: payloads.readerDetails,
      recordCount: payloads.readerDetails.entries.length,
    },
    archiveLifecycle: { payload: payloads.archiveLifecycle, recordCount: 1 },
  };
  for (const resource of input.manifest.resources as {
    id: keyof typeof resourcePayloads;
    sha256: string;
    bytes: number;
    recordCount: number;
  }[]) {
    const current = resourcePayloads[resource.id];
    resource.sha256 = await sha256Utf8(canonicalJson(current.payload));
    resource.bytes = utf8ByteLength(canonicalJson(current.payload));
    resource.recordCount = current.recordCount;
  }
  for (const name of ['admission', 'discoverIndex', 'readerDetails', 'archiveLifecycle'] as const) {
    (input.descriptor.expectedComponents[name] as { sha256: string }).sha256 = await sha256Utf8(
      canonicalJson(payloads[name]),
    );
  }
  (input.descriptor.expectedManifest as { sha256: string }).sha256 = await sha256Utf8(
    canonicalJson(input.manifest),
  );
}
describe('production content release v1', () => {
  it('keeps the frozen pilot count and per-resource rejection surface', async () => {
    const fourthArticle = await sample();
    fourthArticle.documents.articles.articles.push({
      ...structuredClone(fourthArticle.documents.articles.articles[0]!),
      id: 'wrn-art-11111111111111111111111111111111',
    } as unknown as (typeof fourthArticle.documents.articles.articles)[number]);
    await expect(validateProductionContentReleaseV1(fourthArticle)).resolves.toMatchObject({
      ok: false,
    });
    const oversizedResource = await sample();
    oversizedResource.manifest.resources[0]!.bytes = 512 * 1024 + 1;
    await expect(validateProductionContentReleaseV1(oversizedResource)).resolves.toMatchObject({
      ok: false,
    });
  });

  it('accepts only a complete, rights-bound synthetic admission and resolves safe sharing', async () => {
    const input = await sample();
    await expect(validateProductionContentReleaseV1(input)).resolves.toMatchObject({ ok: true });
    const ready = await createValidatedProductionContentReleaseV1(input);
    expect(ready?.articleIds).toEqual([articleId]);
    const resolution = resolveProductionContentArticleV1(ready!, articleId);
    expect(resolution).toEqual({ kind: 'canonical-active', canonicalId: articleId });
    expect(createProductionArticleShareUrlV1(ready!, resolution)).toBe(
      `https://solinaridao.com/articles/${articleId}/`,
    );
  });
  it('fails closed for rights, content-hash, unsafe URL, set, resource and safety drift', async () => {
    const input = await sample();
    const rightsDrift = structuredClone(input);
    (
      rightsDrift.documents.articles.articles[0]!.rights as { thirdPartyMaterialReviewed: boolean }
    ).thirdPartyMaterialReviewed = false;
    await expect(validateProductionContentReleaseV1(rightsDrift)).resolves.toMatchObject({
      ok: false,
    });
    const contentDrift = structuredClone(input);
    contentDrift.documents.admission.entries[0]!.admittedContentSha256 = 'b'.repeat(64);
    await expect(validateProductionContentReleaseV1(contentDrift)).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['component-binding']),
    });
    const unsafe = structuredClone(input);
    unsafe.documents.articles.articles[0]!.originalUrl = 'https://user:secret@example.org/original';
    await expect(validateProductionContentReleaseV1(unsafe)).resolves.toMatchObject({ ok: false });
    const setDrift = structuredClone(input);
    setDrift.manifest.articleIds = [];
    await expect(validateProductionContentReleaseV1(setDrift)).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['article-id-set']),
    });
    const resourceDrift = structuredClone(input);
    resourceDrift.manifest.resources[0]!.bytes += 1;
    await expect(validateProductionContentReleaseV1(resourceDrift)).resolves.toMatchObject({
      ok: false,
    });
    const countDrift = structuredClone(input);
    countDrift.manifest.resources[0]!.recordCount += 1;
    await expect(validateProductionContentReleaseV1(countDrift)).resolves.toMatchObject({
      ok: false,
    });
    await expect(
      validateProductionContentReleaseV1({
        ...input,
        knownSafety: { revision: 2, revokedIds: [articleId] },
      }),
    ).resolves.toMatchObject({ ok: false, errors: expect.arrayContaining(['safety-ledger']) });
    await expect(
      validateProductionContentReleaseV1({
        ...input,
        knownSafety: { revision: 1, revokedIds: [articleId] },
      }),
    ).resolves.toMatchObject({ ok: false, errors: expect.arrayContaining(['safety-ledger']) });
  });
  it('rejects every independently bound admission metadata field when it drifts', async () => {
    const input = await sample();
    const cases: readonly [string, unknown][] = [
      ['originalUrl', 'https://example.org/other'],
      ['sourceId', 'other-source'],
      ['authors', ['Other author']],
      ['sourceSnapshotSha256', 'b'.repeat(64)],
      ['sourceSnapshotBytes', 43],
      ['admittedContentSha256', 'c'.repeat(64)],
      ['licenseId', 'Other-License'],
      ['licenseUrl', 'https://example.org/license'],
      ['evidenceUrl', 'https://example.org/evidence'],
      ['checkedAt', '2026-09-11T00:00:00.000Z'],
      ['scope', 'other scope'],
      ['thirdPartyMaterialReviewed', false],
      ['transformation', { status: 'transformed', reference: 'other' }],
    ];
    for (const [key, value] of cases) {
      const drift = structuredClone(input);
      (drift.documents.admission.entries[0] as unknown as Record<string, unknown>)[key] = value;
      await expect(validateProductionContentReleaseV1(drift)).resolves.toMatchObject({ ok: false });
    }
  });
  it('accepts every neutral reader block kind and rejects partial text, sequence and unsafe text', async () => {
    const allBlocks = await sample([
      { kind: 'paragraph' as const, text: 'Synthetic paragraph.' },
      { kind: 'heading' as const, level: 2, text: 'Synthetic heading.' },
      {
        kind: 'quote' as const,
        text: 'Synthetic quotation.',
        attribution: 'Synthetic attribution.',
      },
      { kind: 'list' as const, style: 'unordered' as const, items: ['Synthetic item.'] },
    ]);
    await expect(validateProductionContentReleaseV1(allBlocks)).resolves.toMatchObject({
      ok: true,
    });
    const partial = structuredClone(allBlocks);
    partial.documents.articles.articles[0]!.contentCompleteness = 'partial';
    await expect(validateProductionContentReleaseV1(partial)).resolves.toMatchObject({ ok: false });
    const invalidSequence = structuredClone(allBlocks);
    invalidSequence.descriptor.sequence = 0;
    await expect(validateProductionContentReleaseV1(invalidSequence)).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['structure']),
    });
    const unsafeText = structuredClone(allBlocks);
    const unsafeBlock = unsafeText.documents.readerDetails.entries[0]!.blocks[0]! as {
      readonly kind: string;
      text?: string;
    };
    unsafeBlock.text = '<script>';
    await expect(validateProductionContentReleaseV1(unsafeText)).resolves.toMatchObject({
      ok: false,
    });
  });
  it('takes a deep immutable snapshot before asynchronous validation and Ready derivation', async () => {
    const input = await sample([
      { kind: 'paragraph', text: 'Synthetic paragraph.' },
      { kind: 'heading', level: 2, text: 'Synthetic heading.' },
      { kind: 'quote', text: 'Synthetic quotation.', attribution: 'Synthetic attribution.' },
      { kind: 'list', style: 'ordered', items: ['Synthetic item.'] },
    ]);
    (
      input as { knownSafety?: { revision: number; revokedIds: (typeof articleId)[] } }
    ).knownSafety = {
      revision: 1,
      revokedIds: [],
    };
    const validation = validateProductionContentReleaseV1(input);
    input.documents.articles.articles[0]!.source.authors[0] = 'Caller mutation';
    (
      input.documents.readerDetails.entries[0]!.blocks[3]! as unknown as { items: string[] }
    ).items[0] = 'Caller mutation';
    input.descriptor.expectedComponents.admission.sha256 = '0'.repeat(64);
    input.manifest.resources[0]!.bytes += 1;
    (
      input as unknown as { knownSafety: { revokedIds: (typeof articleId)[] } }
    ).knownSafety.revokedIds.push(articleId);
    await expect(validation).resolves.toMatchObject({ ok: true });

    const readyInput = await sample([
      { kind: 'paragraph', text: 'Synthetic paragraph.' },
      { kind: 'heading', level: 2, text: 'Synthetic heading.' },
      { kind: 'quote', text: 'Synthetic quotation.', attribution: 'Synthetic attribution.' },
      { kind: 'list', style: 'ordered', items: ['Synthetic item.'] },
    ]);
    (
      readyInput as { knownSafety?: { revision: number; revokedIds: (typeof articleId)[] } }
    ).knownSafety = {
      revision: 1,
      revokedIds: [],
    };
    const expectedManifestBytes = readyInput.manifest.resources[0]!.bytes;
    const ready = await createValidatedProductionContentReleaseV1(readyInput);
    readyInput.documents.articles.articles[0]!.source.authors[0] = 'Caller mutation';
    (
      readyInput.documents.readerDetails.entries[0]!.blocks[3]! as unknown as { items: string[] }
    ).items[0] = 'Caller mutation';
    readyInput.descriptor.expectedComponents.admission.sha256 = '0'.repeat(64);
    readyInput.manifest.resources[0]!.bytes += 1;
    (
      readyInput as unknown as { knownSafety: { revokedIds: (typeof articleId)[] } }
    ).knownSafety.revokedIds.push(articleId);
    expect(ready!.documents.articles.articles[0]!.source.authors).toEqual(['Example author']);
    expect(ready!.documents.readerDetails.entries[0]!.blocks[3]).toEqual({
      kind: 'list',
      style: 'ordered',
      items: ['Synthetic item.'],
    });
    expect(ready!.descriptor.expectedComponents.admission.sha256).not.toBe('0'.repeat(64));
    expect(ready!.manifest.resources[0]!.bytes).toBe(expectedManifestBytes);
    expect(ready!.safetyLedger.revokedIds).toEqual([]);
    expect(Object.isFrozen(ready!.descriptor.expectedComponents.admission)).toBe(true);
    expect(Object.isFrozen(ready!.manifest.resources)).toBe(true);
    expect(Object.isFrozen(ready!.documents.articles.articles[0]!.source.authors)).toBe(true);
    expect(Object.isFrozen(ready!.documents.readerDetails.entries[0]!.blocks[3]!)).toBe(true);
    expect(
      Object.isFrozen(
        (ready!.documents.readerDetails.entries[0]!.blocks[3]! as { items: readonly string[] })
          .items,
      ),
    ).toBe(true);
    expect(Object.isFrozen(ready!.safetyLedger.revokedIds)).toBe(true);
  });
  it('rejects lifecycle contradictions and never resolves a revoked alias target', async () => {
    const aliasId = 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
    const invalid = resolveProductionContentLifecycleV1({
      requestedArticleId: aliasId,
      articleIds: [articleId],
      activeArticleIds: [articleId],
      aliases: [{ sourceId: aliasId, targetId: articleId }],
      goneIds: [],
      revokedIds: [articleId],
    });
    expect(invalid).toMatchObject({ kind: 'invalid' });

    const duplicateAlias = await sample();
    (
      duplicateAlias.documents.archiveLifecycle as {
        aliases: { sourceId: typeof aliasId; targetId: typeof articleId }[];
      }
    ).aliases = [
      { sourceId: aliasId, targetId: articleId },
      { sourceId: aliasId, targetId: articleId },
    ];
    await rehash(duplicateAlias);
    await expect(validateProductionContentReleaseV1(duplicateAlias)).resolves.toMatchObject({
      ok: false,
      errors: ['lifecycle'],
    });

    const duplicateRevocation = await sample();
    (
      duplicateRevocation.documents.archiveLifecycle.revocations as {
        entries: { id: typeof aliasId; status: 'blocked'; category: 'rights-or-safety' }[];
      }
    ).entries = [
      { id: aliasId, status: 'blocked', category: 'rights-or-safety' },
      { id: aliasId, status: 'blocked', category: 'rights-or-safety' },
    ];
    await rehash(duplicateRevocation);
    await expect(validateProductionContentReleaseV1(duplicateRevocation)).resolves.toMatchObject({
      ok: false,
      errors: ['lifecycle'],
    });
  });
  it('rejects exact revision identity drift after matching hashes are recomputed', async () => {
    const manifestDrift = await sample();
    manifestDrift.manifest.revision = 'release-2';
    manifestDrift.descriptor.expectedManifest.revision = 'release-2';
    await rehash(manifestDrift);
    await expect(validateProductionContentReleaseV1(manifestDrift)).resolves.toMatchObject({
      ok: false,
      errors: ['revision-binding'],
    });

    const articlesDrift = await sample();
    articlesDrift.documents.articles.revision = 'release-2';
    await rehash(articlesDrift);
    await expect(validateProductionContentReleaseV1(articlesDrift)).resolves.toMatchObject({
      ok: false,
      errors: ['revision-binding'],
    });

    const componentDrift = await sample();
    componentDrift.documents.readerDetails.revision = 'release-2';
    componentDrift.descriptor.expectedComponents.readerDetails.revision = 'release-2';
    await rehash(componentDrift);
    await expect(validateProductionContentReleaseV1(componentDrift)).resolves.toMatchObject({
      ok: false,
      errors: ['revision-binding'],
    });
  });
  it('binds a separate website projection to the exact validated core manifest and IDs', async () => {
    const ready = await createValidatedProductionContentReleaseV1(await sample());
    const publication = {
      contractVersion: productionContractVersionV1,
      schema: 'wrn.production-website-publication.v1',
      revision: 'website-1',
      generatedAt: '2026-09-10T00:00:00.000Z',
      siteOrigin: 'https://solinaridao.com/',
      sourceManifest: {
        revision: ready!.manifest.revision,
        sha256: ready!.manifestSha256,
        articleIds: [articleId],
      },
      landingIds: [articleId],
      sitemapArticleIds: [articleId],
      generatorVersion: 'synthetic/1',
    };
    expect(isProductionWebsitePublicationV1(publication)).toBe(true);
    expect(validateProductionWebsitePublicationV1(publication, ready!)).toMatchObject({ ok: true });
    expect(
      validateProductionWebsitePublicationV1({ ...publication, landingIds: [] }, ready!),
    ).toMatchObject({ ok: false, errors: ['article-id-set'] });
    expect(
      validateProductionWebsitePublicationV1(
        {
          ...publication,
          sourceManifest: { ...publication.sourceManifest, sha256: '0'.repeat(64) },
        },
        ready!,
      ),
    ).toMatchObject({ ok: false, errors: ['manifest-binding'] });
  });
});
