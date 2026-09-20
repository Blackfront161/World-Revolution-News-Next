import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { assertCleanGitSource, resolveStagingTarget } from './staging-package.mjs';

const execute = promisify(execFile);
const repositoryRoot = path.resolve(process.cwd(), '..', '..');
const { stdout: sourceStatus } = await execute(
  'git',
  ['status', '--porcelain=v1', '--untracked-files=all'],
  { cwd: repositoryRoot },
);
assertCleanGitSource(sourceStatus);

const publication = JSON.parse(
  await readFile(
    new URL('../public/wrn-local-release/v1/website-publication.json', import.meta.url),
  ),
);

const target = resolveStagingTarget({
  sourceOrigin: publication.siteOrigin,
  stagingOrigin: process.env.WRN_STAGING_ORIGIN,
  canonicalStrategy: process.env.WRN_STAGING_CANONICAL_STRATEGY,
  packageMode: process.env.WRN_STAGING_PACKAGE_MODE,
});

process.stdout.write(
  `WRN staging target validated: ${target.stagingOrigin} (${target.canonicalStrategy}; ${target.packageMode}; uploadEligible=${target.uploadEligible})\n`,
);
