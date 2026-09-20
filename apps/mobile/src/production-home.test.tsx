import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductionArticleV1, ProductionReaderImageBlockV2 } from '@wrn/content-contracts';
import { emptySourcePreferences, projectSourcePreferences, setSourcePreference } from '@wrn/domain';
import { selectProductionHomeArticles } from '../../../packages/browser-content/src/production-home-selection';
import {
  ProductionHome,
  type ProductionHomeDirectory,
} from '../../../packages/browser-content/src/production-home';
import { isPermittedProductionExternalUrl } from '../../../packages/browser-content/src/production-content-ui';
import { ProductionContentArea } from './production-content-ui';
import type { ProductionContentOfflineControllerResult } from './production-content-offline-controller';
import { useProductionContentOfflineController } from './content-offline-ui';
import { productionTestResult } from './production-content-test-data';
import { SourcePreferencesProvider } from '../../../packages/browser-content/src/source-preferences-ui';

vi.mock('./content-offline-ui', () => ({ useProductionContentOfflineController: vi.fn() }));

const dialogDescriptors = {
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
};
const objectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [name, descriptor] of Object.entries(dialogDescriptors)) {
    if (descriptor) {
      Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    }
  }
  if (objectUrlDescriptor) {
    Object.defineProperty(URL, 'createObjectURL', objectUrlDescriptor);
  }
  if (revokeObjectUrlDescriptor) {
    Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
  }
});

function article(index: number, sourceId = `source-${index}`): ProductionArticleV1 {
  return {
    id: `wrn-art-${index.toString(16).padStart(32, '0')}`,
    title: `Article ${index}`,
    teaser: `Teaser ${index}`,
    publishedAt: `2026-09-${String(28 - index).padStart(2, '0')}T00:00:00.000Z`,
    originalUrl: `https://example.org/${index}`,
    source: { id: sourceId, name: sourceId, authors: ['Author'] },
    originalLanguage: 'en',
    tags: [],
    contentCompleteness: 'full',
    rights: {
      licenseId: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      evidenceUrl: 'https://example.org/rights',
      checkedAt: '2026-09-10T00:00:00.000Z',
      scope: 'Test only',
      thirdPartyMaterialReviewed: true,
    },
    transformation: { status: 'original', reference: 'Test only' },
  };
}

const mixedImage: ProductionReaderImageBlockV2 = {
  kind: 'image',
  mediaId: 'wrn-media-test-image',
  sourceUrl: 'https://images.example.org/source.png',
  sourcePageUrl: 'https://example.org/article',
  sourceSnapshotSha256: 'a'.repeat(64),
  mime: 'image/png',
  byteLength: 4,
  width: 1,
  height: 1,
  sha256: 'b'.repeat(64),
  base64: 'AAAAAA==',
  altText: 'A test image',
  altLanguage: 'en',
  altTextProvenance: 'editorial',
  attribution: 'Test image author',
  licenseId: 'Image-CC-BY',
  licenseUrl: 'https://images.example.org/license',
  evidenceUrl: 'https://images.example.org/evidence',
  checkedAt: '2026-09-10T00:00:00.000Z',
  thirdPartyMaterialReviewed: true,
};

