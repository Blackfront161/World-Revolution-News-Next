import fixture from './fixtures/wrn-production-content-v1/synthetic-build-input.json';
import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Utf8, utf8ByteLength } from '../src/index.js';
import { createValidatedProductionContentReleaseV1 } from '../src/production-content-release-v1.js';
import {
  createValidatedProductionContentReleaseV2,
  resolveProductionContentArticleV2,
  createProductionArticleShareUrlV2,
  validateProductionContentSafetyEvidenceV2,
} from '../src/production-content-release-v2.js';
import {
  createValidatedProductionContentRelease,
  validateProductionWebsitePublication,
} from '../src/production-content-compatible.js';
import {
  createProductionContentOfflineBundle,
  validateProductionContentOfflineBundle,
} from '../src/production-content-offline-compatible.js';
import { validateProductionContentOfflineBundleV1 } from '../src/production-content-offline-v1.js';

const articleId = 'wrn-art-0123456789abcdef0123456789abcdef';
const revision = 'synthetic-media-2';
const base64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5LQP4QAAAABJRU5ErkJggg==';
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
async function sample() {
  const input = JSON.parse(canonicalJson(fixture));
  const docs = input.documents;
  for (const name of names) docs[name].revision = revision;
  for (const [name, schema] of Object.entries({
    admission: 'wrn.production-article-admission.v1',
    archiveLifecycle: 'wrn.production-archive-lifecycle.v1',
    discoverIndex: 'wrn.production-discover-index.v1',
    readerDetails: 'wrn.production-reader-details.v2',
  })) {
    docs[name].schema = schema;
    docs[name].contractVersion = name === 'readerDetails' ? '2.0.0' : '1.0.0';
  }
  const sourceUrl = 'https://example.org/original-image.png';
  const imageBytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', imageBytes));
  docs.readerDetails.entries[0].blocks.unshift({
    kind: 'image',
    mediaId: `wrn-media-${(await sha256Utf8(sourceUrl)).slice(0, 32)}`,
    sourceUrl,
    sourcePageUrl: docs.articles.articles[0].originalUrl,
    sourceSnapshotSha256: docs.admission.entries[0].sourceSnapshotSha256,
    mime: 'image/png',
    byteLength: imageBytes.byteLength,
    width: 1,
    height: 1,
    sha256: Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join(''),
    base64,
    altText: 'Synthetic test image.',
    altLanguage: 'en',
    altTextProvenance: 'editorial',
    attribution: 'Example',
    licenseId: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    evidenceUrl: 'https://example.org/rights',
    checkedAt: '2026-09-10T00:00:00.000Z',
    thirdPartyMaterialReviewed: true,
  });
  docs.admission.entries[0].admittedContentSha256 = await sha256Utf8(
    canonicalJson({ article: docs.articles.articles[0], detail: docs.readerDetails.entries[0] }),
  );
  const resources = await Promise.all(
    names.map(async (id) => ({
      id,
      path: paths[id],
      sha256: await sha256Utf8(canonicalJson(docs[id])),
      bytes: utf8ByteLength(canonicalJson(docs[id])),
      recordCount:
        id === 'articles'
          ? docs[id].articles.length
          : id === 'archiveLifecycle'
            ? docs[id].archiveArticleIds.length
            : docs[id].entries.length,
    })),
  );
  const manifest = {
    schema: 'wrn.production-content-release.v2',
    contractVersion: '2.0.0',
    revision,
    articleIds: [articleId],
    resources,
  };
  const descriptor = {
    schema: 'wrn.production-content-release-descriptor.v2',
    contractVersion: '2.0.0',
    releaseRevision: revision,
    sequence: 2,
    expectedManifest: { revision, sha256: await sha256Utf8(canonicalJson(manifest)) },
    expectedComponents: Object.fromEntries(
      resources
        .filter((r) => r.id !== 'articles')
        .map((r) => [r.id, { revision, sha256: r.sha256 }]),
    ),
  };
  return { descriptor, manifest, documents: docs };
}
async function rebind(input: Awaited<ReturnType<typeof sample>>) {
  const { documents, manifest, descriptor } = input;
  for (const resource of manifest.resources) {
    resource.sha256 = await sha256Utf8(canonicalJson(documents[resource.id]));
    resource.bytes = utf8ByteLength(canonicalJson(documents[resource.id]));
    if (resource.id !== 'articles')
      descriptor.expectedComponents[resource.id]!.sha256 = resource.sha256;
  }
  descriptor.expectedManifest.sha256 = await sha256Utf8(canonicalJson(manifest));
}

