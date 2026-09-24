import { access, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { atomicRename } from './atomic-rename.mjs';

import { buildProductionContentRelease } from './build-production-content-release.mjs';
import {
  buildWebsiteProductionContentRelease,
  loadWebsiteProductionContentReleaseFromDisk,
  productionWebsiteOrigin,
} from '../apps/website/tools/production-content-release.mjs';
import { publishProductionArticleLandings } from '../apps/website/tools/generate-production-article-landings.mjs';
import {
  canonicalJson,
  isProductionContentSafetyLedgerV1,
  utf8ByteLength,
} from '../packages/content-contracts/src/index.ts';

export const productionDeliveryEndpoint = 'https://solinaridao.com/wrn-production-content/';
export const productionDeliveryLedgerSchema = 'wrn.production-static-delivery-ledger.v1';
export const productionDeliveryManifestSchema = 'wrn.production-static-delivery-manifest.v1';
const maxLedgerEntries = 512;
const maxLedgerBytes = 4 * 1024 * 1024;
const maxReadBytes = 4 * 1024 * 1024;
const revisionFiles = Object.freeze([
  'release-descriptor.json',
  'manifest.json',
  'articles.json',
  'admission.json',
  'discover-index.json',
  'reader-details.json',
  'archive-lifecycle.json',
  'website-publication.json',
]);
const staticFiles = Object.freeze([
  'sitemap.xml',
  'robots.txt',
  'article-publication-manifest.json',
]);
const sha = /^[a-f0-9]{64}$/u;
const revision = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const articleId = /^wrn-art-[a-f0-9]{32}$/u;

function fail(message) {
  throw new Error(`WRN production delivery: ${message}`);
}
function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function exact(value, keys) {
  return isRecord(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}
function isUtc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(value))
    return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}