describe('production Home selection', () => {
  it.each([0, 1, 2, 6, 8])('keeps the ordered 1 + 5 + further split for %s articles', (count) => {
    const input = Array.from({ length: count }, (_, index) => article(index));
    const selection = selectProductionHomeArticles(input);
    expect(selection.lead?.id ?? null).toBe(count === 0 ? null : input[0]!.id);
    expect(selection.main.map((value) => value.id)).toEqual(
      input.slice(1, 6).map((value) => value.id),
    );
    expect(selection.further.map((value) => value.id)).toEqual(
      input.slice(6).map((value) => value.id),
    );
    expect(input.map((value) => value.id)).toEqual(
      Array.from({ length: count }, (_, index) => article(index).id),
    );
  });

  it('deduplicates a malformed input without changing the first stable occurrence', () => {
    const input = [article(0), article(1), article(0), article(2)];
    const selection = selectProductionHomeArticles(input);
    expect(
      [selection.lead, ...selection.main, ...selection.further].map((value) => value?.id),
    ).toEqual([input[0]!.id, input[1]!.id, input[3]!.id]);
  });

  it('projects source follow and hide before the Home cap, so visible items refill it', () => {
    const input = Array.from({ length: 8 }, (_, index) => article(index, `source-${index}`));
    let preferences = emptySourcePreferences();
    preferences = setSourcePreference(preferences, 'production', 'source-7', 'follow')!;
    preferences = setSourcePreference(preferences, 'production', 'source-0', 'hide')!;
    const projected = projectSourcePreferences(input, preferences, 'production', (value) => [
      value.source.id,
    ]);
    const selection = selectProductionHomeArticles(projected);
    expect(selection.lead?.id).toBe(input[7]!.id);
    expect(selection.main.map((value) => value.id)).toEqual(
      [input[1]!, input[2]!, input[3]!, input[4]!, input[5]!].map((value) => value.id),
    );
    expect(selection.further.map((value) => value.id)).toEqual([input[6]!.id]);
  });

  it('removes a prior directory projection as its loader changes, is absent, or throws synchronously', async () => {
    const directory = {
      document: { observedAt: '2026-09-10T00:00:00.000Z' },
      projection: { articles: [], sports: [] },
    } as unknown as ProductionHomeDirectory;
    let resolveReplacement!: (value: ProductionHomeDirectory) => void;
    const replacement = vi.fn(
      () => new Promise<ProductionHomeDirectory>((resolve) => (resolveReplacement = resolve)),
    );
    const renderCard = (value: ProductionArticleV1) => (
      <article key={value.id}>{value.title}</article>
    );
    const input = {
      articles: [article(0)],
      language: 'en' as const,
      sourcePreferences: emptySourcePreferences(),
      renderCard,
      onBrowseDirectory: vi.fn(),
    };
    const rendered = render(
      <ProductionHome {...input} loadDirectory={vi.fn(async () => directory)} />,
    );
    await screen.findByText('Snapshot: 2026-09-10');
    rendered.rerender(<ProductionHome {...input} loadDirectory={replacement} />);
    await waitFor(() => expect(replacement).toHaveBeenCalledOnce());
    expect(screen.queryByText('Snapshot: 2026-09-10')).toBeNull();
    rendered.rerender(<ProductionHome {...input} />);
    expect(screen.queryByText('Snapshot: 2026-09-10')).toBeNull();
    await act(async () => resolveReplacement(directory));
    expect(screen.queryByText('Snapshot: 2026-09-10')).toBeNull();
    rendered.rerender(
      <ProductionHome
        {...input}
        loadDirectory={() => {
          throw new Error('directory-failed');
        }}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be prepared');
  });

  it('renders admitted sports articles through renderCard and filters their tags', async () => {
    const sportArticle = {
      ...article(9),
      title: 'Football accountability commentary',
      tags: ['sports', 'football', 'women'],
    } satisfies ProductionArticleV1;
    const directory = {
      document: { observedAt: '2026-09-10T00:00:00.000Z' },
      projection: { articles: [], sports: [] },
    } as unknown as ProductionHomeDirectory;
    const renderCard = (value: ProductionArticleV1, role: string) => (
      <div data-testid={`card-${role}-${value.id}`}>{value.title}</div>
    );
    render(
      <ProductionHome
        articles={[sportArticle]}
        language="en"
        sourcePreferences={emptySourcePreferences()}
        renderCard={renderCard}
        loadDirectory={vi.fn(async () => directory)}
      />,
    );
    const section = (await screen.findByRole('heading', { name: 'Sport & fan culture' })).closest(
      'section',
    )!;
    expect(within(section).getByText(sportArticle.title)).toBeInTheDocument();
    fireEvent.click(within(section).getByRole('button', { name: 'Fan culture' }));
    expect(within(section).queryByText(sportArticle.title)).toBeNull();
    fireEvent.click(within(section).getByRole('button', { name: 'Football' }));
    expect(within(section).getByText(sportArticle.title)).toBeInTheDocument();
    fireEvent.click(within(section).getByRole('button', { name: 'Women' }));
    expect(within(section).getByText(sportArticle.title)).toBeInTheDocument();
  });

  it('permits only original, text licence, or admitted image licence URLs', async () => {
    const result = await productionTestResult();
    const articleView = {
      kind: 'ready' as const,
      article: result.runtime!.documents.articles.articles[0]!,
      blocks: [mixedImage],
      shareUrl: null,
      redirected: false,
    };
    expect(isPermittedProductionExternalUrl(articleView, articleView.article.originalUrl)).toBe(
      true,
    );
    expect(
      isPermittedProductionExternalUrl(articleView, articleView.article.rights.licenseUrl),
    ).toBe(true);
    expect(isPermittedProductionExternalUrl(articleView, mixedImage.licenseUrl)).toBe(true);
    expect(isPermittedProductionExternalUrl(articleView, mixedImage.sourceUrl)).toBe(false);
    expect(isPermittedProductionExternalUrl(articleView, 'https://unrelated.example.org/')).toBe(
      false,
    );
  });

  it.each([
    { role: 'lead', imageIndex: 0 },
    { role: 'main', imageIndex: 1 },
  ] as const)(
    'guards the $role Home image and removes it for safety, expiry, and a hidden source',
    async ({ role, imageIndex }) => {
      const base = await productionTestResult();
      const imageArticleId = base.runtime!.documents.articles.articles[imageIndex]!.id;
      const result: ProductionContentOfflineControllerResult = {
        ...base,
        runtime: {
          ...base.runtime!,
          documents: {
            ...base.runtime!.documents,
            readerDetails: {
              ...base.runtime!.documents.readerDetails,
              entries: base.runtime!.documents.readerDetails.entries.map((entry) =>
                entry.articleId === imageArticleId
                  ? { ...entry, blocks: [mixedImage, ...entry.blocks] }
                  : entry,
              ),
            },
          },
        },
      } as ProductionContentOfflineControllerResult;
      const invoke = vi.fn(async () => result);
      vi.mocked(useProductionContentOfflineController).mockReturnValue({
        result,
        operation: null,
        operationResult: result,
        invoke,
      });
      const objectUrl = vi.fn(() => 'blob:home-image');
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: objectUrl });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
      render(
        <SourcePreferencesProvider
          storageKey={`home-image-source-preferences-${role}`}
          language="en"
        >
          <ProductionContentArea
            target="home"
            articleId={null}
            archiveRoute={undefined}
            language="en"
            headingRef={createRef<HTMLHeadingElement>()}
            onRead={vi.fn()}
            onArchiveRead={vi.fn()}
            onCloseReader={vi.fn()}
            onCloseArchive={vi.fn()}
            onOpenArchive={vi.fn()}
            shareAdapter={{ share: vi.fn(async () => undefined) }}
          />
        </SourcePreferencesProvider>,
      );
      const imageLicence = await screen.findByRole('button', {
        name: 'Test image author · Image-CC-BY',
      });
      expect(
        document.querySelector<HTMLElement>(`[data-home-role="${role}"]`)?.contains(imageLicence),
      ).toBe(true);
      fireEvent.click(imageLicence);
      const dialog = await screen.findByRole('dialog');
      await expect(within(dialog).getByRole('link')).toHaveAttribute('href', mixedImage.licenseUrl);
      fireEvent.keyDown(dialog, { key: 'Escape' });
      invoke.mockResolvedValueOnce({
        ...result,
        safety: { ...result.safety!, revokedIds: [imageArticleId] },
      });
      fireEvent.click(imageLicence);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      invoke.mockResolvedValueOnce({ ...result, expiresAt: Date.now() - 1 });
      fireEvent.click(imageLicence);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      const card = document.querySelector<HTMLElement>(`[data-home-role="${role}"]`)!;
      const profile = card.querySelector<HTMLElement>('.source-profile')!;
      fireEvent.click(profile.querySelector('summary')!);
      fireEvent.click(within(profile).getByRole('button', { name: 'Hide: Authored test' }));
      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Test image author · Image-CC-BY' }),
        ).toBeNull(),
      );
      expect(objectUrl).toHaveBeenCalled();
    },
  );
});
