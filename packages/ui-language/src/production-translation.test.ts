import { expect, it } from 'vitest';
import { uiLanguageIds } from './index';
import { getProductionTranslationCopy } from './production-translation';

it('covers all nine interface languages with exact translation copy and placeholders', () => {
  const keys = [
    'action',
    'disclosure',
    'loading',
    'offline',
    'timeout',
    'error',
    'discarded',
    'sameLanguage',
    'unavailable',
    'translatedLabel',
    'provenance',
    'retry',
  ].sort();
  expect(uiLanguageIds).toHaveLength(9);
  for (const language of uiLanguageIds) {
    const copy = getProductionTranslationCopy(language);
    expect(Object.keys(copy).sort()).toEqual(keys);
    for (const [key, value] of Object.entries(copy)) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(value.match(/\{[^}]+\}/g) ?? []).toEqual(
        key === 'translatedLabel' ? ['{language}'] : key === 'provenance' ? ['{provider}'] : [],
      );
    }
  }
});
