import { createHash, randomBytes } from 'node:crypto';
import { access, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendReviewedLegacyArticles,
  inspectLegacyNewsSnapshot,
  legacyNewsLimits,
} from './legacy-news-ingestion.mjs';
import { buildProductionContentRelease } from './build-production-content-release.mjs';
import { prepareProductionContentDelivery } from './prepare-production-content-delivery.mjs';
import { canonicalJson } from '../packages/content-contracts/src/index.ts';
import { atomicRename } from './atomic-rename.mjs';

const maxInputBytes = legacyNewsLimits.feedBytes;
const maxBindingsBytes = 64 * 1024;

function fail(message) {
  throw new Error(`WRN legacy news supply: ${message}`);
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isUtc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(value))
    return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function inside(root, candidate, label) {
  if (typeof candidate !== 'string' || candidate.length === 0) fail(`${label} fehlt`);
  const resolved = path.resolve(candidate);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`))
    fail(`${label} liegt ausserhalb des Workspace`);
  return resolved;
}

async function inspectFromRoot(root, candidate, label) {
  const relative = path.relative(root, candidate);
  if (relative === '') return;
  if (relative.startsWith('..') || path.isAbsolute(relative))
    fail(`${label} liegt ausserhalb des realen Workspace`);
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
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

async function inspectExisting(root, candidate, label, maximum) {
  const resolved = inside(root, candidate, label);
  await inspectFromRoot(root, resolved, label);
  let details;
  try {
    details = await lstat(resolved);
  } catch {
    fail(`${label} fehlt`);
  }
  if (!details.isFile() || details.isSymbolicLink() || details.size > maximum)
    fail(`${label} ist keine begrenzte regulaere Datei`);
  const physical = await realpath(resolved);
  if (physical !== root && !physical.startsWith(`${root}${path.sep}`))
    fail(`${label} verlaesst den realen Workspace`);
  return resolved;
}

async function inspectFreshOutput(root, candidate, label) {
  const resolved = inside(root, candidate, label);
  try {
    await access(resolved);
    fail(`${label} existiert bereits und bleibt unveraendert`);
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) throw error;
  }
  const parent = path.dirname(resolved);
  await inspectFromRoot(root, parent, `${label} Elternverzeichnis`);
  let details;
  try {
    details = await lstat(parent);
  } catch {
    fail(`${label} Elternverzeichnis fehlt`);
  }
  if (!details.isDirectory() || details.isSymbolicLink())
    fail(`${label} Elternverzeichnis ist unsicher`);
  const physical = await realpath(parent);
  if (physical !== root && !physical.startsWith(`${root}${path.sep}`))
    fail(`${label} Elternverzeichnis verlaesst den realen Workspace`);
  return resolved;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(`${label} ist kein valides UTF-8 JSON`);
  }
}

function receipt({
  generatedAt,
  dryRun,
  intake,
  previousInputSha256,
  mergedInputSha256,
  release,
  delivery,
}) {
  return {
    schema: 'wrn.legacy-news-supply-receipt.v1',
    version: 1,
    preparedAt: generatedAt,
    dryRun,
    publicationPerformed: false,
    intake: {
      commit: intake.commit,
      observedAt: intake.observedAt,
      feedSha256: intake.feedSha256,
      feedGitBlobSha: intake.feedGitBlobSha,
      statusSha256: intake.statusSha256,
      rows: intake.rows,
      candidateCount: intake.candidates.length,
      rejectedCount: intake.rejected.length,
      upstreamStoppedForBudget: intake.upstreamStoppedForBudget,
      upstreamWarnings: intake.upstreamWarnings,
    },
    previousInputSha256,
    mergedInputSha256,
    release,
    delivery,
  };
}

async function assertRunBundleClosure(directory) {
  const expected = ['delivery', 'merged-input.json', 'publisher', 'receipt.json'];
  const actual = (await readdir(directory)).sort((left, right) => left.localeCompare(right));
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index]))
    fail('Run-Bundle enthaelt unerwartete Arbeitsartefakte');
}

/**
 * Locally composes a separately reviewed legacy batch with the existing V3 and delivery builders.
 * It never fetches, admits source rights, changes a client pointer, or publishes externally.
 * The complete local run bundle is promoted only after all builder checks succeed.
 */
export async function prepareLegacyNewsSupply({
  previousInputPath,
  previousInputSha256,
  reviewedBatchPath,
  bindingsPath,
  feedPath,
  statusPath,
  commit,
  observedAt,
  generatedAt,
  dryRun = false,
  previousLedgerPath,
  outputDirectory,
  trustedWorkspaceRoot,
} = {}) {
  if (typeof dryRun !== 'boolean') fail('dryRun ist ungueltig');
  if (!isUtc(generatedAt)) fail('generatedAt muss ein expliziter UTC-Millisekundenwert sein');
  if (!Number.isSafeInteger(observedAt) || observedAt < 0) fail('observedAt ist ungueltig');
  if (Date.parse(generatedAt) < observedAt) fail('generatedAt liegt vor observedAt');
  if (!/^[a-f0-9]{64}$/u.test(previousInputSha256 ?? '')) fail('previousInputSha256 ist ungueltig');
  if (typeof trustedWorkspaceRoot !== 'string' || trustedWorkspaceRoot.length === 0)
    fail('trustedWorkspaceRoot fehlt');
  const workspace = await realpath(path.resolve(trustedWorkspaceRoot));
  const [previousInput, reviewedBatch, bindings, feed, status, previousLedger, finalOutput] =
    await Promise.all([
      inspectExisting(workspace, previousInputPath, 'vorherige Eingabe', maxInputBytes),
      inspectExisting(workspace, reviewedBatchPath, 'gepruefter Batch', maxInputBytes),
      inspectExisting(workspace, bindingsPath, 'Reviewbindungen', maxBindingsBytes),
      inspectExisting(workspace, feedPath, 'Newsfeed', legacyNewsLimits.feedBytes),
      inspectExisting(workspace, statusPath, 'Feedstatus', legacyNewsLimits.statusBytes),
      inspectExisting(workspace, previousLedgerPath, 'vorheriges Delivery-Ledger', maxInputBytes),
      inspectFreshOutput(workspace, outputDirectory, 'Run-Bundle-Ausgabe'),
    ]);

  const [previousBytes, reviewedBytes, bindingBytes, feedBytes, statusBytes] = await Promise.all([
    readFile(previousInput),
    readFile(reviewedBatch),
    readFile(bindings),
    readFile(feed),
    readFile(status),
  ]);
  const intake = inspectLegacyNewsSnapshot({
    feedBytes,
    statusBytes,
    commit,
    observedAt,
  });
  const merged = appendReviewedLegacyArticles({
    previousInput: parseJson(previousBytes, 'vorherige Eingabe'),
    previousInputSha256,
    reviewedInput: parseJson(reviewedBytes, 'gepruefter Batch'),
    bindings: parseJson(bindingBytes, 'Reviewbindungen'),
    intake,
  });
  const mergedSerialized = `${canonicalJson(merged)}\n`;
  if (Buffer.byteLength(mergedSerialized) > maxInputBytes)
    fail('zusammengefuehrte Eingabe ueberschreitet das Limit');
  const staging = path.join(path.dirname(finalOutput), `.wrn-l-${randomBytes(4).toString('hex')}`);
  await mkdir(staging, { recursive: false });
  let promoted = false;
  try {
    await inspectFromRoot(workspace, staging, 'Run-Bundle-Staging');
    const buildInputOutput = path.join(staging, 'merged-input.json');
    const publisherOutput = path.join(staging, 'publisher');
    const deliveryOutput = path.join(staging, 'delivery');
    const deliveryWorkDirectory = path.join(staging, 'd');
    const deliveryWorkOutput = path.join(deliveryWorkDirectory, 'ready');
    const receiptOutput = path.join(staging, 'receipt.json');
    await writeFile(buildInputOutput, mergedSerialized, { encoding: 'utf8', flag: 'wx' });
    const publisher = await buildProductionContentRelease({
      inputPath: buildInputOutput,
      outputPath: publisherOutput,
    });
    await mkdir(deliveryWorkDirectory, { recursive: false });
    let deliveryResult;
    try {
      deliveryResult = await prepareProductionContentDelivery({
        buildInputPath: buildInputOutput,
        previousLedgerPath: previousLedger,
        generatedAt,
        outputDirectory: deliveryWorkOutput,
        trustedWorkspaceRoot: workspace,
      });
      await atomicRename(deliveryWorkOutput, deliveryOutput);
    } finally {
      await rm(deliveryWorkDirectory, { recursive: true, force: true });
    }
    const delivered = deliveryResult.ledger.entries.at(-1);
    if (!delivered || delivered.descriptorSha256 !== publisher.descriptorSha256)
      fail('Delivery bindet nicht an die Publisher-Ausgabe');
    const deliveryLedgerBytes = await readFile(path.join(deliveryOutput, 'next-ledger.json'));
    const runReceipt = receipt({
      generatedAt,
      dryRun,
      intake,
      previousInputSha256,
      mergedInputSha256: hash(mergedSerialized),
      release: {
        releaseRevision: publisher.releaseRevision,
        sequence: publisher.sequence,
        descriptorSha256: publisher.descriptorSha256,
        articleCount: merged.documents.articles.articles.length,
      },
      delivery: {
        nextLedgerSha256: hash(deliveryLedgerBytes),
        pointerLast:
          deliveryResult.manifest.activationOrder.at(-1) ===
          'activate/wrn-production-content/current.json',
        fileCount: deliveryResult.manifest.files.length,
      },
    });
    await writeFile(receiptOutput, `${canonicalJson(runReceipt)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await assertRunBundleClosure(staging);
    await inspectFreshOutput(workspace, finalOutput, 'Run-Bundle-Ausgabe');
    await atomicRename(staging, finalOutput);
    promoted = true;
    return Object.freeze({
      outputDirectory: finalOutput,
      buildInputPath: path.join(finalOutput, 'merged-input.json'),
      publisher: Object.freeze({ ...publisher, outputPath: path.join(finalOutput, 'publisher') }),
      delivery: Object.freeze({
        outputDirectory: path.join(finalOutput, 'delivery'),
        nextLedgerSha256: runReceipt.delivery.nextLedgerSha256,
      }),
      receipt: Object.freeze(runReceipt),
    });
  } finally {
    if (!promoted) await rm(staging, { recursive: true, force: true });
  }
}

