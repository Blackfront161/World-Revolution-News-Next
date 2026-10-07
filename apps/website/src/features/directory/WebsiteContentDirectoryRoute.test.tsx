import { matchesDirectorySource } from '../../../../../packages/browser-content/src/source-search';
import {
  validateMobileContentDirectory,
  projectMobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import { SourcePreferencesProvider } from '../../../../../packages/browser-content/src/source-preferences-ui';
import { createSourcePreferencesStore } from '../../../../../packages/browser-content/src/source-preferences-state';
import snapshot from '../projection/data/content-directory-v1.json';
import fullOverlayRaw from '../../../../../packages/browser-content/src/data/source-pass-overlay-v1.json?raw';
import { WebsiteContentDirectoryRoute } from './WebsiteContentDirectoryRoute';

afterEach(() => vi.restoreAllMocks());

const mockContentFetch = () =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : ((input as Request | undefined)?.url ?? '');
    const body =
      url === '/wrn-source-passes/current.json' ? fullOverlayRaw : JSON.stringify(snapshot);
    return new Response(body, { headers: { 'content-type': 'application/json' } });
  });

it('finds the existing Direkte Aktion source by domain and name', async () => {
  mockContentFetch();
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
  await screen.findByText('Showing 30 of 547');
  for (const query of [' DIREKTEAKTION.ORG ', 'Direkte Aktion']) {
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: query } });
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Direkte Aktion (DE)' })).toHaveAttribute(
      'href',
      'https://direkteaktion.org/',
    );
  }
});

it('finds every admitted source by recorded names, endpoint and homepage domains', () => {
  if (!validateMobileContentDirectory(snapshot)) throw new Error('Invalid source snapshot');
  const sources = projectMobileContentDirectory(snapshot).sources;
  expect(sources).toHaveLength(547);
  for (const source of sources) {
    const queries = new Set([
      source.name,
      source.url,
      new URL(source.url).hostname.toUpperCase(),
      ...source.observations.flatMap((entry) => [
        entry.name,
        ...(entry.homepage ? [entry.homepage, new URL(entry.homepage).hostname.toUpperCase()] : []),
      ]),
    ]);
    for (const query of queries) {
      expect(matchesDirectorySource(source, ` ${query} `), `${source.id}: ${query}`).toBe(true);
    }
    expect(matchesDirectorySource(source, 'no-such-source.invalid')).toBe(false);
  }
});
it('uses recorded aliases and homepage domains in the rendered source search', async () => {
  mockContentFetch();
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
  await screen.findByText('Showing 30 of 547');
  for (const [query, href] of [
    ['CrimethInc. (Global)', 'https://crimethinc.com/'],
    ['ZNet (Global)', 'https://znetwork.org/'],
    [' WWW.269LIBERATIONANIMALE.FR ', 'https://269liberationanimale.fr/'],
  ]) {
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: query } });
    expect(
      Array.from(document.querySelectorAll('a')).some((link) => link.getAttribute('href') === href),
      query,
    ).toBe(true);
  }
});

it('opens every available directory article for a selected source', async () => {
  expect(
    snapshot.articles
      .filter((article) => article.sourceName === 'Indymedia Argentina')
      .every((article) => article.endpointIds.length === 0),
  ).toBe(true);
  mockContentFetch();
  const onSectionChange = vi.fn();
  const props = { language: 'en' as const, headingRef: { current: null }, onSectionChange };
  const view = render(<WebsiteContentDirectoryRoute {...props} section="sources" />);
  await screen.findByText('Showing 30 of 547');
  fireEvent.change(screen.getByLabelText('Search'), {
    target: { value: 'Indymedia Argentina' },
  });
  expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'All news from this source (20)' })[0]!);
  expect(onSectionChange).toHaveBeenCalledWith('news');
  view.rerender(<WebsiteContentDirectoryRoute {...props} section="news" />);
  expect(screen.getByText('Showing 20 of 20')).toBeInTheDocument();
});

it('hides a legacy article without endpoint IDs but reveals it for an explicit source filter', async () => {
  if (!validateMobileContentDirectory(snapshot)) throw new Error('Invalid source snapshot');
  const projected = projectMobileContentDirectory(snapshot);
  const article = projected.articles.find(
    (entry) => entry.sourceName === 'Indymedia Argentina' && entry.endpointIds.length === 0,
  )!;
  const source = projected.sources.find((entry) => entry.name === article.sourceName)!;
  const hidden = setSourcePreference(emptySourcePreferences(), 'directory', source.id, 'hide')!;
  const storage = {
    getItem: () => JSON.stringify(hidden),
    setItem: () => {},
    removeItem: () => {},
  };
  const createStore = (key: string) =>
    createSourcePreferencesStore(key, storage, new EventTarget());
  mockContentFetch();
  render(
    <SourcePreferencesProvider
      storageKey="website-directory-test"
      language="en"
      createStore={createStore}
    >
      <WebsiteContentDirectoryRoute
        language="en"
        section="news"
        headingRef={{ current: null }}
        onSectionChange={() => {}}
      />
    </SourcePreferencesProvider>,
  );
  await screen.findByText('Snapshot: 2026-10-07');
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: article.title } });
  await waitFor(() => expect(screen.getByText('Showing 0 of 0')).toBeVisible());
  expect(screen.queryByRole('link', { name: article.title })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Source'), { target: { value: article.sourceName } });
  expect(screen.getByText('Showing 1 of 1')).toBeVisible();
  expect(screen.getByRole('link', { name: article.title })).toHaveAttribute('href', article.url);
});

it('opens articles from a curated source pass with different pass and endpoint IDs', async () => {
  mockContentFetch();
  const onSectionChange = vi.fn();
  const props = { language: 'en' as const, headingRef: { current: null }, onSectionChange };
  const view = render(<WebsiteContentDirectoryRoute {...props} section="sources" />);
  const button = await screen.findByRole(
    'button',
    { name: 'All news from this source: Electronic Frontier Foundation (10)' },
    { timeout: 5000 },
  );
  fireEvent.click(button);
  expect(onSectionChange).toHaveBeenCalledWith('news');
  view.rerender(<WebsiteContentDirectoryRoute {...props} section="news" />);
  expect(screen.getByText('Showing 10 of 10')).toBeInTheDocument();
  expect(screen.getByText('Source:')).toBeInTheDocument();
  expect(
    screen.getByText('Electronic Frontier Foundation', { selector: 'strong' }),
  ).toBeInTheDocument();
});

it('renders canonical source passes before the complete endpoint list with combined facets', async () => {
  mockContentFetch();
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
  expect(
    await screen.findByRole('heading', { name: 'Curated active sources' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Historical and current directory endpoints' }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole('heading', { name: 'Center for a Stateless Society', level: 3 }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Topic or tendency'), { target: { value: 'privacy' } });
  expect(
    screen.getByRole('heading', { name: 'Electronic Frontier Foundation', level: 3 }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'Center for a Stateless Society', level: 3 }),
  ).not.toBeInTheDocument();
});
