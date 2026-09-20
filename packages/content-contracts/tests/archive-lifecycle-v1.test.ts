import { describe, expect, it } from 'vitest';

import {
  archiveLifecycleIntegrityPayload,
  canonicalJson,
  isLocalArchiveLifecycleV1,
  localArchiveLifecycleContractVersion,
  localArchiveLifecycleSchema,
  localReaderDetailsContractVersion,
  localReaderDetailsSchema,
  readerDetailsIntegrityPayload,
  sha256Utf8,
  validateLocalArchiveLifecycleV1,
} from '../src/index.js';

const article = {
  id: 'wrn-test-art-alpha',
  title: 'Local lifecycle article',
  teaser: 'This self-authored article is used only for lifecycle contract tests.',
  publishedAt: '2026-08-25T10:00:00.000Z',
  originalUrl: 'https://fixture.invalid/articles/lifecycle-alpha',
  source: { id: 'wrn-test-source-lifecycle', name: 'Local lifecycle fixture' },
  originalLanguage: 'en',
  tags: ['fixture'],
  rights: { status: 'fixture-authored', reference: 'wrn-g3-008-contract-test' },
  transformation: { status: 'original' as const, reference: 'self-authored-fixture' },
  translation: { status: 'not-requested' as const, reference: 'not-requested' },
};

async function createLifecycleCandidate() {
  const detailsBase = {
    contractVersion: localReaderDetailsContractVersion,
    schema: localReaderDetailsSchema,
    revision: 'wrn-g3-008-contract-test-reader-v1',
    entries: [
      {
        articleId: article.id,
        blocks: [{ kind: 'paragraph' as const, text: 'Self-authored local lifecycle text.' }],
      },
    ],
  };
  const details = {
    ...detailsBase,
    integritySha256: await sha256Utf8(canonicalJson(readerDetailsIntegrityPayload(detailsBase))),
  };
  const base = {
    contractVersion: localArchiveLifecycleContractVersion,
    schema: localArchiveLifecycleSchema,
    revision: 'wrn-g3-008-contract-test-v1',
    sourceContent: {
      articlePayloadSha256: await sha256Utf8(canonicalJson({ articles: [article] })),
      readerDetailsRevision: details.revision,
      readerDetailsIntegritySha256: details.integritySha256,
    },
    activeArticleIds: [article.id],
    archiveArticleIds: [article.id],
    shareableArticleIds: [article.id],
    aliases: [{ sourceId: 'wrn-test-art-old-alpha', targetId: article.id }],
    gone: [{ id: 'wrn-test-art-gone', category: 'removed' as const }],
    revocations: {
      revision: 2,
      previousRevision: 1,
      entries: [
        {
          id: 'wrn-test-art-revoked',
          status: 'blocked' as const,
          category: 'rights-or-safety' as const,
        },
      ],
    },
  };
  const lifecycle = {
    ...base,
    integritySha256: await sha256Utf8(canonicalJson(archiveLifecycleIntegrityPayload(base))),
  };
  return { lifecycle, details };
}

describe('WRN-G3-008 local archive lifecycle contract', () => {
  it('binds active and historical sets, aliases, safe unavailable states and a monotone revocation', async () => {
    const { lifecycle, details } = await createLifecycleCandidate();

    expect(isLocalArchiveLifecycleV1(lifecycle)).toBe(true);
    await expect(
      validateLocalArchiveLifecycleV1(lifecycle, [article], details, 2),
    ).resolves.toEqual({
      ok: true,
      errors: [],
      archiveArticleIds: [article.id],
      revocationRevision: 2,
    });
  });

  it('fails closed for alias cycles, self aliases, unknown targets, duplicate sources and unavailable payload IDs', async () => {
    const { lifecycle } = await createLifecycleCandidate();
    const invalidCandidates = [
      { ...lifecycle, aliases: [{ sourceId: article.id, targetId: article.id }] },
      {
        ...lifecycle,
        aliases: [{ sourceId: 'wrn-test-art-old-alpha', targetId: 'wrn-test-art-unknown' }],
      },
      {
        ...lifecycle,
        aliases: [
          { sourceId: 'wrn-test-art-old-alpha', targetId: article.id },
          { sourceId: 'wrn-test-art-old-alpha', targetId: article.id },
        ],
      },
      {
        ...lifecycle,
        aliases: [
          { sourceId: 'wrn-test-art-old-alpha', targetId: 'wrn-test-art-other-alias' },
          { sourceId: 'wrn-test-art-other-alias', targetId: 'wrn-test-art-old-alpha' },
        ],
      },
      { ...lifecycle, archiveArticleIds: [article.id, 'wrn-test-art-revoked'] },
    ];

    for (const candidate of invalidCandidates) {
      expect(isLocalArchiveLifecycleV1(candidate)).toBe(false);
    }
  });

  it('rejects hash drift and a lower revocation revision before any client may resolve content', async () => {
    const { lifecycle, details } = await createLifecycleCandidate();

    await expect(
      validateLocalArchiveLifecycleV1(
        { ...lifecycle, integritySha256: '0'.repeat(64) },
        [article],
        details,
      ),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining(['Archiv-Lifecycle-Hashabweichung.']),
    });
    await expect(
      validateLocalArchiveLifecycleV1(lifecycle, [article], details, 3),
    ).resolves.toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Archiv-Lifecycle liefert eine niedrigere Revocationrevision.',
      ]),
    });
  });
});