function cliOptions(args) {
  const names = new Set([
    '--previous',
    '--previous-sha256',
    '--reviewed',
    '--bindings',
    '--feed',
    '--status',
    '--commit',
    '--observed-at',
    '--generated-at',
    '--ledger',
    '--output',
    '--workspace',
  ]);
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    const value = args[index + 1];
    if (!names.has(name) || !value || value.startsWith('--') || values.has(name))
      fail('ungueltige CLI-Option');
    values.set(name, value);
    index += 1;
  }
  if (values.size !== names.size) fail('unvollstaendige CLI-Optionen');
  if (!isUtc(values.get('--observed-at')))
    fail('observed-at muss ein expliziter UTC-Millisekundenwert sein');
  return values;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  try {
    const values = cliOptions(process.argv.slice(2));
    const result = await prepareLegacyNewsSupply({
      previousInputPath: values.get('--previous'),
      previousInputSha256: values.get('--previous-sha256'),
      reviewedBatchPath: values.get('--reviewed'),
      bindingsPath: values.get('--bindings'),
      feedPath: values.get('--feed'),
      statusPath: values.get('--status'),
      commit: values.get('--commit'),
      observedAt: Date.parse(values.get('--observed-at')),
      generatedAt: values.get('--generated-at'),
      previousLedgerPath: values.get('--ledger'),
      outputDirectory: values.get('--output'),
      trustedWorkspaceRoot: values.get('--workspace'),
    });
    process.stdout.write(
      `${canonicalJson({
        releaseRevision: result.publisher.releaseRevision,
        sequence: result.publisher.sequence,
        receipt: path.join(result.outputDirectory, 'receipt.json'),
        publicationPerformed: false,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `WRN legacy news supply failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
