import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareWebsiteGlossary } from './prepare-website-glossary.mjs';
const document = JSON.parse(
  readFileSync(
    new URL(
      '../../apps/website/src/features/knowledge/packed/legacy-knowledge-v1.json',
      import.meta.url,
    ),
  ),
).currentKnowledge;
const terms = document.lexicon.terms.map(({ rights, ...term }) => term);
const sources = document.lexicon.sources.map(({ rights, linkRights, ...source }) => source);
const base = `const TERMS=${JSON.stringify(terms)}; const SOURCES=${JSON.stringify(sources)};`;
const observedAt = '2026-10-03T19:48:02.457Z',
  commit = 'f4f3058bc68a433dba67cf3de114ba91b6cf4f7f';
test('closed AST data-map imports source tuples, conditional descriptions and stable-ID corrections', () => {
  const source =
    base +
    `SOURCES.push(...[['test-source','WRN reference','https://example.com/reference']].map(([id,name,url])=>({id,name,url,language:'English',downloads:[],description:{de:id==='test-source'?'DE':'other',en:'EN'}}))); TERMS.push(...[${JSON.stringify({ ...terms[0], summary: { de: 'Korrigierter eigener Text.', en: 'Corrected original explanation.' } })}].map(term=>({...term,revision:{version:'reviewed'}})));`;
  const result = prepareWebsiteGlossary(source, commit, observedAt);
  assert.equal(result.lexicon.terms.length, 177);
  assert.equal(result.lexicon.sources.length, 56);
  assert.equal(result.lexicon.terms[0].summary.de, 'Korrigierter eigener Text.');
  assert.equal(result.lexicon.sources.at(-1).description.de, 'DE');
});
for (const expression of [
  `[globalThis.__wrnUnsafe=true]`,
  `[].map(value=>{globalThis.__wrnUnsafe=true;return value;})`,
  `[].filter(value=>value)`,
  `[{}].map(value=>({...value,constructor:'unsafe'}))`,
  `[{}].map(value=>value.title)`,
])
  test('rejects executable or unsupported expansion ' + expression, () => {
    delete globalThis.__wrnUnsafe;
    assert.throws(() =>
      prepareWebsiteGlossary(base + `TERMS.push(...${expression});`, commit, observedAt),
    );
    assert.equal(globalThis.__wrnUnsafe, undefined);
  });
