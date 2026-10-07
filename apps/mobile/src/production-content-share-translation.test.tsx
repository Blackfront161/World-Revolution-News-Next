import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getUiCopy } from '@wrn/ui-language';
import { afterEach, expect, it, vi } from 'vitest';
import { createProductionContentArea } from '../../../packages/browser-content/src/production-content-ui';
import { useProductionContentOfflineController } from './content-offline-ui';
import { productionTestResult, testProductionId } from './production-content-test-data';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';

vi.mock('./content-offline-ui', () => ({ useProductionContentOfflineController: vi.fn() }));

const Reader = createProductionContentArea({
  useProductionContentOfflineController,
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
  headingId: 'share-test-heading',
  archiveTriggerId: 'share-test-archive',
  translationAdapter: {
    identity: { id: 'test', version: '1', provider: 'test' },
    async translate(paragraph) {
      return {
        kind: 'translated',
        identity: 'd'.repeat(64),
        response: {
          contractVersion: '1.0.0',
          mode: 'paragraph',
          sourceLanguage: paragraph.sourceLanguage,
          targetLanguage: paragraph.targetLanguage,
          requestTextSha256: 'a'.repeat(64),
          translation: { text: 'Ein übersetzter Absatz.', textSha256: 'c'.repeat(64) },
          adapter: { id: 'test', version: '1', provider: 'test' },
          cache: {
            namespace: 'translation:v2',
            status: 'hit',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        },
      };
    },
  },
});

afterEach(() => {
  localStorage.removeItem(productionReadingStateStorageKey);
  vi.restoreAllMocks();
});

it('attributes sharing only while a valid paragraph translation is visibly rendered', async () => {
  const result = await productionTestResult();
  let guardResult = result;
  vi.mocked(useProductionContentOfflineController).mockReturnValue({
    result,
    operation: null,
    operationResult: result,
    invoke: vi.fn(async () => guardResult),
  });
  const url = `https://solinaridao.com/articles/${testProductionId}/`;
  const share = vi
    .fn<(...args: unknown[]) => Promise<void>>()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('chooser unavailable'))
    .mockResolvedValueOnce(undefined);
  const props = {
    target: 'home',
    articleId: testProductionId,
    archiveRoute: undefined,
    headingRef: createRef<HTMLHeadingElement>(),
    onRead: vi.fn(),
    onArchiveRead: vi.fn(),
    onCloseReader: vi.fn(),
    onCloseArchive: vi.fn(),
    onOpenArchive: vi.fn(),
    shareAdapter: { share },
  };
  const ui = render(<Reader {...props} language="de" />);
  await screen.findByTestId('production-reader');
  fireEvent.click(screen.getByRole('button', { name: getUiCopy('de').share }));
  await waitFor(() => expect(share).toHaveBeenNthCalledWith(1, url));

  fireEvent.click(screen.getAllByRole('button', { name: 'Diesen Absatz übersetzen' })[0]!);
  expect(await screen.findByText('Ein übersetzter Absatz.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: getUiCopy('de').share }));
  await waitFor(() => expect(share).toHaveBeenNthCalledWith(2, url, { translationLanguage: 'de' }));
  expect(await screen.findByTestId('canonical-share-fallback')).toHaveValue(
    `Übersetzt mit World Revolution News\n${url}`,
  );

  fireEvent.click(screen.getAllByRole('button', { name: 'Diesen Absatz übersetzen' })[0]!);
  expect(await screen.findByText('Ein übersetzter Absatz.')).toBeVisible();
  guardResult = {
    ...result,
    safety: { ...result.safety!, revision: result.safety!.revision + 1 },
  };
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: getUiCopy('de').share }));
  });
  expect(share).toHaveBeenCalledTimes(2);
  guardResult = result;

  ui.rerender(<Reader {...props} language="en" />);
  expect(screen.queryByText('Ein übersetzter Absatz.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: getUiCopy('en').share }));
  await waitFor(() => expect(share).toHaveBeenNthCalledWith(3, url));
});
