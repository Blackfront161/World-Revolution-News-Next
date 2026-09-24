import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyProductionWebsitePackage } from '../apps/website/tools/production-site-package.mjs';
import { validateDirectoryRefresh } from './directory/prepare-content-directory-refresh.mjs';

export const productionHostingPacketSchema = 'wrn.production-hosting-packet.v1';
const websiteSchema = 'wrn.production-website-package.v1';
const maximumFileBytes = 8 * 1024 * 1024;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) =>
  JSON.stringify(value, function (_key, item) {
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([left], [right]) => left.localeCompare(right)),
        )
      : item;
  });
const equal = (left, right) => canonical(left) === canonical(right);

function safeRelative(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z0-9._/-]+$/u.test(value) ||
    value.startsWith('/') ||
    value.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  )
    throw new Error('unsafe-relative-path');
  return value;
}

async function trustedRoot(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value))
    throw new Error('absolute-trusted-root-required');
  const root = path.resolve(value);
  const info = await lstat(root);
  if (!info.isDirectory() || info.isSymbolicLink() || (await realpath(root)) !== root)
    throw new Error('invalid-trusted-root');
  return root;
}

async function inspect(root, target, directory = false) {
  const resolved = path.resolve(target);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('path-outside-workspace');
  let cursor = root;
  for (const segment of relative ? relative.split(path.sep) : []) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    if (info.isSymbolicLink() || (await realpath(cursor)) !== cursor)
      throw new Error('path-alias-forbidden');
    if (cursor !== resolved && !info.isDirectory()) throw new Error('invalid-path-ancestor');
  }
  const info = await lstat(resolved);
  if (directory && !info.isDirectory()) throw new Error('directory-required');
  return resolved;
}

async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readBound(root, base, relative, maximum = maximumFileBytes) {
  const safe = safeRelative(relative);
  const target = await inspect(root, path.join(base, ...safe.split('/')));
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maximum)
    throw new Error('bounded-regular-file-required');
  const bytes = await readFile(target);
  if (bytes.byteLength > maximum) throw new Error('file-byte-limit');
  return bytes;
}

async function writeBound(root, base, relative, bytes) {
  const safe = safeRelative(relative);
  const target = path.join(base, ...safe.split('/'));
  await mkdir(path.dirname(target), { recursive: true });
  await inspect(root, path.dirname(target), true);
  await writeFile(target, bytes, { flag: 'wx' });
}

async function listFiles(root, directory, prefix = '') {
  await inspect(root, directory, true);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = safeRelative(prefix + entry.name);
    const target = await inspect(root, path.join(directory, entry.name));
    if (entry.isDirectory()) files.push(...(await listFiles(root, target, `${relative}/`)));
    else if (entry.isFile()) files.push(relative);
    else throw new Error('unsupported-file-entry');
  }
  return files.sort();
}

function parseJson(bytes, reason) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error(reason);
  }
}

