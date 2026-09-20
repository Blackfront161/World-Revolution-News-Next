import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildProductionEventsMedia as build,
  serialiseProductionEventsMedia,
  readPinnedJson,
  writeAbsent,
  MAX_INPUT_BYTES,
} from './import-production-events-media.mjs';
import {
  productionEventsMediaMaxBytesV1,
  validateProductionEventsMediaV1,
} from '../../packages/content-contracts/src/directory/production-events-media-v1.ts';
const digest = (value) => createHash('sha256').update(value).digest('hex');
const buildProductionEventsMedia = (
  inputs,
  hashes = Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, digest(JSON.stringify(value))]),
  ),
) => build(inputs, hashes);
const event = {
  title: 'Event',
  quelleName: 'Source',
  link: 'https://example.org/event',
  language: 'de',
  eventStart: '2026-09-10T10:00:00+02:00',
  eventEnd: '2026-09-10T11:00:00+02:00',
  eventTimezone: 'Europe/Berlin',
  eventCountry: 'DE',
  eventCity: 'Berlin',
};
const video = {
  title: 'Video',
  source: 'Source',
  sourceId: 'source',
  originalUrl: 'https://example.org/video',
  language: 'pt',
  publishedAt: '2026-09-10T10:00:00Z',
  availability: 'OK',
};
const episode = {
  title: 'Episode',
  sourceName: 'Radio',
  sourceId: 'radio',
  episodeUrl: 'https://example.org/episode',
  language: 'de',
  languageReviewRequired: false,
  published: '2026-09-10T10:00:00+00:00',
};
const source = {
  id: 'radio',
  name: 'Radio',
  homepage: 'http://example.org/',
  language: 'de',
  country: 'DE',
};
const inputs = () => ({
  events: [event],
  videos: { items: [video] },
  episodes: [episode, { ...episode, language: 'fr', languageReviewRequired: true }],
  sources: [source],
});
test('imports only bounded metadata, retains duplicate observations and is deterministic', () => {
  const first = buildProductionEventsMedia(inputs());
  const second = buildProductionEventsMedia(inputs());
  assert.equal(serialiseProductionEventsMedia(first), serialiseProductionEventsMedia(second));
  assert.equal(first.episodes.length, 1);
  assert.equal(first.episodes[0].observationCount, 2);
  assert.equal(first.episodes[0].language, 'und');
  assert.equal(first.episodes[0].languageReviewRequired, true);
  assert.equal(first.sources[0].originalUrl, 'http://example.org/');
  assert.equal(JSON.stringify(first).includes('description'), false);
});
test('records indexed malformed URL/date/metadata rejections without silently accepting them', () => {
  const value = inputs();
  value.events.push(
    { ...event, link: 'https://127.0.0.1/a' },
    { ...event, eventStart: '2026-09-10T10:00:00' },
    { ...event, title: '<b>no</b>' },
  );
  const output = buildProductionEventsMedia(value);
  assert.deepEqual(
    output.reconciliation.rejected.map((entry) => [entry.row, entry.reason]),
    [
      [1, 'invalid-url'],
      [2, 'invalid-date'],
      [3, 'invalid-metadata'],
    ],
  );
});
test('rejects bad pins, shapes and oversize output', () => {
  assert.throws(() => build(inputs()), /input-hashes-required/);
  assert.throws(
    () => buildProductionEventsMedia({ ...inputs(), videos: [] }),
    /input-shape:videos/,
  );
  assert.throws(() => buildProductionEventsMedia(inputs(), { events: 'x' }), /input-hash:events/);
  assert.throws(() => serialiseProductionEventsMedia({}), /output-contract/);
});

test('rejects actual oversized input and output byte buffers', () => {
  const hugeInput = { ...inputs(), sources: [{ ...source, ignored: 'x'.repeat(MAX_INPUT_BYTES) }] };
  assert.throws(() => buildProductionEventsMedia(hugeInput), /input-too-large:sources/);
  const oversized = {
    ...buildProductionEventsMedia(inputs()),
    padding: 'x'.repeat(productionEventsMediaMaxBytesV1),
  };
  assert.ok(Buffer.byteLength(JSON.stringify(oversized)) > productionEventsMediaMaxBytesV1);
  assert.throws(() => serialiseProductionEventsMedia(oversized), /output-too-large/);
});

test('raw pinned reads reject a valid-format wrong hash and oversize file; existing output bytes survive', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wrn-events-media-'));
  const input = join(dir, 'input.json'),
    output = join(dir, 'existing.json'),
    large = join(dir, 'large.json');
  const bytes = Buffer.from('{"source":"local authored fixture"}\n');
  await writeFile(input, bytes);
  assert.deepEqual(await readPinnedJson(input, digest(bytes)), {
    source: 'local authored fixture',
  });
  await assert.rejects(readPinnedJson(input, 'a'.repeat(64)), /input-pin/);
  await writeFile(large, Buffer.alloc(MAX_INPUT_BYTES + 1, 32));
  await assert.rejects(readPinnedJson(large, 'a'.repeat(64)), /input-too-large/);
  await writeAbsent(output, bytes);
  await assert.rejects(writeAbsent(output, 'replacement'), /output-exists/);
  assert.deepEqual(await readFile(output), bytes);
});

test('strict dates, source joins and duplicate identities produce indexed rejections', () => {
  const value = inputs();
  value.events.push(
    { ...event, eventStart: '2026-02-30T10:00:00Z' },
    { ...event, eventEnd: '2026-09-09T10:00:00Z' },
    { ...event },
  );
  value.sources.push({ ...source, id: '' });
  value.episodes.push({ ...episode, sourceId: 'missing' });
  const result = buildProductionEventsMedia(value);
  assert.deepEqual(
    result.reconciliation.rejected.map(({ collection, row, reason }) => [collection, row, reason]),
    [
      ['episodes', 2, 'unknown-source'],
      ['events', 1, 'invalid-date'],
      ['events', 2, 'invalid-date'],
      ['events', 3, 'duplicate-identity'],
      ['sources', 1, 'invalid-metadata'],
    ],
  );
  assert.equal(result.videos[0].sourceId, 'source'); // Video IDs belong to a separate registry.
  assert.equal(result.sources[0].legacyId, 'radio');
  assert.ok(result.episodes[0].observations.every((item) => item.sourceId === 'radio'));
});

test('retains all distinct episode source/language observations and refuses forged display assertions', () => {
  const value = inputs();
  value.sources.push({ ...source, id: 'radio-two', homepage: 'https://second.example.org/' });
  value.episodes[1].sourceId = 'radio-two';
  const result = buildProductionEventsMedia(value);
  assert.deepEqual(
    result.episodes[0].observations.map((item) => item.sourceId),
    ['radio', 'radio-two'],
  );
  for (const change of [
    (doc) => {
      doc.episodes[0].language = 'de';
    },
    (doc) => {
      doc.episodes[0].languageReviewRequired = false;
    },
    (doc) => {
      doc.episodes[0].observations[1].sourceId = 'missing';
    },
    (doc) => {
      doc.episodes[0].observations[1].row = 0;
    },
    (doc) => {
      doc.episodes[0].observations[1].provenanceRef = 'input-events';
    },
  ]) {
    const doc = structuredClone(result);
    change(doc);
    assert.equal(validateProductionEventsMediaV1(doc), false);
  }
});
