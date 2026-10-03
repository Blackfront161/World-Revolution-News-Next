import { describe, expect, it } from 'vitest';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import directory from '../projection/data/content-directory-v1.json';
import layout from './app-home-layout-v1.json';
import {
  appTopics,
  appTopicLabel,
  homeReadingNote,
  homeReadingSummary,
  homeArticleIllustration,
  homeCoverage,
} from './home-editorial';
import noteLanguages from './home-note-languages-v1.json';
import sourceReview from './app-home-source-review-v1.json';
import { validateSourcePassOverlayV1 } from '@wrn/content-contracts/source-pass-overlay-v1';
const article = directory.articles.find((a) => a.id === layout.lead)! as DirectoryArticle;
describe('App Home editorial reading notes', () => {
  it('binds notes to the exact article, original title, URL and reviewed revision', () => {
    expect(homeReadingNote(article, directory.sourceCommit)?.summaryDe).toContain(
      'Elitsha berichtet',
    );
    for (const changed of [
      { ...article, url: 'https://example.com/' },
      { ...article, title: 'Changed' },
      { ...article, sourceName: 'Changed source' },
      { ...article, historical: true },
      { ...article, id: layout.top[0]! },
    ])
      expect(homeReadingNote(changed, directory.sourceCommit)).toBeNull();
    expect(homeReadingNote(article, 'f'.repeat(40))).toBeNull();
  });
  it('covers every selected App article without any source body or copied image', () => {
    expect(validateSourcePassOverlayV1(sourceReview)).toBe(true);
    const ids = [layout.lead, ...layout.top, ...layout.sport, ...layout.more, ...layout.briefing];
    for (const id of ids) {
      const note = homeReadingNote(
        directory.articles.find((a) => a.id === id)! as DirectoryArticle,
        directory.sourceCommit,
      );
      expect(note).not.toBeNull();
      expect(note?.rights).toBe('wrn-original-reading-note');
      expect(note?.admission).toBe('metadata-only-with-wrn-note');
      expect(sourceReview.records.some((profile) => profile.id === note?.sourcePassId)).toBe(true);
      expect(note?.summaryDe.length).toBeLessThan(600);
      expect(note?.summaryEn.length).toBeLessThan(600);
      expect(note).not.toHaveProperty('image');
      expect(note).not.toHaveProperty('body');
    }
  });
  it('does not produce reading notes for held App items even when raw metadata remains visible', () => {
    for (const held of layout.excludedSelection) {
      const candidate = directory.articles.find((a) => a.id === held.articleId);
      if (candidate) expect(homeReadingNote(candidate as DirectoryArticle, directory.sourceCommit)).toBeNull();
    }
  });
  it('uses all 21 canonical App topics with all nine language catalogues', () => {
    expect(new Set(appTopics).size).toBe(21);
    expect(appTopicLabel('Indigenous Struggles', 'de')).toBe('Indigene Kämpfe');
    expect(appTopicLabel('Libraries', 'el')).toBe('Βιβλιοθήκες');
    expect(appTopicLabel('Unclassified', 'de')).toBe('Unclassified');
  });
  it('provides local reading notes in all nine languages, bound to unchanged source notes', () => {
    const ids = [layout.lead, ...layout.top, ...layout.sport, ...layout.more, ...layout.briefing];
    for (const id of ids) {
      const selected = directory.articles.find((a) => a.id === id)! as DirectoryArticle;
      const note = homeReadingNote(selected, directory.sourceCommit)!;
      const versions = noteLanguages.entries.filter((entry) => entry.articleId === id);
      expect(versions).toHaveLength(1);
      expect(versions[0]!.sourceSummaryEn).toBe(note.summaryEn);
      expect(versions[0]!.sourceHeadlineDe).toBe(note.headlineDe);
      for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const) {
        const localized = homeReadingSummary(selected, directory.sourceCommit, language)!;
        expect(localized.language).toBe(language);
        expect(localized.text.length).toBeGreaterThan(40);
        expect(localized.text.length).toBeLessThan(600);
        expect(localized.headline?.length).toBeGreaterThan(15);
      }
    }
    expect(
      homeReadingSummary({ ...article, url: 'https://example.com/' }, directory.sourceCommit, 'es'),
    ).toBeNull();
    expect(homeReadingSummary(article, 'f'.repeat(40), 'el')).toBeNull();
  });
  it('binds the WRN illustration only to its reviewed current article and revision', () => {
    expect(homeArticleIllustration(article, directory.sourceCommit)?.assetType).toBe(
      'wrn-original-generated-illustration',
    );
    for (const changed of [
      { ...article, id: layout.top[0]! },
      { ...article, url: 'https://example.com/' },
      { ...article, title: 'Changed' },
      { ...article, historical: true },
    ])
      expect(homeArticleIllustration(changed, directory.sourceCommit)).toBeNull();
    expect(homeArticleIllustration(article, 'f'.repeat(40))).toBeNull();
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
