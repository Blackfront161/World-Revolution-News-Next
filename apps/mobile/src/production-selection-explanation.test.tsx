import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProductionContentReadyV1 } from '@wrn/content-contracts';
import {
  createLocalPersonalizationState,
  emptySourcePreferences,
  setSourcePreference,
} from '@wrn/domain';
import { getUiCopy, uiLanguageIds } from '@wrn/ui-language';
import { getProductionSelectionCopy } from '@wrn/ui-language/source-preferences';
import {
  getProductionPreferenceMatches,
  matchesProductionPreferences,
} from '../../../packages/browser-content/src/production-content-view';
import { ProductionSelectionExplanation } from '../../../packages/browser-content/src/production-selection-explanation';
import { SourcePreferencesProvider } from '../../../packages/browser-content/src/source-preferences-ui';
import { ProductionContentArea } from './production-content-ui';
import { useProductionContentOfflineController } from './content-offline-ui';
import { productionTestResult } from './production-content-test-data';

vi.mock('./content-offline-ui', () => ({ useProductionContentOfflineController: vi.fn() }));
const key = 'wrn.selection-explanation.test';
const preferences = createLocalPersonalizationState({
  interestIds: [],
  regionIds: ['global'],
  contentLanguageIds: ['en'],
})!;
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('reasons from explicit production choices', () => {
  it('uses the same exact AND/OR matches as filtering without mutating choices or article metadata', async () => {
    const result = await productionTestResult();
    const article = { ...result.runtime!.documents.articles.articles[0]!, tags: ['sport'] };
    const selected = {
      ...preferences,
      interestIds: ['football', 'sport'] as const,
      regionIds: ['europe', 'global'] as const,
      contentLanguageIds: ['de', 'en'] as const,
    };
    const before = JSON.stringify({ result, article, selected });
    expect(getProductionPreferenceMatches(article, result, selected)).toEqual({
      interestIds: ['sport'],
      regionIds: ['global'],
      contentLanguageIds: ['en'],
    });
    expect(matchesProductionPreferences(article, result, selected)).toBe(true);
    for (const changed of [
      { ...selected, interestIds: ['football'] as const },
      { ...selected, regionIds: ['europe'] as const },
      { ...selected, contentLanguageIds: ['de'] as const },
    ]) {
      expect(getProductionPreferenceMatches(article, result, changed)).toBeNull();
      expect(matchesProductionPreferences(article, result, changed)).toBe(false);
    }
    expect(getProductionPreferenceMatches(article, null, selected)).toBeNull();
    expect(JSON.stringify({ result, article, selected })).toBe(before);
  });

  it('matches discover topics and leaves unselected groups empty', async () => {
    const result = await productionTestResult();
    // This authored helper creates v1. The modified graph is used only by the pure filter.
    const ready = result.runtime as ProductionContentReadyV1;
    const article = result.runtime!.documents.articles.articles[0]!;
    const entry = result.runtime!.documents.discoverIndex.entries.find(
      (value) => value.articleId === article.id,
    )!;
    const current = {
      ...result,
      runtime: {
        ...ready,
        documents: {
          ...ready.documents,
          discoverIndex: {
            ...ready.documents.discoverIndex,
            entries: [{ ...entry, topics: ['sport'] }],
          },
        },
      },
    };
    expect(
      getProductionPreferenceMatches(article, current, {
        ...preferences,
        interestIds: ['sport'],
        regionIds: [],
        contentLanguageIds: [],
      }),
    ).toEqual({ interestIds: ['sport'], regionIds: [], contentLanguageIds: [] });
  });

  it('shows only matching labels and opens without writes or requests', async () => {
    const result = await productionTestResult();
    const article = result.runtime!.documents.articles.articles[0]!;
    const set = vi.spyOn(Storage.prototype, 'setItem');
    const fetch = vi.spyOn(globalThis, 'fetch');
    const copy = getProductionSelectionCopy('de');
    render(
      <ProductionSelectionExplanation
        article={article}
        result={result}
        preferences={{
          ...preferences,
          regionIds: ['europe', 'global'],
          contentLanguageIds: ['de', 'en'],
        }}
        language="de"
      />,
    );
    const summary = screen.getByText(copy.title, { selector: 'summary' });
    fireEvent.click(summary);
    const details = summary.closest('details')!;
    expect(details).toHaveAttribute('lang', 'de');
    expect(
      within(details).getByText(getUiCopy('de').personalizationRegionGlobal),
    ).toBeInTheDocument();
    expect(within(details).queryByText(getUiCopy('de').personalizationRegionEurope)).toBeNull();
    expect(within(details).getByText('English')).toHaveAttribute('lang', 'en');
    expect(within(details).queryByText('Deutsch')).toBeNull();
    expect(set).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('updates exact source reasons on storage refresh and never invents a follow', async () => {
    const result = await productionTestResult();
    const article = result.runtime!.documents.articles.articles[0]!;
    const followed = setSourcePreference(
      emptySourcePreferences(),
      'production',
      article.source.id,
      'follow',
    )!;
    localStorage.setItem(key, JSON.stringify(followed));
    const copy = getProductionSelectionCopy('en');
    render(
      <SourcePreferencesProvider storageKey={key} language="en">
        <ProductionSelectionExplanation article={article} result={result} language="en" />
      </SourcePreferencesProvider>,
    );
    expect(screen.getByText(copy.followed)).toBeInTheDocument();
    expect(screen.getByText(article.source.name)).toBeInTheDocument();
    localStorage.setItem(
      key,
      JSON.stringify(
        setSourcePreference(emptySourcePreferences(), 'production', 'another-source', 'follow')!,
      ),
    );
    fireEvent(window, new StorageEvent('storage', { key }));
    expect(screen.queryByText(copy.followed)).toBeNull();
    expect(screen.getByText(copy.otherSource)).toBeInTheDocument();
    localStorage.removeItem(key);
    fireEvent(window, new StorageEvent('storage', { key }));
    expect(screen.queryByText(copy.title)).toBeNull();
  });

  it.each(uiLanguageIds)('%s has complete localized explanations', async (language) => {
    const result = await productionTestResult();
    const article = result.runtime!.documents.articles.articles[0]!;
    const copy = getProductionSelectionCopy(language);
    expect(Object.keys(copy)).toEqual(Object.keys(getProductionSelectionCopy('en')));
    expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
    render(
      <ProductionSelectionExplanation
        article={article}
        result={result}
        preferences={preferences}
        language={language}
      />,
    );
    expect(screen.getByText(copy.title, { selector: 'summary' })).toHaveAttribute(
      'aria-label',
      `${copy.title}: ${article.title}`,
    );
    expect(screen.getByText(copy.local)).toBeInTheDocument();
  });

  it.each(['home', 'discover', 'saved', 'more', 'following'])(
    'only renders article reasons on following, tested on %s',
    async (target) => {
      const result = await productionTestResult();
      vi.mocked(useProductionContentOfflineController).mockReturnValue({
        result,
        operation: null,
        operationResult: result,
        invoke: vi.fn(async () => result),
      });
      render(
        <ProductionContentArea
          target={target}
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
          preferences={preferences}
        />,
      );
      await act(async () => undefined);
      const summaries = screen.queryAllByText(getProductionSelectionCopy('en').title, {
        selector: 'summary',
      });
      expect(summaries.length > 0).toBe(target === 'following');
    },
  );
});
