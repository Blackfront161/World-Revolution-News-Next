import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildOfflineShell } from './build-offline-shell.mjs';
import { integrateStaticArticleLandings } from './integrate-static-article-landings.mjs';
import {
  assertCleanGitSource,
  assertExpectedStagingHtml,
  buildStagingSecurityHeaders,
  copyClosedPublicPackage,
  createPackageManifest,
  injectStagingHead,
  renderApacheConfig,
  resolveStagingTarget,
  writeRetirementPackage,
} from './staging-package.mjs';

const execute = promisify(execFile);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const repositoryRoot = path.resolve(process.cwd(), '..', '..');

const { stdout: sourceStatus } = await execute(
  'git',
  ['status', '--porcelain=v1', '--untracked-files=all'],
  { cwd: repositoryRoot },
);
assertCleanGitSource(sourceStatus);

function ownedDirectory(argument, expectedPrefix) {
  if (!argument) throw new Error(`Missing ${expectedPrefix} directory argument`);
  const resolved = path.resolve(argument);
  if (
    path.dirname(resolved) !== process.cwd() ||
    !path.basename(resolved).startsWith(expectedPrefix)
  )
    throw new Error(`${expectedPrefix} directory must be an owned child of the website package`);
  return resolved;
}

async function htmlDocuments(directory, relative = '') {
  const documents = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    if (relative === '' && entry.name === '.vite') continue;
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) documents.push(...(await htmlDocuments(directory, next)));
    else if (entry.isFile() && entry.name.endsWith('.html'))
      documents.push(await readFile(path.join(directory, next), 'utf8'));
  }
  return documents;
}

const buildDirectory = ownedDirectory(process.argv[2], 'dist-staging-build');
const packageDirectory = ownedDirectory(process.argv[3], 'dist-staging-package');
const retirementDirectory = ownedDirectory(process.argv[4], 'dist-staging-retirement');

const publication = JSON.parse(
  await readFile(path.join(buildDirectory, 'wrn-local-release', 'v1', 'website-publication.json')),
);
const target = resolveStagingTarget({
  sourceOrigin: publication.siteOrigin,
  stagingOrigin: process.env.WRN_STAGING_ORIGIN,
  canonicalStrategy: process.env.WRN_STAGING_CANONICAL_STRATEGY,
  packageMode: process.env.WRN_STAGING_PACKAGE_MODE,
});

const indexPath = path.join(buildDirectory, 'index.html');
await writeFile(indexPath, injectStagingHead(await readFile(indexPath, 'utf8'), target), 'utf8');

const publicationManifest = await integrateStaticArticleLandings({
  outputDirectory: buildDirectory,
  publicationTarget: target,
});
await assertExpectedStagingHtml(buildDirectory);
const headers = buildStagingSecurityHeaders(await htmlDocuments(buildDirectory));
const shell = await buildOfflineShell({
  outputDirectory: buildDirectory,
  compatibility: 'g3-015-v1',
  htmlResponseHeaders: headers,
  stagingOrigin: target.stagingOrigin,
});
await writeFile(path.join(buildDirectory, '.htaccess'), renderApacheConfig(headers), 'utf8');
await copyClosedPublicPackage(buildDirectory, packageDirectory);
await writeRetirementPackage({ directory: retirementDirectory, headers });

const [{ stdout: commitOutput }, lockfile] = await Promise.all([
  execute('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot }),
  readFile(path.join(repositoryRoot, 'pnpm-lock.yaml')),
]);
const sourceCommit = commitOutput.trim();
const common = {
  sourceCommit,
  lockfileSha256: sha256(lockfile),
  stagingOrigin: target.stagingOrigin,
  canonicalStrategy: target.canonicalStrategy,
  packageMode: target.packageMode,
  uploadEligible: target.uploadEligible,
  contentRevision: publicationManifest.releaseRevision,
};
const activeManifest = await createPackageManifest({
  directory: packageDirectory,
  ...common,
  kind: 'active',
});
const retirementManifest = await createPackageManifest({
  directory: retirementDirectory,
  ...common,
  kind: 'retirement',
});
await writeFile(
  `${packageDirectory}.manifest.json`,
  `${JSON.stringify({ ...activeManifest, shellId: shell.shellId }, null, 2)}\n`,
  'utf8',
);
await writeFile(
  `${retirementDirectory}.manifest.json`,
  `${JSON.stringify(retirementManifest, null, 2)}\n`,
  'utf8',
);

process.stdout.write(
  `WRN staging package ${activeManifest.packageId} (${activeManifest.files.length} files)\n` +
    `WRN retirement package ${retirementManifest.packageId} (${retirementManifest.files.length} files)\n`,
);
