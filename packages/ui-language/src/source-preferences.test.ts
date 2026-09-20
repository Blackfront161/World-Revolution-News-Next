import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from './index';
import { getSourcePreferencesCopy } from './source-preferences';

describe('source preferences labels', () => {
  it.each(uiLanguageIds)(
    '%s has complete and distinct controls and truthful local-data notices',
    (language) => {
      const copy = getSourcePreferencesCopy(language);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(getSourcePreferencesCopy('en')).sort());
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
      expect(new Set([copy.follow, copy.unfollow, copy.hide, copy.unhide]).size).toBe(4);
      expect(copy.saved).not.toBe(copy.failed);
      expect(copy.protected).not.toBe(copy.empty);
      expect(copy.unavailable).not.toBe(copy.empty);
      expect(copy.clearQuestion).not.toBe(copy.clear);
    },
  );
});
