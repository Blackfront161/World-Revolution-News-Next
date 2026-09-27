import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ProductionArticleV1 } from '@wrn/content-contracts';
import { emptySourcePreferences } from '@wrn/domain';
import {
  ProductionHome,
  type ProductionHomeDirectory,
} from '../../../packages/browser-content/src/production-home';

it('puts the newest original-source reports before older full-text reading pieces', async () => {
  const report = (id: string, language: string, day: string) => ({
    id,
    url: `https://source.example/${id}`,
    title: `Report ${id}`,
    sourceName: `Source ${id}`,
    language,
    publishedAt: `2026-09-${day}T08:00:00.000Z`,
    endpointIds: [],
  });
  const directory = {
    document: { observedAt: '2026-09-27T10:00:00.000Z' },
    projection: {
      articles: [
        report('older', 'de', '10'),
        report('newest', 'en', '27'),
        report('middle', 'tr', '26'),
      ],
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
