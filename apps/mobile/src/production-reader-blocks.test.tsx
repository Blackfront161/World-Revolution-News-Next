import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ProductionReaderImageBlockV2 } from '@wrn/content-contracts';
import { ProductionReaderBlocks } from './production-reader-blocks';
import { authoredProductionBlocks } from './production-content-test-data';
import type { ProductionReaderTranslation } from '../../../packages/browser-content/src/production-reader-blocks';
import type {
  ProductionTranslationAdapter,
  ProductionTranslationOutcome,
} from '../../../packages/browser-content/src/production-translation';

function translationContext(): ProductionReaderTranslation {
  return {
    authority: {
      releaseRevision: 'release',
      manifestSha256: 'a'.repeat(64),
      articleId: 'article',
      articleRevision: 'b'.repeat(64),
      activeKey: 'key',
      safetyRevision: 1,
      expiresAt: Date.now() + 60_000,
    },
    route: 'route',
    sourceLanguage: 'en',
    language: 'de',
    adapter: null,
  };
}
function translatedOutcome(): ProductionTranslationOutcome {
  return {
    kind: 'translated',
    identity: 'd'.repeat(64),
    response: {
      contractVersion: '1.0.0',
      mode: 'paragraph',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      requestTextSha256: 'a'.repeat(64),
      translation: { text: 'Eine Übersetzung.', textSha256: 'c'.repeat(64) },
      adapter: { id: 'test', version: '1', provider: 'test' },
      cache: {
        namespace: 'translation:v2',
        status: 'hit',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
  };
}

it('keeps original text and language visible through explicit translation, error and retry; other block kinds have no action', async () => {
  const translate = vi
    .fn()
    .mockResolvedValueOnce({ kind: 'error' })
    .mockResolvedValueOnce(translatedOutcome());
  const context = {
    ...translationContext(),
    adapter: { identity: { id: 'test', version: '1', provider: 'test' }, translate },
  };
  const ui = render(
    <ProductionReaderBlocks blocks={authoredProductionBlocks} translation={context} />,
  );
  const original = ui.container.querySelector('.production-translatable-paragraph > p')!;
  expect(original).toHaveAttribute('lang', 'en');
  expect(original).toBeVisible();
  expect(translate).not.toHaveBeenCalled();
  expect(ui.container.querySelectorAll('[data-translation-action]')).toHaveLength(
    authoredProductionBlocks.filter((block) => block.kind === 'paragraph').length,
  );
  expect(screen.getByText(/Nur der gewählte öffentliche Absatz/)).toBeVisible();
  fireEvent.click(screen.getAllByRole('button', { name: 'Diesen Absatz übersetzen' })[0]!);
  expect(original).toBeVisible();
  expect(await screen.findByText('Die Übersetzung ist fehlgeschlagen.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Erneut übersetzen' }));
  expect(await screen.findByText('Eine Übersetzung.')).toHaveAttribute('lang', 'de');
  expect(original).toBeVisible();
  expect(ui.container.querySelector('[data-translation-result]')).toHaveAttribute(
    'data-cache-status',
    'hit',
  );
  expect(translate).toHaveBeenCalledTimes(2);
});

it('aborts and hides late results after each reader identity change', async () => {
  const changes = [
    'releaseRevision',
    'manifestSha256',
    'articleId',
    'articleRevision',
    'activeKey',
    'safetyRevision',
    'expiresAt',
    'route',
    'sourceLanguage',
    'language',
    'adapter',
    'text',
    'blockIndex',
  ] as const;
  for (const change of changes) {
    let complete!: (outcome: ProductionTranslationOutcome) => void;
    const translate = vi.fn<ProductionTranslationAdapter['translate']>(
      () =>
        new Promise<ProductionTranslationOutcome>((resolve) => {
          complete = resolve;
        }),
    );
    const context = {
      ...translationContext(),
      adapter: { identity: { id: 'test', version: '1', provider: 'test' }, translate },
    };
    const blocks = [{ kind: 'paragraph' as const, text: 'Original public paragraph.' }];
    const ui = render(<ProductionReaderBlocks blocks={blocks} translation={context} />);
    fireEvent.click(screen.getByRole('button', { name: 'Diesen Absatz übersetzen' }));
    const signal = translate.mock.calls[0]![1] as AbortSignal;
    let next: ProductionReaderTranslation = context;
    if (change in context.authority)
      next = {
        ...context,
        authority: {
          ...context.authority,
          [change]:
            typeof context.authority[change as keyof typeof context.authority] === 'number'
              ? 2
              : 'changed',
        },
      };
    else if (change === 'adapter')
      next = {
        ...context,
        adapter: { ...context.adapter, identity: { ...context.adapter.identity, version: '2' } },
      };
    else if (change === 'language') next = { ...context, language: 'fr' };
    else if (change === 'sourceLanguage') next = { ...context, sourceLanguage: 'es' };
    else if (change === 'route') next = { ...context, route: 'other-route' };
    const nextBlocks =
      change === 'text'
        ? [{ kind: 'paragraph' as const, text: 'A changed paragraph.' }]
        : change === 'blockIndex'
          ? [{ kind: 'heading' as const, level: 2 as const, text: 'Heading' }, ...blocks]
          : blocks;
    ui.rerender(<ProductionReaderBlocks blocks={nextBlocks} translation={next} />);
    expect(signal.aborted, change).toBe(true);
    await act(async () => complete(translatedOutcome()));
    expect(ui.container.querySelector('[data-translation-result]'), change).toBeNull();
    expect(
      ui.container.querySelector('.production-translatable-paragraph > p'),
      change,
    ).toBeVisible();
    ui.unmount();
  }
});

it('cancels on offline and unmount, and disabled service never renders an active translation action', async () => {
  const unavailable = render(
    <ProductionReaderBlocks
      blocks={[{ kind: 'paragraph', text: 'Original' }]}
      translation={translationContext()}
    />,
  );
  expect(screen.getByText('Die Absatzübersetzung ist derzeit nicht verfügbar.')).toBeVisible();
  expect(unavailable.container.querySelector('[data-translation-action]')).toBeNull();
  unavailable.unmount();
  for (const transition of ['offline', 'unmount']) {
    const translate = vi.fn<ProductionTranslationAdapter['translate']>(
      () => new Promise<ProductionTranslationOutcome>(() => undefined),
    );
    const context = {
      ...translationContext(),
      adapter: { identity: { id: 'test', version: '1', provider: 'test' }, translate },
    };
    const ui = render(
      <ProductionReaderBlocks
        blocks={[{ kind: 'paragraph', text: 'Original' }]}
        translation={context}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Diesen Absatz übersetzen' }));
    const signal = translate.mock.calls[0]![1] as AbortSignal;
    if (transition === 'offline') {
      act(() => window.dispatchEvent(new Event('offline')));
      expect(screen.getByText('Original')).toBeVisible();
      expect(screen.getByText('Offline: Das Original bleibt lesbar.')).toBeVisible();
      expect(screen.getByRole('button')).toBeDisabled();
    } else ui.unmount();
    expect(signal.aborted).toBe(true);
    ui.unmount();
  }
});

it('renders text-only paragraph, exact heading levels, attributed quote and both list semantics', () => {
  const { container } = render(<ProductionReaderBlocks blocks={authoredProductionBlocks} />);
  expect(screen.getByRole('heading', { name: 'Authored section', level: 2 })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Authored subsection', level: 3 })).toBeVisible();
  expect(container.querySelector('figure blockquote')?.textContent).toBe('An authored quote.');
  expect(container.querySelector('figcaption')?.textContent).toBe('Test author');
  expect(container.querySelectorAll('ol > li')).toHaveLength(2);
  expect(container.querySelectorAll('ul > li')).toHaveLength(2);
  expect(container.querySelectorAll('iframe, img, script, a')).toHaveLength(0);
});

it('places admitted image bytes between prose, confirms license links and releases every Blob URL', () => {
  const createObjectURL = vi
    .fn()
    .mockReturnValueOnce('blob:test-one')
    .mockReturnValueOnce('blob:test-two');
  const revokeObjectURL = vi.fn();
  const OriginalURL = URL;
  vi.stubGlobal(
    'URL',
    Object.assign(class extends OriginalURL {}, { createObjectURL, revokeObjectURL }),
  );
  // Render fixture only; contract/admission validity is exercised by V2 tests.
  const image: ProductionReaderImageBlockV2 = {
    kind: 'image',
    mediaId: `wrn-media-${'a'.repeat(32)}`,
    sourceUrl: 'https://example.org/image.png',
    sourcePageUrl: 'https://example.org/article',
    sourceSnapshotSha256: 'a'.repeat(64),
    mime: 'image/png',
    byteLength: 67,
    width: 1,
    height: 1,
    sha256: 'a'.repeat(64),
    base64:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5LQP4QAAAABJRU5ErkJggg==',
    altText: 'Authored image alternative',
    altLanguage: 'en',
    altTextProvenance: 'editorial',
    attribution: 'Example artist',
    licenseId: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    evidenceUrl: 'https://example.org/rights',
    checkedAt: '2026-09-10T00:00:00.000Z',
    thirdPartyMaterialReviewed: true,
  };
  const onExternal = vi.fn();
  const ui = render(
    <ProductionReaderBlocks
      blocks={[
        { kind: 'paragraph', text: 'Before image' },
        image,
        { kind: 'paragraph', text: 'After image' },
      ]}
      onExternal={onExternal}
    />,
  );
  try {
    expect([...ui.container.children].map((element) => element.tagName)).toEqual([
      'P',
      'FIGURE',
      'P',
    ]);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:test-one');
    expect(ui.container.querySelector('img[src^="https:"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Example artist · CC-BY-4.0' }));
    expect(onExternal).toHaveBeenCalledWith(image.licenseUrl, expect.any(HTMLButtonElement));
    ui.rerender(
      <ProductionReaderBlocks
        blocks={[{ ...image, mediaId: `wrn-media-${'b'.repeat(32)}` }]}
        onExternal={onExternal}
      />,
    );
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-one');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:test-two');
    fireEvent.error(screen.getByRole('img'));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-two');
    expect(screen.getByRole('img')).not.toHaveAttribute('src');
    expect(screen.getByRole('img')).toHaveTextContent(image.altText);
  } finally {
    ui.unmount();
    vi.unstubAllGlobals();
  }
});
