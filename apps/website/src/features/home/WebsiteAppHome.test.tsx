import { describe, expect, it } from 'vitest';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from './app-home-layout-v1.json';
import { selectAppHomeArticles } from './WebsiteAppHome';
const document = directory as MobileContentDirectory;
const data = { document, projection: document };
describe('actual App Home selection on the Website', () => {
  it('uses the App news lead and all five top stories instead of the old reviewed lead', () => {
    const home = selectAppHomeArticles(data, document.articles);
    expect(home.lead?.title).toBe(
      '«Se vuelven a encender las calles» tras el fallo de la Corte que reactivó la extranjerización de la tierra',
    );
    expect(home.top.map((a) => a.title)).toEqual([
      'Husiler: Suudi Arabistan, başkent Sana ve diğer bazı kentlere hava saldırıları düzenliyor',
      'The Struggle for Class-Independent Unionism in the Face of State Intervention (UAWD Daily Struggle)',
      '2ο Ελευθεριακό φεστιβάλ για τον οργανωμένο αναρχισμό, 2-3/10 Πάρκο ΧΑΝΘ',
      'We Demand More Information on How Marin Cops Illegally Shared Flock ALPR Data',
      'Morta por PMs, juíza Patrícia Acioli “humilhava policiais”, disse Flávio Bolsonaro em 2011',
    ]);
    expect(home.more).toHaveLength(9);
    expect(home.briefing).toHaveLength(5);
    expect(home.sport).toHaveLength(1);
    expect(layout.excludedSelection).toEqual([]);
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
