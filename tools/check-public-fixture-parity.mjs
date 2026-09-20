import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// Package tests own neutral fixtures; only this workspace-level integration
// check binds them to shipped client artifacts. Neither package imports an app.
export const publicFixturePairs = Object.freeze([
  ...[
    'mobile-media-release',
    'media-manifest',
    'media-admission',
    'media-rights',
    'media-consent',
    'media-lifecycle',
    'media-revocation',
  ].map((name) =>
    Object.freeze({
      fixture: `packages/content-contracts/tests/fixtures/wrn-mobile-media-v1/${name}.json`,
      client: `apps/mobile/public/wrn-mobile-media/v1/${name}.json`,
    }),
  ),
  Object.freeze({
    fixture:
      'packages/content-contracts/tests/fixtures/wrn-mobile-regional-events-v1/mobile-regional-events.json',
    client: 'apps/mobile/public/wrn-mobile-regional-events/v1/mobile-regional-events.json',
  }),
  ...[
    'archive-lifecycle',
    'articles',
    'discover-index',
    'release-descriptor',
    'manifest',
    'reader-details',
    'supplemental-items',
    'website-publication',
  ].map((name) =>
    Object.freeze({
      fixture: `packages/test-support/tests/fixtures/wrn-g3-016-public/${name}.json`,
      client: `apps/mobile/public/wrn-local-release/v1/${name}.json`,
    }),
  ),
]);

export function verifyPublicFixtureParity(
  workspaceRoot,
  readText = (file) => readFileSync(file, 'utf8'),
) {
  for (const pair of publicFixturePairs) {
    const read = (relativePath) => {
      try {
        return JSON.parse(readText(path.resolve(workspaceRoot, relativePath)));
      } catch {
        throw new Error(`Fixture parity: missing or invalid JSON: ${relativePath}`);
      }
    };
    if (!isDeepStrictEqual(read(pair.fixture), read(pair.client))) {
      throw new Error(`Fixture parity: content differs: ${pair.fixture} <> ${pair.client}`);
    }
  }
  return publicFixturePairs.length;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  const root = path.resolve(path.dirname(thisFile), '..');
  process.stdout.write(`Public fixture parity: ${verifyPublicFixtureParity(root)} pairs passed\n`);
}
