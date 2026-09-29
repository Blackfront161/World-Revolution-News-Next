import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import {
  ProductionHome,
  type ProductionHomeDirectory,
} from '../../../packages/browser-content/src/production-home';
import type {
  DirectoryTitleTranslation,
  ProductionTranslationAdapter,
  ProductionTranslationOutcome,
} from '../../../packages/browser-content/src/production-translation';

it('puts the newest original-source reports before older full-text reading pieces', async () => {
  const report = (id: string, language: string, day: string) => ({
    id,
    url: `https://source.example/${id}`,
    title: `Report ${id}`,
    sourceName: `Source ${id}`,
    language,
    publishedAt: `2026-09-${day}T08:00:00.000Z`,
    endpointIds: [],
    observations: [],
  });
  const directory = {
    document: { sourceCommit: 'fixture-revision', observedAt: '2026-09-27T10:00:00.000Z' },
    projection: {
      articles: [
        report('older', 'de', '10'),
        report('newest', 'en', '27'),
        report('middle', 'tr', '26'),
      ],
      sources: [],
      sports: [],
    },
  } as unknown as ProductionHomeDirectory;
  const olderFullText = {
    id: 'wrn-art-00000000000000000000000000000001',
    title: 'Reviewed full text from 19 September',
    publishedAt: '2026-09-19T08:00:00.000Z',
    tags: [],
  } as unknown as ProductionArticleV1;

  render(
    <ProductionHome
      articles={[olderFullText]}
      language="de"
      sourcePreferences={emptySourcePreferences()}
      renderCard={(article) => <article key={article.id}>{article.title}</article>}
      loadDirectory={vi.fn(async () => directory)}
      prioritizeCurrentLinks
    />,
  );

  await screen.findByRole('link', { name: /Report newest/ });
  const currentHeading = screen.getByRole('heading', { name: 'Aktuelle Meldungen' });
  const current = currentHeading.closest('section')!;
  const links = within(current).getAllByRole('link');
  expect(links.map((link) => link.textContent?.trim())).toEqual([
    'Report newest ↗',
    'Report middle ↗',
    'Report older ↗',
  ]);
  expect(links[0]).toHaveAttribute('href', 'https://source.example/newest');
  expect(links[0]).toHaveAttribute('target', '_blank');
  expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByRole('heading', { name: 'Lesestück im Blickpunkt' })).toBeInTheDocument();
  expect(screen.getByText(olderFullText.title)).toBeInTheDocument();
  expect(document.querySelector('.production-home')?.firstElementChild).toBe(current);
});

it('places the website image lead before the current-link sidebar in DOM order', async () => {
  const fullText = {
    id: 'wrn-art-00000000000000000000000000000002',
    title: 'Reviewed lead',
    publishedAt: '2026-09-19T08:00:00.000Z',
    tags: [],
  } as unknown as ProductionArticleV1;
  const directory = {
    document: { sourceCommit: 'fixture-sidebar', observedAt: '2026-09-27T10:00:00.000Z' },
    projection: {
      articles: [
        {
          id: 'current',
          url: 'https://source.example/current',
          title: 'Current original',
          sourceName: 'Source',
          language: 'en',
          publishedAt: '2026-09-27T08:00:00.000Z',
          endpointIds: [],
          observations: [],
        },
      ],
      sources: [],
      sports: [],
    },
  } as unknown as ProductionHomeDirectory;
  render(
    <ProductionHome
      articles={[fullText]}
      language="de"
      sourcePreferences={emptySourcePreferences()}
      renderCard={(article) => <article>{article.title}</article>}
      loadDirectory={vi.fn(async () => directory)}
      prioritizeCurrentLinks
      leadWithCurrentSidebar
    />,
  );
  await screen.findByRole('link', { name: /Current original/ });
  const front = document.querySelector('.production-home__front-grid');
  expect(document.querySelector('.production-home')?.firstElementChild).toBe(front);
  expect(front?.children[0]).toContainElement(
    screen.getByRole('heading', { name: 'Lesestück im Blickpunkt' }),
  );
  expect(front?.children[1]).toContainElement(
    screen.getByRole('heading', { name: 'Aktuelle Meldungen' }),
  );
  expect(screen.getByRole('link', { name: /Current original/ })).toHaveAttribute(
    'href',
    'https://source.example/current',
  );
});

