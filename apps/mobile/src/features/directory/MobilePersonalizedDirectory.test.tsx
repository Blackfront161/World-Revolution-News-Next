import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createLocalPersonalizationState,
  emptySourcePreferences,
  setSourcePreference,
} from '@wrn/domain';
import { SourcePreferencesProvider } from '../../../../../packages/browser-content/src/source-preferences-ui';
import {
  projectMobileContentDirectory,
  type MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import snapshot from './data/content-directory-v1.json';
import { MobilePersonalizedDirectory } from './MobilePersonalizedDirectory';

const document = snapshot as MobileContentDirectory;
const projection = projectMobileContentDirectory(document);
const state = createLocalPersonalizationState({
  interestIds: ['movement-news'],
  regionIds: [],
  contentLanguageIds: [],
})!;

describe('personalized mobile directory links', () => {
  it('shows only current matching metadata with source, dates and safe original links', async () => {
    const matching = projection.articles.find(
      (article) => !article.historical && article.topics.includes('Movement News'),
    )!;
    const other = projection.articles.find(
      (article) => !article.historical && !article.topics.includes('Movement News'),
    )!;
    const historical = { ...matching, id: 'historical-copy', historical: true };
    const load = vi.fn(async () => ({
      document,
      projection: { ...projection, articles: [matching, other, historical] },
    }));
    render(<MobilePersonalizedDirectory language="en" state={state} load={load} />);

    const section = await screen.findByRole('region', { name: 'Current links for me' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(1);
    expect(within(section).getByText(matching.title)).toBeVisible();
    expect(within(section).getByText(matching.sourceName)).toBeVisible();
    expect(within(section).getByText(/Stand: 2026-09-09|Snapshot: 2026-09-09/)).toBeVisible();
    expect(within(section).getByText(/metadata and original links/i)).toBeVisible();
    expect(within(section).queryByText(other.title)).toBeNull();
    const link = within(section).getByRole('link');
    expect(link).toHaveAttribute('href', matching.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(within(section).queryByRole('button', { name: /read article/i })).toBeNull();
    expect(load).toHaveBeenCalledWith();
  });

  it('keeps a precise empty state when explicit choices have no current directory match', async () => {
    const languageState = createLocalPersonalizationState({
      interestIds: [],
      regionIds: [],
      contentLanguageIds: ['de'],
    })!;
    const undArticle = projection.articles.find(
      (article) => !article.historical && article.language === 'und',
    )!;
    render(
      <MobilePersonalizedDirectory
        language="de"
        state={languageState}
        load={async () => ({
          document,
          projection: { ...projection, articles: [undArticle] },
        })}
      />,
    );
    const section = await screen.findByRole('region', { name: 'Aktuelle Links für mich' });
    expect(within(section).getByRole('status')).toHaveTextContent('Keine');
    expect(within(section).queryByRole('link')).toBeNull();
  });

  it('honors a hidden source even when its current article has no endpoint IDs', async () => {
    const source = projection.sources.find((entry) => entry.name === 'Electronic Frontier Foundation')!;
    const hidden = projection.articles.find(
      (article) =>
        !article.historical &&
        article.sourceName === source.name &&
        article.endpointIds.length === 0 &&
        article.topics.includes('Movement News'),
    )!;
    const visible = projection.articles.find(
      (article) =>
        !article.historical &&
        article.sourceName !== source.name &&
        article.topics.includes('Movement News'),
    )!;
    const storageKey = 'wrn.personalized-directory-source-test';
    const choices = setSourcePreference(emptySourcePreferences(), 'directory', source.id, 'hide')!;
    localStorage.setItem(storageKey, JSON.stringify(choices));
    try {
      render(
        <SourcePreferencesProvider storageKey={storageKey} language="en">
          <MobilePersonalizedDirectory
            language="en"
            state={state}
            load={async () => ({
              document,
              projection: { ...projection, articles: [hidden, visible] },
            })}
          />
        </SourcePreferencesProvider>,
      );
      const section = await screen.findByRole('region', { name: 'Current links for me' });
      expect(await within(section).findByText(visible.title)).toBeVisible();
      expect(within(section).queryByText(hidden.title)).toBeNull();
    } finally {
      localStorage.removeItem(storageKey);
    }
  });
});
