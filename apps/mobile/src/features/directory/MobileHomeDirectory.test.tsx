import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import {
  SourcePreferencesProvider,
  SourceChoiceControls,
} from '../../../../../packages/browser-content/src/source-preferences-ui';
import {
  projectMobileContentDirectory,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import snapshot from './data/content-directory-v1.json';
import { MobileHomeDirectory } from './MobileHomeDirectory';
import { selectHomeDirectoryArticles } from './home-directory-selection';

const document = snapshot as MobileContentDirectory;
const data = { document, projection: projectMobileContentDirectory(document) };
afterEach(() => localStorage.removeItem('wrn.mobile.source-preferences.v1'));

describe('real Home directory selection', () => {
  it('projects scoped followed/hidden endpoints after stable sorting and before the five-slot cap', () => {
    const base = data.projection.articles[0]!;
    const hiddenId = `source-${'a'.repeat(64)}`;
    const followedId = `source-${'b'.repeat(64)}`;
    const articles = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
      ...base,
      id,
      language: 'en',
      publishedAt: null,
      endpointIds: id === 'a' ? [hiddenId] : id === 'g' ? [followedId] : [],
    }));
    const choices = setSourcePreference(
      setSourcePreference(emptySourcePreferences(), 'directory', followedId, 'follow')!,
      'directory',
      hiddenId,
      'hide',
    )!;
    expect(
      selectHomeDirectoryArticles(articles, 'en', choices).map((article) => article.id),
    ).toEqual(['g', 'b', 'c', 'd', 'e']);
    expect(
      selectHomeDirectoryArticles(
        articles,
        'en',
        setSourcePreference(emptySourcePreferences(), 'directory', hiddenId, 'hide')!,
      ).map((article) => article.id),
    ).toEqual(['b', 'c', 'd', 'e', 'f']);
    expect(
      selectHomeDirectoryArticles(
        articles,
        'en',
        setSourcePreference(emptySourcePreferences(), 'production', hiddenId, 'hide')!,
      ).map((article) => article.id),
    ).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(articles.map((article) => article.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('updates real Home references when the provider follows, hides and restores an endpoint', async () => {
    const endpointId = 'source-29fc972c91f79e665a490767d523a69e3b3a5ce82fc8663ab1980021392dfdb5';
    const matchingIds = new Set(
      data.projection.articles
        .filter((article) => article.endpointIds.includes(endpointId))
        .map((article) => article.id),
    );
    expect(matchingIds.size).toBeGreaterThan(5);
    render(
      <SourcePreferencesProvider storageKey="wrn.mobile.source-preferences.v1" language="en">
        <SourceChoiceControls catalog="directory" sourceId={endpointId} name="Evrensel" />
        <MobileHomeDirectory language="en" load={async () => data} onBrowse={() => {}} />
      </SourcePreferencesProvider>,
    );
    const region = screen.getByRole('region', { name: 'From the news archive' });
    await within(region).findAllByRole('listitem');
    const ids = () =>
      [...region.querySelectorAll('[data-home-directory-article]')].map((el) =>
        el.getAttribute('data-home-directory-article'),
      );
    const baseline = ids();
    fireEvent.click(screen.getByRole('button', { name: 'Follow: Evrensel' }));
    expect(ids()).toHaveLength(5);
    expect(ids().every((id) => id !== null && matchingIds.has(id))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Hide: Evrensel' }));
    expect(ids()).toHaveLength(5);
    expect(ids().every((id) => id !== null && !matchingIds.has(id))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Show again: Evrensel' }));
    expect(ids()).toEqual(baseline);
  });

  it('prefers the requested language, orders dates and ties, puts missing dates last, without mutating inputs', () => {
    const base = data.projection.articles[0]!;
    const articles = [
      { ...base, id: 'c', language: 'de', publishedAt: null },
      { ...base, id: 'b', language: 'de', publishedAt: '2026-09-02T10:00:00.000Z' },
      { ...base, id: 'a', language: 'de', publishedAt: '2026-09-02T10:00:00.000Z' },
      { ...base, id: 'd', language: 'en', publishedAt: '2026-09-09T10:00:00.000Z' },
      { ...base, id: 'e', language: 'en', publishedAt: null },
      { ...base, id: 'f', language: 'en', publishedAt: null },
    ];
    expect(selectHomeDirectoryArticles(articles, 'de').map((a) => a.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    expect(articles.map((a) => a.id)).toEqual(['c', 'b', 'a', 'd', 'e', 'f']);
    const withdrawn = structuredClone(document);
    const removed = selectHomeDirectoryArticles(data.projection.articles, 'de')[0]!;
    withdrawn.withdrawals.articleIds.push(removed.id);
    expect(
      selectHomeDirectoryArticles(projectMobileContentDirectory(withdrawn).articles, 'de').some(
        (a) => a.id === removed.id,
      ),
    ).toBe(false);
  });

  it('shows five real headlines as external links, snapshot date and directory navigation, without reader or save controls', async () => {
    const browse = vi.fn();
    render(<MobileHomeDirectory language="de" load={async () => data} onBrowse={browse} />);
    const region = screen.getByRole('region', { name: 'Aus dem Nachrichtenarchiv' });
    expect(await within(region).findAllByRole('listitem')).toHaveLength(5);
    expect(within(region).getByText(/Stand: /)).toBeInTheDocument();
    for (const link of within(region).getAllByRole('link')) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    }
    expect(within(region).getAllByRole('button')).toHaveLength(1);
    fireEvent.click(within(region).getByRole('button', { name: /Nachrichtenverzeichnis/ }));
    expect(browse).toHaveBeenCalledOnce();
  });

  it('reports a loading failure and lets a retry reach an honest empty state', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ ...data, projection: { ...data.projection, articles: [] } });
    render(<MobileHomeDirectory language="en" load={load} onBrowse={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByRole('alert')).toHaveTextContent('could not');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No matching entries')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