function inside(root, candidate, label) {
  const resolved = path.resolve(candidate);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`))
    fail(`${label} liegt ausserhalb des Workspace`);
  return resolved;
}
async function inspectFromRoot(root, candidate, label, { requireLeaf = true } = {}) {
  const relative = path.relative(root, candidate);
  if (relative === '') return;
  if (relative.startsWith('..') || path.isAbsolute(relative))
    fail(`${label} liegt ausserhalb des realen Workspace`);
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    if (!requireLeaf && cursor === candidate) break;
    let details;
    try {
      details = await lstat(cursor);
    } catch {
      fail(`${label} fehlt`);
    }
    if (details.isSymbolicLink()) fail(`${label} verwendet einen Link oder Junction`);
    const physical = await realpath(cursor);
    if (physical !== root && !physical.startsWith(`${root}${path.sep}`))
      fail(`${label} verlaesst den realen Workspace`);
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
async function readBoundFile(candidate, label, maximum = maxReadBytes) {
  let details;
  try {
    details = await lstat(candidate);
  } catch {
    fail(`${label} fehlt`);
  }
  if (!details.isFile() || details.isSymbolicLink() || details.size > maximum)
    fail(`${label} ist keine begrenzte regulaere Datei`);
  return readFile(candidate);
}
function parseJson(bytes, label) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(`${label} ist kein valides UTF-8 JSON`);
  }
}
function sameSorted(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function validIds(ids) {
  return (
    Array.isArray(ids) &&
    ids.every((id) => typeof id === 'string' && articleId.test(id)) &&
    sameSorted(ids, [...new Set(ids)].sort())
  );
}
function validEntry(entry) {
  return (
    exact(entry, [
      'sequence',
      'releaseRevision',
      'descriptorSha256',
      'manifestSha256',
      'safetyRevision',
      'publicationSha256',
      'staticManifestSha256',
      'generatedAt',
      'articleIds',
    ]) &&
    Number.isSafeInteger(entry.sequence) &&
    entry.sequence > 0 &&
    typeof entry.releaseRevision === 'string' &&
    revision.test(entry.releaseRevision) &&
    ['descriptorSha256', 'manifestSha256', 'publicationSha256', 'staticManifestSha256'].every(
      (key) => sha.test(entry[key]),
    ) &&
    Number.isSafeInteger(entry.safetyRevision) &&
    entry.safetyRevision > 0 &&
    isUtc(entry.generatedAt) &&
    validIds(entry.articleIds)
  );
}
export function validateProductionDeliveryLedger(value, bytes) {
  if (bytes.byteLength > maxLedgerBytes) fail('Ledger ueberschreitet 4 MiB');
  if (
    !exact(value, [
      'schema',
      'version',
      'endpointBase',
      'siteOrigin',
      'highestSequence',
      'previousLedgerSha256',
      'entries',
      'safetyLedger',
    ])
  )
    fail('Ledgerform ist nicht exakt');
  if (
    value.schema !== productionDeliveryLedgerSchema ||
    value.version !== 1 ||
    value.endpointBase !== productionDeliveryEndpoint ||
    value.siteOrigin !== productionWebsiteOrigin
  )
    fail('Ledgervertrag ist nicht gebunden');
  if (
    !Array.isArray(value.entries) ||
    value.entries.length === 0 ||
    value.entries.length > maxLedgerEntries ||
    !value.entries.every(validEntry)
  )
    fail('Ledgereintraege sind ungueltig');
  if (
    value.previousLedgerSha256 !== null &&
    !(typeof value.previousLedgerSha256 === 'string' && sha.test(value.previousLedgerSha256))
  )
    fail('Ledger-Vorhash ist ungueltig');
  if (!isProductionContentSafetyLedgerV1(value.safetyLedger)) fail('Safetyledger ist ungueltig');
  const revisions = new Set();
  const descriptors = new Set();
  for (const [index, entry] of value.entries.entries()) {
    if (revisions.has(entry.releaseRevision) || descriptors.has(entry.descriptorSha256))
      fail('Ledgeridentitaet ist nicht eindeutig');
    revisions.add(entry.releaseRevision);
    descriptors.add(entry.descriptorSha256);
    if (index > 0) {
      const prior = value.entries[index - 1];
      if (
        entry.sequence <= prior.sequence ||
        entry.safetyRevision < prior.safetyRevision ||
        entry.generatedAt < prior.generatedAt
      )
        fail('Ledger ist nicht monoton');
    }
  }
  const last = value.entries.at(-1);
  if (value.entries[0].sequence !== 1) fail('Ledger beginnt nicht bei Genesis-Sequenz 1');
  if ((value.entries.length === 1) !== (value.previousLedgerSha256 === null))
    fail('Ledger-Vorhash verletzt Genesisinvariante');
  if (
    value.highestSequence !== last.sequence ||
    value.safetyLedger.revision !== last.safetyRevision
  )
    fail('Ledgerkopf ist nicht gebunden');
  return value;
}
async function readLedger(previousLedgerPath, workspace) {
  if (previousLedgerPath === null) return null;
  if (typeof previousLedgerPath !== 'string' || previousLedgerPath.length === 0)
    fail('previousLedgerPath muss explizit null oder ein Pfad sein');
  const target = inside(workspace, previousLedgerPath, 'Ledger');
  await inspectFromRoot(workspace, target, 'Ledger');
  const bytes = await readBoundFile(target, 'Ledger', maxLedgerBytes);
  return Object.freeze({
    bytes,
    sha256: hash(bytes),
    value: validateProductionDeliveryLedger(parseJson(bytes, 'Ledger'), bytes),
  });
}
function newLedger({
  previous,
  ready,
  descriptorSha256,
  publicationSha256,
  staticManifestSha256,
  generatedAt,
}) {
  const priorEntries = previous ? previous.value.entries : [];
  if (priorEntries.length >= maxLedgerEntries) fail('Ledgerlimit von 512 Eintraegen erreicht');
  const ids = [...ready.articleIds].sort();
  if (!validIds(ids)) fail('Core liefert keine gueltigen Artikel-IDs');
  const safety = ready.safetyLedger;
  if (!isProductionContentSafetyLedgerV1(safety)) fail('Core-Safetyledger ist ungueltig');
  if (previous) {
    const prior = previous.value;
    const last = prior.entries.at(-1);
    if (
      ready.descriptor.sequence <= last.sequence ||
      safety.revision < prior.safetyLedger.revision ||
      generatedAt < last.generatedAt
    )
      fail('neuer Release verletzt Ledgermonotonie');
    if (!prior.safetyLedger.revokedIds.every((id) => safety.revokedIds.includes(id)))
      fail('neuer Core verliert einen Widerruf');
    if (
      safety.revision === prior.safetyLedger.revision &&
      !sameSorted(safety.revokedIds, prior.safetyLedger.revokedIds)
    )
      fail('gleiche Safetyrevision hat andere Widerrufe');
    if (
      priorEntries.some(
        (entry) =>
          entry.releaseRevision === ready.descriptor.releaseRevision ||
          entry.descriptorSha256 === descriptorSha256,
      )
    )
      fail('Releaseidentitaet existiert bereits im Ledger');
  } else if (ready.descriptor.sequence !== 1) fail('Genesis erfordert Sequenz 1');
  const entry = Object.freeze({
    sequence: ready.descriptor.sequence,
    releaseRevision: ready.descriptor.releaseRevision,
    descriptorSha256,
    manifestSha256: ready.manifestSha256,
    safetyRevision: safety.revision,
    publicationSha256,
    staticManifestSha256,
    generatedAt,
    articleIds: Object.freeze(ids),
  });
  const ledger = {
    schema: productionDeliveryLedgerSchema,
    version: 1,
    endpointBase: productionDeliveryEndpoint,
    siteOrigin: productionWebsiteOrigin,
    highestSequence: entry.sequence,
    previousLedgerSha256: previous ? previous.sha256 : null,
    entries: [...priorEntries, entry],
    safetyLedger: { revision: safety.revision, revokedIds: [...safety.revokedIds] },
  };
  const serialized = `${canonicalJson(ledger)}\n`;
  const bytes = Buffer.from(serialized);
  validateProductionDeliveryLedger(parseJson(bytes, 'next-ledger'), bytes);
  return Object.freeze({ ledger: Object.freeze(ledger), serialized, sha256: hash(serialized) });
}
async function copyBound(source, target, root, files, beforeWrite) {
  const relative = path.relative(root, target).split(path.sep).join('/');
  if (!relative || relative.startsWith('../') || path.isAbsolute(relative))
    fail('unsicherer Ausgabepfad');
  const bytes = await readBoundFile(source, relative);
  await mkdir(path.dirname(target), { recursive: true });
  if (beforeWrite) await beforeWrite(Object.freeze({ path: relative, target, bytes }));
  await writeFile(target, bytes, { flag: 'wx' });
  files.push(Object.freeze({ path: relative, bytes: bytes.byteLength, sha256: hash(bytes) }));
}
function validateStaticManifest(value, ready) {
  if (
    !isRecord(value) ||
    value.contractVersion !== 'wrn.production-website-static-publication-manifest.v1' ||
    !validIds(value.articleIds) ||
    !sameSorted(value.articleIds, [...ready.articleIds].sort()) ||
    !sameSorted(value.landingIds, value.articleIds) ||
    !sameSorted(value.sitemapArticleIds, value.articleIds)
  )
    fail('statisches Publikationsmanifest bindet nicht an Core');
}

/** Produces a local, non-promoted static delivery package. */
export async function prepareProductionContentDelivery({
  buildInputPath,
  previousLedgerPath,
  generatedAt,
  outputDirectory,
  trustedWorkspaceRoot,
  beforeWrite,
} = {}) {
  if (previousLedgerPath === undefined) fail('previousLedgerPath fehlt; null kennzeichnet Genesis');
  if (!isUtc(generatedAt)) fail('generatedAt muss ein expliziter UTC-Millisekundenwert sein');
  if (typeof trustedWorkspaceRoot !== 'string' || trustedWorkspaceRoot.length === 0)
    fail('trustedWorkspaceRoot fehlt');
  if (typeof buildInputPath !== 'string' || typeof outputDirectory !== 'string')
    fail('input und Ausgabe muessen explizite Pfade sein');
  const workspaceInput = path.resolve(trustedWorkspaceRoot);
  const workspace = await realpath(workspaceInput);
  const input = inside(workspace, buildInputPath, 'Buildeingabe');
  const output = inside(workspace, outputDirectory, 'Ausgabeziel');
  await inspectFromRoot(workspace, input, 'Buildeingabe');
  await inspectFromRoot(workspace, path.dirname(output), 'Ausgabeeltern', { requireLeaf: true });
  if (await exists(output)) fail('Ausgabeziel existiert bereits und bleibt unveraendert');
  await readBoundFile(input, 'Buildeingabe');
  const previous = await readLedger(previousLedgerPath, workspace);
  const parent = path.dirname(output);
  const staging = path.join(parent, `.wrn-d-${randomBytes(4).toString('hex')}`);
  await mkdir(staging, { recursive: false });
  await inspectFromRoot(workspace, staging, 'Staging');
  const core = path.join(staging, 'core');
  const website = path.join(staging, 'website');
  const statics = path.join(staging, 'static');
  const coreResult = await buildProductionContentRelease({ inputPath: input, outputPath: core });
  await buildWebsiteProductionContentRelease({
    outputDirectory: website,
    sourceRoot: core,
    trustedWorkspaceRoot: workspace,
    generatedAt,
  });
  const release = await loadWebsiteProductionContentReleaseFromDisk({ root: website });
  const publicationBytes = await readBoundFile(
    path.join(website, release.ready.descriptor.releaseRevision, 'website-publication.json'),
    'website-publication.json',
  );
  const descriptorBytes = await readBoundFile(
    path.join(website, release.ready.descriptor.releaseRevision, 'release-descriptor.json'),
    'release-descriptor.json',
  );
  if (hash(descriptorBytes) !== coreResult.descriptorSha256)
    fail('Websitekopie veraendert Corepointer');
  const staticManifest = await publishProductionArticleLandings({
    outputDirectory: statics,
    releaseRoot: website,
  });
  validateStaticManifest(staticManifest, release.ready);
  const staticManifestBytes = await readBoundFile(
    path.join(statics, 'article-publication-manifest.json'),
    'article-publication-manifest.json',
  );
  if (hash(staticManifestBytes) !== hash(Buffer.from(`${canonicalJson(staticManifest)}\n`)))
    fail('statisches Manifest ist nicht kanonisch');
  const ledger = newLedger({
    previous,
    ready: release.ready,
    descriptorSha256: coreResult.descriptorSha256,
    publicationSha256: hash(publicationBytes),
    staticManifestSha256: hash(staticManifestBytes),
    generatedAt,
  });
  const readyOutput = path.join(staging, 'delivery');
  await mkdir(readyOutput);
  const files = [];
  const revisionRoot = path.join(website, release.ready.descriptor.releaseRevision);
  for (const name of revisionFiles)
    await copyBound(
      path.join(revisionRoot, name),
      path.join(
        readyOutput,
        'preactivate',
        'wrn-production-content',
        release.ready.descriptor.releaseRevision,
        name,
      ),
      readyOutput,
      files,
      beforeWrite,
    );
  for (const page of staticManifest.landingPages)
    await copyBound(
      path.join(statics, page.path),
      path.join(readyOutput, 'preactivate', page.path),
      readyOutput,
      files,
      beforeWrite,
    );
  for (const name of staticFiles)
    await copyBound(
      path.join(statics, name),
      path.join(readyOutput, 'preactivate', name),
      readyOutput,
      files,
      beforeWrite,
    );
  await copyBound(
    path.join(core, 'current.json'),
    path.join(readyOutput, 'activate', 'wrn-production-content', 'current.json'),
    readyOutput,
    files,
    beforeWrite,
  );
  const sortedFiles = files.toSorted((left, right) => left.path.localeCompare(right.path));
  const pointerPath = 'activate/wrn-production-content/current.json';
  if (sortedFiles.at(-1)?.path === pointerPath)
    fail('lexical order cannot stand in for activation order');
  const manifest = {
    schema: productionDeliveryManifestSchema,
    version: 1,
    endpointBase: productionDeliveryEndpoint,
    siteOrigin: productionWebsiteOrigin,
    generatedAt,
    releaseRevision: release.ready.descriptor.releaseRevision,
    sequence: release.ready.descriptor.sequence,
    nextLedgerSha256: ledger.sha256,
    activationOrder: [
      ...sortedFiles.map((entry) => entry.path).filter((entry) => entry !== pointerPath),
      pointerPath,
    ],
    files: sortedFiles,
    operatorInstructions: [
      'Read-only: verify every delivery-manifest.json sha256 and bytes before publication.',
      'A separately authorized publisher may copy preactivate files, verify headers, then activate current.json last.',
      'No live endpoint, cache, header or rollback action is performed by this package.',
    ],
  };
  if (utf8ByteLength(canonicalJson(manifest)) > maxReadBytes)
    fail('Deliverymanifest ueberschreitet das Limit');
  await writeFile(
    path.join(readyOutput, 'delivery-manifest.json'),
    `${canonicalJson(manifest)}\n`,
    { flag: 'wx' },
  );
  await writeFile(path.join(readyOutput, 'next-ledger.json'), ledger.serialized, { flag: 'wx' });
  if (await exists(output))
    fail('Ausgabeziel entstand waehrend der Vorbereitung und bleibt unveraendert');
  await inspectFromRoot(workspace, path.dirname(output), 'Ausgabeeltern');
  await atomicRename(readyOutput, output);
  return Object.freeze({
    outputDirectory: output,
    manifest: Object.freeze(manifest),
    ledger: ledger.ledger,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const values = new Map();
    let genesis = false;
    for (let index = 0; index < args.length; index += 1) {
      const token = args[index];
      if (token === '--genesis') {
        if (genesis) fail('doppeltes --genesis');
        genesis = true;
        continue;
      }
      if (!['--input', '--output', '--generated-at', '--workspace', '--ledger'].includes(token))
        fail('unbekannte oder positionale CLI-Option');
      const value = args[index + 1];
      if (!value || value.startsWith('--') || values.has(token))
        fail('CLI-Wert fehlt oder Option ist doppelt');
      values.set(token, value);
      index += 1;
    }
    if (
      !['--input', '--output', '--generated-at', '--workspace'].every((name) => values.has(name)) ||
      genesis === values.has('--ledger')
    )
      fail(
        'usage: exact --input --output --generated-at --workspace and exactly one of --genesis or --ledger',
      );
    const result = await prepareProductionContentDelivery({
      buildInputPath: values.get('--input'),
      outputDirectory: values.get('--output'),
      generatedAt: values.get('--generated-at'),
      previousLedgerPath: genesis ? null : values.get('--ledger'),
      trustedWorkspaceRoot: values.get('--workspace'),
    });
    process.stdout.write(
      `WRN delivery prepared: ${result.manifest.releaseRevision} sequence ${result.manifest.sequence}; current.json is last.\n`,
    );
  } catch (error) {
    process.stderr.write(
      `WRN delivery failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
