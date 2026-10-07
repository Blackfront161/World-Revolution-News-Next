import { describe, expect, it } from 'vitest';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from './app-home-layout-v1.json';
import { selectAppHomeArticles } from './app-home-selection';
const document = directory as MobileContentDirectory;
const data = { document, projection: document };
describe('actual App Home selection on the Website', () => {
  it('uses the current App lead and reviewed stories in their exact App role order', () => {
    const home = selectAppHomeArticles(data, document.articles);
    expect(home.lead?.id).toBe(
      'news-af1556a29e670df58a5b85322782fab9101f423308699c6732b81b986209d814',
    );
    expect(home.lead?.title).toBe(
      'Health minister calls alcohol ‘one of the major concerns’ for Indigenous communities',
    );
    expect(home.top.map((a) => a.title)).toEqual([
      'Bring Maja back: Antifaschist*in muss sofort aus Ungarn hierher überstellt werden!',
      '«Construir colectivamente donde dicen que no se puede»: presentan experiencia de los barrios comunitarios Crisol Popular y Norita Cortiñas',
      'How the Dagalos’ ever tightening hold on power destabilized the RSF project',
      'Labour Council’s Palantir Investments Increased 1,200% During Gaza Genocide',
      'Ottawa gives $77M to Arctic Bay for small craft harbour',
    ]);
    expect(home.more).toHaveLength(8);
    expect(home.briefing).toHaveLength(5);
    expect(home.current).toHaveLength(399);
    expect(home.sport).toHaveLength(1);
    expect(layout.excludedSelection).toHaveLength(1);
    const selected = [home.lead, ...home.top, ...home.more, ...home.briefing, ...home.sport].map(
      (a) => a?.url,
    );
    for (const held of layout.excludedSelection) expect(selected).not.toContain(held.url);
  });
  it('cannot restore a withdrawn or source-hidden App article from the layout map', () => {
    const admitted = document.articles.filter(
      (a) => a.id !== layout.lead && a.id !== layout.top[0],
    );
    const home = selectAppHomeArticles(data, admitted);
    expect(home.lead).toBeNull();
    expect(home.top.some((a) => a.id === layout.top[0])).toBe(false);
    expect(home.current.every((a) => !a.historical)).toBe(true);
  });
  it('does not project an App ordering onto a different unbound directory revision', () => {
    const home = selectAppHomeArticles(
      { ...data, document: { ...document, sourceCommit: 'f'.repeat(40) } },
      document.articles,
    );
    expect(home.lead).toBeNull();
    expect(home.top).toEqual([]);
    expect(home.more).toEqual([]);
    expect(home.briefing).toEqual([]);
  });
});
