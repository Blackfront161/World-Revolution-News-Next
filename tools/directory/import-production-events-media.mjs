import { createHash } from 'node:crypto';
import { readFile, stat, writeFile, access, constants } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  productionEventsMediaMaxBytesV1,
  productionEventsMediaInputPathsV1,
  productionEventsMediaCollectionLimitsV1,
  productionEventsMediaPlainText,
  normaliseProductionEventsMediaUrl,
  normaliseProductionEventsMediaInstant,
  validateProductionEventsMediaV1,
} from '../../packages/content-contracts/src/directory/production-events-media-v1.ts';

export const MAX_INPUT_BYTES = 16 * 1024 * 1024;
export const inputPins = Object.freeze({
  events: 'c1e618f0c7c525e22394029c1e27eda8c6045c02a35f972f4fe57796c6be3f86',
  videos: '53ebf5be1a058ed9395f77620ad4b5c7f8eaac7fae6e9dc3f7204b525823983c',
  episodes: '8e128a2070e9130daacc4903a8bf1c028afaf5c6194a9d2d035594c923500421',
  sources: '9b5676fa402c060b9ab1a3f29e49dec3b0bcf92199ea36e5c11fcdba599a721e',
});
const hash = (value) => createHash('sha256').update(value).digest('hex');
const repo = 'https://github.com/Blackfront161/World-Revolution-News-Website';
const commit = '9a59b17cc9b3a6a7b7541c2e64862af208d02ace';
const observedAt = '2026-09-10T00:00:00.000Z';
const paths = productionEventsMediaInputPathsV1;
const text = (value, max = 500) => (productionEventsMediaPlainText(value, max) ? value : null);
const canonicalUrl = (value) => normaliseProductionEventsMediaUrl(value);
const language = (value) =>
  typeof value === 'string' &&
  value.length <= 35 &&
  /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(value)
    ? value
    : 'und';
const instant = normaliseProductionEventsMediaInstant;
const urlFields = (originalUrl, canonical) =>
  originalUrl === canonical ? { originalUrl } : { originalUrl, canonicalUrl: canonical };
