import { describe, expect, it } from 'vitest';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from './app-home-layout-v1.json';
import { selectAppHomeArticles } from './WebsiteAppHome';
const document = directory as MobileContentDirectory;
const data = { document, projection: document };
describe('actual App Home selection on the Website', () => {
  it('uses the current App lead and reviewed stories in their exact App role order', () => {
    const home = selectAppHomeArticles(data, document.articles);
    expect(home.lead?.title).toBe(
      'Make the wealthy pay: AIDC lays out alternative to austerity',
    );
    expect(home.top.map((a) => a.title)).toEqual([
      'Nunavut sports hall of fame inductions begin',
      '“If Bolsonaro wins, they kill us; if Lula wins, they let us die.”',
      'Iran’s teachers movement perseveres against all odds',
      'Site-Blocking Will Not Defend IP, No Matter the Bill’s Name',
    ]);
    expect(home.more).toHaveLength(6);
    expect(home.briefing).toHaveLength(4);
    expect(home.sport).toHaveLength(0);
    expect(layout.excludedSelection).toHaveLength(5);
    const selected = [home.lead, ...home.top, ...home.more, ...home.briefing].map((a) => a?.id);
    for (const held of layout.excludedSelection) expect(selected).not.toContain(held.articleId);
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
