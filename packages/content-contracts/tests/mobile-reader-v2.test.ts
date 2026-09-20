import { describe, expect, it } from 'vitest';
import {
  mobileReaderV2FragmentSha256,
  mobileReaderV2MaxArticles,
  mobileReaderV2MaxDecodedMediaBytesPerArticle,
  mobileReaderV2MaxIdLength,
  mobileReaderV2MaxMedia,
  mobileReaderV2MaxMediaBytes,
  mobileReaderV2MaxMediaDimension,
  mobileReaderV2MaxMediaPerArticle,
  mobileReaderV2MaxMediaPixels,
  mobileReaderV2MaxTransportBytes,
  mobileReaderV2MaxDecodedJsonBytes,
  mobileReaderV2MaxBlockReferencesPerArticle,
  mobileReaderV2MaxSectionsPerArticle,
  mobileReaderV2Rights,
  validateMobileReaderV2Document as validateMobileReaderV2DocumentContract,
  type MobileReaderV2Document,
  type MobileReaderV2SnapshotIdentity,
} from '../src/mobile-reader-v2.js';
import type { LocalArticle, LocalReaderDetailEntryV1 } from '../src/index.js';

const blocks = [
  { kind: 'paragraph' as const, text: 'Self-authored local block one.' },
  { kind: 'heading' as const, level: 2 as const, text: 'Local heading' },
];
const v1Entries: readonly LocalReaderDetailEntryV1[] = Object.freeze([
  Object.freeze({ articleId: 'wrn-test-article-a', blocks: Object.freeze(blocks) }),
]);
const v1Articles: readonly Pick<LocalArticle, 'id' | 'source'>[] = Object.freeze([
  Object.freeze({
    id: 'wrn-test-article-a',
    source: Object.freeze({ id: 'wrn-test-source-local', name: 'Local fixture source' }),
  }),
]);
const snapshot: MobileReaderV2SnapshotIdentity = Object.freeze({
  releaseRevision: 'wrn-test-release-v1',
  manifestSha256: '1'.repeat(64),
  readerDetailsRevision: 'wrn-test-reader-v1',
  readerDetailsWholeDocumentSha256: '2'.repeat(64),
  readerDetailsIntegritySha256: '3'.repeat(64),
});

async function validDocument(): Promise<MobileReaderV2Document> {
  return {
    contractVersion: '1.0.0',
    schema: 'wrn.mobile-reader-v2.v1',
    revision: 'wrn-test-sidecar-v1',
    snapshot,
    articles: [
      {
        articleId: 'wrn-test-article-a',
        projection: 'structured',
        transformerId: 'wrn-local-reader-v2-transformer',
        transformerVersion: '1.0.0',
        sections: [
          {
            sectionId: 'wrn-v2-section-a',
            blockReferences: [
              {
                blockId: 'wrn-v2-block-a',
                startIndex: 0,
                endIndex: 1,
                sourceFragmentSha256: await mobileReaderV2FragmentSha256(blocks),
              },
            ],
          },
        ],
      },
    ],
    sources: [
      {
        sourceId: 'wrn-test-source-local',
        selfDescription: 'Synthetic local fixture source.',
        editorialContext: 'Only a local contract fixture; no real source claim.',
        sourceType: 'synthetic-fixture',
        regions: ['local-fixture'],
        languages: ['en'],
        freshness: { status: 'unknown', reviewedAt: null },
        correctionContact: null,
      },
    ],
    media: [],
    revocations: { revision: 0, previousRevision: 0, entries: [] },
  };
}

function validMedia(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    mediaId: 'wrn-v2-media-a',
    articleId: 'wrn-test-article-a',
    sectionId: 'wrn-v2-section-a',
    blockId: 'wrn-v2-block-a',
    provenance: 'self-authored',
    rights: mobileReaderV2Rights,
    license: 'fixture',
    attribution: 'fixture',
    delivery: 'self-authored-local-fixture',
    localAssetId: 'wrn-local-asset-a',
    mimeType: 'image/png',
    byteLength: 1,
    width: 1,
    height: 1,
    sha256: '4'.repeat(64),
    revision: 'v1',
    altTextProvenance: 'self-authored',
    altText: 'Self-authored local fixture image.',
    ...overrides,
  };
}