const id = (kind, url) => `wrn-${kind}-${hash(`${kind}:${url}`)}`;
const rejected = (collection, row, reason, reconciliation) => {
  reconciliation.rejected.push({ collection, row, reason });
  return null;
};
const collection = (input, key) => {
  if (key === 'videos') return input?.items;
  return input;
};
function provenanceRef(key) {
  return `input-${key}`;
}
function eventRow(item, row, reconciliation) {
  const originalUrl = item?.link,
    canonical = canonicalUrl(originalUrl),
    startAt = instant(item?.eventStart);
  const endAt =
    item?.eventEnd === '' || item?.eventEnd === null || item?.eventEnd === undefined
      ? null
      : instant(item.eventEnd);
  if (!canonical) return rejected('events', row, 'invalid-url', reconciliation);
  if (!startAt || (item?.eventEnd && !endAt) || (endAt && Date.parse(endAt) < Date.parse(startAt)))
    return rejected('events', row, 'invalid-date', reconciliation);
  const title = text(item?.title),
    sourceName = text(item?.quelleName);
  if (!title || !sourceName) return rejected('events', row, 'invalid-metadata', reconciliation);
  return {
    id: id('event', canonical),
    title,
    sourceName,
    ...urlFields(originalUrl, canonical),
    language: language(item.language),
    startAt,
    endAt,
    sourceStartAt: item.eventStart,
    sourceEndAt: item.eventEnd || null,
    timezone: text(item.eventTimezone, 80),
    country: text(item.eventCountry, 80),
    city: text(item.eventCity, 160),
    provenanceRef: provenanceRef('events'),
    row,
  };
}
function videoRow(item, row, reconciliation) {
  const originalUrl = item?.originalUrl,
    canonical = canonicalUrl(originalUrl),
    publishedAt = instant(item?.publishedAt);
  if (!canonical) return rejected('videos', row, 'invalid-url', reconciliation);
  if (!publishedAt) return rejected('videos', row, 'invalid-date', reconciliation);
  const title = text(item?.title),
    sourceName = text(item?.source),
    sourceId = text(item?.sourceId, 160);
  if (!title || !sourceName || !sourceId)
    return rejected('videos', row, 'invalid-metadata', reconciliation);
  return {
    id: id('video', canonical),
    title,
    sourceName,
    sourceId,
    ...urlFields(originalUrl, canonical),
    language: language(item.language),
    publishedAt,
    sourcePublishedAt: item.publishedAt,
    historicalAvailability: text(item.availability, 80),
    provenanceRef: provenanceRef('videos'),
    row,
  };
}
function episodeRow(item, row, reconciliation) {
  const originalUrl = item?.episodeUrl,
    canonical = canonicalUrl(originalUrl),
    publishedAt = instant(item?.published);
  if (!canonical) return rejected('episodes', row, 'invalid-url', reconciliation);
  if (!publishedAt) return rejected('episodes', row, 'invalid-date', reconciliation);
  const title = text(item?.title),
    sourceName = text(item?.sourceName),
    sourceId = text(item?.sourceId, 160);
  if (!title || !sourceName || !sourceId)
    return rejected('episodes', row, 'invalid-metadata', reconciliation);
  return {
    id: id('episode', canonical),
    title,
    sourceName,
    sourceId,
    ...urlFields(originalUrl, canonical),
    language: language(item.language),
    languageReviewRequired: item.languageReviewRequired === true,
    publishedAt,
    sourcePublishedAt: item.published,
    observation: {
      provenanceRef: provenanceRef('episodes'),
      row,
      sourceId,
      language: language(item.language),
      languageReviewRequired: item.languageReviewRequired === true,
    },
  };
}
function sourceRow(item, row, reconciliation) {
  const originalUrl = item?.homepage,
    canonical = canonicalUrl(originalUrl);
  if (!canonical) return rejected('sources', row, 'invalid-url', reconciliation);
  const name = text(item?.name),
    legacyId = text(item?.id, 160);
  if (!name || !legacyId) return rejected('sources', row, 'invalid-metadata', reconciliation);
  return {
    id: id('source', canonical),
    legacyId,
    name,
    ...urlFields(originalUrl, canonical),
    language: language(item.language),
    country: text(item.country, 80),
    provenanceRef: provenanceRef('sources'),
    row,
  };
}
function deduplicateEpisodes(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!row) continue;
    const key = canonicalUrl(row.originalUrl);
    const values = groups.get(key) ?? [];
    values.push(row);
    groups.set(key, values);
  }
  return [...groups.values()].map((values) => {
    values.sort((left, right) => left.observation.row - right.observation.row);
    const display = values[0];
    const observations = values.map((value) => value.observation);
    const languages = new Set(observations.map((value) => value.language));
    return {
      id: display.id,
      title: display.title,
      sourceName: display.sourceName,
      sourceId: display.sourceId,
      originalUrl: display.originalUrl,
      ...(display.canonicalUrl === undefined ? {} : { canonicalUrl: display.canonicalUrl }),
      language: languages.size === 1 ? display.language : 'und',
      languageReviewRequired:
        values.some((value) => value.languageReviewRequired) || languages.size > 1,
      publishedAt: display.publishedAt,
      sourcePublishedAt: display.sourcePublishedAt,
      observationCount: observations.length,
      observations,
    };
  });
}
export function buildProductionEventsMedia(inputs, hashes) {
  if (!hashes || typeof hashes !== 'object') throw new Error('input-hashes-required');
  for (const key of Object.keys(inputPins)) {
    const rows = collection(inputs[key], key);
    if (!Array.isArray(rows) || rows.length > productionEventsMediaCollectionLimitsV1[key])
      throw new Error(`input-shape:${key}`);
    if (!/^[a-f0-9]{64}$/u.test(hashes[key] ?? '')) throw new Error(`input-hash:${key}`);
    if (Buffer.byteLength(JSON.stringify(inputs[key])) > MAX_INPUT_BYTES)
      throw new Error(`input-too-large:${key}`);
  }
  const reconciliation = {
    input: Object.fromEntries(
      Object.keys(inputPins).map((key) => [key, collection(inputs[key], key).length]),
    ),
    accepted: { events: 0, videos: 0, episodes: 0, sources: 0 },
    rejected: [],
    rawEpisodeUrls: 0,
    deduplicatedEpisodes: 0,
  };
  const uniqueRows = (rows, key) => {
    const ids = new Set(),
      legacyIds = new Set();
    return rows
      .filter((entry) => {
        if (!entry) return false;
        if (ids.has(entry.id) || (key === 'sources' && legacyIds.has(entry.legacyId)))
          return rejected(key, entry.row, 'duplicate-identity', reconciliation);
        ids.add(entry.id);
        if (key === 'sources') legacyIds.add(entry.legacyId);
        return true;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  };
  const events = uniqueRows(
    inputs.events.map((row, index) => eventRow(row, index, reconciliation)),
    'events',
  );
  const videos = uniqueRows(
    inputs.videos.items.map((row, index) => videoRow(row, index, reconciliation)),
    'videos',
  );
  const sources = uniqueRows(
    inputs.sources.map((row, index) => sourceRow(row, index, reconciliation)),
    'sources',
  );
  const sourceIds = new Set(sources.map((entry) => entry.legacyId));
  const episodeRows = inputs.episodes.map((row, index) => {
    const entry = episodeRow(row, index, reconciliation);
    return entry && !sourceIds.has(entry.sourceId)
      ? rejected('episodes', index, 'unknown-source', reconciliation)
      : entry;
  });
  reconciliation.rawEpisodeUrls = new Set(
    inputs.episodes.map((row) => row?.episodeUrl).filter((url) => typeof url === 'string'),
  ).size;
  const episodes = deduplicateEpisodes(episodeRows).sort((a, b) => a.id.localeCompare(b.id));
  reconciliation.accepted = {
    events: events.length,
    videos: videos.length,
    episodes: episodeRows.filter(Boolean).length,
    sources: sources.length,
  };
  reconciliation.deduplicatedEpisodes = episodes.length;
  reconciliation.rejected.sort((a, b) => a.collection.localeCompare(b.collection) || a.row - b.row);
  const document = {
    schema: 'wrn.production-events-media.v1',
    version: 1,
    rights: 'metadata-only',
    snapshot: {
      repository: repo,
      commit,
      observedAt,
      historical: true,
      inputs: Object.keys(inputPins).map((key) => ({
        ref: provenanceRef(key),
        path: paths[key],
        sha256: hashes[key],
      })),
    },
    events,
    videos,
    episodes,
    sources,
    reconciliation,
  };
  if (!validateProductionEventsMediaV1(document)) throw new Error('output-contract');
  return document;
}
export function serialiseProductionEventsMedia(document) {
  const output = JSON.stringify(document) + '\n';
  if (Buffer.byteLength(output) > productionEventsMediaMaxBytesV1)
    throw new Error('output-too-large');
  if (!validateProductionEventsMediaV1(document)) throw new Error('output-contract');
  return output;
}
export async function readPinnedJson(path, expectedHash) {
  if ((await stat(path)).size > MAX_INPUT_BYTES) throw new Error('input-too-large');
  const bytes = await readFile(path);
  if (bytes.byteLength > MAX_INPUT_BYTES) throw new Error('input-too-large');
  if (hash(bytes) !== expectedHash) throw new Error('input-pin');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export async function writeAbsent(path, data) {
  try {
    await access(path, constants.F_OK);
    throw new Error('output-exists');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await writeFile(path, data, { flag: 'wx' });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 7) throw new Error('Expected events videos episodes sources output');
  const entries = await Promise.all(
    Object.keys(inputPins).map(async (key, index) => [
      key,
      await readPinnedJson(process.argv[index + 2], inputPins[key]),
    ]),
  );
  const output = serialiseProductionEventsMedia(
    buildProductionEventsMedia(Object.fromEntries(entries), inputPins),
  );
  await writeAbsent(process.argv[6], output);
  process.stdout.write(
    `${JSON.stringify({ bytes: Buffer.byteLength(output), sha256: hash(output) })}\n`,
  );
}
