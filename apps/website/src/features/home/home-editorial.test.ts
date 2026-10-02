import { describe, expect, it } from 'vitest';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from './app-home-layout-v1.json';
import { appTopics, appTopicLabel, homeReadingNote, homeCoverage } from './home-editorial';
const article = directory.articles.find((a) => a.id === layout.lead)! as DirectoryArticle;
describe('App Home editorial reading notes', () => {
  it('binds notes to the exact article, original title, URL and reviewed revision', () => {
    expect(homeReadingNote(article, directory.sourceCommit)?.summaryDe).toContain(
      'ANRed berichtet',
    );
    for (const changed of [
      { ...article, url: 'https://example.com/' },
      { ...article, title: 'Changed' },
      { ...article, historical: true },
      { ...article, id: layout.top[0]! },
    ])
      expect(homeReadingNote(changed, directory.sourceCommit)).toBeNull();
    expect(homeReadingNote(article, 'f'.repeat(40))).toBeNull();
  });
  it('covers every selected App article without any source body or copied image', () => {
    const ids = [layout.lead, ...layout.top, ...layout.sport, ...layout.more, ...layout.briefing];
    for (const id of ids) {
      const note = homeReadingNote(
        directory.articles.find((a) => a.id === id)! as DirectoryArticle,
        directory.sourceCommit,
      );
      expect(note).not.toBeNull();
      expect(note?.rights).toBe('wrn-original-reading-note');
      expect(note?.summaryDe.length).toBeLessThan(600);
      expect(note?.summaryEn.length).toBeLessThan(600);
      expect(note).not.toHaveProperty('image');
      expect(note).not.toHaveProperty('body');
    }
  });
  it('uses all 21 canonical App topics with all nine language catalogues', () => {
    expect(new Set(appTopics).size).toBe(21);
    expect(appTopicLabel('Indigenous Struggles', 'de')).toBe('Indigene Kämpfe');
    expect(appTopicLabel('Libraries', 'el')).toBe('Βιβλιοθήκες');
    expect(appTopicLabel('Unclassified', 'de')).toBe('Unclassified');
  });
  it('excludes future and historical articles and unknown language from coverage', () => {
    const now = Date.parse('2026-10-02T12:00:00.000Z');
    const rows = [
      { ...article, language: 'und', topics: ['Global'], publishedAt: '2026-10-02T10:00:00.000Z' },
      {
        ...article,
        language: 'de',
        sourceName: 'Other',
        publishedAt: '2026-10-01T13:00:00.000Z',
        topics: ['Europe'],
      },
      { ...article, language: 'tr', publishedAt: '2026-10-03T12:00:00.000Z' },
      { ...article, language: 'fr', historical: true },
    ];
    expect(homeCoverage(rows, now)).toEqual({
      articles: 2,
      languages: 1,
      regions: 2,
      sources: 2,
      last24Hours: 2,
    });
  });
});
