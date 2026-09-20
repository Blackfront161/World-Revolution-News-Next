import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { formatUiCopy, getUiCopy } from '@wrn/ui-language';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionContentArea } from './production-content-ui';
import { useProductionContentOfflineController } from './content-offline-ui';
import { productionTestResult, testProductionId } from './production-content-test-data';
import { productionReadingStateStorageKey } from './production-reading-state';

vi.mock('./content-offline-ui', () => ({ useProductionContentOfflineController: vi.fn() }));
const dialogDescriptors = ['showModal', 'close'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, key)] as const,
);
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  localStorage.removeItem(productionReadingStateStorageKey);
  vi.restoreAllMocks();
  for (const [key, value] of dialogDescriptors) {
    if (value) Object.defineProperty(HTMLDialogElement.prototype, key, value);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});
const props = () => ({
  target: 'home',
  articleId: testProductionId,
  archiveRoute: undefined,
  language: 'en' as const,
  headingRef: createRef<HTMLHeadingElement>(),
  onRead: vi.fn(),
  onArchiveRead: vi.fn(),
  onCloseReader: vi.fn(),
  onCloseArchive: vi.fn(),
  onOpenArchive: vi.fn(),
  shareAdapter: { share: vi.fn(async (): Promise<void> => undefined) },
});

