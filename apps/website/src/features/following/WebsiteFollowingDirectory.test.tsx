import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createLocalPersonalizationState,
  emptySourcePreferences,
  projectPersonalizedDirectoryArticles,
  setSourcePreference,
} from '@wrn/domain';
import {
  projectMobileContentDirectory,
  validateMobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import snapshot from '../directory/data/content-directory-v1.json';
import type { WebsiteContentDirectory } from '../directory/directory-loader';
import { WebsiteFollowingDirectory } from './WebsiteFollowingDirectory';
import { directoryArticlePath } from '../reader/directory-article-url';

const sourcePreference = vi.hoisted(() => ({ state: null as unknown }));
vi.mock('../../../../../packages/browser-content/src/source-preferences-ui', () => ({
  useSourcePreferences: () => ({ state: sourcePreference.state }),
}));

if (!validateMobileContentDirectory(snapshot)) throw new Error('Invalid directory fixture');
const directory: WebsiteContentDirectory = {
  document: snapshot,
  projection: projectMobileContentDirectory(snapshot),
};
const preferences = createLocalPersonalizationState({
  interestIds: [],
  regionIds: [],
  contentLanguageIds: ['en'],
});
if (!preferences) throw new Error('Invalid personalization fixture');
const matching = projectPersonalizedDirectoryArticles({
  state: preferences,
  articles: directory.projection.articles,
});

beforeEach(() => {
  sourcePreference.state = emptySourcePreferences();
});
afterEach(() => vi.restoreAllMocks());

it('shows only current local matches as dated source metadata with Website reader links and loads more', async () => {
  const loadDirectory = vi.fn(async (_signal: AbortSignal) => directory);
  render(
    <WebsiteFollowingDirectory
      language="en"
      preferences={preferences}
      loadDirectory={loadDirectory}
    />,
  );
  expect(await screen.findByText(`Showing 30 of ${matching.length}`)).toBeVisible();
  expect(loadDirectory).toHaveBeenCalledOnce();
  expect(loadDirectory.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  expect(screen.getByText(/metadata and original links/i)).toBeVisible();
  expect(screen.getByText(`Snapshot: ${directory.document.observedAt.slice(0, 10)}`)).toBeVisible();
  const list = screen.getByRole('list');
  expect(within(list).getAllByRole('listitem')).toHaveLength(30);
  const first = matching[0]!;
  expect(within(list).getByRole('link', { name: first.title })).toHaveAttribute(
    'href',
    directoryArticlePath(first.id, 'en'),
  );
  expect(within(list).getByRole('link', { name: first.title })).not.toHaveAttribute('target');
  fireEvent.click(screen.getByRole('button', { name: 'Load 30 more' }));
  expect(screen.getByText(`Showing ${matching.length} of ${matching.length}`)).toBeVisible();
  expect(within(list).getAllByRole('listitem')).toHaveLength(matching.length);
});

it('respects a locally hidden directory source while retaining other matching links', async () => {
  const hidden = matching.find((article) => article.endpointIds.length > 0)!;
  sourcePreference.state = setSourcePreference(
    emptySourcePreferences(),
    'directory',
    hidden.endpointIds[0]!,
    'hide',
  );
  render(
    <WebsiteFollowingDirectory
      language="de"
      preferences={preferences}
      loadDirectory={async () => directory}
    />,
  );
  expect(await screen.findByRole('heading', { name: 'Aktuelle Links für mich' })).toBeVisible();
  expect(screen.queryByRole('link', { name: hidden.title })).not.toBeInTheDocument();
  expect(screen.getByText(/von \d+ angezeigt/)).toBeVisible();
});

it('also respects a hidden source on legacy links without endpoint IDs', async () => {
  const movement = createLocalPersonalizationState({
    interestIds: ['movement-news'],
    regionIds: [],
    contentLanguageIds: [],
  })!;
  const candidates = projectPersonalizedDirectoryArticles({
    state: movement,
    articles: directory.projection.articles,
  });
  const hidden = candidates.find(
    (article) =>
      article.endpointIds.length === 0 &&
      directory.projection.sources.some((source) => source.name === article.sourceName),
  )!;
  const visible = candidates.find((article) => article.sourceName !== hidden.sourceName)!;
  const source = directory.projection.sources.find((entry) => entry.name === hidden.sourceName)!;
  sourcePreference.state = setSourcePreference(
    emptySourcePreferences(),
    'directory',
    source.id,
    'hide',
  );
  const reduced: WebsiteContentDirectory = {
    ...directory,
    projection: { ...directory.projection, articles: [hidden, visible] },
  };
  render(
    <WebsiteFollowingDirectory
      language="de"
      preferences={movement}
      loadDirectory={async () => reduced}
    />,
  );
  expect(await screen.findByText('1 von 1 angezeigt')).toBeVisible();
  expect(screen.queryByRole('link', { name: hidden.title })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: visible.title })).toBeVisible();
});
