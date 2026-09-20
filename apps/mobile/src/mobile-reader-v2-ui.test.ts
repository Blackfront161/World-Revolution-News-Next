import { render, screen, waitFor } from '@testing-library/react';
import { createElement as h } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { englishUiCopy } from '@wrn/ui-language';
import type { LocalArticle, LocalReaderDetailEntryV1 } from '@wrn/content-contracts';
import type {
  MobileReaderV2SnapshotIdentity,
  MobileReaderV2ValidatedDocument,
} from '@wrn/content-contracts/mobile-reader-v2';
import { emptyMobileReaderV2MediaSafetyLedger } from './mobile-reader-v2-media-safety';
import { mobileReaderV2BuildPin } from './mobile-reader-v2';
import { loadMobileReaderV2 } from './mobile-reader-v2';
import { MobileReaderV2Presentation } from './mobile-reader-v2-ui';
import rawSidecar from '../public/wrn-mobile-reader-v2/v1/mobile-reader-v2.json?raw';
import readerDetails from '../public/wrn-local-release/v1/reader-details.json';
import articles from '../public/wrn-local-release/v1/articles.json';

const article: LocalArticle = {
  id: 'article-a',
  title: 'Fixture title',
  teaser: 'Fixture teaser',
  publishedAt: '2026-08-31T00:00:00.000Z',
  originalUrl: 'https://fixture.invalid/article-a',
  source: { id: 'source-a', name: 'Fixture source' },
  originalLanguage: 'en',
  tags: [],
  rights: { status: 'fixture-authored-no-third-party-media', reference: 'fixture' },
  transformation: { status: 'original', reference: 'fixture' },
  translation: { status: 'not-requested', reference: 'fixture' },
};
const detail: LocalReaderDetailEntryV1 = {
  articleId: article.id,
  blocks: [{ kind: 'paragraph', text: 'Original block stays visible.' }],
};
const sidecar = {
  document: {
    snapshot: mobileReaderV2BuildPin.snapshot,
    articles: [
      {
        articleId: article.id,
        projection: 'ambiguous',
        transformerId: 'fixture',
        transformerVersion: '1',
        sections: [
          {
            sectionId: 'section-a',
            blockReferences: [
              {
                blockId: 'block-a',
                startIndex: 0,
                endIndex: 0,
                sourceFragmentSha256: 'a'.repeat(64),
              },
            ],
          },
        ],
      },
    ],
    sources: [
      {
        sourceId: article.source.id,
        selfDescription: 'Self authored fixture',
        editorialContext: 'Test-only editorial context',
        sourceType: 'fixture',
        regions: ['local'],
        languages: ['en'],
        freshness: { status: 'unknown', reviewedAt: null },
        correctionContact: null,
      },
    ],
    media: [
      {
        mediaId: 'media-a',
        articleId: article.id,
        sectionId: 'section-a',
        blockId: 'block-a',
        provenance: 'fixture',
        rights: 'self-authored-local-fixture',
        license: 'fixture',
        attribution: 'fixture',
        delivery: 'self-authored-local-fixture',
        localAssetId: 'wrn-local-asset-missing',
        mimeType: 'image/png',
        byteLength: 1,
        width: 1,
        height: 1,
        sha256: 'b'.repeat(64),
        revision: '1',
        altTextProvenance: 'fixture',
        altText: 'Fixture image',
      },
    ],
  },
  mediaById: new Map(),
} as unknown as MobileReaderV2ValidatedDocument;

function snapshotWith(
  field: keyof MobileReaderV2SnapshotIdentity,
  value = 'mismatch',
): MobileReaderV2SnapshotIdentity {
  return { ...mobileReaderV2BuildPin.snapshot, [field]: value };
}

function renderPresentation(
  overrides: Partial<Parameters<typeof MobileReaderV2Presentation>[0]> = {},
) {
  return render(
    h(MobileReaderV2Presentation, {
      article,
      detail,
      sidecar,
      snapshot: mobileReaderV2BuildPin.snapshot,
      targetLanguage: 'de',
      copy: englishUiCopy,
      isOffline: false,
      translationAdapter: null,
      mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      ...overrides,
    }),
  );
}

