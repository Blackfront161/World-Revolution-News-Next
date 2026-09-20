import { describe, expect, it } from 'vitest';
import { getProductionContentCopy, uiLanguageIds } from '../src/index';
describe('production copy', () => {
  it('covers the exact same nonempty text keys in every registered language', () => {
    const keys = Object.keys(getProductionContentCopy('en')).sort();
    for (const language of uiLanguageIds) {
      const copy = getProductionContentCopy(language);
      expect(Object.keys(copy).sort()).toEqual(keys);
      expect(Object.values(copy).every((value) => value.length > 0)).toBe(true);
      expect(Object.isFrozen(copy)).toBe(true);
    }
  });
});
