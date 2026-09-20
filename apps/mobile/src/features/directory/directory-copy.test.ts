import { describe, expect, it } from 'vitest';
import { getDirectoryCopy } from './directory-copy.js';

describe('directory copy', () => {
  it('provides a complete local copy for each supported UI language', () => {
    for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const) {
      const copy = getDirectoryCopy(language);
      expect(copy.title).not.toHaveLength(0);
      expect(copy.loading).not.toHaveLength(0);
      expect(copy.loadError).not.toHaveLength(0);
      expect(copy.sportNote).not.toHaveLength(0);
    }
    expect(getDirectoryCopy('es').title).not.toBe(getDirectoryCopy('en').title);
  });
});
