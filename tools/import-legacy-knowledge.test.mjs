import assert from 'node:assert/strict';
import test from 'node:test';
import { createKnowledgeDocument, readLiteralDeclaration } from './import-legacy-knowledge.mjs';

test('AST importer accepts literal source and term records with rights', () => {
  const source =
    "const SOURCES = [{ id: 'source', name: 'Source', language: 'English', description: { de: 'Deutsch', en: 'English' }, url: 'https://example.org/', downloads: [] }]; const TERMS = [{ id: 'term', category: 'basics', sources: ['source'], title: { de: 'Begriff', en: 'Term' }, aliases: { de: [], en: [] }, summary: { de: 'Kurz', en: 'Brief' }, practice: { de: 'Praxis', en: 'Practice' }, debate: { de: 'Debatte', en: 'Debate' }, related: [] }];";
  const document = createKnowledgeDocument({
    libraryFeed: '[]',
    librarySources: '[]',
    lexiconSource: source,
  });
  assert.equal(document.lexicon.sources.length, 1);
  assert.equal(document.lexicon.terms.length, 1);
  assert.equal(document.lexicon.sources[0].linkRights, 'metadata-and-links');
  assert.equal(document.lexicon.terms[0].rights, 'user-supplied-editorial-text');
  assert.throws(() => readLiteralDeclaration('const TERMS = call();', 'TERMS'), /non-literal/);
});

test('AST reader rejects executable, prototype, duplicate and syntactically invalid input', () => {
  for (const source of [
    'const TERMS = [call()];',
    'const TERMS = [...other];',
    'const TERMS = { __proto__: {} };',
    'const TERMS = { constructor: 1 };',
    'const TERMS = { a: 1, a: 2 };',
    'const TERMS = { get a() { return 1; } };',
    'const TERMS = [;',
  ])
    assert.throws(() => readLiteralDeclaration(source, 'TERMS'));
});

test('importer rejects oversized input and invalid observation time before output', () => {
  const empty = {
    libraryFeed: '[]',
    librarySources: '[]',
    lexiconSource: 'const SOURCES = []; const TERMS = [];',
  };
  assert.throws(
    () => createKnowledgeDocument({ ...empty, observedAt: '2026-02-30T00:00:00.000Z' }),
    /header/,
  );
  assert.throws(
    () => createKnowledgeDocument({ ...empty, libraryFeed: ' '.repeat(3 * 1024 * 1024 + 1) }),
    /input size/,
  );
});

test('real imported snapshot preserves exact IDs, all source counts and EPUB-only titles', async () => {
  const { readFile } = await import('node:fs/promises');
  const document = JSON.parse(
    await readFile(
      new URL(
        '../apps/mobile/src/features/knowledge/data/legacy-knowledge-v1.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const { validateMobileKnowledge } =
    await import('../packages/content-contracts/src/mobile-knowledge-v1.ts');
  assert.equal(validateMobileKnowledge(document).ok, true);
  assert.equal(document.library.books.length, 609);
  assert.equal(document.library.sources.length, 9);
  assert.equal(document.lexicon.terms.length, 22);
  assert.equal(document.lexicon.sources.length, 12);
  const epub = document.library.books.find(
    (item) => item.id === 'anarchist-library-it-512871156ff74e983cf88e74',
  );
  assert.equal(epub.readUrl, '');
  assert.ok(epub.downloads.epub);
  assert.deepEqual(epub.formats, ['epub']);
  assert.equal(
    document.library.sources.filter(
      (source) => !document.library.books.some((book) => book.sourceId === source.id),
    ).length,
    5,
  );
});