describe('MobileReaderV2Presentation', () => {
  it('accepts the byte-exact packaged sidecar with the production pin', async () => {
    const result = await loadMobileReaderV2({
      pin: mobileReaderV2BuildPin,
      snapshot: mobileReaderV2BuildPin.snapshot,
      v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
      v1Articles: articles.articles as unknown as readonly Pick<LocalArticle, 'id' | 'source'>[],
      signal: new AbortController().signal,
      request: async () =>
        new Response(rawSidecar, { status: 200, headers: { 'content-type': 'application/json' } }),
    });
    expect(result.kind).toBe('ready');
  });

  it('keeps original text, declares ambiguity, and renders only a bound blocked-media placeholder', async () => {
    const user = userEvent.setup();
    renderPresentation();
    expect(screen.getByText('Original block stays visible.')).toBeVisible();
    expect(screen.getByText(englishUiCopy.readerV2Ambiguous)).toBeVisible();
    expect(screen.getByText(englishUiCopy.readerV2MediaUnavailable)).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
    await user.click(screen.getByRole('button', { name: englishUiCopy.readerV2TranslateBlock }));
    expect(screen.getByText(englishUiCopy.readerV2TranslationDisabled)).toBeVisible();
    await user.click(screen.getByText(englishUiCopy.readerV2SourceProfile));
    expect(screen.getByText('Self authored fixture')).toBeVisible();
    expect(screen.getByText('Test-only editorial context')).toBeVisible();
  });

  it.each([
    'releaseRevision',
    'manifestSha256',
    'readerDetailsRevision',
    'readerDetailsWholeDocumentSha256',
    'readerDetailsIntegritySha256',
  ] as const)('fails closed when the sidecar differs in %s', (field) => {
    renderPresentation({ snapshot: snapshotWith(field) });

    expect(screen.getByText('Original block stays visible.')).toBeVisible();
    expect(document.querySelector('[data-reader-v2="fallback"]')).not.toBeNull();
    expect(document.querySelector('.reader-v2-section')).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2Ambiguous)).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2MediaUnavailable)).toBeNull();
    expect(screen.queryByRole('button', { name: englishUiCopy.readerV2TranslateBlock })).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2SourceProfile)).toBeNull();
  });

  it('uses new v1 text synchronously for A to B, A/B/A, activation, and rollback', () => {
    const detailB: LocalReaderDetailEntryV1 = {
      articleId: article.id,
      blocks: [{ kind: 'paragraph', text: 'Snapshot B original text.' }],
    };
    const snapshotB = snapshotWith('releaseRevision', 'release-b');
    const rendered = renderPresentation();
    expect(document.querySelector('[data-reader-v2="ambiguous"]')).not.toBeNull();

    // This rerender is intentionally before React's passive cleanup effect.
    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail: detailB,
        sidecar,
        snapshot: snapshotB,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: null,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    expect(screen.getByText('Snapshot B original text.')).toBeVisible();
    expect(screen.queryByText(englishUiCopy.readerV2SourceProfile)).toBeNull();
    expect(document.querySelector('[data-reader-v2="fallback"]')).not.toBeNull();

    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: null,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    expect(document.querySelector('[data-reader-v2="ambiguous"]')).not.toBeNull();

    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: null,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: null,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    expect(document.querySelector('[data-reader-v2="fallback"]')).not.toBeNull();

    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: null,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    expect(document.querySelector('[data-reader-v2="ambiguous"]')).not.toBeNull();
  });

  it('renders a rejected projection as v1 only with no Reader-v2 DOM', () => {
    const rejected = {
      ...sidecar,
      document: {
        ...sidecar.document,
        articles: sidecar.document.articles.map((candidate) =>
          candidate.articleId === article.id
            ? { ...candidate, projection: 'rejected' as const }
            : candidate,
        ),
      },
    } as MobileReaderV2ValidatedDocument;
    renderPresentation({ sidecar: rejected });

    expect(screen.getByText('Original block stays visible.')).toBeVisible();
    expect(document.querySelector('[data-reader-v2="fallback"]')).not.toBeNull();
    expect(document.querySelector('.reader-v2-section')).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2Ambiguous)).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2MediaUnavailable)).toBeNull();
    expect(screen.queryByRole('button', { name: englishUiCopy.readerV2TranslateBlock })).toBeNull();
    expect(screen.queryByText(englishUiCopy.readerV2SourceProfile)).toBeNull();
  });

  it('keeps the packaged media-free Reader-v2 projection free of an invented media slot', async () => {
    const result = await loadMobileReaderV2({
      pin: mobileReaderV2BuildPin,
      snapshot: mobileReaderV2BuildPin.snapshot,
      v1Entries: readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[],
      v1Articles: articles.articles as unknown as readonly Pick<LocalArticle, 'id' | 'source'>[],
      signal: new AbortController().signal,
      request: async () =>
        new Response(rawSidecar, { status: 200, headers: { 'content-type': 'application/json' } }),
    });
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    const packagedArticle = (articles.articles as unknown as readonly LocalArticle[]).find(
      (item) => item.id === 'wrn-test-art-cedar',
    );
    const packagedDetail = (
      readerDetails.entries as unknown as readonly LocalReaderDetailEntryV1[]
    ).find((item) => item.articleId === 'wrn-test-art-cedar');
    expect(packagedArticle).toBeDefined();
    expect(packagedDetail).toBeDefined();
    render(
      h(MobileReaderV2Presentation, {
        article: packagedArticle!,
        detail: packagedDetail!,
        sidecar: result.sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'en',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: null,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    expect(screen.queryByText(englishUiCopy.readerV2MediaUnavailable)).toBeNull();
    expect(document.querySelector('.reader-v2-reference img')).toBeNull();
  });

  it('uses only an injected local adapter and discards an obsolete translation result', async () => {
    const user = userEvent.setup();
    let resolveTranslation: (value: string) => void = () => {
      throw new Error('translation was not started');
    };
    const adapter = {
      id: 'fixture-adapter',
      version: '1',
      translate: vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveTranslation = resolve;
          }),
      ),
    };
    const rendered = render(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: adapter,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    await user.click(screen.getByRole('button', { name: englishUiCopy.readerV2TranslateBlock }));
    expect(screen.getByText(englishUiCopy.readerV2TranslationLoading)).toBeVisible();
    await waitFor(() => expect(adapter.translate).toHaveBeenCalledTimes(1));
    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'fr',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: adapter,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    resolveTranslation('Old translation must not render.');
    await waitFor(() => expect(screen.queryByText('Old translation must not render.')).toBeNull());
    expect(screen.getByText('Original block stays visible.')).toBeVisible();
  });

  it('maps injected local translation success and offline states without replacing original text', async () => {
    const user = userEvent.setup();
    const adapter = {
      id: 'fixture-adapter',
      version: '1',
      translate: vi.fn(async () => 'Local fixture translation.'),
    };
    const rendered = render(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: false,
        translationAdapter: adapter,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    await user.click(screen.getByRole('button', { name: englishUiCopy.readerV2TranslateBlock }));
    expect(await screen.findByText('fixture-adapter/1: Local fixture translation.')).toBeVisible();
    expect(screen.getByText('Original block stays visible.')).toBeVisible();
    rendered.rerender(
      h(MobileReaderV2Presentation, {
        article,
        detail,
        sidecar,
        snapshot: mobileReaderV2BuildPin.snapshot,
        targetLanguage: 'de',
        copy: englishUiCopy,
        isOffline: true,
        translationAdapter: adapter,
        mediaSafety: { kind: 'ready', ledger: emptyMobileReaderV2MediaSafetyLedger() },
      }),
    );
    await user.click(screen.getByRole('button', { name: englishUiCopy.readerV2TranslateBlock }));
    expect(screen.getByText(englishUiCopy.readerV2TranslationOffline)).toBeVisible();
    expect(screen.queryByText('fixture-adapter/1: Local fixture translation.')).toBeNull();
  });
});
