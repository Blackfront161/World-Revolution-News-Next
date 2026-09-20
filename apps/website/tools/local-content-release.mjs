import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  createValidatedLocalContentReleaseV1,
  localContentReleaseMaxTransportBytes,
} from '../../../packages/content-contracts/src/index.ts';

const releaseRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/wrn-local-release/v1',
);
const documentNames = Object.freeze({
  descriptor: 'release-descriptor.json',
  manifest: 'manifest.json',
  articles: 'articles.json',
  supplementalItems: 'supplemental-items.json',
  discoverIndex: 'discover-index.json',
  readerDetails: 'reader-details.json',
  archiveLifecycle: 'archive-lifecycle.json',
  websitePublication: 'website-publication.json',
});

function fail() {
  throw new Error('WRN-G3-012-Publisher: lokale Inhaltsrevision ist nicht sicher lesbar.');
}

async function readJson(name) {
  const relative = documentNames[name];
  const candidate = path.resolve(releaseRoot, relative);
  if (!candidate.startsWith(`${releaseRoot}${path.sep}`)) fail();
  let content;
  try {
    content = await readFile(candidate, 'utf8');
  } catch {
    fail();
  }
  if (Buffer.byteLength(content, 'utf8') > localContentReleaseMaxTransportBytes) fail();
  try {
    return JSON.parse(content);
  } catch {
    fail();
  }
}

/**
 * Der Publisher liest dieselben versionierten JSON-Artefakte wie die Website-
 * Runtime. Test-Support, Netzwerk und Fixturefallback bleiben ausgeschlossen.
 */
export async function loadWebsiteLocalContentReleaseFromDisk() {
  const [
    descriptor,
    manifest,
    articles,
    supplementalItems,
    discoverIndex,
    readerDetails,
    archiveLifecycle,
    websitePublication,
  ] = await Promise.all(Object.keys(documentNames).map((name) => readJson(name)));
  const ready = await createValidatedLocalContentReleaseV1(descriptor, {
    manifest,
    payloads: { articles, 'supplemental-items': supplementalItems },
    discoverIndex,
    readerDetails,
    archiveLifecycle,
    websitePublication,
  });
  return Object.freeze({ ready });
}