function validateMobileReaderV2Document(
  candidate: unknown,
  expectedSnapshot: MobileReaderV2SnapshotIdentity,
  entries: readonly LocalReaderDetailEntryV1[],
) {
  const articles =
    entries === v1Entries
      ? v1Articles
      : entries.map((entry) => ({
          id: entry.articleId,
          source: { id: 'wrn-test-source-local', name: 'Local fixture source' },
        }));
  return validateMobileReaderV2DocumentContract(candidate, expectedSnapshot, entries, articles);
}

async function documentWithArticleCount(articleCount: number): Promise<{
  readonly document: MobileReaderV2Document;
  readonly entries: readonly LocalReaderDetailEntryV1[];
}> {
  const block = Object.freeze({ kind: 'paragraph' as const, text: 'Local bounded block.' });
  const fragment = await mobileReaderV2FragmentSha256([block]);
  const entries = Array.from({ length: articleCount }, (_, index) =>
    Object.freeze({ articleId: `wrn-bounded-article-${index}`, blocks: Object.freeze([block]) }),
  );
  return {
    entries,
    document: {
      contractVersion: '1.0.0',
      schema: 'wrn.mobile-reader-v2.v1',
      revision: 'wrn-bounded-sidecar',
      snapshot,
      articles: entries.map((entry, index) => ({
        articleId: entry.articleId,
        projection: 'original' as const,
        transformerId: 'wrn-local-reader-v2-transformer',
        transformerVersion: '1.0.0',
        sections: [
          {
            sectionId: `wrn-bounded-section-${index}`,
            blockReferences: [
              {
                blockId: `wrn-bounded-block-${index}`,
                startIndex: 0,
                endIndex: 0,
                sourceFragmentSha256: fragment,
              },
            ],
          },
        ],
      })),
      sources: [
        {
          sourceId: 'wrn-test-source-local',
          selfDescription: 'Synthetic local fixture source.',
          editorialContext: 'Only a local contract fixture; no real source claim.',
          sourceType: 'synthetic-fixture',
          regions: ['local-fixture'],
          languages: ['en'],
          freshness: { status: 'unknown', reviewedAt: null },
          correctionContact: null,
        },
      ],
      media: [],
      revocations: { revision: 0, previousRevision: 0, entries: [] },
    },
  };
}

async function documentWithPartitionedReferences(
  sectionCount: number,
  referenceCount: number,
): Promise<{
  readonly document: MobileReaderV2Document;
  readonly entries: readonly LocalReaderDetailEntryV1[];
}> {
  const localBlocks = Array.from({ length: referenceCount }, (_, index) =>
    Object.freeze({ kind: 'paragraph' as const, text: `Local bounded block ${index}.` }),
  );
  const references = await Promise.all(
    localBlocks.map(async (block, index) => ({
      blockId: `wrn-bounded-block-${index}`,
      startIndex: index,
      endIndex: index,
      sourceFragmentSha256: await mobileReaderV2FragmentSha256([block]),
    })),
  );
  const sections = Array.from({ length: sectionCount }, (_, index) => ({
    sectionId: `wrn-bounded-section-${index}`,
    blockReferences: references.filter(
      (_, referenceIndex) => referenceIndex % sectionCount === index,
    ),
  }));
  const entry = Object.freeze({
    articleId: 'wrn-bounded-article',
    blocks: Object.freeze(localBlocks),
  });
  return {
    entries: [entry],
    document: {
      contractVersion: '1.0.0',
      schema: 'wrn.mobile-reader-v2.v1',
      revision: 'wrn-bounded-sidecar',
      snapshot,
      articles: [
        {
          articleId: entry.articleId,
          projection: 'structured',
          transformerId: 'wrn-local-reader-v2-transformer',
          transformerVersion: '1.0.0',
          sections,
        },
      ],
      sources: [
        {
          sourceId: 'wrn-test-source-local',
          selfDescription: 'Synthetic local fixture source.',
          editorialContext: 'Only a local contract fixture; no real source claim.',
          sourceType: 'synthetic-fixture',
          regions: ['local-fixture'],
          languages: ['en'],
          freshness: { status: 'unknown', reviewedAt: null },
          correctionContact: null,
        },
      ],
      media: [],
      revocations: { revision: 0, previousRevision: 0, entries: [] },
    },
  };
}