it('translates a known-language current title automatically and keeps unknown language and original links intact', async () => {
  const report = (id: string, language: string) => ({
    id,
    url: `https://source.example/${id}`,
    title: `Original ${id}`,
    sourceName: 'Example source',
    language,
    publishedAt: '2026-09-27T08:00:00.000Z',
    endpointIds: [],
    observations: [],
  });
  const directory = {
    document: { sourceCommit: 'fixture-translation', observedAt: '2026-09-27T10:00:00.000Z' },
    projection: {
      articles: [report('known', 'en'), report('unknown', 'und')],
      sources: [],
      sports: [],
    },
  } as unknown as ProductionHomeDirectory;
  const identity = { id: 'fixture', version: '1', provider: 'fixture-provider' };
  const translateDirectoryTitle = vi.fn(async (_title: DirectoryTitleTranslation) => {
    void _title;
    return {
      kind: 'translated',
      identity: 'fixture',
      response: {
        translation: { text: 'Übersetzter Titel' },
        cache: { expiresAt: new Date(Date.now() + 60_000).toISOString() },
      },
    } as ProductionTranslationOutcome;
  });
  const adapter: ProductionTranslationAdapter = {
    identity,
    translate: async () => ({ kind: 'unavailable' }),
    translateDirectoryTitle,
  };
  render(
    <ProductionHome
      articles={[]}
      language="de"
      sourcePreferences={emptySourcePreferences()}
      renderCard={() => null}
      loadDirectory={vi.fn(async () => directory)}
      translationAdapter={adapter}
      prioritizeCurrentLinks
    />,
  );
  expect(await screen.findByText('Übersetzter Titel', {}, { timeout: 5000 })).toBeVisible();
  expect(screen.getByText('Original known').closest('small')).toHaveTextContent(
    'Maschinell übersetzt · Original: Original known',
  );
  expect(screen.getByRole('link', { name: /Übersetzter Titel/ })).toHaveAttribute(
    'href',
    'https://source.example/known',
  );
  expect(screen.getByRole('link', { name: /Original unknown/ })).toHaveAttribute(
    'href',
    'https://source.example/unknown',
  );
  expect(translateDirectoryTitle).toHaveBeenCalledTimes(1);
  expect(translateDirectoryTitle.mock.calls[0]?.[0]).toMatchObject({
    kind: 'directory-title',
    text: 'Original known',
    sourceLanguage: 'en',
    targetLanguage: 'de',
  });
});

it('keeps a hidden legacy source off the current headline strip without endpoint IDs', async () => {
  const sourceId = `source-${'a'.repeat(64)}`;
  const directory = {
    document: { sourceCommit: 'fixture-hidden', observedAt: '2026-09-27T10:00:00.000Z' },
    projection: {
      articles: [
        {
          id: 'hidden',
          url: 'https://source.example/hidden',
          title: 'Hidden report',
          sourceName: 'Hidden source',
          language: 'en',
          publishedAt: '2026-09-27T08:00:00.000Z',
          endpointIds: [],
          observations: [],
        },
      ],
      sources: [
        {
          id: sourceId,
          url: 'https://source.example/',
          name: 'Hidden source',
          languages: ['en'],
          mediaType: null,
          historicalHttp: false,
          accessNote: null,
          observations: [],
        },
      ],
      sports: [],
    },
  } as unknown as ProductionHomeDirectory;
  const preferences = setSourcePreference(emptySourcePreferences(), 'directory', sourceId, 'hide')!;
  render(
    <ProductionHome
      articles={[]}
      language="de"
      sourcePreferences={preferences}
      renderCard={() => null}
      loadDirectory={vi.fn(async () => directory)}
      prioritizeCurrentLinks
    />,
  );
  expect(await screen.findByText('Stand: 2026-09-27')).toBeVisible();
  expect(screen.queryByRole('link', { name: /Hidden report/ })).not.toBeInTheDocument();
});
