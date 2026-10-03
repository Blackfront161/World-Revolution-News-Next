import { createRef, StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import { getUiCopy, uiLanguageIds, type UiLanguage } from '@wrn/ui-language';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from '../home/app-home-layout-v1.json';
import { homeReadingSummary } from '../home/home-editorial';
import { getWebsiteHomeCopy } from '../home/website-home-copy';
import { WebsiteDirectoryReader } from './WebsiteDirectoryReader';
import { DirectoryArticleLink } from './directory-article-link';
import { DirectoryReaderNavigation } from './directory-reader-navigation';
import { directoryArticlePath } from './directory-article-url';
import { WebsiteNewsSaved } from './WebsiteNewsSaved';
import { newsReadingStorageKey } from './news-reading-state';
const shared = vi.hoisted(() => ({
  preferences: null as unknown,
  data: null as unknown,
  listeners: new Set<(data: unknown) => void>(),
  translate: vi.fn(),
}));
vi.mock('../translation/shared-article-translation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../translation/shared-article-translation')>()),
  translateSharedArticle: shared.translate,
}));
vi.mock('../../../../../packages/browser-content/src/source-preferences-ui', () => ({
  useSourcePreferences: () => ({ state: shared.preferences }),
}));
vi.mock('../directory/directory-loader', () => ({
  loadWebsiteContentDirectory: async () => shared.data,
  subscribeWebsiteContentDirectory: (listener: (data: unknown) => void) => {
    shared.listeners.add(listener);
    return () => shared.listeners.delete(listener);
  },
}));
const document = directory as MobileContentDirectory,
  article = document.articles.find((item) => item.id === layout.lead)!;
