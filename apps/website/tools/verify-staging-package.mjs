import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyStagingPackage } from './staging-package.mjs';

function ownedDirectory(argument) {
  if (!argument) throw new Error('Usage: verify-staging-package.mjs <package> <manifest>');
  const resolved = path.resolve(argument);
  if (
    path.dirname(resolved) !== process.cwd() ||
    !path.basename(resolved).startsWith('dist-staging-package')
  )
    throw new Error('Package must be an owned child of the website package');
  return resolved;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = ownedDirectory(process.argv[2]);
  const manifestPath = path.resolve(process.argv[3] ?? '');
  if (path.dirname(manifestPath) !== process.cwd() || manifestPath !== `${directory}.manifest.json`)
    throw new Error('External manifest path must match the package');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const result = await verifyStagingPackage({
    directory,
    manifest,
    actualOrigin: process.env.WRN_STAGING_ACTUAL_ORIGIN,
    allowProbe: process.argv.includes('--allow-probe'),
  });
  process.stdout.write(
    `WRN staging package externally verified: ${result.packageId} (${result.files} files; ${result.actualOrigin})\n`,
  );
}
