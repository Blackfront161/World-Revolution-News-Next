import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { observePublishedWebsiteInputs } from './observe-website-projection-inputs.mjs';
import { projectionBytes, projectionHash } from './website-content-projection.mjs';
import {
  prepareWebsiteContentTuple,
  writePreparedWebsiteTuple,
} from './prepare-website-content-tuple.mjs';
const root = new URL('../../', import.meta.url);
async function policy(path, fetchImpl) {
  const response = await fetchImpl('https://solinaridao.com/' + path, {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { accept: 'application/json', 'accept-encoding': 'identity' },
    signal: AbortSignal.timeout(10000),
  });
  if (
    response.status !== 200 ||
    response.redirected ||
    !response.body ||
    !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')
  )
    throw Error('Tuple policy response');
  const encoding = response.headers.get('content-encoding'),
    declared = encoding && encoding !== 'identity' ? null : response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 4 * 1024 * 1024))
    throw Error('Tuple policy size');
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > 4 * 1024 * 1024) throw Error('Tuple policy size');
    chunks.push(chunk);
  }
  if (declared !== null && Number(declared) !== length) throw Error('Tuple policy truncated');
  return Buffer.concat(chunks, length);
}
/** Observe immutable Data plus its exact public publication, and current restrictive first-party policy. */
export async function observeAndPrepareWebsiteTuple({
  commit,
  sequence,
  fetchImpl = fetch,
  now = Date.now,
}) {
  const observation = await observePublishedWebsiteInputs({ commit, fetchImpl, now });
  const [baselineBytes, sourcePassBytes, revocationBytes, imagesBytes] = await Promise.all([
    readFile(new URL('apps/website/src/features/directory/data/content-directory-v1.json', root)),
    policy('wrn-source-passes/current.json', fetchImpl),
    policy('wrn-source-pass-revocations/current.json', fetchImpl),
    readFile(new URL('apps/website/src/features/home/app-article-images-v1.json', root)),
  ]);
  const baseline = JSON.parse(baselineBytes),
    feedBytes = observation.files['news-feed.json'],
    statusBytes = observation.files['feed-status.json'],
    sourceBytes = observation.files['sources-registry.json'];
  const binding = {
    admissionPolicy: 'website-restricted-link-only-v1',
    importMode: 'metadata-only',
    commit,
    observedAt: observation.observedAt,
    hashes: {
      baseline: projectionHash(projectionBytes(baseline)),
      feed: projectionHash(feedBytes),
      status: projectionHash(statusBytes),
      registry: projectionHash(sourceBytes),
      sourcePass: projectionHash(sourcePassBytes),
      revocations: projectionHash(revocationBytes),
    },
    feedCount: JSON.parse(feedBytes).length,
    registerCount: JSON.parse(sourceBytes).sources.length,
    publishedOrigin: observation.publishedOrigin,
    publishedBytesMatchCommit: true,
  };
  return prepareWebsiteContentTuple({
    baseline,
    feedBytes,
    statusBytes,
    sourceBytes,
    sourcePassBytes,
    revocationBytes,
    binding,
    sequence,
    allowedImageOrigins: JSON.parse(imagesBytes).origins,
  });
}
function option(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = option('--output');
  if (!output) throw Error('Output required');
  const prepared = await observeAndPrepareWebsiteTuple({
    commit: option('--commit'),
    sequence: Number(option('--sequence')),
  });
  await writePreparedWebsiteTuple(prepared, output);
  console.log(
    JSON.stringify({
      state: 'prepared',
      sequence: prepared.pointer.sequence,
      artifactSha256: prepared.pointer.artifactSha256,
      bytes: prepared.bytes.length,
      publicationPerformed: false,
    }),
  );
}
