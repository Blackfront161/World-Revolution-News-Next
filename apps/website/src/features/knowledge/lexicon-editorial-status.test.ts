import { describe, expect, it } from 'vitest';
import { draftKnowledgeTermIds, knowledgeDraftCopy } from './lexicon-editorial-status';
import { validateMobileKnowledge } from '@wrn/content-contracts/mobile-knowledge-v1';
import packed from './packed/legacy-knowledge-v1.json';

describe('source-bound glossary draft metadata', () => {
  const document = validateMobileKnowledge(packed.currentKnowledge).value!;
  it('retains all ten original drafts and provides the notice in all nine UI languages', () => {
    const ids = draftKnowledgeTermIds(document);
    expect(ids.size).toBe(10);
    expect(ids.has('worker-cooperative')).toBe(true);
    expect(ids.has('mutual-aid')).toBe(false);
    expect(Object.keys(knowledgeDraftCopy)).toHaveLength(9);
    expect(Object.values(knowledgeDraftCopy).every((text) => text.length > 20)).toBe(true);
  });
  it.each(['sourceCommit', 'inputLexiconSha256', 'missing-term'])(
    '%s cannot silently remove draft notices',
    (kind) => {
      const changed = structuredClone(document);
      if (kind === 'sourceCommit') Object.assign(changed, { sourceCommit: '0'.repeat(40) });
      if (kind === 'inputLexiconSha256')
        Object.assign(changed.input, { lexiconSha256: '0'.repeat(64) });
      if (kind === 'missing-term')
        Object.assign(changed.lexicon, {
          terms: changed.lexicon.terms.filter((term) => term.id !== 'worker-cooperative'),
        });
      expect(() => draftKnowledgeTermIds(changed)).toThrow('lexicon-editorial-status-binding');
    },
  );
});
