import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from './index';
import { getProductionPodcastCopy } from './production-podcast';

describe('production podcast copy', () => {
  it('has complete non-empty controls and disclosures in every UI language', () => {
    for (const language of uiLanguageIds)
      for (const value of Object.values(getProductionPodcastCopy(language)))
        expect(value.trim()).not.toBe('');
  });
});