describe('production reader component', () => {
  it('filters Discover by admitted metadata and clears criteria outside Discover', async () => {
    const base = await productionTestResult();
    const runtime = base.runtime!;
    const [first, second] = runtime.documents.articles.articles;
    const result = {
      ...base,
      runtime: {
        ...runtime,
        documents: {
          ...runtime.documents,
          articles: {
            ...runtime.documents.articles,
            articles: [
              {
                ...first!,
                source: { ...first!.source, id: 'source-a', name: 'Source A' },
                originalLanguage: 'en',
              },
              {
                ...second!,
                source: { ...second!.source, id: 'source-b', name: 'Source B' },
                originalLanguage: 'it',
              },
            ],
          },
          discoverIndex: {
            ...runtime.documents.discoverIndex,
            entries: [
              {
                articleId: first!.id,
                region: 'north-america',
                topics: ['rights'],
                format: 'news',
              },
              {
                articleId: second!.id,
                region: 'europe',
                topics: ['technology'],
                format: 'commentary',
              },
            ],
          },
        },
      },
    } as typeof base;
    const invoke = vi.fn(async () => result);
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke,
    });
    const input = { ...props(), target: 'discover', articleId: null };
    const rendered = render(<ProductionContentArea {...input} />);
    await screen.findByRole('heading', { name: 'Discover' });
    const filters = screen
      .getByText(formatUiCopy(getUiCopy('en').filtersWithCount, { count: '0' }))
      .closest('details')!;
    expect(filters).not.toHaveAttribute('open');
    fireEvent.click(filters.querySelector('summary')!);
    expect(filters).toHaveAttribute('open');
    expect(screen.getByRole('option', { name: 'English' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Italiano' })).toBeVisible();

    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'north-america' } });
    expect(screen.getByRole('heading', { name: 'Authored test 0' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Authored test 1' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'source-b' } });
    expect(screen.getByRole('heading', { name: 'Authored test 1' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Original language'), { target: { value: 'it' } });
    expect(screen.queryByRole('heading', { name: 'Authored test 0' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Original language'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'technology' } });
    expect(screen.getByRole('heading', { name: 'Authored test 1' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Topic'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'commentary' } });
    expect(screen.getByRole('heading', { name: 'Authored test 1' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'north-america' } });
    expect(screen.queryByRole('heading', { name: 'Authored test 1' })).toBeNull();

    rendered.rerender(<ProductionContentArea {...input} target="saved" />);
    expect(screen.queryByLabelText('Region')).toBeNull();
    expect(await screen.findByRole('heading', { name: 'Authored test 1' })).toBeVisible();
  });

  it('opens optional Discover filters and returns reset focus to search', async () => {
    const result = await productionTestResult();
    const invoke = vi.fn(async () => result);
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke,
    });
    render(<ProductionContentArea {...props()} target="discover" articleId={null} />);
    await screen.findByRole('heading', { name: 'Discover' });
    const summary = screen.getByText('Filters (0)');
    const details = summary.closest('details')!;
    fireEvent.click(summary);
    expect(details).toHaveAttribute('open');
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'global' } });
    expect(screen.getByText('Filters (1)')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reset all filters' }));
    expect(screen.getByLabelText('Region')).toHaveValue('');
    await waitFor(() => expect(screen.getByLabelText('Search')).toHaveFocus());
  });

  it('shows a pending reader guard as loading, then distinguishes ready and unavailable articles', async () => {
    const result = await productionTestResult();
    let finish!: () => void;
    const invoke = vi.fn(
      () =>
        new Promise<typeof result>((resolve) => {
          finish = () => {
            resolve(result);
          };
        }),
    );
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke,
    });
    const input = props();
    const rendered = render(<ProductionContentArea {...input} />);
    const copy = getUiCopy('en');
    expect(screen.getByRole('heading', { name: copy.loading })).toBeVisible();
    expect(screen.queryByRole('heading', { name: copy.archiveUnavailable })).toBeNull();
    await act(async () => {
      finish();
    });
    await screen.findByTestId('production-reader');
    rendered.rerender(<ProductionContentArea {...input} articleId="missing-article" />);
    expect(screen.getByRole('heading', { name: copy.loading })).toBeVisible();
    await act(async () => {
      finish();
    });
    expect(screen.getByRole('heading', { name: copy.archiveUnavailable })).toBeVisible();
    expect(screen.queryByTestId('production-reader')).toBeNull();
  });

  for (const outcome of ['resolve', 'reject'] as const) {
    it.each(['unchanged', 'replacement', 'safety', 'deadline', 'expiry', 'clock'] as const)(
      `binds deferred share ${outcome} feedback to %s authority`,
      async (change) => {
        let result = await productionTestResult();
        const invoke = vi.fn(async () => result);
        vi.mocked(useProductionContentOfflineController).mockImplementation(() => ({
          result,
          operation: null,
          operationResult: result,
          invoke,
        }));
        let finish!: () => void;
        const input = props();
        input.shareAdapter.share = vi.fn(
          () =>
            new Promise<void>((resolve, reject) => {
              finish = () =>
                outcome === 'resolve' ? resolve() : reject(new Error('share unavailable'));
            }),
        );
        const rendered = render(<ProductionContentArea {...input} />);
        await screen.findByTestId('production-reader');
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await waitFor(() => expect(input.shareAdapter.share).toHaveBeenCalledOnce());
        if (change === 'replacement')
          result = { ...result, activeKey: `${result.activeKey}-replacement` };
        if (change === 'safety')
          result = {
            ...result,
            safety: { ...result.safety!, revision: result.safety!.revision + 1 },
          };
        if (change === 'deadline') result = { ...result, expiresAt: result.expiresAt! + 1000 };
        if (change === 'expiry')
          result = { ...result, status: 'needs-source-check', runtime: null, expiresAt: null };
        if (change === 'clock') vi.spyOn(Date, 'now').mockReturnValue(result.expiresAt! + 1);
        else rendered.rerender(<ProductionContentArea {...input} />);
        await act(async () => {
          finish();
        });
        const copy = getUiCopy('en');
        const expected =
          outcome === 'resolve' ? copy.canonicalShareReady : copy.canonicalShareError;
        if (change === 'unchanged') expect(screen.getByText(expected)).toBeVisible();
        else expect(screen.queryByText(expected)).toBeNull();
        if (outcome === 'reject' && change === 'unchanged')
          expect(screen.getByTestId('canonical-share-fallback')).toHaveValue(
            'https://solinaridao.com/articles/wrn-art-0123456789abcdef0123456789abcdef/',
          );
        else expect(screen.queryByTestId('canonical-share-fallback')).toBeNull();
      },
    );
  }

  it('removes already displayed share feedback when same-route authority expires', async () => {
    let result = await productionTestResult();
    const invoke = vi.fn(async () => result);
    vi.mocked(useProductionContentOfflineController).mockImplementation(() => ({
      result,
      operation: null,
      operationResult: result,
      invoke,
    }));
    const input = props();
    const rendered = render(<ProductionContentArea {...input} />);
    await screen.findByTestId('production-reader');
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await screen.findByText(getUiCopy('en').canonicalShareReady);
    result = { ...result, status: 'needs-source-check', runtime: null, expiresAt: null };
    rendered.rerender(<ProductionContentArea {...input} />);
    expect(screen.queryByText(getUiCopy('en').canonicalShareReady)).toBeNull();
  });
  it.each(['newer-share', 'route-reopen'] as const)(
    'ignores a superseded share after %s',
    async (replacement) => {
      const result = await productionTestResult();
      const invoke = vi.fn(async () => result);
      vi.mocked(useProductionContentOfflineController).mockReturnValue({
        result,
        operation: null,
        operationResult: result,
        invoke,
      });
      const completions: Array<{ resolve(): void; reject(reason: Error): void }> = [];
      const input = props();
      input.shareAdapter.share = vi.fn(
        () => new Promise<void>((resolve, reject) => completions.push({ resolve, reject })),
      );
      const rendered = render(<ProductionContentArea {...input} />);
      await screen.findByTestId('production-reader');
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      await waitFor(() => expect(completions).toHaveLength(1));
      if (replacement === 'newer-share') {
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await waitFor(() => expect(completions).toHaveLength(2));
        await act(async () => completions[1]!.reject(new Error('newer failure')));
        expect(screen.getByText(getUiCopy('en').canonicalShareError)).toBeVisible();
      } else {
        rendered.rerender(<ProductionContentArea {...input} articleId={null} />);
        await screen.findByRole('heading', { name: 'Current' });
        rendered.rerender(<ProductionContentArea {...input} />);
        await screen.findByTestId('production-reader');
      }
      await act(async () => completions[0]!.resolve());
      expect(screen.queryByText(getUiCopy('en').canonicalShareReady)).toBeNull();
      if (replacement === 'newer-share')
        expect(screen.getByText(getUiCopy('en').canonicalShareError)).toBeVisible();
    },
  );
  it('main and archive expose the same admitted blocks and canonical internal share', async () => {
    const result = await productionTestResult();
    const invoke = vi.fn(async () => result);
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke,
    });
    const input = props();
    const rendered = render(<ProductionContentArea {...input} />);
    await screen.findByTestId('production-reader');
    expect(screen.getByRole('heading', { name: 'Authored subsection', level: 3 })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() =>
      expect(input.shareAdapter.share).toHaveBeenCalledWith(
        `https://solinaridao.com/articles/${testProductionId}/`,
      ),
    );
    const before = rendered.container.querySelector('.production-reader-blocks')!.innerHTML;
    rendered.rerender(
      <ProductionContentArea {...input} articleId={null} archiveRoute={testProductionId} />,
    );
    await screen.findByTestId('production-reader');
    expect(rendered.container.querySelector('.production-reader-blocks')!.innerHTML).toBe(before);
  });
  it('keeps corrupt v2 protected and removes an open external dialog when authority is lost', async () => {
    const result = await productionTestResult();
    const invoke = vi.fn(async () => result);
    localStorage.setItem(productionReadingStateStorageKey, '{future-format');
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result,
      operation: null,
      operationResult: result,
      invoke,
    });
    const input = props();
    const rendered = render(<ProductionContentArea {...input} />);
    await screen.findByTestId('production-reader');
    expect(screen.getByRole('button', { name: 'Save for later' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Open original source' }));
    await screen.findByRole('dialog');
    vi.mocked(useProductionContentOfflineController).mockReturnValue({
      result: { ...result, status: 'needs-source-check', runtime: null, expiresAt: null },
      operation: null,
      operationResult: result,
      invoke,
    });
    rendered.rerender(<ProductionContentArea {...input} />);
    expect(screen.queryByTestId('production-reader')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(productionReadingStateStorageKey)).toBe('{future-format');
  });
});
