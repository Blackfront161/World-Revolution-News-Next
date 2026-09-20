import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from './index';
import { formatEventsMediaCopy, getEventsMediaCopy, getProductionMediaCopy } from './events-media';

describe('events/media copy', () => {
  it('has each required label in all nine UI languages', () => {
    for (const language of uiLanguageIds) {
      const copy = getEventsMediaCopy(language);
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
      expect(copy.events).not.toBe(copy.media);
    }
  });
  it('formats count values without interpreting content metadata', () => {
    expect(
      formatEventsMediaCopy(getEventsMediaCopy('en').showing, { shown: 30, total: 5610 }),
    ).toBe('Showing 30 of 5610');
  });
  it('has complete current-media interface copy in every supported language', () => {
    for (const language of uiLanguageIds) {
      const copy = getProductionMediaCopy(language);
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
      expect(copy.onlineOnly).not.toBe(copy.noDownload);
    }
  });
});
