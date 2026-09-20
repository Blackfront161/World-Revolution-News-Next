import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  productionDeliveryEndpoint,
  productionDeliveryManifestSchema,
  validateProductionDeliveryLedger,
} from './prepare-production-content-delivery.mjs';

import { isProductionContentCurrentPointerV1 } from '../packages/content-contracts/src/index.ts';

const origin = 'https://solinaridao.com';
const pointer = 'activate/wrn-production-content/current.json';
const maxFile = 4 * 1024 * 1024;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (message) => {
  throw new Error(`WRN delivery verification: ${message}`);
};

async function boundedFile(root, relative, limit) {
  if (
    typeof relative !== 'string' ||
    !/^[a-zA-Z0-9._/-]+$/.test(relative) ||
    relative.split('/').some((part) => !part || part === '.' || part === '..')
  )
    fail('invalid package path');
  let cursor = root;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) fail('package contains link or junction');
    const physical = await realpath(cursor);
    if (!physical.startsWith(root + path.sep)) fail('package escapes its root');
  }
  const info = await lstat(cursor);
  if (!info.isFile() || info.size > limit) fail('file exceeds bound');
  const bytes = await readFile(cursor);
  if (bytes.length > limit) fail('file changed beyond bound');
  return bytes;
}

/** Read-only, hash-bound check. Neither uploads nor activates any content. */
export async function verifyProductionDelivery({
  directory,
  manifestSha256,
  phase = 'local',
  fetchImpl = globalThis.fetch,
}) {
  if (!['local', 'preactivate', 'active'].includes(phase)) fail('invalid phase');
  if (!/^[a-f0-9]{64}$/.test(manifestSha256 ?? '')) fail('exact manifest hash required');
  const root = await realpath(directory);
  const manifestBytes = await boundedFile(root, 'delivery-manifest.json', maxFile);
  if (sha(manifestBytes) !== manifestSha256) fail('manifest hash mismatch');
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes));
  if (
    !manifest ||
    typeof manifest.releaseRevision !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,127}$/.test(manifest.releaseRevision) ||
    !Number.isSafeInteger(manifest.sequence) ||
    manifest.sequence < 1 ||
    typeof manifest.generatedAt !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(manifest.generatedAt) ||
    !Number.isFinite(Date.parse(manifest.generatedAt)) ||
    new Date(manifest.generatedAt).toISOString() !== manifest.generatedAt ||
    manifest.schema !== productionDeliveryManifestSchema ||
    manifest.version !== 1 ||
    manifest.endpointBase !== productionDeliveryEndpoint ||
    manifest.siteOrigin !== origin + '/' ||
    !Array.isArray(manifest.files) ||
    manifest.files.length < 2 ||
    manifest.files.length > 256
  )
    fail('invalid manifest');
  const files = new Map();
  const destinations = new Set();
  let total = 0;
  for (const entry of manifest.files) {
    if (
      typeof entry.path !== 'string' ||
      !(entry.path.startsWith('preactivate/') || entry.path === pointer) ||
      files.has(entry.path) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 1 ||
      entry.bytes > maxFile ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      fail('invalid file entry');
    const destination = entry.path.replace(/^(?:preactivate|activate)\//, '');
    if (destinations.has(destination)) fail('duplicate destination');
    destinations.add(destination);
    total += entry.bytes;
    if (total > 16 * 1024 * 1024) fail('package exceeds total bound');
    const bytes = await boundedFile(root, entry.path, entry.bytes);
    if (bytes.length !== entry.bytes || sha(bytes) !== entry.sha256)
      fail('local file hash mismatch');
    files.set(entry.path, entry);
  }
  if (
    !files.has(pointer) ||
    !Array.isArray(manifest.activationOrder) ||
    manifest.activationOrder.length !== files.size ||
    new Set(manifest.activationOrder).size !== files.size ||
    manifest.activationOrder.some((p) => !files.has(p)) ||
    manifest.activationOrder.at(-1) !== pointer
  )
    fail('activation order must contain every file and pointer last');
  const ledger = await boundedFile(root, 'next-ledger.json', maxFile);
  if (sha(ledger) !== manifest.nextLedgerSha256) fail('ledger hash mismatch');
  const parsedLedger = validateProductionDeliveryLedger(
    JSON.parse(ledger.toString('utf8')),
    ledger,
  );
  const current = JSON.parse((await boundedFile(root, pointer, maxFile)).toString('utf8'));
  const head = parsedLedger.entries.at(-1);
  if (
    !isProductionContentCurrentPointerV1(current) ||
    current.descriptorPath !== `${manifest.releaseRevision}/release-descriptor.json` ||
    current.releaseRevision !== manifest.releaseRevision ||
    current.sequence !== manifest.sequence ||
    head.sequence !== manifest.sequence ||
    head.releaseRevision !== manifest.releaseRevision ||
    head.generatedAt !== manifest.generatedAt ||
    head.descriptorSha256 !== current.descriptorSha256
  )
    fail('release identity mismatch');
  const revisionRoot = `preactivate/wrn-production-content/${manifest.releaseRevision}/`;
  for (const [file, digest] of [
    [`preactivate/wrn-production-content/${current.descriptorPath}`, head.descriptorSha256],
    [revisionRoot + 'manifest.json', head.manifestSha256],
    [revisionRoot + 'website-publication.json', head.publicationSha256],
    ['preactivate/article-publication-manifest.json', head.staticManifestSha256],
  ])
    if (files.get(file)?.sha256 !== digest) fail('ledger does not bind delivered revision');
  const checked = [];
  if (phase !== 'local') {
    const deadline = Date.now() + 60_000;
    for (const relative of manifest.activationOrder) {
      if (relative === pointer && phase === 'preactivate') continue;
      const entry = files.get(relative);
      const pathname = relative.replace(/^(?:preactivate|activate)\//, '');
      const url = new URL('/' + pathname, origin);
      if (url.origin !== origin || url.pathname !== '/' + pathname || url.search || url.hash)
        fail('unsafe remote path');
      const remaining = deadline - Date.now();
      if (remaining <= 0) fail('verification deadline exceeded');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(5000, remaining));
      let reader;
      try {
        const response = await fetchImpl(url.href, {
          method: 'GET',
          redirect: 'error',
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          signal: controller.signal,
        });
        if (
          !response.ok ||
          response.redirected ||
          response.body === null ||
          (response.url && response.url !== url.href)
        ) {
          await response.body?.cancel().catch(() => {});
          fail('remote response rejected');
        }
        reader = response.body.getReader();
        if (
          relative === pointer &&
          !/(?:^|,)\s*no-store\s*(?:,|$)|(?:^|,)\s*no-cache(?:\s|,|$)/i.test(
            response.headers.get('cache-control') ?? '',
          )
        )
          fail('pointer must not be served as a fresh cached response');
        const digest = createHash('sha256');
        let count = 0;
        for (;;) {
          controller.signal.throwIfAborted();
          const chunk = await reader.read();
          if (chunk.done) break;
          count += chunk.value.byteLength;
          if (count > entry.bytes) fail('remote file exceeds bound');
          digest.update(chunk.value);
        }
        if (count !== entry.bytes || digest.digest('hex') !== entry.sha256)
          fail('remote file hash mismatch');
        checked.push(relative);
      } finally {
        controller.abort();
        if (reader) {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
        clearTimeout(timeout);
      }
    }
  }
  return {
    schema: 'wrn.delivery-verification.v1',
    phase,
    manifestSha256,
    releaseRevision: manifest.releaseRevision,
    sequence: manifest.sequence,
    localFiles: files.size,
    remoteFiles: checked.length,
    pointerChecked: checked.includes(pointer),
    publicationPerformed: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [directory, manifestSha256, phase = 'local', ...extra] = process.argv.slice(2);
    if (!directory || !manifestSha256 || extra.length)
      fail('usage: directory manifest-sha256 [local|preactivate|active]');
    console.log(
      JSON.stringify(await verifyProductionDelivery({ directory, manifestSha256, phase })),
    );
  } catch {
    console.error('WRN delivery verification failed; no publication performed.');
    process.exitCode = 1;
  }
}
