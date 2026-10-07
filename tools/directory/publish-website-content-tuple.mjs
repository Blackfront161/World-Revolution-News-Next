import { readFile, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFtpsTransport } from './publish-live-content-directory.mjs';
import { projectionHash } from './website-content-projection.mjs';
import {
  isWebsiteTuplePointer,
  validateWebsiteContentTuple,
  websiteTupleMaxBytes,
  websiteTuplePointerMaxBytes,
} from '../../packages/content-contracts/src/directory/website-content-tuple-v1.ts';
export const websiteTuplePublicBase = 'https://solinaridao.com/wrn-website-content/';
const requireValue = (condition, reason) => {
  if (!condition) throw Error(reason);
};
const parse = (bytes) => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
async function bounded(response, max) {
  requireValue(
    response.status === 200 &&
      !response.redirected &&
      response.body &&
      /^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? ''),
    'tuple-public-response',
  );
  const encoding = response.headers.get('content-encoding'),
    declared = encoding && encoding !== 'identity' ? null : response.headers.get('content-length');
  requireValue(
    declared === null || (/^\d+$/.test(declared) && Number(declared) <= max),
    'tuple-public-size',
  );
  let length = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    length += chunk.length;
    requireValue(length <= max, 'tuple-public-size');
    chunks.push(chunk);
  }
  requireValue(declared === null || Number(declared) === length, 'tuple-public-truncated');
  return Buffer.concat(chunks, length);
}
const fetchOptions = (deadline) => ({
  credentials: 'omit',
  redirect: 'error',
  cache: 'no-store',
  referrerPolicy: 'no-referrer',
  headers: { accept: 'application/json', 'accept-encoding': 'identity' },
  signal: AbortSignal.timeout(deadline),
});
export async function readPublicWebsiteTuplePointerBytes(fetchImpl = fetch) {
  const response = await fetchImpl(
    new URL('current.json', websiteTuplePublicBase),
    fetchOptions(10000),
  );
  // The initial pointer belongs to the normal reviewed Website deployment. This
  // updater requires a real previous release so rollback is always possible.
  requireValue(response.status !== 404, 'tuple-seed-release-required');
  return bounded(response, websiteTuplePointerMaxBytes);
}
function pointer(bytes) {
  requireValue(bytes.byteLength <= websiteTuplePointerMaxBytes, 'tuple-pointer-size');
  const value = parse(bytes);
  requireValue(isWebsiteTuplePointer(value), 'tuple-pointer-contract');
  return value;
}
async function boundedFile(base, name, max) {
  const file = resolve(base, name),
    rel = relative(base, file);
  requireValue(rel && !isAbsolute(rel) && !rel.split(sep).includes('..'), 'tuple-file-path');
  let cursor = base;
  requireValue(!(await lstat(cursor)).isSymbolicLink(), 'tuple-linked-file');
  for (const part of rel.split(sep)) {
    cursor = resolve(cursor, part);
    requireValue(!(await lstat(cursor)).isSymbolicLink(), 'tuple-linked-file');
  }
  const stat = await lstat(file);
  requireValue(stat.isFile() && stat.size <= max, 'tuple-file-size');
  const bytes = await readFile(file);
  requireValue(bytes.length <= max, 'tuple-file-size');
  return { bytes, file };
}
export async function loadPreparedWebsiteTuple({
  output,
  expectedCommit,
  allowedImageOrigins,
  now = Date.now(),
}) {
  const base = resolve(output),
    { bytes: pointerBytes } = await boundedFile(base, 'current.json', websiteTuplePointerMaxBytes),
    manifest = pointer(pointerBytes);
  requireValue(
    manifest.source.dataCommit === expectedCommit && /^[a-f0-9]{40}$/.test(expectedCommit),
    'tuple-commit',
  );
  requireValue(
    Date.parse(manifest.observedAt) <= now + 300000 &&
      now - Date.parse(manifest.observedAt) <= 7200000,
    'tuple-stale',
  );
  const { bytes: snapshotBytes, file: snapshotPath } = await boundedFile(
    base,
    manifest.artifactPath,
    websiteTupleMaxBytes,
  );
  requireValue(
    snapshotBytes.length === manifest.artifactBytes &&
      projectionHash(snapshotBytes) === manifest.artifactSha256,
    'tuple-snapshot-hash',
  );
  const tuple = parse(snapshotBytes);
  requireValue(
    await validateWebsiteContentTuple(tuple, { allowedImageOrigins }),
    'tuple-snapshot-contract',
  );
  requireValue(
    tuple.sequence === manifest.sequence &&
      tuple.observedAt === manifest.observedAt &&
      same(tuple.source, manifest.source),
    'tuple-snapshot-binding',
  );
  const { bytes: readyBytes } = await boundedFile(base, 'READY.json', 4096),
    ready = parse(readyBytes);
  requireValue(
    ready.schema === 'wrn.website-content-tuple-ready.v1' &&
      ready.sequence === manifest.sequence &&
      ready.artifactSha256 === manifest.artifactSha256 &&
      ready.artifactBytes === snapshotBytes.length &&
      ready.publicationPerformed === false,
    'tuple-ready',
  );
  return { manifest, pointerBytes, snapshotBytes, snapshotPath };
}
/** Upload immutable metadata first; activate exactly one pointer; restore exact previous bytes on failure. */
export async function publishPreparedWebsiteTuple({
  prepared,
  transport,
  fetchCurrentBytes = readPublicWebsiteTuplePointerBytes,
  fetchPublic = fetch,
}) {
  const { manifest, pointerBytes, snapshotBytes, snapshotPath } = prepared;
  const previousBytes = await fetchCurrentBytes(),
    previous = pointer(previousBytes);
  const alreadyCurrent = same(previous, manifest);
  requireValue(
    alreadyCurrent || manifest.sequence > previous.sequence,
    'tuple-rollback-or-conflict',
  );
  if (!alreadyCurrent) await transport.uploadSnapshot(manifest.artifactPath, snapshotPath);
  const response = await fetchPublic(
    new URL(manifest.artifactPath, websiteTuplePublicBase),
    fetchOptions(20000),
  );
  const readback = await bounded(response, websiteTupleMaxBytes);
  requireValue(
    readback.length === snapshotBytes.length &&
      projectionHash(readback) === manifest.artifactSha256,
    'tuple-upload-mismatch',
  );
  if (alreadyCurrent) return { state: 'already-current', sequence: manifest.sequence };
  requireValue(same(pointer(await fetchCurrentBytes()), previous), 'tuple-concurrent-publication');
  const pending = `current.${manifest.sequence}-${manifest.artifactSha256}.tmp`,
    rollback = `current.${manifest.sequence}-${manifest.artifactSha256}.rollback.tmp`;
  await transport.uploadPointer(pending, pointerBytes);
  await transport.uploadPointer(rollback, previousBytes);
  requireValue(same(pointer(await fetchCurrentBytes()), previous), 'tuple-concurrent-publication');
  let failed = false;
  try {
    await transport.activatePointer(pending);
  } catch {
    failed = true;
  }
  let active = null;
  try {
    active = pointer(await fetchCurrentBytes());
  } catch {
    /* Exact rollback still required. */
  }
  if (!failed && same(active, manifest)) return { state: 'published', sequence: manifest.sequence };
  if (active && !same(active, manifest) && !same(active, previous))
    throw Error('tuple-concurrent-publication');
  try {
    await transport.activatePointer(rollback);
    requireValue(
      Buffer.from(await fetchCurrentBytes()).equals(Buffer.from(previousBytes)),
      'tuple-rollback-unverified',
    );
  } catch {
    throw Error('tuple-rollback-unverified');
  }
  throw Error('tuple-activation-unverified-restored');
}
function option(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const images = parse(
      await readFile(
        new URL('../../apps/website/src/features/home/app-article-images-v1.json', import.meta.url),
      ),
    );
    const prepared = await loadPreparedWebsiteTuple({
      output: option('--output'),
      expectedCommit: option('--expected-commit'),
      allowedImageOrigins: images.origins,
    });
    if (!process.argv.includes('--publish'))
      console.log(
        JSON.stringify({
          state: 'validated-dry-run',
          sequence: prepared.manifest.sequence,
          publicationPerformed: false,
        }),
      );
    else {
      requireValue(process.env.WRN_DIRECTORY_PUBLISH_ENABLED === '1', 'tuple-publish-disabled');
      requireValue(
        /\/wrn-website-content\/?$/.test(process.env.WRN_FTPS_DIRECTORY ?? ''),
        'tuple-ftps-directory-must-target-wrn-website-content',
      );
      const transport = createFtpsTransport({
        host: process.env.WRN_FTPS_HOST,
        ip: process.env.WRN_FTPS_IP,
        user: process.env.WRN_FTPS_USER,
        password: process.env.WRN_FTPS_PASSWORD,
        remoteRoot: process.env.WRN_FTPS_DIRECTORY,
        profile: 'website-tuple',
      });
      console.log(JSON.stringify(await publishPreparedWebsiteTuple({ prepared, transport })));
    }
  } catch (error) {
    console.error('Website tuple publication stopped: ' + error.message);
    process.exitCode = 1;
  }
}
