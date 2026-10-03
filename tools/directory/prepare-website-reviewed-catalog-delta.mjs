import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { prepareWebsiteAppCatalog } from './prepare-website-app-catalog.mjs';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Preserve the Data snapshot verbatim and append only reviewed App intake records. */
export async function prepareWebsiteReviewedCatalogDelta({
  appDirectory,
  commit,
  baselineCommit,
  previousFile,
  outputFile,
  scratchDirectory,
  observedAt,
}) {
  if (![commit, baselineCommit].every((value) => /^[a-f0-9]{40}$/.test(value)))
    throw Error('catalog-delta-binding');
  const read = (revision, name) =>
    execFileSync('git', ['-C', appDirectory, 'show', `${revision}:${name}`], {
      maxBuffer: 4194304,
    });
  const previous = JSON.parse(await readFile(previousFile));
  if (previous.schema !== 'wrn.website-events-media-package.v1')
    throw Error('catalog-delta-baseline');
  const inputs = [],
    added = {};
  const policyBytes = read(commit, 'podcast-content-policy.json'),
    policy = JSON.parse(policyBytes);
  if (policy.schemaVersion !== 1 || !Array.isArray(policy.metadataOnlyEpisodeIds))
    throw Error('catalog-delta-policy');
  for (const [kind, file, count] of [
    ['podcasts', 'podcasts.json', 55],
    ['library', 'library-feed.json', 10],
  ]) {
    const bytes = read(commit, file),
      all = JSON.parse(bytes),
      old = JSON.parse(read(baselineCommit, file));
    if (!Array.isArray(all) || !Array.isArray(old)) throw Error('catalog-delta-input');
    const byId = new Map(all.map((row) => [row.id, row]));
    if (
      byId.size !== all.length ||
      old.some((row) => JSON.stringify(row) !== JSON.stringify(byId.get(row.id)))
    )
      throw Error('catalog-delta-existing-record-change');
    const oldIds = new Set(old.map((row) => row.id));
    added[kind] = all.filter((row) => !oldIds.has(row.id));
    if (added[kind].length !== count) throw Error('catalog-delta-review-count');
    for (const row of added[kind]) {
      if (kind === 'podcasts' && !policy.metadataOnlyEpisodeIds.includes(row.id))
        throw Error('catalog-delta-policy-missing');
      if (kind === 'library' && row.contentPolicy !== 'metadata_and_links_only')
        throw Error('catalog-delta-book-policy');
      if (
        [
          'audio',
          'audioUrl',
          'enclosure',
          'image',
          'imageUrl',
          'description',
          'body',
          'fullText',
        ].some((key) => row[key]) ||
        (row.downloads && Object.keys(row.downloads).length)
      )
        throw Error('catalog-delta-media');
    }
    inputs.push({ path: file, sha256: hash(bytes), bytes: bytes.length });
  }
  inputs.push({
    path: 'podcast-content-policy.json',
    sha256: hash(policyBytes),
    bytes: policyBytes.length,
  });
  // Reuse the existing closed seven-field metadata projection with empty other collections.
  for (const [file, rows] of [
    ['radio-stations.json', []],
    ['podcasts.json', added.podcasts],
    ['video-feed.json', []],
    ['library-feed.json', added.library],
    ['events-feed.json', []],
  ])
    await writeFile(`${scratchDirectory}/${file}`, JSON.stringify(rows));
  await writeFile(`${scratchDirectory}/history-placeholder.json`, '{}');
  await prepareWebsiteAppCatalog({
    inputDirectory: scratchDirectory,
    historyFile: `${scratchDirectory}/history-placeholder.json`,
    outputFile: `${scratchDirectory}/projected.json`,
    commit,
    observedAt,
  });
  const projected = JSON.parse(await readFile(`${scratchDirectory}/projected.json`)).current
    .collections;
  const delta = {
    schema: 'wrn.website-reviewed-app-catalog-delta.v1',
    rights: 'metadata-original-link-only',
    repository: 'https://github.com/Blackfront161/World-Revolution-News-App.git',
    commit,
    baselineCommit,
    observedAt,
    inputs,
    collections: { podcasts: projected.podcasts, library: projected.library },
  };
  for (const kind of ['podcasts', 'library']) {
    const oldIds = new Set(previous.current.collections[kind].map((row) => row.id));
    if (delta.collections[kind].some((row) => oldIds.has(row.id)))
      throw Error('catalog-delta-collision');
  }
  const next = {
    schema: 'wrn.website-events-media-package.v2',
    history: previous.history,
    current: previous.current,
    supplement: delta,
  };
  await writeFile(outputFile, JSON.stringify(next) + '\n');
  return {
    commit,
    baselineCommit,
    inputs,
    addedRawIds: Object.fromEntries(
      Object.entries(added).map(([kind, rows]) => [kind, rows.map((row) => row.id)]),
    ),
    addedProjectedCounts: Object.fromEntries(
      Object.entries(delta.collections).map(([kind, rows]) => [kind, rows.length]),
    ),
    historyAndBasePreserved: true,
    mediaFetched: false,
    policy: 'metadata-original-link-only',
  };
}
