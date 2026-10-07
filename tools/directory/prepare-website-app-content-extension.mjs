import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { projectionHash, projectionBytes } from './website-content-projection.mjs';
import { prepareWebsiteKnowledge } from './prepare-website-knowledge.mjs';
import { prepareWebsiteAppCatalog } from './prepare-website-app-catalog.mjs';
import { unpackWebsiteCatalog } from '../../apps/website/src/features/events-media/app-catalog.ts';
/** Only immutable reviewed App inputs; history and current Data remain unchanged. */
export async function prepareWebsiteAppContentExtension({
  appDirectory,
  appCommit,
  handoffCommit,
  handoffPath,
  previousCatalogFile,
  previousKnowledgeFile,
  historyKnowledgeFile,
  historyCatalogFile,
  output,
  observedAt,
}) {
  if (
    ![appCommit, handoffCommit].every((v) => /^[a-f0-9]{40}$/.test(v)) ||
    handoffPath !== 'docs/handoffs/website-content-2026-10-05/manifest.json'
  )
    throw Error('App extension binding');
  const read = (path) =>
    execFileSync(
      'git',
      ['-c', `safe.directory=${appDirectory}`, '-C', appDirectory, 'show', `${appCommit}:${path}`],
      { maxBuffer: 4194304 },
    );
  const manifestBytes = execFileSync(
      'git',
      [
        '-c',
        `safe.directory=${appDirectory}`,
        '-C',
        appDirectory,
        'show',
        `${handoffCommit}:${handoffPath}`,
      ],
      { maxBuffer: 1048576 },
    ),
    manifest = JSON.parse(manifestBytes);
  if (manifest.appCommit !== appCommit) throw Error('App extension manifest identity');
  await mkdir(output);
  await mkdir(join(output, 'inputs'));
  const hashes = {};
  for (const path of [
    'library-feed.json',
    'video-feed.json',
    'radio-stations.json',
    'podcasts.json',
    'events-feed.json',
    'podcast-content-policy.json',
    'learning-paths.json',
    'lexicon-locales.json',
    'lexicon-tab.js',
    'library-sources.json',
  ]) {
    const bytes = read(path);
    const declared = manifest.inputs[path];
    if (
      declared &&
      (declared.commit !== appCommit ||
        declared.bytes !== bytes.length ||
        declared.sha256 !== projectionHash(bytes))
    )
      throw Error('App extension input hash');
    hashes[path] = { bytes: bytes.length, sha256: projectionHash(bytes) };
    await writeFile(join(output, 'inputs', path), bytes, { flag: 'wx' });
  }
  const previous = JSON.parse(await readFile(previousCatalogFile));
  await unpackWebsiteCatalog(previous, new AbortController().signal);
  const books = JSON.parse(read('library-feed.json')),
    videoDocument = JSON.parse(read('video-feed.json')),
    videos = videoDocument.items ?? videoDocument;
  const oldKnowledge = JSON.parse(await readFile(previousKnowledgeFile)),
    oldBooks = new Set(oldKnowledge.currentKnowledge.library.books.map((b) => b.id));
  const addedBooks = books.filter((b) => !oldBooks.has(b.id));
  for (const b of addedBooks)
    if (
      b.contentPolicy !== 'metadata_and_links_only' ||
      Object.keys(b.downloads ?? {}).length ||
      ['body', 'fullText', 'image', 'imageUrl'].some((k) => b[k])
    )
      throw Error('App extension book rights');
  // This extension projects only its three collections. Radio/events retain the
  // existing exact Data package and are never replaced by incidental App feeds.
  await mkdir(join(output, 'projection-inputs'));
  for (const name of ['library-feed.json', 'video-feed.json', 'podcasts.json'])
    await writeFile(join(output, 'projection-inputs', name), read(name), { flag: 'wx' });
  for (const name of ['radio-stations.json', 'events-feed.json'])
    await writeFile(join(output, 'projection-inputs', name), '[]\n', { flag: 'wx' });
  const projectedFile = join(output, 'app-catalog.json');
  await prepareWebsiteAppCatalog({
    inputDirectory: join(output, 'projection-inputs'),
    historyFile: historyCatalogFile,
    outputFile: projectedFile,
    commit: appCommit,
    observedAt,
    podcastPolicy: JSON.parse(read('podcast-content-policy.json')),
  });
  const projected = JSON.parse(await readFile(projectedFile)).current.collections;
  const existingVideos = new Set(previous.current.collections.videos.map((v) => v.id));
  const addedVideos = projected.videos.filter((v) => !existingVideos.has(v.id));
  const previousVideoBytes = execFileSync(
      'git',
      [
        '-c',
        `safe.directory=${appDirectory}`,
        '-C',
        appDirectory,
        'show',
        `${previous.supplement.commit}:video-feed.json`,
      ],
      { maxBuffer: 4194304 },
    ),
    previousVideoDocument = JSON.parse(previousVideoBytes),
    previousVideos = previousVideoDocument.items ?? previousVideoDocument;
  let reviewedNewVideos = 0;
  for (const raw of videos.filter((v) =>
    addedVideos.some((a) => a.url === (v.originalUrl ?? v.link)),
  )) {
    const retained = previousVideos.find((v) => v.id === raw.id);
    if (retained) {
      if (!isDeepStrictEqual(retained, raw)) throw Error('App extension old video change');
    } else {
      if (
        raw.availability !== 'ORIGINAL_LINK_ONLY' ||
        raw.contentPolicy !== 'metadata_and_links_only' ||
        raw.editorialReview?.decision !== 'metadata-original-link-admitted' ||
        !/^[a-f0-9]{64}$/.test(raw.editorialReview?.evidenceSha256 ?? '') ||
        [
          'image',
          'imageUrl',
          'embedUrl',
          'thumbnailUrl',
          'audio',
          'body',
          'fullText',
          'description',
        ].some((k) => raw[k])
      )
        throw Error('App extension video rights');
      reviewedNewVideos++;
    }
    if (raw.languageVerified === false)
      projected.videos.find((v) => v.url === raw.originalUrl).language = 'und';
  }
  const collections = {};
  for (const kind of ['podcasts', 'library', 'videos']) {
    const known = new Map(previous.current.collections[kind].map((v) => [v.id, v]));
    for (const old of previous.supplement.collections[kind] ?? []) known.set(old.id, old);
    // The new supplement may only append metadata; existing records cannot silently change.
    const incoming = new Map(projected[kind].map((v) => [v.id, v]));
    for (const old of previous.supplement.collections[kind] ?? [])
      if (!isDeepStrictEqual(old, incoming.get(old.id)))
        throw Error('App extension existing supplement change');
    collections[kind] = [
      ...(previous.supplement.collections[kind] ?? []),
      ...projected[kind].filter((v) => !known.has(v.id)),
    ];
  }
  const supplement = {
    ...previous.supplement,
    schema: 'wrn.website-reviewed-app-catalog-delta.v2',
    commit: appCommit,
    baselineCommit: previous.supplement.commit,
    observedAt,
    inputs: [
      'podcasts.json',
      'library-feed.json',
      'podcast-content-policy.json',
      'video-feed.json',
    ].map((path) => ({ path, ...hashes[path] })),
    collections,
  };
  const catalog = { ...previous, supplement };
  const loaded = await unpackWebsiteCatalog(catalog, new AbortController().signal);
  await writeFile(join(output, 'catalog.json'), projectionBytes(catalog), { flag: 'wx' });
  await writeFile(join(output, 'knowledge.json'), await readFile(previousKnowledgeFile), {
    flag: 'wx',
  });
  const knowledge = await prepareWebsiteKnowledge({
    appDirectory,
    commit: appCommit,
    historyFile: historyKnowledgeFile,
    outputFile: join(output, 'knowledge.json'),
    learningPathsFile: join(output, 'learning-paths.json'),
    lexiconLocalesFile: join(output, 'lexicon-locales.json'),
    observedAt,
  });
  const receipt = {
    schema: 'wrn.website-app-content-extension.v1',
    appCommit,
    handoffCommit,
    handoffSha256: projectionHash(manifestBytes),
    observedAt,
    inputs: hashes,
    previousAppVideoSha256: projectionHash(previousVideoBytes),
    knowledge,
    catalogCounts: Object.fromEntries(
      Object.entries(loaded.current.collections).map(([k, v]) => [k, v.length]),
    ),
    addedBooks: addedBooks.map((b) => b.id),
    addedVideos: addedVideos.map((v) => v.id),
    reviewedNewVideos,
    rights: 'metadata-and-original-links; WRN learning paths; no publisher bodies or media',
    publicationPerformed: false,
  };
  await writeFile(join(output, 'receipt.json'), projectionBytes(receipt), { flag: 'wx' });
  return receipt;
}