describe('mobile reader v2 atomic contract', () => {
  it('accepts a complete stable exact-cover projection', async () => {
    await expect(
      validateMobileReaderV2Document(await validDocument(), snapshot, v1Entries),
    ).resolves.toMatchObject({
      document: { revision: 'wrn-test-sidecar-v1' },
    });
  });

  it.each([
    ['gap', 1, 1],
    ['duplicate', 0, 0],
    ['out-of-order', 1, 1],
  ] as const)('fails closed for an exact-cover %s', async (kind, start, end) => {
    const document = await validDocument();
    const reference = document.articles[0]!.sections[0]!.blockReferences[0]!;
    const extra = {
      blockId: `wrn-v2-block-${kind}`,
      startIndex: start,
      endIndex: end,
      sourceFragmentSha256: await mobileReaderV2FragmentSha256(blocks.slice(start, end + 1)),
    };
    const refs =
      kind === 'gap'
        ? [
            {
              ...reference,
              endIndex: 0,
              sourceFragmentSha256: await mobileReaderV2FragmentSha256(blocks.slice(0, 1)),
            },
          ]
        : kind === 'duplicate'
          ? [reference, extra]
          : [
              extra,
              {
                ...reference,
                endIndex: 0,
                sourceFragmentSha256: await mobileReaderV2FragmentSha256(blocks.slice(0, 1)),
              },
            ];
    const candidate = {
      ...document,
      articles: [
        {
          ...document.articles[0]!,
          sections: [{ ...document.articles[0]!.sections[0]!, blockReferences: refs }],
        },
      ],
    };
    await expect(
      validateMobileReaderV2Document(candidate, snapshot, v1Entries),
    ).resolves.toBeNull();
  });

  it('rejects a snapshot mismatch, non-stable heuristic ID, and incomplete v1 article set', async () => {
    const document = await validDocument();
    await expect(
      validateMobileReaderV2Document(
        { ...document, snapshot: { ...snapshot, releaseRevision: 'other' } },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        { ...document, articles: [{ ...document.articles[0]!, articleId: 'text-derived-id' }] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document({ ...document, articles: [] }, snapshot, v1Entries),
    ).resolves.toBeNull();
  });

  it('allows an explicit rejected article only as a v1 fallback marker', async () => {
    const document = await validDocument();
    const rejected = {
      ...document,
      articles: [
        {
          articleId: 'wrn-test-article-a',
          projection: 'rejected' as const,
          transformerId: 'wrn-local-reader-v2-transformer',
          transformerVersion: '1.0.0',
          sections: [],
        },
      ],
    };
    await expect(
      validateMobileReaderV2Document(rejected, snapshot, v1Entries),
    ).resolves.toMatchObject({ document: { articles: [{ projection: 'rejected' }] } });
    await expect(
      validateMobileReaderV2Document(
        { ...rejected, media: [{ mediaId: 'media', articleId: 'wrn-test-article-a' }] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        { ...document, sources: [document.sources[0]!, document.sources[0]!] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          sources: [
            {
              ...document.sources[0]!,
              languages: ['zz', 'aa'],
              regions: ['local-fixture', 'local-fixture'],
            },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('requires transform provenance and rejects article-wide duplicate block anchors', async () => {
    const document = await validDocument();
    const article = document.articles[0]!;
    const withoutTransformer = { ...article } as Record<string, unknown>;
    delete withoutTransformer.transformerVersion;
    await expect(
      validateMobileReaderV2Document(
        { ...document, articles: [withoutTransformer] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    const split = await mobileReaderV2FragmentSha256(blocks.slice(0, 1));
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          articles: [
            {
              ...article,
              sections: [
                {
                  sectionId: 'wrn-v2-section-first',
                  blockReferences: [
                    {
                      blockId: 'wrn-v2-block-duplicate',
                      startIndex: 0,
                      endIndex: 0,
                      sourceFragmentSha256: split,
                    },
                  ],
                },
                {
                  sectionId: 'wrn-v2-section-second',
                  blockReferences: [
                    {
                      blockId: 'wrn-v2-block-duplicate',
                      startIndex: 1,
                      endIndex: 1,
                      sourceFragmentSha256: await mobileReaderV2FragmentSha256(blocks.slice(1)),
                    },
                  ],
                },
              ],
            },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('requires exact transformer identities and rejects article shape drift', async () => {
    const document = await validDocument();
    const article = document.articles[0] as unknown as Record<string, unknown>;
    const invalidIdentity = {
      missing: undefined,
      blank: '',
      invalidCharacters: 'wrn reader',
      tooLong: 'a'.repeat(mobileReaderV2MaxIdLength + 1),
    } as const;
    for (const transformer of ['transformerId', 'transformerVersion'] as const) {
      for (const [, value] of Object.entries(invalidIdentity) as Array<
        [keyof typeof invalidIdentity, string | undefined]
      >) {
        const mutatedArticle = { ...article } as Record<string, unknown>;
        if (value === undefined) {
          delete mutatedArticle[transformer];
        } else {
          mutatedArticle[transformer] = value;
        }
        await expect(
          validateMobileReaderV2Document(
            { ...document, articles: [{ ...mutatedArticle }] },
            snapshot,
            v1Entries,
          ),
        ).resolves.toBeNull();
      }
    }
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          articles: [{ ...article, unexpected: 'extra' }],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('fails closed for malformed predecessor relation and source-profile exact cover', async () => {
    const document = await validDocument();
    const section = document.articles[0]!.sections[0]!;
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          articles: [
            {
              ...document.articles[0]!,
              sections: [
                {
                  ...section,
                  predecessor: {
                    articleId: 'wrn-test-article-a',
                    beforeBlockId: section.blockReferences[0]!.blockId,
                    sourceFragmentSha256: section.blockReferences[0]!.sourceFragmentSha256,
                    label: 'Prior local fixture',
                  },
                },
              ],
            },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document({ ...document, sources: [] }, snapshot, v1Entries),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          sources: [
            ...document.sources,
            { ...document.sources[0]!, sourceId: 'wrn-test-source-extra' },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('accepts a non-self predecessor with its current-section anchor and validates source freshness', async () => {
    const document = await validDocument();
    const predecessorBlock = Object.freeze({
      kind: 'paragraph' as const,
      text: 'Prior local fixture.',
    });
    const predecessorEntry = Object.freeze({
      articleId: 'wrn-test-article-predecessor',
      blocks: Object.freeze([predecessorBlock]),
    });
    const predecessorArticle = {
      articleId: predecessorEntry.articleId,
      projection: 'original' as const,
      transformerId: 'wrn-local-reader-v2-transformer',
      transformerVersion: '1.0.0',
      sections: [
        {
          sectionId: 'wrn-v2-section-predecessor',
          blockReferences: [
            {
              blockId: 'wrn-v2-block-predecessor',
              startIndex: 0,
              endIndex: 0,
              sourceFragmentSha256: await mobileReaderV2FragmentSha256([predecessorBlock]),
            },
          ],
        },
      ],
    };
    const current = document.articles[0]!;
    const anchored = {
      ...current,
      sections: [
        {
          ...current.sections[0]!,
          predecessor: {
            articleId: predecessorEntry.articleId,
            beforeBlockId: current.sections[0]!.blockReferences[0]!.blockId,
            sourceFragmentSha256: current.sections[0]!.blockReferences[0]!.sourceFragmentSha256,
            label: 'Earlier fixture entry',
          },
        },
      ],
    };
    const entries = [...v1Entries, predecessorEntry];
    const result = await validateMobileReaderV2Document(
      {
        ...document,
        articles: [anchored, predecessorArticle],
        sources: [
          {
            ...document.sources[0]!,
            freshness: { status: 'current', reviewedAt: '2026-08-31T00:00:00.000Z' },
            correctionContact: { label: 'Fixture contact', value: 'Local fixture only' },
          },
        ],
      },
      snapshot,
      entries,
    );
    expect(result).not.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          sources: [
            { ...document.sources[0]!, freshness: { status: 'current', reviewedAt: null } },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('enforces article, ID and media hard caps fail-closed', async () => {
    const document = await validDocument();
    const oversizedId = 'a'.repeat(mobileReaderV2MaxIdLength + 1);
    await expect(
      validateMobileReaderV2Document({ ...document, revision: oversizedId }, snapshot, v1Entries),
    ).resolves.toBeNull();
    const tooMany = Array.from(
      { length: mobileReaderV2MaxArticles + 1 },
      () => document.articles[0]!,
    );
    await expect(
      validateMobileReaderV2Document({ ...document, articles: tooMany }, snapshot, v1Entries),
    ).resolves.toBeNull();
    const invalidMedia = {
      mediaId: 'wrn-v2-media-a',
      articleId: 'wrn-test-article-a',
      sectionId: 'wrn-v2-section-a',
      blockId: 'wrn-v2-block-a',
      provenance: 'self-authored',
      rights: mobileReaderV2Rights,
      license: 'fixture',
      attribution: 'fixture',
      delivery: 'self-authored-local-fixture',
      localAssetId: 'wrn-local-asset-a',
      mimeType: 'image/png',
      byteLength: mobileReaderV2MaxMediaBytes + 1,
      width: 1,
      height: 1,
      sha256: '4'.repeat(64),
      revision: 'v1',
      altTextProvenance: 'self-authored',
    };
    await expect(
      validateMobileReaderV2Document({ ...document, media: [invalidMedia] }, snapshot, v1Entries),
    ).resolves.toBeNull();
  });

  it.each([-1, 0, 1] as const)('enforces opaque ID length at limit %+d', async (delta) => {
    const document = await validDocument();
    const result = await validateMobileReaderV2Document(
      { ...document, revision: 'a'.repeat(mobileReaderV2MaxIdLength + delta) },
      snapshot,
      v1Entries,
    );
    expect(result === null).toBe(delta > 0);
  });

  it.each([-1, 0, 1] as const)('enforces individual media bytes at limit %+d', async (delta) => {
    const document = await validDocument();
    const result = await validateMobileReaderV2Document(
      {
        ...document,
        media: [validMedia({ byteLength: mobileReaderV2MaxMediaBytes + delta })],
      },
      snapshot,
      v1Entries,
    );
    expect(result === null).toBe(delta > 0);
  });

  it.each([-1, 0, 1] as const)(
    'enforces aggregate media bytes per article at limit %+d',
    async (delta) => {
      const document = await validDocument();
      const media = [
        validMedia({ mediaId: 'wrn-v2-media-a', byteLength: mobileReaderV2MaxMediaBytes }),
        validMedia({ mediaId: 'wrn-v2-media-b', byteLength: mobileReaderV2MaxMediaBytes }),
        validMedia({ mediaId: 'wrn-v2-media-c', byteLength: mobileReaderV2MaxMediaBytes }),
        validMedia({
          mediaId: 'wrn-v2-media-d',
          byteLength: mobileReaderV2MaxMediaBytes + Math.min(delta, 0),
        }),
      ];
      if (delta > 0) media.push(validMedia({ mediaId: 'wrn-v2-media-e', byteLength: delta }));
      const result = await validateMobileReaderV2Document(
        { ...document, media },
        snapshot,
        v1Entries,
      );
      expect(result === null).toBe(delta > 0);
    },
  );

  it.each([-1, 0, 1] as const)('enforces the article cap at limit %+d', async (delta) => {
    const fixture = await documentWithArticleCount(mobileReaderV2MaxArticles + delta);
    const result = await validateMobileReaderV2Document(
      fixture.document,
      snapshot,
      fixture.entries,
    );
    expect(result === null).toBe(delta > 0);
  });

  it.each([
    ['sections', mobileReaderV2MaxSectionsPerArticle],
    ['block references', mobileReaderV2MaxBlockReferencesPerArticle],
  ] as const)('enforces %s at their three discrete boundaries', async (_, limit) => {
    for (const delta of [-1, 0, 1] as const) {
      const count = limit + delta;
      const sections = limit === mobileReaderV2MaxSectionsPerArticle ? count : 1;
      const references = limit === mobileReaderV2MaxBlockReferencesPerArticle ? count : count;
      const fixture = await documentWithPartitionedReferences(sections, references);
      const result = await validateMobileReaderV2Document(
        fixture.document,
        snapshot,
        fixture.entries,
      );
      expect(result === null).toBe(delta > 0);
    }
  });

  it.each([-1, 0, 1] as const)('enforces per-article media count at limit %+d', async (delta) => {
    const document = await validDocument();
    const media = Array.from({ length: mobileReaderV2MaxMediaPerArticle + delta }, (_, index) =>
      validMedia({ mediaId: `wrn-v2-media-${index}`, localAssetId: `wrn-local-asset-${index}` }),
    );
    const result = await validateMobileReaderV2Document(
      { ...document, media },
      snapshot,
      v1Entries,
    );
    expect(result === null).toBe(delta > 0);
  });

  it('enforces the sidecar media cap at limit minus one, limit, and limit plus one', async () => {
    for (const delta of [-1, 0, 1] as const) {
      const articleCount = Math.ceil(
        (mobileReaderV2MaxMedia + delta) / mobileReaderV2MaxMediaPerArticle,
      );
      const fixture = await documentWithArticleCount(articleCount);
      const media = Array.from({ length: mobileReaderV2MaxMedia + delta }, (_, index) => {
        const articleIndex = Math.floor(index / mobileReaderV2MaxMediaPerArticle);
        return validMedia({
          mediaId: `wrn-v2-media-${index}`,
          localAssetId: `wrn-local-asset-${index}`,
          articleId: `wrn-bounded-article-${articleIndex}`,
          sectionId: `wrn-bounded-section-${articleIndex}`,
          blockId: `wrn-bounded-block-${articleIndex}`,
        });
      });
      const result = await validateMobileReaderV2Document(
        { ...fixture.document, media },
        snapshot,
        fixture.entries,
      );
      expect(result === null).toBe(delta > 0);
    }
  });

  it('admits only self-authored local fixture media with an opaque local asset identifier', async () => {
    const document = await validDocument();
    await expect(
      validateMobileReaderV2Document({ ...document, media: [validMedia()] }, snapshot, v1Entries),
    ).resolves.toMatchObject({ mediaById: expect.any(Map) });
    for (const rights of ['denied', 'missing', 'remote', 'unknown']) {
      await expect(
        validateMobileReaderV2Document(
          { ...document, media: [validMedia({ rights })] },
          snapshot,
          v1Entries,
        ),
      ).resolves.toBeNull();
    }
    const absentRights = validMedia();
    delete absentRights.rights;
    await expect(
      validateMobileReaderV2Document({ ...document, media: [absentRights] }, snapshot, v1Entries),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        { ...document, media: [{ ...validMedia(), unexpected: 'value' }] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    for (const localAssetId of [
      undefined,
      '/assets/fixture.png',
      'https://example.invalid/fixture.png',
      'wrn-local-asset-a?query=1',
      'wrn-local-asset-' + 'a'.repeat(mobileReaderV2MaxIdLength),
    ]) {
      const media = validMedia({ localAssetId });
      if (localAssetId === undefined) delete media.localAssetId;
      await expect(
        validateMobileReaderV2Document({ ...document, media: [media] }, snapshot, v1Entries),
      ).resolves.toBeNull();
    }
    for (const localAssetSuffixLength of [111, 112, 113]) {
      const result = await validateMobileReaderV2Document(
        {
          ...document,
          media: [
            validMedia({ localAssetId: `wrn-local-asset-${'a'.repeat(localAssetSuffixLength)}` }),
          ],
        },
        snapshot,
        v1Entries,
      );
      expect(result === null).toBe(localAssetSuffixLength > 112);
    }
    await expect(
      validateMobileReaderV2Document(
        { ...document, media: [validMedia({ delivery: 'remote' })] },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['at-cap', 'a'.repeat(1024)],
    ['over-cap', 'a'.repeat(1025)],
  ] as const)('enforces media alt text %s', async (_, altText) => {
    const document = await validDocument();
    const media = validMedia({ altText });
    if (altText === undefined) delete media.altText;
    await expect(
      validateMobileReaderV2Document({ ...document, media: [media] }, snapshot, v1Entries),
    ).resolves.toSatisfy((value) =>
      altText === 'a'.repeat(1024) ? value !== null : value === null,
    );
  });

  it('fails closed for every malformed predecessor variant and source-profile relation', async () => {
    const document = await validDocument();
    const section = document.articles[0]!.sections[0]!;
    const predecessorBlock = Object.freeze({
      kind: 'paragraph' as const,
      text: 'Prior local fixture block.',
    });
    const predecessorFragmentSha256 = await mobileReaderV2FragmentSha256([predecessorBlock]);
    const validPredecessor = {
      articleId: 'wrn-test-article-predecessor',
      beforeBlockId: section.blockReferences[0]!.blockId,
      sourceFragmentSha256: section.blockReferences[0]!.sourceFragmentSha256,
      label: 'Prior local fixture',
    };
    const predecessorArticle = {
      articleId: 'wrn-test-article-predecessor',
      projection: 'original' as const,
      transformerId: 'wrn-local-reader-v2-transformer',
      transformerVersion: '1.0.0',
      sections: [
        {
          sectionId: 'wrn-v2-section-predecessor',
          blockReferences: [
            {
              blockId: 'wrn-v2-block-predecessor',
              startIndex: 0,
              endIndex: 0,
              sourceFragmentSha256: predecessorFragmentSha256,
            },
          ],
        },
      ],
    };
    const validCandidate = {
      ...document,
      articles: [
        {
          ...document.articles[0]!,
          sections: [{ ...section, predecessor: validPredecessor }],
        },
        predecessorArticle,
      ],
    };
    const validEntries = [
      ...v1Entries,
      { articleId: predecessorArticle.articleId, blocks: [predecessorBlock] },
    ];
    const validArticles = [
      ...v1Articles,
      {
        id: predecessorArticle.articleId,
        source: { id: 'wrn-test-source-local', name: 'Local fixture source' },
      },
    ];
    await expect(
      validateMobileReaderV2DocumentContract(validCandidate, snapshot, validEntries, validArticles),
    ).resolves.not.toBeNull();

    for (const malformed of [
      { ...validPredecessor, articleId: 'wrn-test-article-a' },
      { ...validPredecessor, articleId: 'missing-article-id' },
      { ...validPredecessor, beforeBlockId: 'missing-block' },
      {
        ...validPredecessor,
        sourceFragmentSha256: 'b'.repeat(64),
      },
      { ...validPredecessor, label: '' },
      { ...validPredecessor, label: 'a'.repeat(257) },
      { ...validPredecessor, unexpected: 'value' } as Record<string, unknown>,
    ] as const) {
      const anchored = {
        ...section,
        predecessor: malformed as unknown as NonNullable<(typeof section)['predecessor']>,
      };
      const candidate = {
        ...document,
        articles: [
          {
            ...document.articles[0]!,
            sections: [anchored],
          },
          predecessorArticle,
        ],
      };
      await expect(
        validateMobileReaderV2DocumentContract(candidate, snapshot, validEntries, validArticles),
      ).resolves.toBeNull();
    }

    const baselineSource = document.sources[0]!;
    await expect(
      validateMobileReaderV2Document(
        { ...document, sources: [baselineSource] },
        snapshot,
        v1Entries,
      ),
    ).resolves.not.toBeNull();
    const mutatedSourceProfiles: readonly Record<string, unknown>[] = [
      { ...document.sources[0], sourceId: 'missing-??' } as Record<string, unknown>,
      { ...document.sources[0], sourceId: 'wrn-test-source-alt' } as Record<string, unknown>,
      { ...document.sources[0], selfDescription: '' } as Record<string, unknown>,
      { ...document.sources[0], selfDescription: 'a'.repeat(2049) } as Record<string, unknown>,
      { ...document.sources[0], editorialContext: '' } as Record<string, unknown>,
      { ...document.sources[0], editorialContext: 'a'.repeat(2049) } as Record<string, unknown>,
      { ...document.sources[0], sourceType: '' } as Record<string, unknown>,
      { ...document.sources[0], sourceType: 'a'.repeat(129) } as Record<string, unknown>,
      { ...document.sources[0], regions: [] } as Record<string, unknown>,
      { ...document.sources[0], regions: ['zz', 'aa'] } as Record<string, unknown>,
      { ...document.sources[0], regions: ['local-fixture', 'local-fixture'] } as Record<
        string,
        unknown
      >,
      { ...document.sources[0], languages: [] } as Record<string, unknown>,
      { ...document.sources[0], languages: ['zz', 'aa'] } as Record<string, unknown>,
      { ...document.sources[0], languages: ['en', 'en'] } as Record<string, unknown>,
      { ...document.sources[0], freshness: { status: 'current', reviewedAt: null } },
      {
        ...document.sources[0],
        freshness: { status: 'unknown', reviewedAt: '2026-08-31T00:00:00.000Z' },
      },
      { ...document.sources[0], freshness: { status: 'stale', reviewedAt: null } },
      { ...document.sources[0], freshness: { status: 'invalid', reviewedAt: null } },
      { ...document.sources[0], correctionContact: { label: 'x' } },
      { ...document.sources[0], correctionContact: { label: '', value: 'Contact' } },
      { ...document.sources[0], correctionContact: { label: 'Contact', value: '' } },
      { ...document.sources[0], correctionContact: { label: 'a'.repeat(257), value: 'Contact' } },
      { ...document.sources[0], correctionContact: { label: 'Contact', value: 'a'.repeat(257) } },
      {
        ...document.sources[0],
        correctionContact: {
          label: 'fixture',
          value: 'value',
          unexpected: 'extra',
        } as Record<string, unknown>,
      } as Record<string, unknown>,
    ];
    for (const sourceProfile of mutatedSourceProfiles) {
      await expect(
        validateMobileReaderV2Document(
          { ...document, sources: [sourceProfile as Record<string, unknown>] },
          snapshot,
          v1Entries,
        ),
      ).resolves.toBeNull();
    }
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          sources: [
            document.sources[0]!,
            { ...document.sources[0]!, sourceId: document.sources[0]!.sourceId },
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });

  it('fails closed when per-article media aggregate or image caps cross their direct limits', async () => {
    const document = await validDocument();
    const atAggregateLimit = [
      validMedia({ mediaId: 'wrn-v2-media-a', byteLength: mobileReaderV2MaxMediaBytes }),
      validMedia({ mediaId: 'wrn-v2-media-b', byteLength: mobileReaderV2MaxMediaBytes }),
      validMedia({ mediaId: 'wrn-v2-media-c', byteLength: mobileReaderV2MaxMediaBytes }),
      validMedia({ mediaId: 'wrn-v2-media-d', byteLength: mobileReaderV2MaxMediaBytes }),
    ];
    await expect(
      validateMobileReaderV2Document({ ...document, media: atAggregateLimit }, snapshot, v1Entries),
    ).resolves.toMatchObject({ document: { media: { length: 4 } } });
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          media: [...atAggregateLimit, validMedia({ mediaId: 'wrn-v2-media-e', byteLength: 1 })],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    for (const candidate of [
      validMedia({ width: mobileReaderV2MaxMediaDimension + 1 }),
      validMedia({ height: mobileReaderV2MaxMediaDimension + 1 }),
      validMedia({
        width: mobileReaderV2MaxMediaDimension,
        height: mobileReaderV2MaxMediaDimension + 1,
      }),
      validMedia({
        width: mobileReaderV2MaxMediaDimension,
        height: mobileReaderV2MaxMediaDimension,
      }),
      validMedia({ width: 1, height: mobileReaderV2MaxMediaPixels + 1 }),
    ]) {
      const expected =
        candidate.width === mobileReaderV2MaxMediaDimension &&
        candidate.height === mobileReaderV2MaxMediaDimension;
      await expect(
        validateMobileReaderV2Document({ ...document, media: [candidate] }, snapshot, v1Entries),
      ).resolves.toSatisfy((value) => (expected ? value !== null : value === null));
    }
    expect(mobileReaderV2MaxDecodedMediaBytesPerArticle).toBe(1024 * 1024);
  });

  it.each([2047, 2048, 2049] as const)(
    'enforces the width cap at %d with height fixed at one',
    async (width) => {
      const document = await validDocument();
      const result = await validateMobileReaderV2Document(
        { ...document, media: [validMedia({ width, height: 1 })] },
        snapshot,
        v1Entries,
      );
      expect(result === null).toBe(width > mobileReaderV2MaxMediaDimension);
    },
  );

  it.each([2047, 2048, 2049] as const)(
    'enforces the height cap at %d with width fixed at one',
    async (height) => {
      const document = await validDocument();
      const result = await validateMobileReaderV2Document(
        { ...document, media: [validMedia({ width: 1, height })] },
        snapshot,
        v1Entries,
      );
      expect(result === null).toBe(height > mobileReaderV2MaxMediaDimension);
    },
  );

  it('binds the redundant media-pixel invariant and its reachable equal maximum', async () => {
    expect(mobileReaderV2MaxTransportBytes).toBe(mobileReaderV2MaxDecodedJsonBytes);
    expect(mobileReaderV2MaxMediaPixels).toBe(mobileReaderV2MaxMediaDimension ** 2);
    const document = await validDocument();
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          media: [
            validMedia({
              width: mobileReaderV2MaxMediaDimension,
              height: mobileReaderV2MaxMediaDimension,
            }),
          ],
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.not.toBeNull();
  });

  it('rejects unsupported root schema/version variants and unknown top-level keys', async () => {
    const document = await validDocument();
    await expect(
      validateMobileReaderV2Document(
        { ...document, contractVersion: '0.0.9' },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        { ...document, contractVersion: '2.0.0' },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        { ...document, schema: 'wrn.mobile-reader-v2.v99' as const },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
    await expect(
      validateMobileReaderV2Document(
        {
          ...document,
          ...(Object.fromEntries([['unexpectedTopLevelKey', 'value']]) as Record<string, unknown>),
        },
        snapshot,
        v1Entries,
      ),
    ).resolves.toBeNull();
  });
});