const props = (language: UiLanguage = 'de') => ({
  articleId: article.id,
  language,
  onClose: vi.fn(),
  headingRef: createRef<HTMLHeadingElement>(),
});
beforeEach(() => {
  localStorage.clear();
  shared.preferences = emptySourcePreferences();
  shared.data = { document, projection: document };
  shared.translate.mockReset().mockResolvedValue({ kind: 'unavailable' });
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async (_name: string, _options: unknown, callback: () => unknown) => callback(),
    },
  });
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});
afterEach(() => {
  cleanup();
  shared.listeners.clear();
  vi.restoreAllMocks();
});
describe('Website internal news reader', () => {
  it('automatically translates an opened foreign headline once in StrictMode and shares its translated title with WRN attribution', async () => {
    const foreign = document.articles.find(
      (item) => item.language === 'en' && !homeReadingSummary(item, document.sourceCommit, 'de'),
    )!;
    shared.translate.mockResolvedValue({
      kind: 'translated',
      title: 'Übersetzter Titel',
      text: '',
      cache: 'hit',
    });
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(
      <StrictMode>
        <WebsiteDirectoryReader {...props()} articleId={foreign.id} />
      </StrictMode>,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Übersetzter Titel' }),
    ).toHaveAttribute('lang', 'de');
    expect(shared.translate).toHaveBeenCalledOnce();
    expect(shared.translate.mock.calls[0]![0]).toEqual({
      title: foreign.title,
      text: '',
      sourceLanguage: 'en',
      targetLanguage: 'de',
    });
    fireEvent.click(screen.getByRole('button', { name: /Teilen/ }));
    expect(share).toHaveBeenCalledWith({
      title: 'Übersetzter Titel',
      text: `Übersetzter Titel · ${foreign.sourceName} · Übersetzt mit World Revolution News`,
      url: `https://solinaridao.com${directoryArticlePath(foreign.id, 'de')}`,
    });
    expect(screen.getByText(foreign.title)).toBeInTheDocument();
  });
  it('discards a delayed translation after changing language and keeps the Original while waiting', async () => {
    const foreign = document.articles.find(
      (item) => item.language === 'en' && !homeReadingSummary(item, document.sourceCommit, 'de'),
    )!;
    let resolve!: (value: unknown) => void;
    shared.translate
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValueOnce({
        kind: 'translated',
        title: 'Titre français',
        text: '',
        cache: 'unknown',
      });
    const view = render(<WebsiteDirectoryReader {...props()} articleId={foreign.id} />);
    await waitFor(() => expect(shared.translate).toHaveBeenCalledOnce());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(foreign.title);
    view.rerender(<WebsiteDirectoryReader {...props('fr')} articleId={foreign.id} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Titre français' }),
    ).toHaveAttribute('lang', 'fr');
    resolve({ kind: 'translated', title: 'Stale German title', text: '', cache: 'miss' });
    await waitFor(() => expect(screen.queryByText('Stale German title')).not.toBeInTheDocument());
    expect(shared.translate.mock.calls[0]![1].aborted).toBe(true);
  });
  it.each(uiLanguageIds)(
    'renders an attributed local WRN note and all reader labels in %s',
    async (language) => {
      const ui = getUiCopy(language),
        copy = getWebsiteHomeCopy(language),
        note = homeReadingSummary(article, document.sourceCommit, language)!;
      render(<WebsiteDirectoryReader {...props(language)} />);
      expect(
        await screen.findByRole('heading', { level: 1, name: note.headline! }),
      ).toHaveAttribute('lang', language);
      expect(screen.getByText(note.text)).toHaveAttribute('lang', language);
      expect(screen.getByLabelText(copy.versions)).toHaveValue(language);
      expect(screen.getByRole('button', { name: new RegExp(ui.saveForLater) })).toBeVisible();
      expect(screen.getByText(copy.metadataNotice)).toBeVisible();
      expect(screen.getByRole('link', { name: new RegExp(ui.openOriginalSource) })).toHaveAttribute(
        'href',
        article.url,
      );
      expect(screen.getByAltText(`${copy.illustrationCredit} · ${note.headline}`)).toHaveAttribute(
        'lang',
        language,
      );
    },
  );
  it('switches both headline and note to another available local language without submitting the original article', async () => {
    render(<WebsiteDirectoryReader {...props()} />);
    await screen.findByRole('heading', {
      level: 1,
      name: homeReadingSummary(article, document.sourceCommit, 'de')!.headline!,
    });
    fireEvent.change(screen.getByLabelText(getWebsiteHomeCopy('de').versions), {
      target: { value: 'el' },
    });
    const note = homeReadingSummary(article, document.sourceCommit, 'el')!;
    expect(screen.getByRole('heading', { level: 1, name: note.headline! })).toHaveAttribute(
      'lang',
      'el',
    );
    expect(screen.getByText(note.text)).toHaveAttribute('lang', 'el');
    expect(screen.getByRole('textbox')).toHaveValue(
      `https://solinaridao.com${directoryArticlePath(article.id, 'el')}`,
    );
  });
  it('shares the selected translated headline with attribution and only the canonical Website link', async () => {
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<WebsiteDirectoryReader {...props()} />);
    await screen.findByRole('heading', {
      level: 1,
      name: homeReadingSummary(article, document.sourceCommit, 'de')!.headline!,
    });
    fireEvent.change(screen.getByLabelText(getWebsiteHomeCopy('de').versions), {
      target: { value: 'fr' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Teilen/ }));
    expect(share).toHaveBeenCalledWith({
      title: homeReadingSummary(article, document.sourceCommit, 'fr')!.headline,
      text: `${homeReadingSummary(article, document.sourceCommit, 'fr')!.headline} · ${article.sourceName}`,
      url: `https://solinaridao.com${directoryArticlePath(article.id, 'fr')}`,
    });
  });
  it('provides clipboard sharing and a manually selectable link when native share is absent', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<WebsiteDirectoryReader {...props()} />);
    await screen.findByRole('button', { name: /Teilen/ });
    fireEvent.click(screen.getByRole('button', { name: /Teilen/ }));
    await screen.findByText(getWebsiteHomeCopy('de').copied);
    expect(writeText).toHaveBeenCalledWith(
      `https://solinaridao.com${directoryArticlePath(article.id, 'de')}`,
    );
  });
  it('persists save/read separately, displays the saved entry and removes it only through user action', async () => {
    const view = render(<WebsiteDirectoryReader {...props()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Später lesen/ }));
    await screen.findByRole('button', { name: /Aus.*Gespeichert.*entfernen/ });
    fireEvent.click(screen.getByRole('button', { name: /Als gelesen markieren/ }));
    await screen.findByRole('button', { name: /Als ungelesen markieren/ });
    expect(JSON.parse(localStorage.getItem(newsReadingStorageKey)!).entries[0]).toMatchObject({
      articleId: article.id,
      saved: true,
      read: true,
    });
    view.unmount();
    render(<WebsiteNewsSaved language="de" />);
    expect(
      await screen.findByRole('link', {
        name: homeReadingSummary(article, document.sourceCommit, 'de')!.headline!,
      }),
    ).toHaveAttribute('href', directoryArticlePath(article.id, 'de'));
    fireEvent.click(screen.getByRole('button', { name: /Aus.*Gespeichert.*entfernen/ }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(newsReadingStorageKey)!).entries[0]).toMatchObject({
        saved: false,
        read: true,
      }),
    );
  });
  it('immediately removes the reader content/actions after a source is hidden, without deleting saved IDs', async () => {
    localStorage.setItem(
      newsReadingStorageKey,
      JSON.stringify({
        schema: newsReadingStorageKey,
        entries: [{ articleId: article.id, saved: true, read: false }],
      }),
    );
    const view = render(<WebsiteDirectoryReader {...props()} />);
    const headline = homeReadingSummary(article, document.sourceCommit, 'de')!.headline!;
    await screen.findByRole('heading', { level: 1, name: headline });
    shared.preferences = setSourcePreference(
      emptySourcePreferences(),
      'directory',
      article.endpointIds[0]!,
      'hide',
    );
    view.rerender(<WebsiteDirectoryReader {...props()} />);
    expect(screen.queryByRole('heading', { name: headline })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Teilen/ })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(newsReadingStorageKey)!).entries).toHaveLength(1);
  });
  it('uses normal same-tab navigation while preserving browser modifier/open-new-tab behavior', () => {
    const open = vi.fn();
    render(
      <DirectoryReaderNavigation.Provider value={open}>
        <DirectoryArticleLink id={article.id} language="de">
          Titel
        </DirectoryArticleLink>
      </DirectoryReaderNavigation.Provider>,
    );
    const link = screen.getByRole('link', { name: 'Titel' });
    expect(link).not.toHaveAttribute('target');
    fireEvent.click(link, { ctrlKey: true });
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(open).toHaveBeenCalledWith(article.id, link);
  });
});
