import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchLegacyNewsSnapshot, legacyNewsLimits } from '../legacy-news-ingestion.mjs';
import {
  fetchLegacySourceRegistry,
  liveDirectorySourceLimit,
} from './prepare-live-content-directory.mjs';
import { projectionHash, projectionBytes } from './website-content-projection.mjs';
const origin = 'https://blackfront161.github.io/Revolution-News-Data/';

/** Read-only observation: the actual published bytes must equal one immutable upstream commit. */
export async function observePublishedWebsiteInputs({ commit, fetchImpl = fetch, now = Date.now }) {
  const signal = AbortSignal.timeout(legacyNewsLimits.deadlineMs);
  const snapshot = await fetchLegacyNewsSnapshot({ commit, fetchImpl, signal, now });
  const registry = await fetchLegacySourceRegistry({ commit, fetchImpl, signal });
  const files = {
    'news-feed.json': snapshot.feedBytes,
    'feed-status.json': snapshot.statusBytes,
    'sources-registry.json': registry,
  };
  for (const [name, pinned] of Object.entries(files)) {
    const maximum =
      name === 'feed-status.json'
        ? legacyNewsLimits.statusBytes
        : name === 'news-feed.json'
          ? legacyNewsLimits.feedBytes
          : liveDirectorySourceLimit;
    const response = await fetchImpl(origin + name, {
      signal,
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      headers: { accept: 'application/json', 'accept-encoding': 'identity' },
    });
    if (
      !response.ok ||
      response.redirected ||
      !response.body ||
      !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
    )
      throw Error('published-response');
    const declared = response.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximum))
      throw Error('published-size');
    const chunks = [];
    let length = 0;
    for await (const chunk of response.body) {
      signal.throwIfAborted();
      length += chunk.length;
      if (length > maximum) throw Error('published-size');
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks, length);
    if (declared !== null && Number(declared) !== length) throw Error('published-truncated');
    if (!bytes.equals(Buffer.from(pinned))) throw Error('published-commit-mismatch');
  }
  return {
    files,
    commit,
    observedAt: new Date(now()).toISOString(),
    publishedOrigin: origin,
    publishedBytesMatchCommit: true,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [commit, output, sequenceValue] = process.argv.slice(2),
    sequence = Number(sequenceValue);
  if (!commit || !output || !Number.isSafeInteger(sequence) || sequence < 1)
    throw Error('usage: commit new-work-directory sequence');
  const observation = await observePublishedWebsiteInputs({ commit });
  await mkdir(resolve(output));
  for (const [name, bytes] of Object.entries(observation.files))
    await writeFile(resolve(output, name), bytes, { flag: 'wx' });
  const paths = {
    baseline: 'apps/website/src/features/directory/data/content-directory-v1.json',
    feed: resolve(output, 'news-feed.json'),
    status: resolve(output, 'feed-status.json'),
    registry: resolve(output, 'sources-registry.json'),
    sourcePass: 'apps/website/public/wrn-source-passes/current.json',
    revocations: 'apps/website/public/wrn-source-pass-revocations/current.json',
  };
  const hashes = {};
  for (const [name, file] of Object.entries(paths)) {
    const bytes = await readFile(file);
    hashes[name] = projectionHash(name === 'baseline' ? projectionBytes(JSON.parse(bytes)) : bytes);
  }
  const binding = {
    admissionPolicy: 'website-restricted-link-only-v1',
    importMode: 'metadata-only',
    commit,
    observedAt: observation.observedAt,
    hashes,
    feedCount: JSON.parse(observation.files['news-feed.json']).length,
    registerCount: JSON.parse(observation.files['sources-registry.json']).sources.length,
    publishedOrigin: origin,
    publishedBytesMatchCommit: true,
  };
  await writeFile(resolve(output, 'config.json'), projectionBytes({ paths, binding, sequence }), {
    flag: 'wx',
  });
  console.log(JSON.stringify({ publicationPerformed: false, binding }));
}
