import { describe, expect, it } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import { getSupportCopy } from './support-copy.js';

describe('support copy', () => {
  it('provides a complete local route copy object for each registered UI language', () => {
    const english = getSupportCopy('en');
    for (const language of uiLanguageIds) {
      const copy = getSupportCopy(language);
      expect(copy.helpTitle).not.toBe('');
      expect(copy.helpIntro).not.toBe('');
      expect(copy.letterTitle).not.toBe('');
      expect(copy.retry).not.toBe('');
      if (language !== 'en') {
        for (const key of [
          'helpIntro',
          'solidarityIntro',
          'letterIntro',
          'navigationPrompt',
          'reloadNote',
        ] as const)
          expect(copy[key]).not.toBe(english[key]);
      }
    }
  });
});