function entry(relative, bytes) {
  return { path: relative, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function apacheDirectoryPolicy() {
  const unset = (name) => [`Header onsuccess unset ${name}`, `Header always unset ${name}`];
  return Buffer.from(
    [
      'Options -Indexes',
      'AddType application/json .json',
      ...unset('Access-Control-Allow-Origin'),
      'Header always set Access-Control-Allow-Origin "*"',
      ...unset('Access-Control-Allow-Credentials'),
      ...unset('Cross-Origin-Resource-Policy'),
      'Header always set Cross-Origin-Resource-Policy "cross-origin"',
      '<FilesMatch "^(?!current\\.json$).+\\.json$">',
      ...unset('Cache-Control'),
      'Header always set Cache-Control "public, max-age=31536000, immutable"',
      '</FilesMatch>',
      '<Files "current.json">',
      ...unset('Cache-Control'),
      'Header always set Cache-Control "no-store"',
      '</Files>',
      '',
    ].join('\n'),
  );
}

async function plan({ websiteDirectory, directoryRefreshDirectory, trustedWorkspaceRoot }) {
  const root = await trustedRoot(trustedWorkspaceRoot);
  if (!path.isAbsolute(websiteDirectory) || !path.isAbsolute(directoryRefreshDirectory))
    throw new Error('absolute-input-directories-required');
  const website = await inspect(root, websiteDirectory, true);
  const directory = await inspect(root, directoryRefreshDirectory, true);
  await verifyProductionWebsitePackage({ directory: website, trustedWorkspaceRoot: root });
  const websiteManifestBytes = await readBound(
    root,
    path.dirname(website),
    `${path.basename(website)}.manifest.json`,
  );
  const websiteManifest = parseJson(websiteManifestBytes, 'invalid-website-manifest');
  if (
    websiteManifest?.schema !== websiteSchema ||
    !Array.isArray(websiteManifest.files) ||
    !Array.isArray(websiteManifest.activationOrder) ||
    !websiteManifest.headers ||
    typeof websiteManifest.headers !== 'object'
  )
    throw new Error('invalid-website-contract');
  const websitePaths = websiteManifest.files.map((item) => safeRelative(item.path));
  if (
    new Set(websitePaths).size !== websitePaths.length ||
    !equal([...websitePaths].sort(), [...websiteManifest.activationOrder].sort())
  )
    throw new Error('invalid-website-closure');
  const publicFiles = new Map();
  for (const item of websiteManifest.files) {
    const bytes = await readBound(root, website, item.path);
    if (bytes.byteLength !== item.bytes || sha256(bytes) !== item.sha256)
      throw new Error(`website-byte-mismatch:${item.path}`);
    publicFiles.set(item.path, bytes);
  }

  const currentBytes = await readBound(root, directory, 'current.json');
  const current = parseJson(currentBytes, 'invalid-directory-manifest');
  const artifactPath = safeRelative(current?.artifactPath);
  const artifactBytes = await readBound(root, directory, artifactPath);
  if (!(await validateDirectoryRefresh(current, artifactBytes, current.sequence - 1)))
    throw new Error('invalid-directory-refresh');
  const directoryClosure = await listFiles(root, directory);
  if (!equal(directoryClosure, ['current.json', artifactPath].sort()))
    throw new Error('invalid-directory-closure');
  const hostedCurrent = 'wrn-content-directory/current.json';
  const hostedArtifact = `wrn-content-directory/${artifactPath}`;
  const hostedPolicy = 'wrn-content-directory/.htaccess';
  if ([hostedCurrent, hostedArtifact, hostedPolicy].some((name) => publicFiles.has(name)))
    throw new Error('hosting-path-collision');
  publicFiles.set(hostedCurrent, currentBytes);
  publicFiles.set(hostedArtifact, artifactBytes);
  publicFiles.set(hostedPolicy, apacheDirectoryPolicy());

  const baseHeaders = websiteManifest.headers['index.html'];
  if (!baseHeaders || typeof baseHeaders !== 'object') throw new Error('missing-base-headers');
  const directoryHeaders = (cacheControl) => ({
    ...baseHeaders,
    'access-control-allow-origin': '*',
    'cache-control': cacheControl,
    'cross-origin-resource-policy': 'cross-origin',
  });
  const headers = {
    ...websiteManifest.headers,
    [hostedCurrent]: directoryHeaders('no-store'),
    [hostedArtifact]: directoryHeaders('public, max-age=31536000, immutable'),
  };
  const productionPointer = 'wrn-production-content/current.json';
  if (websiteManifest.activationOrder.at(-1) !== productionPointer)
    throw new Error('website-pointer-not-last');
  const activationOrder = [
    ...websiteManifest.activationOrder.filter((item) => item !== productionPointer),
    hostedPolicy,
    hostedArtifact,
    productionPointer,
    hostedCurrent,
  ];
  const paths = [...publicFiles.keys()].sort();
  if (!equal([...activationOrder].sort(), paths)) throw new Error('activation-closure-mismatch');
  const manifest = {
    schema: productionHostingPacketSchema,
    version: 1,
    sourceCommit: websiteManifest.sourceCommit,
    generatedAtUTC: websiteManifest.generatedAtUTC,
    canonicalOrigin: websiteManifest.canonicalOrigin,
    website: {
      sourceDirectory: path.relative(root, website).replaceAll(path.sep, '/'),
      manifestSha256: sha256(websiteManifestBytes),
      revision: websiteManifest.revision,
      sequence: websiteManifest.sequence,
      shellId: websiteManifest.shellId,
    },
    directory: {
      sourceDirectory: path.relative(root, directory).replaceAll(path.sep, '/'),
      sequence: current.sequence,
      observedAt: current.observedAt,
      sourceCommit: current.source.commit,
      currentSha256: sha256(currentBytes),
      artifactPath: hostedArtifact,
      artifactSha256: current.artifactSha256,
    },
    files: paths.map((relative) => entry(relative, publicFiles.get(relative))),
    headers,
    activationOrder,
    rollback: {
      retainBeforeActivation: [productionPointer, hostedCurrent],
      restoreOrder: [productionPointer, hostedCurrent],
      requirement: 'retain-prior-root-and-pointer-bytes-before-transfer',
    },
    operatorInstructions: [
      'Verify every byte count and SHA-256 before transfer.',
      'Retain the prior server root and both prior pointer responses before activation.',
      'Transfer immutable files first, then activate both current.json pointers in the recorded order.',
      'Verify HTTPS, headers, hashes and client refresh before replacing the retained rollback copy.',
      'On failure restore the retained root and pointers; never synthesize rollback metadata.',
    ],
  };
  return { root, manifest, publicFiles };
}

export async function prepareProductionHostingPacket(options = {}) {
  const root = await trustedRoot(options.trustedWorkspaceRoot);
  if (typeof options.outputDirectory !== 'string' || !path.isAbsolute(options.outputDirectory))
    throw new Error('absolute-output-directory-required');
  const output = path.resolve(options.outputDirectory);
  await inspect(root, path.dirname(output), true);
  for (const target of [output, `${output}.manifest.json`, `${output}.README.txt`])
    if (await exists(target)) throw new Error('output-exists-and-is-preserved');
  const prepared = await plan(options);
  await mkdir(output);
  for (const [relative, bytes] of prepared.publicFiles)
    await writeBound(root, output, relative, bytes);
  await writeFile(`${output}.manifest.json`, `${canonical(prepared.manifest)}\n`, { flag: 'wx' });
  await writeFile(
    `${output}.README.txt`,
    'Prepared hosting packet only. Retain the current server root and pointer bytes, upload immutable files first, activate both current.json files last, verify the live response, and restore retained bytes on any failure.\n',
    { flag: 'wx' },
  );
  return {
    outputDirectory: output,
    manifestPath: `${output}.manifest.json`,
    files: prepared.manifest.files.length,
    websiteRevision: prepared.manifest.website.revision,
    directorySequence: prepared.manifest.directory.sequence,
  };
}

export async function verifyProductionHostingPacket({ directory, trustedWorkspaceRoot, manifest }) {
  const root = await trustedRoot(trustedWorkspaceRoot);
  const output = await inspect(root, directory, true);
  const supplied =
    manifest ??
    parseJson(
      await readBound(root, path.dirname(output), `${path.basename(output)}.manifest.json`),
      'invalid-hosting-manifest',
    );
  if (
    supplied?.schema !== productionHostingPacketSchema ||
    typeof supplied.website?.sourceDirectory !== 'string' ||
    typeof supplied.directory?.sourceDirectory !== 'string'
  )
    throw new Error('invalid-hosting-contract');
  const expected = await plan({
    websiteDirectory: path.join(root, ...safeRelative(supplied.website.sourceDirectory).split('/')),
    directoryRefreshDirectory: path.join(
      root,
      ...safeRelative(supplied.directory.sourceDirectory).split('/'),
    ),
    trustedWorkspaceRoot: root,
  });
  if (!equal(supplied, expected.manifest)) throw new Error('hosting-manifest-mismatch');
  const actual = await listFiles(root, output);
  if (!equal(actual, [...expected.publicFiles.keys()].sort()))
    throw new Error('hosting-closure-mismatch');
  for (const [relative, bytes] of expected.publicFiles)
    if (!bytes.equals(await readBound(root, output, relative)))
      throw new Error(`hosting-byte-mismatch:${relative}`);
  return {
    files: actual.length,
    websiteRevision: supplied.website.revision,
    directorySequence: supplied.directory.sequence,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const values = new Map();
    const allowed = ['--website', '--directory', '--output', '--workspace'];
    for (let index = 0; index < args.length; index += 2) {
      if (
        !allowed.includes(args[index]) ||
        values.has(args[index]) ||
        !args[index + 1] ||
        args[index + 1].startsWith('--')
      )
        throw new Error('unknown-duplicate-positional-or-missing-cli-argument');
      values.set(args[index], args[index + 1]);
    }
    if (values.size !== allowed.length) throw new Error('missing-required-cli-argument');
    const result = await prepareProductionHostingPacket({
      websiteDirectory: values.get('--website'),
      directoryRefreshDirectory: values.get('--directory'),
      outputDirectory: values.get('--output'),
      trustedWorkspaceRoot: values.get('--workspace'),
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(
      `WRN hosting packet failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
