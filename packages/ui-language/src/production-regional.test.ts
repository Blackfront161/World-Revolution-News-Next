import { describe, expect, it } from 'vitest';
import { getProductionRegionalCopy } from './production-regional';

describe('regional event copy', () => {
  for (const language of ['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const) {
    it(`has complete meaningful ${language} messages for source age, local choice and failures`, () => {
      const copy = getProductionRegionalCopy(language);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(getProductionRegionalCopy('en')).sort());
      expect(
        Object.values(copy).every(
          (value) => value.length > 0 && value.trim() === value && !/[<>]/u.test(value),
        ),
      ).toBe(true);
      expect(copy.stale).not.toBe(copy.empty);
      expect(copy.temporary).not.toBe(copy.saved);
      expect(copy.storageError).not.toBe(copy.conflict);
    });
  }
});
