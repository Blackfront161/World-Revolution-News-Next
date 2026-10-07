import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { prepareWebsiteLibraryRefresh } from './prepare-website-library-refresh.mjs';

const seed = JSON.parse(
  await fs.readFile(
    new URL(
      '../../apps/website/src/features/knowledge/packed/legacy-knowledge-v1.json',
      import.meta.url,
    ),
  ),
);
async function fixture(change = () => {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wrn-library-refresh-'));
  const previous = structuredClone(seed),
    old = previous.currentKnowledge.library.books[0];
  previous.currentKnowledge.library.books = [old];
  previous.currentKnowledge.withdrawnIds.books = [old.id];
  const added = {
    ...structuredClone(old),
    id: old.id + '-new',
    title: 'Additional metadata',
    downloads: {
      epub: new URL(
        '/library/metadata-test.epub',
        previous.currentKnowledge.library.sources.find((x) => x.id === old.sourceId).homepage,
      ).href,
    },
    readUrl: '',
    formats: ['epub'],
  };
  const feed = [structuredClone(old), added];
  change(feed, previous);
  const args = {
    packageFile: path.join(dir, 'package.json'),
    libraryFeedFile: path.join(dir, 'feed.json'),
    outputFile: path.join(dir, 'output.json'),
    dataCommit: 'a'.repeat(40),
    observedAt: '2026-10-03T01:44:46.000Z',
  };
  await fs.writeFile(args.packageFile, JSON.stringify(previous));
  await fs.writeFile(args.libraryFeedFile, JSON.stringify(feed));
  return { dir, previous, args };
}
test('adds metadata while preserving IDs, withdrawals, history and the complete glossary', async () => {
  const { previous, args } = await fixture();
  const receipt = await prepareWebsiteLibraryRefresh(args);
  const next = JSON.parse(await fs.readFile(args.outputFile));
  assert.deepEqual(next.history, previous.history);
  assert.deepEqual(next.currentKnowledge.lexicon, previous.currentKnowledge.lexicon);
  assert.deepEqual(next.currentKnowledge.withdrawnIds, previous.currentKnowledge.withdrawnIds);
  assert.deepEqual(
    next.currentKnowledge.library.books[0],
    previous.currentKnowledge.library.books[0],
  );
  assert.equal(receipt.preservedBooks, 1);
  assert.equal(receipt.books, 2);
  assert.equal(receipt.mediaFetched, false);
  assert.equal(next.currentKnowledge.sourceCommit, previous.currentKnowledge.sourceCommit);
});
for (const [name, change, expected] of [
  ['removal', (feed) => feed.shift(), 'existing-record-change'],
  [
    'changed original',
    (feed) => (feed[0].downloads.epub = 'https://example.org/other.epub'),
    'existing-record-change',
  ],
  ['duplicate ID', (feed) => (feed[1].id = feed[0].id), 'existing-record-change'],
  ['unknown source', (feed) => (feed[1].sourceId = 'unreviewed'), 'unknown-source'],
  ['unsafe scheme', (feed) => (feed[1].downloads.epub = 'javascript:alert(1)'), 'contract'],
  [
    'unbound host',
    (feed) => (feed[1].downloads.epub = 'https://example.org/book.epub'),
    'original-host',
  ],
])
  test('refuses ' + name + ' before creating an output', async () => {
    const { args } = await fixture(change);
    await assert.rejects(prepareWebsiteLibraryRefresh(args), new RegExp(expected));
    await assert.rejects(fs.access(args.outputFile));
  });
for (const reverse of [false, true])
  test(
    'a newer unreviewed EPUB cannot replace an admitted metadata-only book in either input order ' +
      reverse,
    async () => {
      const { args } = await fixture((feed, previous) => {
        const book = structuredClone(
          seed.currentKnowledge.library.books.find(
            (row) => row.id === 'anarchist-library-de-ba62ecff09594a0105cded9a',
          ),
        );
        assert.ok(book);
        previous.currentKnowledge.library.books = [book];
        previous.currentKnowledge.withdrawnIds.books = [book.id];
        feed.splice(0, feed.length, book, {
          ...book,
          updatedAt: '2099-01-01T00:00:00.000Z',
          downloads: { epub: 'https://de.anarchistlibraries.net/unreviewed.epub' },
        });
        if (reverse) feed.reverse();
      });
      await assert.rejects(prepareWebsiteLibraryRefresh(args), /existing-record-change/);
      await assert.rejects(fs.access(args.outputFile));
    },
  );
