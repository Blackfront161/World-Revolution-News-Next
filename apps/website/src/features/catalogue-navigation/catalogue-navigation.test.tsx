import { createRef, StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUiCopy, uiLanguageIds } from '@wrn/ui-language';
import {
  projectMobileKnowledge,
  validateMobileKnowledge,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import knowledge from '../knowledge/packed/legacy-knowledge-v1.json';
import catalog from '../events-media/packed/production-events-media-v1.json';
import { WebsiteKnowledgeRoute } from '../knowledge/WebsiteKnowledgeRoute';
import { WebsiteAppCatalog } from '../events-media/WebsiteAppCatalog';
import { getWebsiteHomeCopy } from '../home/website-home-copy';
import { catalogueHref } from './catalogue-location';
import { emptyCatalogueView } from './catalogue-location';
import { draftKnowledgeTermIds, knowledgeDraftCopy } from '../knowledge/lexicon-editorial-status';
const shared = vi.hoisted(() => ({ knowledge: null as unknown }));
vi.mock('../knowledge/knowledge-loader', () => ({
  loadWebsiteKnowledge: async () => shared.knowledge,
}));
vi.mock('../events-media/events-media-loader', () => ({
  loadWebsiteAppCatalog: async () => ({ current: catalog.current }),
}));
const document = validateMobileKnowledge(knowledge.currentKnowledge).value!;
const book = document.library.books[0]!,
  podcast = catalog.current.collections.podcasts[0]!;
beforeEach(() => {
  shared.knowledge = {
    document,
    glossaryDocument: document,
    projection: projectMobileKnowledge(document),
    draftTermIds: draftKnowledgeTermIds(document),
  };
  window.history.replaceState({}, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('website metadata item views', () => {
  it.each(uiLanguageIds)('shows the original term draft notice in %s', async (language) => {
    window.history.replaceState({}, '', catalogueHref('lexicon', language, 'worker-cooperative'));
    render(<WebsiteKnowledgeRoute language={language} headingRef={createRef()} />);
    expect(await screen.findByText(knowledgeDraftCopy[language])).toBeVisible();
  });
  it('restores a control and position after StrictMode cancels the initial animation frame', async () => {
    window.history.replaceState(
      {
        wrnCatalogueReturn: {
          kind: 'library',
          view: { ...emptyCatalogueView, query: book.title },
          scrollY: 120,
          focusItem: null,
          focusControl: 'query',
        },
      },
      '',
      '#knowledge/library',
    );
    render(
      <StrictMode>
        <WebsiteKnowledgeRoute language="de" headingRef={createRef()} />
      </StrictMode>,
    );
    const input = await screen.findByRole('textbox');
    expect(input).toHaveValue(book.title);
    await waitFor(() => expect(input).toHaveFocus());
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'instant' });
  });
  it('media filters retain the chosen value when resetting pagination in the same event', async () => {
    window.history.replaceState({}, '', '#media/podcasts');
    render(<WebsiteAppCatalog mode="media" language="de" />);
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: podcast.title } });
    expect(input).toHaveValue(podcast.title);
    expect(await screen.findByRole('link', { name: podcast.title })).toBeVisible();
    expect(window.history.state.wrnCatalogueReturn.view.query).toBe(podcast.title);
  });
  it.each(uiLanguageIds)(
    'opens a bound book in %s with canonical share fallback',
    async (language) => {
      window.history.replaceState({}, '', catalogueHref('library', language, book.id));
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      render(<WebsiteKnowledgeRoute language={language} headingRef={createRef()} />);
      expect(await screen.findByRole('heading', { name: book.title, level: 2 })).toHaveAttribute(
        'lang',
        book.languages[0],
      );
      expect(
        screen.getByRole('button', { name: new RegExp(getUiCopy(language).back) }),
      ).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: getUiCopy(language).share }));
      await waitFor(() =>
        expect(writeText).toHaveBeenCalledWith(
          `https://solinaridao.com${catalogueHref('library', language, book.id)}`,
        ),
      );
      expect(
        screen.getByRole('textbox', { name: getWebsiteHomeCopy(language).copyLink }),
      ).toHaveValue(`https://solinaridao.com${catalogueHref('library', language, book.id)}`);
      expect(screen.getByRole('link')).toHaveAttribute('href', book.readUrl);
    },
  );
  it('opens a podcast by stable ID with no audio request and shares only its website URL', async () => {
    window.history.replaceState({}, '', catalogueHref('podcasts', 'de', podcast.id));
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<WebsiteAppCatalog mode="media" language="de" />);
    expect(await screen.findByRole('heading', { name: podcast.title })).toHaveAttribute(
      'lang',
      podcast.language,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', podcast.url);
    expect(window.document.querySelector('audio')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Teilen' }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: podcast.title,
        url: `https://solinaridao.com${catalogueHref('podcasts', 'de', podcast.id)}`,
      }),
    );
  });
  it.each([
    '#knowledge/library?item=missing-book',
    '#knowledge/lexicon?item=unknown-term',
    '#knowledge/lexicon?item=a&item=b',
  ])('does not substitute another item for %s', async (hash) => {
    window.history.replaceState({}, '', hash);
    render(<WebsiteKnowledgeRoute language="de" headingRef={createRef()} />);
    expect(
      await screen.findByRole('heading', { name: getUiCopy('de').locallyUnavailable }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Teilen' })).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('restores actual native Back focus, filters and pagination from the prior catalogue entry', async () => {
    window.history.replaceState({}, '', '#knowledge/library');
    render(<WebsiteKnowledgeRoute language="de" headingRef={createRef()} />);
    const filters = await screen.findAllByRole('textbox');
    fireEvent.change(filters[0]!, { target: { value: book.title } });
    const trigger = await screen.findByRole('link', { name: book.title });
    fireEvent.click(trigger);
    await screen.findByRole('heading', { name: book.title, level: 2 });
    const saved = window.history.state;
    expect(saved.wrnCatalogueItemId).toBe(book.id);
    fireEvent.click(screen.getByRole('button', { name: /Zurück/ }));
    await waitFor(() => expect(window.location.hash).toBe('#knowledge/library'));
    expect(screen.getByRole('textbox')).toHaveValue(book.title);
    await waitFor(() => expect(screen.getByRole('link', { name: book.title })).toHaveFocus());
  });
});
