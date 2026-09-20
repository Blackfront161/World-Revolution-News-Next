import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildWebsiteProductionContentRelease } from './production-content-release.mjs';

export { buildWebsiteProductionContentRelease } from './production-content-release.mjs';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputDirectory = process.argv[2];
  const generatedAt = process.argv[3];
  const result = await buildWebsiteProductionContentRelease({ outputDirectory, generatedAt });
  process.stdout.write(
    `WRN-Stage-C: ${result.releaseRevision} local production release written.\n`,
  );
}
