import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildDirectory,
  normaliseDirectoryUrl,
  readPinnedJson,
  serialiseDirectory,
  MAX_INPUT_BYTES,
} from './import-content-directory.mjs';
const hash = (v) => createHash('sha256').update(v).digest('hex');
const input = () => ({
  historicalNews: [
    {
      link: 'https://example.com/news?keep=yes#part',
      title: 'Earlier title',
      quelleName: 'Earlier publisher',
      language: 'de',
      pubDate: '2026-08-01',
      sourceHomepage: 'https://example.com/',
      categories: ['Old'],
    },
  ],
  currentNews: [
    {
      link: 'https://example.com/news?keep=yes&utm_source=a',
      title: 'Current title',
      quelleName: 'Publisher',
      language: 'en',
      pubDate: '2026-09-09',
      sourceHomepage: 'https://example.com/',
      categories: ['New'],
      content: 'DO NOT COPY',
      images: ['DO NOT COPY'],
    },
  ],
  historicalSources: {
    generatedAt: '2026-08-01',
    sources: [
      {
        canonicalUrl: 'https://example.com/feed',
        name: 'Earlier publisher',
        languages: ['de'],
        mediaType: 'news',
        status: 'inactive',
        active: false,
        homepage: 'https://example.com/',
      },
    ],
  },
  currentSources: {
    generatedAt: '2026-09-09',
    sources: [
      {
        canonicalUrl: 'https://example.com/feed',
        name: 'Publisher',
        languages: ['en'],
        mediaType: 'podcast',
        status: 'active',
        active: true,
        homepage: 'https://example.com/',
      },
    ],
  },
});
test('identities remove only utm and fragment and retain meaningful query/endpoint distinctions', () => {
  assert.equal(
    normaliseDirectoryUrl('https://example.com/news?keep=yes&utm_source=a#part', { news: true }),
    'https://example.com/news?keep=yes',
  );
  assert.notEqual(
    normaliseDirectoryUrl('https://example.com/?a=1'),
    normaliseDirectoryUrl('https://example.com/?a=2'),
  );
  assert.equal(
    normaliseDirectoryUrl('https://www.example.com/feed?utm_source=x#part'),
    'https://www.example.com/feed?utm_source=x#part',
  );
  assert.equal(normaliseDirectoryUrl('https://user:pass@example.com'), null);
});
test('full observations retain conflicting metadata, attribution, hashes and closed exact-homepage refs', () => {
  const inputs = input(),
    d = buildDirectory(inputs);
  assert.equal(d.articles.length, 1);
  assert.equal(d.sources.length, 1);
  const a = d.articles[0],
    s = d.sources[0];
  assert.equal(a.id, 'news-' + hash(a.url));
  assert.equal(s.id, 'source-' + hash(s.url));
  assert.equal(a.title, 'Current title');
  assert.deepEqual(
    a.observations.map((o) => [o.title, o.language, o.topics]),
    [
      ['Earlier title', 'de', ['Old']],
      ['Current title', 'en', ['New']],
    ],
  );
  assert.deepEqual(
    s.observations.map((o) => [o.name, o.status, o.active, o.mediaType]),
    [
      ['Earlier publisher', 'inactive', false, 'news'],
      ['Publisher', 'active', true, 'podcast'],
    ],
  );
  assert.deepEqual(a.endpointIds, [s.id]);
  assert.equal(a.observations[1].provenance.inputSHA256, hash(JSON.stringify(inputs.currentNews)));
  assert.equal(a.observations[0].provenance.commit, '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0');
  assert.equal(d.reconciliation.news.rawLinkUnion, 2);
  assert.equal(d.reconciliation.news.normalizedUrlUnionBeforeHttps, 1);
  assert.equal(d.reconciliation.news.collisions, 1);
  assert.equal(d.reconciliation.sources.collisions, 1);
  assert.ok(!JSON.stringify(d).includes('DO NOT COPY'));
  inputs.currentNews[0].title = 'Changed again';
  assert.equal(buildDirectory(inputs).articles[0].id, a.id);
  inputs.currentNews[0].sourceHomepage = 'https://www.example.com/';
  inputs.historicalNews[0].sourceHomepage = '';
  assert.deepEqual(buildDirectory(inputs).articles[0].endpointIds, []);
});
test('counts unsafe/HTTP/invalid metadata instead of silently losing rows; missing dates/language stay unknown', () => {
  const inputs = input();
  inputs.currentNews.push(
    { link: '/relative' },
    { link: 'http://example.com/news' },
    { link: 'https://example.com/bad', title: '<b>bad</b>' },
  );
  delete inputs.currentNews[0].language;
  inputs.currentNews[0].pubDate = 'not a date';
  inputs.currentSources.sources.push({
    canonicalUrl: 'http://historical.example.com/',
    name: 'Historical',
    languages: [],
  });
  const d = buildDirectory(inputs);
  assert.deepEqual(d.reconciliation.news.github, {
    input: 4,
    accepted: 1,
    rejected: { url: 1, http: 1, metadata: 1 },
  });
  assert.equal(d.articles[0].language, 'und');
  assert.equal(d.articles[0].publishedAt, null);
  assert.equal(d.articles[0].observations[1].rawPublishedAt, 'not a date');
  assert.equal(d.sources[1].accessNote, 'insecure-url');
});
test('enforces shapes and row/raw/runtime bounds before writing', () => {
  assert.throws(() => buildDirectory({ ...input(), historicalNews: {} }), /input-shape/);
  assert.throws(() => buildDirectory({ ...input(), currentSources: [] }), /input-shape/);
  assert.throws(
    () => buildDirectory({ ...input(), currentNews: Array(2001).fill({}) }),
    /input-shape/,
  );
  assert.throws(
    () => buildDirectory({ ...input(), currentNews: [{ content: 'x'.repeat(MAX_INPUT_BYTES) }] }),
    /input-too-large/,
  );
  assert.throws(
    () => serialiseDirectory({ ...buildDirectory(input()), extra: 'x'.repeat(3 * 1024 * 1024) }),
    /output-too-large/,
  );
  assert.throws(() => serialiseDirectory({}), /output-contract/);
});
test('pinned reader checks raw size/hash and fatal UTF-8 before JSON parse', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wrn-directory-pin-test-'));
  const file = join(root, 'input.json');
  await writeFile(file, '{}');
  assert.deepEqual(await readPinnedJson(file, hash('{}')), {});
  await assert.rejects(() => readPinnedJson(file, '0'.repeat(64)), /input-pin/);
  const invalid = Buffer.from([0xff]);
  await writeFile(file, invalid);
  await assert.rejects(() => readPinnedJson(file, hash(invalid)), /encoded data/);
  await writeFile(file, ' '.repeat(MAX_INPUT_BYTES + 1));
  await assert.rejects(() => readPinnedJson(file, '0'.repeat(64)), /input-too-large/);
});
