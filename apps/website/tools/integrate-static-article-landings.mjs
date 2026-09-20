import { access, rename, rm, rmdir } from 'node:fs/promises';
import path from 'node:path';

import { publishStaticArticleLandings } from './generate-static-article-landings.mjs';

const staticArtifactNames = Object.freeze([
  'articles',
  'sitemap.xml',
  'robots.txt',
  'article-publication-manifest.json',
]);

function fail(message) {
  throw new Error(`WRN-G3-007-Buildintegration: ${message}`);
}

async function pathExists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Adds the verified static publication to Vite's newly created website output.
 * It refuses to replace any pre-existing publication artifact, so an unrelated
 * caller-owned website directory cannot be silently changed by this step.
 */
export async function integrateStaticArticleLandings({
  outputDirectory,
  publicationTarget,
  move = rename,
}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0) {
    fail('outputDirectory fehlt');
  }
  const output = path.resolve(outputDirectory);
  if (!(await pathExists(output))) fail('Website-Buildziel fehlt.');

  for (const name of staticArtifactNames) {
    if (await pathExists(path.join(output, name))) {
      fail(`Website-Buildziel enthaelt bereits ${name} und bleibt unveraendert.`);
    }
  }

  const staging = path.join(output, '.wrn-g3-007-static-staging');
  if (await pathExists(staging)) fail('Eigenes Stagingverzeichnis existiert bereits.');
  const publicationManifest = await publishStaticArticleLandings({
    outputDirectory: staging,
    publicationTarget,
  });

  const promoted = [];
  try {
    for (const name of staticArtifactNames) {
      await move(path.join(staging, name), path.join(output, name));
      promoted.push(name);
    }
    await rmdir(staging);
    return publicationManifest;
  } catch (promotionError) {
    const rollbackErrors = [];
    for (const name of [...promoted].reverse()) {
      try {
        await move(path.join(output, name), path.join(staging, name));
      } catch (rollbackError) {
        rollbackErrors.push(`${name}: ${String(rollbackError)}`);
      }
    }
    if (rollbackErrors.length > 0) {
      fail(
        `Promotion fehlgeschlagen und die vollstaendige Ruecknahme ist nicht sicher moeglich: ${rollbackErrors.join(' | ')}`,
      );
    }
    /** Das Verzeichnis wurde ausschliesslich vom sicheren Publisher reserviert. */
    await rm(staging, { recursive: true, force: true });
    throw promotionError;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const outputDirectory = process.argv[2];
  const result = await integrateStaticArticleLandings({ outputDirectory });
  process.stdout.write(
    `WRN-G3-007-Buildintegration: ${result.landingPages.length} statische Landingpages im Website-Build.\n`,
  );
}
