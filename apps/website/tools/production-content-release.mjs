import { access, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  createValidatedProductionContentRelease,
  isProductionContentDescriptor,
  validateProductionWebsitePublication,
} from '../../../packages/content-contracts/src/index.ts';
import { isProductionContentDescriptorV3 } from '../../../packages/content-contracts/src/production-content-release-v3.ts';
import { productionContentCapacityPolicyV3 } from '../../../packages/content-contracts/src/production-content-capacity-policy.ts';
import {
  productionContentMaxBundleBytes,
  productionContentMaxResourceBytes,
} from '../../../packages/content-contracts/src/content-release-core-v1.ts';

export const productionWebsitePublicationFile = 'website-publication.json';
export const productionReleaseCurrentFile = 'current.json';
export const productionWebsitePublisherVersion = 'wrn-production-website-publisher/1';
/** Canonical URL serialization required by the shared safe-HTTPS contract. */
export const productionWebsiteOrigin = 'https://solinaridao.com/';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(toolDirectory, '../../..');
const admittedSourceRoot = path.join(
  workspaceRoot,
  'docs/evidence/WRN-PRODUCTION-ARTICLE-PILOT-2026-09-10/generated-core-e8506a4',
);
const releaseNames = Object.freeze([
  'release-descriptor.json',
  'manifest.json',
  'articles.json',
  'admission.json',
  'discover-index.json',
  'reader-details.json',
  'archive-lifecycle.json',
]);

function fail(message) {
  throw new Error(`WRN-Stage-C-ProductionPublication: ${message}`);
}

function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalPath(root, relative) {
  const candidate = path.resolve(root, relative);
  if (candidate === root || !candidate.startsWith(`${root}${path.sep}`))
    fail('unsicherer Dateipfad');
  return candidate;
}

function isRevision(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{2,127}$/.test(value);
}