describe('explicit V2 production images with unchanged V1 validators', () => {
  it('retains frozen V2 pilot rejections for four articles and a 512 KiB resource', async () => {
    const fourthArticle = await sample();
    fourthArticle.documents.articles.articles.push({
      ...structuredClone(fourthArticle.documents.articles.articles[0]!),
      id: 'wrn-art-11111111111111111111111111111111',
    } as (typeof fourthArticle.documents.articles.articles)[number]);
    expect(await createValidatedProductionContentReleaseV2(fourthArticle)).toBeNull();
    const oversizedResource = await sample();
    oversizedResource.manifest.resources[0]!.bytes = 512 * 1024 + 1;
    expect(await createValidatedProductionContentReleaseV2(oversizedResource)).toBeNull();
  });

  it('binds the separate Website publication to the original V2 manifest', async () => {
    const input = await sample();
    const ready = (await createValidatedProductionContentReleaseV2(input))!;
    const publication = {
      contractVersion: '1.0.0',
      schema: 'wrn.production-website-publication.v1',
      revision,
      generatedAt: '2026-09-10T00:00:00.000Z',
      siteOrigin: 'https://solinaridao.com/',
      sourceManifest: { revision, sha256: ready.manifestSha256, articleIds: [articleId] },
      landingIds: [articleId],
      sitemapArticleIds: [articleId],
      generatorVersion: 'test/2',
    };
    expect(validateProductionWebsitePublication(publication, ready).ok).toBe(true);
    publication.sourceManifest.sha256 = 'f'.repeat(64);
    expect(validateProductionWebsitePublication(publication, ready).ok).toBe(false);
  });
  it('retains original image bytes and identities; private text proof cannot escape', async () => {
    const input = await sample();
    const ready = await createValidatedProductionContentReleaseV2(input);
    expect(ready).not.toBeNull();
    expect(ready?.documents).toEqual(input.documents);
    expect(ready?.manifestSha256).toBe(input.descriptor.expectedManifest.sha256);
    expect(await createValidatedProductionContentRelease(input)).toEqual(ready);
    expect(await createValidatedProductionContentReleaseV1(input)).toBeNull();
    const resolution = resolveProductionContentArticleV2(ready!, articleId);
    expect(resolution.kind).toBe('canonical-active');
    expect(createProductionArticleShareUrlV2(ready!, resolution)).toBe(
      `https://solinaridao.com/articles/${articleId}/`,
    );
    expect(resolveProductionContentArticleV2(structuredClone(ready!), articleId).kind).toBe(
      'invalid',
    );
    input.documents.readerDetails.entries[0].blocks[0].altText = 'mutation';
    expect(ready?.documents.readerDetails.entries[0]?.blocks[0]).not.toEqual(
      input.documents.readerDetails.entries[0].blocks[0],
    );
  });
  it('rejects tampered original resource/component/admission bindings before projection', async () => {
    for (const mutation of ['resource', 'component', 'admission', 'image', 'extra', 'version']) {
      const input = await sample();
      if (mutation === 'resource') input.manifest.resources[0]!.bytes++;
      if (mutation === 'component')
        input.descriptor.expectedComponents.readerDetails!.sha256 = 'f'.repeat(64);
      if (mutation === 'admission') {
        input.documents.admission.entries[0].admittedContentSha256 = 'f'.repeat(64);
        await rebind(input);
      }
      if (mutation === 'image')
        input.documents.readerDetails.entries[0].blocks[0].base64 = base64.replace('Nk', 'Nl');
      if (mutation === 'extra') input.documents.readerDetails.extra = true;
      if (mutation === 'version') input.descriptor.contractVersion = '1.0.0';
      expect(await createValidatedProductionContentReleaseV2(input), mutation).toBeNull();
    }
  });
  it('rejects correctly rehashed but invalid image byte/provenance/count and text records', async () => {
    for (const mutation of ['bytes', 'page', 'snapshot', 'count', 'text']) {
      const input = await sample();
      const detail = input.documents.readerDetails.entries[0];
      if (mutation === 'bytes') detail.blocks[0].sha256 = 'f'.repeat(64);
      if (mutation === 'page') detail.blocks[0].sourcePageUrl = 'https://example.org/different';
      if (mutation === 'snapshot') detail.blocks[0].sourceSnapshotSha256 = 'f'.repeat(64);
      if (mutation === 'count')
        detail.blocks.unshift(
          ...Array.from({ length: 8 }, () => structuredClone(detail.blocks[0])),
        );
      if (mutation === 'text') detail.blocks[1].text = '<script>bad</script>';
      input.documents.admission.entries[0].admittedContentSha256 = await sha256Utf8(
        canonicalJson({ article: input.documents.articles.articles[0], detail }),
      );
      await rebind(input);
      expect(await createValidatedProductionContentReleaseV2(input), mutation).toBeNull();
    }
  });
  it('persists and reopens the actual V2 envelope and rejects V1 format disguise', async () => {
    const input = await sample();
    const bundle = await createProductionContentOfflineBundle({ ...input, checkedAt: 100 });
    expect(bundle.format).toBe('wrn.production-content-offline-bundle.v2');
    expect(bundle.documents).toEqual(input.documents);
    expect(
      await validateProductionContentOfflineBundle(structuredClone(bundle), {
        revision: 1,
        revokedIds: [],
      }),
    ).not.toBeNull();
    expect(
      await validateProductionContentOfflineBundleV1(bundle, { revision: 1, revokedIds: [] }),
    ).toBeNull();
    expect(
      await validateProductionContentOfflineBundle(
        { ...bundle, format: 'wrn.production-content-offline-bundle.v1' },
        { revision: 1, revokedIds: [] },
      ),
    ).toBeNull();
    expect(
      await validateProductionContentOfflineBundle(bundle, {
        revision: 2,
        revokedIds: [articleId],
      }),
    ).toBeNull();
  });
  it('checks original V2 safety identities before payloads, without requiring image bytes', async () => {
    const input = await sample();
    const safetyInput = {
      descriptor: input.descriptor,
      manifest: input.manifest,
      archiveLifecycle: input.documents.archiveLifecycle,
      knownSafety: { revision: 0, revokedIds: [] },
    };
    expect(await validateProductionContentSafetyEvidenceV2(safetyInput)).toEqual({
      revision: 1,
      revokedIds: [],
    });
    safetyInput.manifest.resources[0]!.sha256 = 'f'.repeat(64);
    expect(await validateProductionContentSafetyEvidenceV2(safetyInput)).toBeNull();
  });
});
