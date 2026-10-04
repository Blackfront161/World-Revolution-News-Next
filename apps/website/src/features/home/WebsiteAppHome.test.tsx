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
    expect(home.lead?.id).toBe('news-1275b2a383697835d98166d826a33ccf93080f39aec56e8548d9dfb3e6edf344');
    expect(home.lead?.title).toBe('Purulia’s Bero-Chandi Pahar Faces Renewed Threat from Granite Mining');
    expect(home.top.map((a) => a.title)).toEqual([
      'Direct Action (SolFed) #05 1998',
      'The Algorithm of the Ballot: How Data Decides Democracy Before We Vote',
      'Lightweight',
      'Every year, alongside many others, we observe April 15 as Steal Something from Work Day&mdash;an&hellip;',
      'Redes, moral, identificação e mais: o que as eleições revelam, mas não aparece nas urnas',
    ]);
    expect(home.more).toHaveLength(9);
    expect(home.briefing).toHaveLength(5);
    expect(home.current).toHaveLength(423);
    expect(home.sport).toHaveLength(0);
    expect(layout.excludedSelection).toHaveLength(22);
    const selected = [home.lead, ...home.top, ...home.more, ...home.briefing].map((a) => a?.id);
    for (const held of layout.excludedSelection) expect(selected).not.toContain(held.id);
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
