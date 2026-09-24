import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  isContentDirectoryRefreshBoundToDocument,
  isContentDirectoryRefreshManifestV1,
  contentDirectoryRefreshRepository,
  contentDirectoryRefreshSchema,
} from '../../packages/content-contracts/src/directory/content-directory-refresh-v1.ts';
import {
  mobileContentDirectoryMaxBytes,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';

export const directoryRefreshSchema = contentDirectoryRefreshSchema;
export const directoryRefreshMaxBytes = mobileContentDirectoryMaxBytes;
export const directoryRefreshOrigin = 'https://solinaridao.com';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => JSON.stringify(value) + '\n';

async function decodeDirectory(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > directoryRefreshMaxBytes) return null;
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
  return validateMobileContentDirectory(document) &&
    (await validateMobileContentDirectoryIds(document))
    ? document
    : null;
}

export async function validateDirectoryRefresh(manifest, bytes, previousSequence = 0) {
  if (
    !isContentDirectoryRefreshManifestV1(manifest) ||
    !Number.isSafeInteger(previousSequence) ||
    previousSequence < 0 ||
    manifest.sequence <= previousSequence ||
    sha256(bytes) !== manifest.artifactSha256
  )
    return false;
  const document = await decodeDirectory(bytes);
  return document !== null && isContentDirectoryRefreshBoundToDocument(manifest, document);
}

async function boundedResponseBytes(response) {
  if (!response.ok || response.redirected || response.body === null) throw new Error('response');
  const contentType = response.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|$)/iu.test(contentType)) throw new Error('mime');
  const header = response.headers.get('content-length');
  if (header !== null && (!/^\d+$/u.test(header) || Number(header) > directoryRefreshMaxBytes)) {
    await response.body.cancel().catch(() => undefined);
    throw new Error('size');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > directoryRefreshMaxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error('size');
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** The bundled snapshot is always validated before it can become the offline fallback. */
export async function selectDirectoryRefresh({
  localBytes,
  manifest,
  previousSequence = 0,
  fetchImpl = fetch,
}) {
  const localDocument = await decodeDirectory(localBytes);
  if (localDocument === null) throw new Error('local-directory-invalid');
  if (!isContentDirectoryRefreshManifestV1(manifest) || manifest.sequence <= previousSequence)
    return { state: 'offline-fallback', bytes: localBytes };
  const url = new URL(`/wrn-content-directory/${manifest.artifactPath}`, directoryRefreshOrigin);
  try {
    const response = await fetchImpl(url, {
      redirect: 'error',
      credentials: 'omit',
      headers: { accept: 'application/json' },
    });
    const bytes = await boundedResponseBytes(response);
    if (!(await validateDirectoryRefresh(manifest, bytes, previousSequence)))
      throw new Error('remote-directory-invalid');
    return { state: 'remote-accepted', bytes };
  } catch {
    return { state: 'offline-fallback', bytes: localBytes };
  }
}

export async function writePreparedDirectoryRefresh({ document, sequence, output }) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error('refresh-sequence');
  const bytes = new TextEncoder().encode(canonical(document));
  const artifactSha256 = sha256(bytes);
  const manifest = {
    schema: directoryRefreshSchema,
    sequence,
    observedAt: document.observedAt,
    artifactPath: `snapshots/directory-${sequence}-${artifactSha256}.json`,
    artifactSha256,
    source: {
      repository: contentDirectoryRefreshRepository,
      commit: document.sourceCommit,
      newsPath: 'news-feed.json',
      sourcesPath: 'sources-registry.json',
    },
  };
  if (!(await validateDirectoryRefresh(manifest, bytes, sequence - 1)))
    throw new Error('refresh-contract');
  const target = resolve(output);
  const staging = `${target}.staging-${process.pid}`;
  await mkdir(resolve(staging, 'snapshots'), { recursive: true });
  await writeFile(resolve(staging, manifest.artifactPath), bytes, { flag: 'wx' });
  await writeFile(resolve(staging, 'current.json'), canonical(manifest), { flag: 'wx' });
  await mkdir(dirname(target), { recursive: true });
  await rename(staging, target);
  return manifest;
}

if (process.argv[1]?.endsWith('prepare-content-directory-refresh.mjs')) {
  const [documentPath, output, sequenceValue] = process.argv.slice(2);
  const sequence = Number(sequenceValue);
  if (!documentPath || !output || !Number.isSafeInteger(sequence) || sequence < 1)
    throw new Error('usage: document output sequence');
  const bytes = await readFile(documentPath);
  if (bytes.byteLength > directoryRefreshMaxBytes) throw new Error('directory size');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  await writePreparedDirectoryRefresh({ document, sequence, output });
}
