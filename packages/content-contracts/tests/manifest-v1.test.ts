import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  isLocalManifestV1,
  localManifestContractVersion,
  sha256Utf8,
  validateLocalManifestIntegrity,
  validateLocalManifestV1,
} from '../src/index.js';

const sourceCommit = '0123456789abcdef0123456789abcdef01234567';
const articles = {
  articles: [
    {
      id: 'wrn-test-art-alpha',
      title: 'Lokale Testmeldung Alpha',
      teaser: 'Diese selbst erstellte Testmeldung dient ausschliesslich der lokalen Darstellung.',
      publishedAt: '2026-08-23T10:00:00.000Z',
      originalUrl: 'https://fixture.invalid/articles/alpha',
      source: { id: 'wrn-test-source-local', name: 'Lokale Testquelle' },
      originalLanguage: 'de',
      tags: ['lokal', 'test'],
      rights: { status: 'fixture-authored', reference: 'wrn-g3-002-fixture' },
      transformation: { status: 'original' as const, reference: 'self-authored-fixture' },
      translation: { status: 'not-requested' as const, reference: 'not-applicable' },
    },
  ],
};
const emptyPayload = { items: [] } as const;

async function createCandidate() {
  const activeFeedIds = ['wrn-test-art-alpha'];
  const emptyIds: string[] = [];
  return {
    contractVersion: localManifestContractVersion,
    revision: 'wrn-g3-002-fixture-v1',
    generatedAt: '2026-08-23T10:00:00.000Z',
    sourceCommit,
    resources: [
      {
        id: 'articles',
        path: 'local-fixture://wrn-g3-002/articles.json',
        schema: 'wrn.local-article-records.v1' as const,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'fail-closed' as const,
        availability: 'required' as const,
        sha256: await sha256Utf8(canonicalJson(articles)),
        bytes: new TextEncoder().encode(canonicalJson(articles)).byteLength,
        recordCount: 1,
      },
      {
        id: 'supplemental-items',
        path: 'local-fixture://wrn-g3-002/supplemental-items.json',
        schema: 'wrn.local-empty-items.v1' as const,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'render-empty' as const,
        availability: 'optional-empty' as const,
        sha256: await sha256Utf8(canonicalJson(emptyPayload)),
        bytes: new TextEncoder().encode(canonicalJson(emptyPayload)).byteLength,
        recordCount: 0,
      },
      {
        id: 'media-placeholder',
        path: 'local-fixture://wrn-g3-002/media-placeholder.json',
        schema: 'wrn.local-empty-items.v1' as const,
        owner: 'wrn-g3-002-local-fixture',
        fallbackClass: 'render-optional-absent' as const,
        availability: 'optional-absent' as const,
        absence: {
          reason: 'Keine Medien sind Teil dieser lokalen Fixture.',
          uiState: 'optional-absent' as const,
          nextReviewAt: '2026-09-23T10:00:00.000Z',
        },
      },
    ],
    articleSets: {
      activeFeedIds,
      archiveIds: activeFeedIds,
      landingIds: emptyIds,
      redirectSourceIds: emptyIds,
      sitemapArticleIds: emptyIds,
    },
    articleSetHashes: {
      activeFeedIds: await sha256Utf8(canonicalJson(activeFeedIds)),
      archiveIds: await sha256Utf8(canonicalJson(activeFeedIds)),
      landingIds: await sha256Utf8(canonicalJson(emptyIds)),
      redirectSourceIds: await sha256Utf8(canonicalJson(emptyIds)),
      sitemapArticleIds: await sha256Utf8(canonicalJson(emptyIds)),
    },
    compatibility: {
      minContractVersion: localManifestContractVersion,
      maxContractVersion: localManifestContractVersion,
    },
    provenance: {
      generatorVersion: 'wrn-local-fixture-generator/1',
      fixtureSeedCommit: sourceCommit,
      sourceKind: 'self-authored-local-fixture' as const,
    },
    revocationRevision: 'wrn-local-revocations-v1',
  };
}

