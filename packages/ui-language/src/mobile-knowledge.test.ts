import { describe, expect, it } from 'vitest';
import { getMobileKnowledgeCopy, type MobileKnowledgeCopy } from './mobile-knowledge';

describe('mobile knowledge language', () => {
  it('has a complete dedicated copy for every registered UI language', () => {
    expect(getMobileKnowledgeCopy('de').title).toBe('Wissen');
    const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
    const english = getMobileKnowledgeCopy('en');
    for (const language of languages) {
      const copy: MobileKnowledgeCopy = getMobileKnowledgeCopy(language);
      expect(Object.values(copy)).toHaveLength(Object.keys(english).length);
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
    }
    for (const language of languages.filter((language) => language !== 'en')) {
      expect(getMobileKnowledgeCopy(language)).not.toBe(english);
      expect(getMobileKnowledgeCopy(language).title).not.toBe(english.title);
    }
  });

  it('labels the catalogue snapshot, historical review and limited offline use in every language', () => {
    for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const) {
      const copy = getMobileKnowledgeCopy(language);
      expect(copy.snapshotDate).not.toHaveLength(0);
      expect(copy.snapshotDate).not.toMatch(/\d{4}/u);
      expect(copy.historicalReview).not.toHaveLength(0);
      expect(copy.offlineNote).not.toHaveLength(0);
    }
  });
});