function parseJson(bytes, label, maximum = productionContentMaxResourceBytes) {
  if (bytes.byteLength > maximum) fail(`${label} ueberschreitet das Ressourcenlimit`);
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail(`${label} ist kein valides UTF-8`);
  }
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} ist kein valides JSON`);
  }
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

async function readBoundFile(root, relative, label, maximum = productionContentMaxResourceBytes) {
  const file = canonicalPath(root, relative);
  let details;
  try {
    details = await lstat(file);
  } catch {
    fail(`${label} fehlt`);
  }
  if (!details.isFile() || details.size > maximum)
    fail(`${label} ueberschreitet das Ressourcenlimit`);
  let bytes;
  try {
    bytes = await readFile(file);
  } catch {
    fail(`${label} fehlt`);
  }
  return bytes;
}

function currentPointerShape(value) {
  return (
    value &&
    typeof value === 'object' &&
    Object.keys(value).length === 5 &&
    value.schema === 'wrn.production-content-current.v1' &&
    isRevision(value.releaseRevision) &&
    Number.isSafeInteger(value.sequence) &&
    value.sequence >= 0 &&
    typeof value.descriptorPath === 'string' &&
    value.descriptorPath === `${value.releaseRevision}/release-descriptor.json` &&
    typeof value.descriptorSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(value.descriptorSha256)
  );
}

async function readReleaseParts(root) {
  const currentBytes = await readBoundFile(root, productionReleaseCurrentFile, 'current.json');
  const current = parseJson(currentBytes, 'current.json');
  if (!currentPointerShape(current)) fail('current.json bindet keinen sicheren Descriptor');

  const descriptorBytes = await readBoundFile(
    root,
    current.descriptorPath,
    'release-descriptor.json',
  );
  if (hashBytes(descriptorBytes) !== current.descriptorSha256)
    fail('Descriptor-Hash stimmt nicht mit current.json ueberein');
  const descriptor = parseJson(descriptorBytes, 'release-descriptor.json');
  if (!isProductionContentDescriptor(descriptor))
    fail('Descriptor-Version wird nicht unterstuetzt');
  if (
    !descriptor ||
    descriptor.releaseRevision !== current.releaseRevision ||
    descriptor.sequence !== current.sequence
  )
    fail('Descriptor-Revision stimmt nicht mit current.json ueberein');
  const v3 = isProductionContentDescriptorV3(descriptor);
  const resourceCaps = v3
    ? productionContentCapacityPolicyV3.maxResourceBytes
    : Object.freeze({
        articles: productionContentMaxResourceBytes,
        admission: productionContentMaxResourceBytes,
        discoverIndex: productionContentMaxResourceBytes,
        readerDetails: productionContentMaxResourceBytes,
        archiveLifecycle: productionContentMaxResourceBytes,
      });
  const bundleCap = v3 ? 4 * 1024 * 1024 : productionContentMaxBundleBytes;

  const parts = new Map([
    [productionReleaseCurrentFile, currentBytes],
    [current.descriptorPath, descriptorBytes],
  ]);
  let total = currentBytes.byteLength + descriptorBytes.byteLength;
  for (const name of releaseNames.slice(1)) {
    const relative = `${current.releaseRevision}/${name}`;
    const id =
      name === 'archive-lifecycle.json'
        ? 'archiveLifecycle'
        : name === 'discover-index.json'
          ? 'discoverIndex'
          : name === 'reader-details.json'
            ? 'readerDetails'
            : name.slice(0, -5);
    const bytes = await readBoundFile(root, relative, name, resourceCaps[id]);
    parseJson(bytes, name, resourceCaps[id]);
    total += bytes.byteLength;
    if (total > bundleCap) fail('Release ueberschreitet das Bundlelimit');
    parts.set(relative, bytes);
  }
  const documents = {
    articles: parseJson(
      parts.get(`${current.releaseRevision}/articles.json`),
      'articles.json',
      resourceCaps.articles,
    ),
    admission: parseJson(
      parts.get(`${current.releaseRevision}/admission.json`),
      'admission.json',
      resourceCaps.admission,
    ),
    discoverIndex: parseJson(
      parts.get(`${current.releaseRevision}/discover-index.json`),
      'discover-index.json',
      resourceCaps.discoverIndex,
    ),
    readerDetails: parseJson(
      parts.get(`${current.releaseRevision}/reader-details.json`),
      'reader-details.json',
      resourceCaps.readerDetails,
    ),
    archiveLifecycle: parseJson(
      parts.get(`${current.releaseRevision}/archive-lifecycle.json`),
      'archive-lifecycle.json',
      resourceCaps.archiveLifecycle,
    ),
  };
  const ready = await createValidatedProductionContentRelease({
    descriptor,
    manifest: parseJson(parts.get(`${current.releaseRevision}/manifest.json`), 'manifest.json'),
    documents,
  });
  if (!ready) fail('Release verletzt den versionierten Produktionsvertrag');
  return Object.freeze({ current, descriptor, ready, parts, totalBytes: total, bundleCap });
}

export function createProductionWebsitePublication(ready, generatedAt) {
  const publication = Object.freeze({
    contractVersion: '1.0.0',
    schema: 'wrn.production-website-publication.v1',
    revision: ready.descriptor.releaseRevision,
    generatedAt,
    siteOrigin: productionWebsiteOrigin,
    sourceManifest: Object.freeze({
      revision: ready.manifest.revision,
      sha256: ready.manifestSha256,
      articleIds: Object.freeze([...ready.articleIds]),
    }),
    landingIds: Object.freeze([...ready.articleIds]),
    sitemapArticleIds: Object.freeze([...ready.articleIds]),
    generatorVersion: productionWebsitePublisherVersion,
  });
  const result = validateProductionWebsitePublication(publication, ready);
  if (!result.ok) fail(`Publikationsvertrag ungueltig: ${result.errors.join(', ')}`);
  return publication;
}

/** Reads only the fixed public release layout and validates both independent contracts. */
export async function loadWebsiteProductionContentReleaseFromDisk({
  root = path.join(workspaceRoot, 'apps/website/public/wrn-production-content'),
} = {}) {
  const release = await readReleaseParts(path.resolve(root));
  const publicationBytes = await readBoundFile(
    path.resolve(root),
    `${release.current.releaseRevision}/${productionWebsitePublicationFile}`,
    productionWebsitePublicationFile,
  );
  const publication = parseJson(publicationBytes, productionWebsitePublicationFile);
  if (release.totalBytes + publicationBytes.byteLength > release.bundleCap)
    fail('Release einschliesslich Publikation ueberschreitet das Bundlelimit');
  const publicationValidation = validateProductionWebsitePublication(publication, release.ready);
  if (!publicationValidation.ok)
    fail(`Publikationsbindung ungueltig: ${publicationValidation.errors.join(', ')}`);
  // This deterministic publisher deliberately uses the Core revision as its
  // own publication revision. Other generic Website projections may differ.
  if (publication.revision !== release.ready.descriptor.releaseRevision)
    fail('Publikationsrevision widerspricht dem Stage-C-Publisherprofil');
  return Object.freeze({ ready: release.ready, publication: Object.freeze(publication) });
}

/** Copies admitted bytes exactly and appends the independently validated Website binding. */
export async function buildWebsiteProductionContentRelease({
  outputDirectory = path.join(workspaceRoot, 'apps/website/public/wrn-production-content'),
  sourceRoot = admittedSourceRoot,
  trustedWorkspaceRoot = workspaceRoot,
  generatedAt,
} = {}) {
  const output = path.resolve(outputDirectory);
  const trusted = path.resolve(trustedWorkspaceRoot);
  if (output === trusted || !output.startsWith(`${trusted}${path.sep}`))
    fail('Ausgabeziel liegt nicht im Workspace');
  if (await exists(output)) fail('Ausgabeziel existiert bereits und bleibt unveraendert');
  const release = await readReleaseParts(path.resolve(sourceRoot));
  const publication = createProductionWebsitePublication(release.ready, generatedAt);
  await mkdir(path.dirname(output), { recursive: true });
  try {
    await mkdir(output);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'EEXIST')
      fail('Ausgabeziel existiert bereits und bleibt unveraendert');
    throw error;
  }
  for (const [relative, bytes] of release.parts) {
    const target = canonicalPath(output, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  const publicationTarget = canonicalPath(
    output,
    `${release.current.releaseRevision}/${productionWebsitePublicationFile}`,
  );
  await writeFile(publicationTarget, `${JSON.stringify(publication)}\n`, 'utf8');
  return Object.freeze({
    outputDirectory: output,
    releaseRevision: release.ready.descriptor.releaseRevision,
    manifestSha256: release.ready.manifestSha256,
    publication,
  });
}
