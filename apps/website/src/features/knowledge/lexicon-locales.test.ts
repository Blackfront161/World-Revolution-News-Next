import { describe, it, expect } from 'vitest';
import { localizedKnowledgeTerm } from './lexicon-locales';
import packed from './packed/legacy-knowledge-v1.json';
import translations from './data/lexicon-locales.json';
describe('supplemental glossary translations preserve language fallback', () => {
  const term = packed.currentKnowledge.lexicon.terms.find((item) => item.id === 'mutual-aid')!;
  it('shows a complete translated entry as a draft without mutating DE/EN', () => {
    const before = JSON.stringify(term);
    expect(localizedKnowledgeTerm(term, 'fr')).toMatchObject({ language: 'fr', draft: true });
    expect(localizedKnowledgeTerm(term, 'es')).toMatchObject({ language: 'es', draft: true });
    expect(JSON.stringify(term)).toBe(before);
    expect(localizedKnowledgeTerm(term, 'it')).toMatchObject({ language: 'en', draft: false });
  });
  it('falls back when text is incomplete or contains markup', () => {
    const malformed = structuredClone(translations);
    malformed.terms['mutual-aid'].fr.debate = '';
    malformed.terms['mutual-aid'].es.summary = '<script>invalid</script>';
    expect(localizedKnowledgeTerm(term, 'fr', malformed).language).toBe('en');
    expect(localizedKnowledgeTerm(term, 'es', malformed).language).toBe('en');
  });
});