describe('Local Manifest v1', () => {
  it('accepts a complete local fixture with all resource classes', async () => {
    const manifest = await createCandidate();

    expect(isLocalManifestV1(manifest)).toBe(true);
    expect(validateLocalManifestV1(manifest)).toEqual({ ok: true, errors: [] });
    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: { articles, 'supplemental-items': emptyPayload },
      }),
    ).resolves.toMatchObject({ ok: true, errors: [] });
  });

  it('rejects a moving branch, provenance mismatch, malformed required metadata and broken set relation', async () => {
    const manifest = await createCandidate();
    const moving = { ...manifest, sourceCommit: 'main' };
    const mismatchedProvenance = {
      ...manifest,
      provenance: { ...manifest.provenance, fixtureSeedCommit: 'f'.repeat(40) },
    };
    const missingHash = {
      ...manifest,
      resources: manifest.resources.map((resource) =>
        resource.availability === 'required' ? { ...resource, sha256: '' } : resource,
      ),
    };
    const badRelation = {
      ...manifest,
      articleSets: { ...manifest.articleSets, activeFeedIds: ['wrn-test-art-not-in-archive'] },
    };

    expect(isLocalManifestV1(moving)).toBe(false);
    expect(isLocalManifestV1(mismatchedProvenance)).toBe(false);
    expect(isLocalManifestV1(missingHash)).toBe(false);
    expect(isLocalManifestV1(badRelation)).toBe(false);
  });

  it('rejects non-local or duplicate resource paths, ambiguous article resources and incomplete teasers', async () => {
    const manifest = await createCandidate();
    const articleResource = manifest.resources.find((resource) => resource.id === 'articles')!;
    const httpPath = {
      ...manifest,
      resources: manifest.resources.map((resource) =>
        resource.id === 'articles'
          ? { ...resource, path: 'https://fixture.invalid/articles.json' }
          : resource,
      ),
    };
    const duplicatePath = {
      ...manifest,
      resources: [...manifest.resources, { ...articleResource, id: 'articles-copy' }],
    };
    const duplicateArticleSchema = {
      ...manifest,
      resources: [
        ...manifest.resources,
        {
          ...articleResource,
          id: 'articles-copy',
          path: 'local-fixture://wrn-g3-002/articles-copy.json',
        },
      ],
    };
    const incompleteTeaser = {
      articles: [
        { ...articles.articles[0], teaser: 'Dieser Satz bleibt absichtlich unvollstaendig...' },
      ],
    };

    expect(isLocalManifestV1(httpPath)).toBe(false);
    expect(isLocalManifestV1(duplicatePath)).toBe(false);
    expect(isLocalManifestV1(duplicateArticleSchema)).toBe(false);
    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: { articles: incompleteTeaser, 'supplemental-items': emptyPayload },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Payload entspricht nicht dem deklarierten Schema: articles',
      ]),
    });
  });

  it('fails closed for changed content, missing required payloads and a payload for an absent resource', async () => {
    const manifest = await createCandidate();
    const tamperedArticles = {
      articles: [{ ...articles.articles[0], title: 'Manipulierter Titel' }],
    };

    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: { articles: tamperedArticles, 'supplemental-items': emptyPayload },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['Hashabweichung: articles']),
    });
    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: { 'supplemental-items': emptyPayload },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['Fehlender deklarierter Ressourcenpayload: articles']),
    });
    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: { articles },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Fehlender deklarierter Ressourcenpayload: supplemental-items',
      ]),
    });
    await expect(
      validateLocalManifestIntegrity({
        manifest,
        payloads: {
          articles,
          'supplemental-items': emptyPayload,
          'media-placeholder': emptyPayload,
        },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Optional-abwesente Ressource darf keinen Payload haben: media-placeholder',
      ]),
    });
  });

  it('uses canonical sorting for IDs and object keys', async () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalJson(['b', 'a'])).toBe('["b","a"]');
    expect(await sha256Utf8(canonicalJson(['a', 'b']))).not.toBe(
      await sha256Utf8(canonicalJson(['b', 'a'])),
    );
  });

  it('fails integrity when active IDs are structurally valid but absent from article records', async () => {
    const manifest = await createCandidate();
    const ids = ['wrn-test-art-alpha', 'wrn-test-art-ghost'];
    const changedManifest = {
      ...manifest,
      articleSets: {
        ...manifest.articleSets,
        activeFeedIds: ids,
        archiveIds: ids,
      },
      articleSetHashes: {
        ...manifest.articleSetHashes,
        activeFeedIds: await sha256Utf8(canonicalJson(ids)),
        archiveIds: await sha256Utf8(canonicalJson(ids)),
      },
    };

    expect(isLocalManifestV1(changedManifest)).toBe(true);
    await expect(
      validateLocalManifestIntegrity({
        manifest: changedManifest,
        payloads: { articles, 'supplemental-items': emptyPayload },
      }),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['Archiv-ID-Menge entspricht nicht den Artikelrecords.']),
    });
  });
});
