import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from './index';
import { getProductionHomeCopy } from './production-home';

describe('production Home copy', () => {
  it('has complete, non-empty copy for every registered interface language', () => {
    for (const language of uiLanguageIds)
      expect(
        Object.values(getProductionHomeCopy(language)).every((value) => value.length > 0),
      ).toBe(true);
  });
});
