import { access, mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { publishProductionArticleLandings } from './generate-production-article-landings.mjs';

const artifacts = Object.freeze([
  'articles',
  'sitemap.xml',
  'robots.txt',
  'article-publication-manifest.json',
]);

function fail(message) {
  throw new Error(`WRN-Stage-C-Integration: ${message}`);
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Promotes a new local publication; failure rolls promoted files back into retained staging. */
export async function integrateProductionArticleLandings({
  outputDirectory,
  releaseRoot,
  move = rename,
} = {}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0)
    fail('outputDirectory fehlt');
  const output = path.resolve(outputDirectory);
  if (!(await exists(output))) fail('Website-Buildziel fehlt');
  for (const name of artifacts) {
    if (await exists(path.join(output, name)))
      fail(`Website-Buildziel enthaelt bereits ${name} und bleibt unveraendert`);
  }
  const staging = path.join(output, '.wrn-stage-c-publication-staging');
  if (await exists(staging)) fail('Eigenes Stagingverzeichnis existiert bereits');
  await mkdir(staging);
  const publication = await publishProductionArticleLandings({
    outputDirectory: path.join(staging, 'publication'),
    releaseRoot,
  });
  const source = path.join(staging, 'publication');
  const promoted = [];
  try {
    for (const name of artifacts) {
      await move(path.join(source, name), path.join(output, name));
      promoted.push(name);
    }
    return publication;
  } catch (error) {
    for (const name of [...promoted].reverse()) {
      await move(path.join(output, name), path.join(source, name));
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const publication = await integrateProductionArticleLandings({
      outputDirectory: process.argv[2],
    });
    process.stdout.write(
      `WRN-Stage-C: ${publication.landingPages.length} production article landings integrated.\n`,
    );
  } catch (error) {
    process.stderr.write(
      `WRN-Stage-C integration failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
