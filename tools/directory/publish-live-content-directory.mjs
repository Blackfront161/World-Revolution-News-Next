import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  isContentDirectoryRefreshBoundToDocument,
  isContentDirectoryRefreshManifestV1,
} from '../../packages/content-contracts/src/directory/content-directory-refresh-v1.ts';
import {
  mobileContentDirectoryMaxBytes,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';

export const directoryPublicBase = 'https://solinaridao.com/wrn-content-directory/';
const manifestMaxBytes = 4_096;
const maximumCandidateAgeMs = 2 * 60 * 60 * 1_000;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const requireValue = (condition, reason) => {
  if (!condition) throw new Error(reason);
};

async function boundedResponse(response, maximum) {
  requireValue(response.ok && !response.redirected, 'directory-public-response');
  requireValue(
    /^application\/json(?:\s*;|$)/iu.test(response.headers.get('content-type') ?? ''),
    'directory-public-type',
  );
  const declared = response.headers.get('content-length');
  if (declared !== null)
    requireValue(/^\d+$/u.test(declared) && Number(declared) <= maximum, 'directory-public-size');
  requireValue(response.body !== null, 'directory-public-body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      requireValue(size <= maximum, 'directory-public-size');
      chunks.push(part.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export async function loadPreparedDirectory({ output, expectedCommit, now = Date.now() }) {
  requireValue(/^[a-f0-9]{40}$/u.test(expectedCommit), 'directory-commit');
  const base = resolve(output);
  const manifestBytes = await readFile(resolve(base, 'current.json'));
  requireValue(manifestBytes.length <= manifestMaxBytes, 'directory-manifest-size');
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes));
  requireValue(isContentDirectoryRefreshManifestV1(manifest), 'directory-manifest-contract');
  requireValue(manifest.source.commit === expectedCommit, 'directory-commit-mismatch');
  const observed = Date.parse(manifest.observedAt);
  requireValue(
    observed <= now + 5 * 60_000 && observed >= now - maximumCandidateAgeMs,
    'directory-stale',
  );
  const snapshotPath = resolve(base, manifest.artifactPath);
  requireValue(
    snapshotPath.startsWith(`${base}\\`) || snapshotPath.startsWith(`${base}/`),
    'directory-path',
  );
  const snapshotBytes = await readFile(snapshotPath);
  requireValue(snapshotBytes.length <= mobileContentDirectoryMaxBytes, 'directory-snapshot-size');
  requireValue(hash(snapshotBytes) === manifest.artifactSha256, 'directory-snapshot-hash');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(snapshotBytes));
  requireValue(
    validateMobileContentDirectory(document) &&
      (await validateMobileContentDirectoryIds(document)) &&
      isContentDirectoryRefreshBoundToDocument(manifest, document),
    'directory-snapshot-contract',
  );
  return Object.freeze({ manifest, manifestBytes, snapshotBytes, snapshotPath });
}

async function readPublicDirectoryManifestBytes(fetchImpl = fetch) {
  const response = await fetchImpl(new URL('current.json', directoryPublicBase), {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  return boundedResponse(response, manifestMaxBytes);
}

function parsePublicDirectoryManifest(bytes) {
  requireValue(
    bytes instanceof Uint8Array && bytes.byteLength <= manifestMaxBytes,
    'directory-live-manifest',
  );
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  requireValue(isContentDirectoryRefreshManifestV1(manifest), 'directory-live-manifest');
  return manifest;
}

export async function readPublicDirectoryManifest(fetchImpl = fetch) {
  return parsePublicDirectoryManifest(await readPublicDirectoryManifestBytes(fetchImpl));
}

const samePublication = (left, right) =>
  left?.sequence === right.sequence && left?.artifactSha256 === right.artifactSha256;

export async function publishPreparedDirectory({
  prepared,
  transport,
  fetchCurrent = readPublicDirectoryManifest,
  fetchCurrentBytes = readPublicDirectoryManifestBytes,
  fetchPublic = fetch,
}) {
  const { manifest, manifestBytes, snapshotBytes, snapshotPath } = prepared;
  const previous = await fetchCurrent();
  const alreadyCurrent = samePublication(previous, manifest);
  if (!alreadyCurrent)
    requireValue(manifest.sequence > previous.sequence, 'directory-rollback-or-sequence-conflict');
  if (!alreadyCurrent) await transport.uploadSnapshot(manifest.artifactPath, snapshotPath);
  const snapshotResponse = await fetchPublic(new URL(manifest.artifactPath, directoryPublicBase), {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  const publishedSnapshot = await boundedResponse(snapshotResponse, mobileContentDirectoryMaxBytes);
  requireValue(
    publishedSnapshot.length === snapshotBytes.length &&
      hash(publishedSnapshot) === manifest.artifactSha256,
    'directory-upload-mismatch',
  );
  if (alreadyCurrent)
    return Object.freeze({ state: 'already-current', sequence: manifest.sequence });
  const latest = await fetchCurrent();
  requireValue(samePublication(latest, previous), 'directory-concurrent-publication');
  const pendingPath = `current.${manifest.sequence}-${manifest.artifactSha256}.tmp`;
  await transport.uploadPointer(pendingPath, manifestBytes);
  const previousBytes = await fetchCurrentBytes();
  requireValue(
    samePublication(parsePublicDirectoryManifest(previousBytes), previous),
    'directory-concurrent-publication',
  );
  const rollbackPath = `current.${manifest.sequence}-${manifest.artifactSha256}.rollback.tmp`;
  await transport.uploadPointer(rollbackPath, previousBytes);
  let activationFailed = false;
  try {
    await transport.activatePointer(pendingPath);
  } catch {
    activationFailed = true;
  }
  let active;
  try {
    active = await fetchCurrent();
  } catch {
    active = null;
  }
  if (!activationFailed && samePublication(active, manifest))
    return Object.freeze({ state: 'published', sequence: manifest.sequence });
  if (active && !samePublication(active, manifest) && !samePublication(active, previous))
    throw new Error('directory-concurrent-publication');
  try {
    await transport.activatePointer(rollbackPath);
    requireValue(samePublication(await fetchCurrent(), previous), 'directory-rollback-unverified');
  } catch {
    throw new Error('directory-rollback-unverified');
  }
  throw new Error('directory-activation-unverified-restored');
}

function curlOption(value) {
  requireValue(
    typeof value === 'string' && value.length > 0 && !/[\r\n\0]/u.test(value),
    'directory-ftps-option',
  );
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

export function createFtpsTransport({ host, ip, user, password, remoteRoot }) {
  requireValue(/^[a-z0-9-]+\.hstgr\.io$/u.test(host), 'directory-ftps-host');
  requireValue(isIP(ip) === 4, 'directory-ftps-ip');
  requireValue(/^[a-zA-Z0-9_.-]+$/u.test(user), 'directory-ftps-user');
  requireValue(typeof password === 'string' && password.length >= 16, 'directory-ftps-password');
  requireValue(
    /^\/[a-zA-Z0-9_./-]*$/u.test(remoteRoot) && !remoteRoot.includes('..'),
    'directory-ftps-root',
  );
  const base = `ftp://${host}:21${remoteRoot.endsWith('/') ? remoteRoot : `${remoteRoot}/`}`;
  const run = (args) =>
    new Promise((resolveRun, rejectRun) => {
      const child = spawn(
        'curl',
        [
          '--config',
          '-',
          '--silent',
          '--show-error',
          '--fail',
          '--ssl-reqd',
          '--tlsv1.2',
          '--ftp-pasv',
          '--connect-timeout',
          '10',
          '--max-time',
          '90',
          '--resolve',
          `${host}:21:${ip}`,
          ...args,
        ],
        { stdio: ['pipe', 'ignore', 'pipe'] },
      );
      let stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (part) => {
        stderr = (stderr + part).slice(-2_000);
      });
      child.on('error', () => rejectRun(new Error('directory-ftps-launch')));
      child.on('close', (code) =>
        code === 0
          ? resolveRun()
          : rejectRun(
              new Error(
                `directory-ftps-exit-${code}: ${stderr.replaceAll(password, '[redacted]')}`,
              ),
            ),
      );
      child.stdin.end(`user = ${curlOption(`${user}:${password}`)}\n`);
    });
  const url = (path) => {
    requireValue(
      /^(?:snapshots\/directory-\d+-[a-f0-9]{64}\.json|current\.\d+-[a-f0-9]{64}\.(?:rollback\.)?tmp)$/u.test(
        path,
      ),
      'directory-ftps-path',
    );
    return new URL(path, base).href;
  };
  return Object.freeze({
    uploadSnapshot: async (path, file) =>
      run(['--ftp-create-dirs', '--upload-file', file, '--url', url(path)]),
    uploadPointer: async (path, bytes) => {
      const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
      const { tmpdir } = await import('node:os');
      const { join } = await import('node:path');
      const temp = await mkdtemp(join(tmpdir(), 'wrn-pointer-'));
      try {
        const file = join(temp, 'current.json');
        await writeFile(file, bytes, { mode: 0o600 });
        await run(['--upload-file', file, '--url', url(path)]);
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    },
    activatePointer: async (path) =>
      run(['--quote', `RNFR ${path}`, '--quote', 'RNTO current.json', '--url', base]),
  });
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const prepared = await loadPreparedDirectory({
      output: option('--output'),
      expectedCommit: option('--expected-commit'),
    });
    if (!process.argv.includes('--publish')) {
      process.stdout.write(
        JSON.stringify({ state: 'validated-dry-run', sequence: prepared.manifest.sequence }) + '\n',
      );
    } else {
      requireValue(process.env.WRN_DIRECTORY_PUBLISH_ENABLED === '1', 'directory-publish-disabled');
      const transport = createFtpsTransport({
        host: process.env.WRN_FTPS_HOST,
        ip: process.env.WRN_FTPS_IP,
        user: process.env.WRN_FTPS_USER,
        password: process.env.WRN_FTPS_PASSWORD,
        remoteRoot: process.env.WRN_FTPS_DIRECTORY,
      });
      process.stdout.write(
        JSON.stringify(await publishPreparedDirectory({ prepared, transport })) + '\n',
      );
    }
  } catch (error) {
    process.stderr.write(`Directory publication stopped: ${error.message}\n`);
    process.exitCode = 1;
  }
}
