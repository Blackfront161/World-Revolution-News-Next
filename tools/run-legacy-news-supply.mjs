import { createHash, randomBytes } from 'node:crypto';
import { access, lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bindReviewedLegacyArticles,
  fetchLegacyNewsSnapshot,
  legacyNewsLimits,
} from './legacy-news-ingestion.mjs';
import { buildProductionContentRelease } from './build-production-content-release.mjs';
import { prepareLegacyNewsSupply } from './prepare-legacy-news-supply.mjs';
import { canonicalJson } from '../packages/content-contracts/src/index.ts';
import { atomicRename } from './atomic-rename.mjs';

const maxInputBytes = legacyNewsLimits.feedBytes;
const maxBindingsBytes = 64 * 1024;

function fail(message) {
  throw new Error(`WRN continuous legacy news supply: ${message}`);
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

function parseJson(bytes, label) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(`${label} ist kein valides UTF-8 JSON`);
  }
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

async function readTrustedJson(root, candidate, label, maximum) {
  const resolved = inside(root, candidate, label);
  await inspectFromRoot(root, resolved, label);
  const details = await lstat(resolved);
  if (!details.isFile() || details.isSymbolicLink() || details.size > maximum)
    fail(`${label} ist keine begrenzte regulaere Datei`);
  return { path: resolved, value: parseJson(await readFile(resolved), label) };
}

async function inspectFreshOutput(root, candidate) {
  const resolved = inside(root, candidate, 'Run-Ausgabe');
  try {
    await access(resolved);
    fail('Run-Ausgabe existiert bereits und bleibt unveraendert');
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) throw error;
  }
  const parent = path.dirname(resolved);
  await inspectFromRoot(root, parent, 'Run-Ausgabe Elternverzeichnis');
  const details = await lstat(parent);
  if (!details.isDirectory() || details.isSymbolicLink())
    fail('Run-Ausgabe Elternverzeichnis ist unsicher');
  return resolved;
}

function intakeSummary(intake) {
  if (
    !intake ||
    typeof intake !== 'object' ||
    typeof intake.commit !== 'string' ||
    !Array.isArray(intake.candidates) ||
    !Array.isArray(intake.rejected)
  )
    fail('ungueltige Intake-Antwort');
  return {
    commit: intake.commit,
    observedAt: intake.observedAt,
    feedSha256: intake.feedSha256,
    statusSha256: intake.statusSha256,
    candidateCount: intake.candidates.length,
    rejectedCount: intake.rejected.length,
    upstreamWarnings: intake.upstreamWarnings ?? [],
  };
}

async function writeStoppedReceipt({
  workspace,
  outputDirectory,
  generatedAt,
  dryRun,
  state,
  intake,
  review,
}) {
  const finalOutput = await inspectFreshOutput(workspace, outputDirectory);
  const staging = path.join(path.dirname(finalOutput), `.wrn-c-${randomBytes(4).toString('hex')}`);
  await mkdir(staging, { recursive: false });
  let promoted = false;
  try {
    const receipt = {
      schema: 'wrn.continuous-legacy-news-supply-run.v1',
      version: 1,
      state,
      preparedAt: generatedAt,
      dryRun,
      publicationPerformed: false,
      intake: intakeSummary(intake),
      ...(review ?? {}),
    };
    await writeFile(path.join(staging, 'receipt.json'), `${canonicalJson(receipt)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await atomicRename(staging, finalOutput);
    promoted = true;
    return Object.freeze({ state, outputDirectory: finalOutput, receipt: Object.freeze(receipt) });
  } finally {
    if (!promoted) await rm(staging, { recursive: true, force: true });
  }
}

async function writePreparedReceipt({ directory, generatedAt, dryRun, intake, preparedReceipt }) {
  const receipt = {
    schema: 'wrn.continuous-legacy-news-supply-run.v1',
    version: 1,
    state: 'prepared',
    preparedAt: generatedAt,
    dryRun,
    publicationPerformed: false,
    intake: intakeSummary(intake),
    previousInputSha256: preparedReceipt.previousInputSha256,
    mergedInputSha256: preparedReceipt.mergedInputSha256,
    release: preparedReceipt.release,
    delivery: preparedReceipt.delivery,
  };
  await writeFile(path.join(directory, 'receipt.json'), `${canonicalJson(receipt)}\n`, {
    encoding: 'utf8',
    flag: 'w',
  });
  return Object.freeze(receipt);
}

function reviewedArticles(value) {
  const articles = value?.documents?.articles?.articles;
  if (!Array.isArray(articles) || articles.length === 0)
    fail('gepruefter Batch enthaelt keine Artikel');
  return articles;
}

function articleBundle(input, article) {
  const documents = input?.documents;
  const entry = (name) => {
    const entries = documents?.[name]?.entries;
    if (!Array.isArray(entries)) fail(`ungueltige ${name}-Eintraege`);
    const matches = entries.filter((candidate) => candidate?.articleId === article.id);
    if (matches.length !== 1) fail(`ungueltige ${name}-Identitaet`);
    return matches[0];
  };
  const lifecycle = documents?.archiveLifecycle;
  if (!lifecycle || typeof lifecycle !== 'object') fail('ungueltiger Lifecycle');
  const membership = (name) => {
    const values = lifecycle[name];
    if (!Array.isArray(values)) fail(`ungueltiger Lifecycle ${name}`);
    return values.includes(article.id);
  };
  const lifecycleEntries = (values, key, name) => {
    if (!Array.isArray(values)) fail(`ungueltiger Lifecycle ${name}`);
    return values.filter((value) => value?.[key] === article.id);
  };
  return {
    article,
    admission: entry('admission'),
    discoverIndex: entry('discoverIndex'),
    readerDetails: entry('readerDetails'),
    archiveLifecycle: {
      active: membership('activeArticleIds'),
      archive: membership('archiveArticleIds'),
      shareable: membership('shareableArticleIds'),
      aliases: lifecycleEntries(lifecycle.aliases, 'sourceId', 'aliases'),
      gone: lifecycleEntries(lifecycle.gone, 'id', 'gone'),
      revocations: lifecycleEntries(lifecycle.revocations?.entries, 'id', 'revocations'),
    },
  };
}

function alreadyPrepared(previous, reviewedInput) {
  const reviewed = reviewedArticles(reviewedInput);
  const previousArticles = previous?.documents?.articles?.articles;
  if (!Array.isArray(previousArticles)) fail('vorherige Eingabe enthaelt keine Artikel');
  const byId = new Map(previousArticles.map((article) => [article?.id, article]));
  const byUrl = new Map(previousArticles.map((article) => [article?.originalUrl, article]));
  if (byId.size !== previousArticles.length || byUrl.size !== previousArticles.length)
    fail('vorherige Eingabe hat mehrdeutige Artikelidentitaeten');
  let exact = 0;
  for (const article of reviewed) {
    const sameId = byId.get(article?.id);
    const sameUrl = byUrl.get(article?.originalUrl);
    if (!sameId && !sameUrl) continue;
    if (
      sameId !== sameUrl ||
      !sameId ||
      hash(canonicalJson(articleBundle(previous, sameId))) !==
        hash(canonicalJson(articleBundle(reviewedInput, article)))
    )
      fail('gepruefter Batch kollidiert mit bereits vorbereiteten Artikeln');
    exact += 1;
  }
  if (exact === 0) return false;
  if (exact !== reviewed.length) fail('gepruefter Batch mischt vorhandene und neue Artikel');
  if (
    previous.sequence !== reviewedInput.sequence ||
    previous.releaseRevision !== reviewedInput.releaseRevision
  )
    fail('wiederholter Batch hat nicht dieselbe Sequenz und Release-Revision');
  const lifecycle = reviewedInput.documents?.archiveLifecycle;
  if (
    !Array.isArray(lifecycle?.aliases) ||
    lifecycle.aliases.length !== 0 ||
    !Array.isArray(lifecycle?.gone) ||
    lifecycle.gone.length !== 0 ||
    !Array.isArray(lifecycle?.revocations?.entries) ||
    lifecycle.revocations.entries.length !== 0
  )
    fail('wiederholter Batch darf keine Lifecycle-Historie aendern');
  return true;
}

function hasArticleOverlap(previous, reviewedInput) {
  const prior = previous?.documents?.articles?.articles;
  const reviewed = reviewedArticles(reviewedInput);
  if (!Array.isArray(prior)) fail('vorherige Eingabe enthaelt keine Artikel');
  const ids = new Set(prior.map((article) => article?.id));
  const urls = new Set(prior.map((article) => article?.originalUrl));
  return reviewed.some((article) => ids.has(article?.id) || urls.has(article?.originalUrl));
}

function noChangeReviewBinding(previousInputSha256, reviewed, bindings) {
  const articleIds = reviewedArticles(reviewed)
    .map((article) => article.id)
    .sort();
  if (new Set(articleIds).size !== articleIds.length)
    fail('gepruefter Batch hat doppelte Artikelidentitaeten');
  return {
    previousInputSha256,
    reviewedInputSha256: hash(canonicalJson(reviewed)),
    bindingsSha256: hash(canonicalJson(bindings)),
    articleIds,
  };
}

async function validateV3Input(value, label, directory) {
  if (value?.schema !== 'wrn.production-content-build-input.v3')
    fail(`${label} ist keine V3-Eingabe`);
  const inputPath = path.join(directory, `${label}.json`);
  const outputPath = path.join(directory, `${label}-publisher`);
  await writeFile(inputPath, `${canonicalJson(value)}\n`, { encoding: 'utf8', flag: 'wx' });
  try {
    await buildProductionContentRelease({ inputPath, outputPath });
  } catch {
    fail(`${label} besteht die vollstaendige V3-Pruefung nicht`);
  }
}

/**
 * Runs the existing pinned snapshot, review binding and atomic local bundle steps.
 * Missing admission and an exact repeat are terminal local states, never publication.
 */
export async function runLegacyNewsSupply({
  commit,
  outputDirectory,
  trustedWorkspaceRoot,
  previousInputPath,
  previousInputSha256,
  previousLedgerPath,
  reviewedBatchPath,
  bindingsPath,
  generatedAt,
  dryRun = false,
  fetchSnapshot = fetchLegacyNewsSnapshot,
  now = Date.now,
} = {}) {
  if (typeof dryRun !== 'boolean') fail('dryRun ist ungueltig');
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) fail('commit ist ungueltig');
  if (typeof trustedWorkspaceRoot !== 'string' || trustedWorkspaceRoot.length === 0)
    fail('trustedWorkspaceRoot fehlt');
  if ((reviewedBatchPath === undefined) !== (bindingsPath === undefined))
    fail('gepruefter Batch und Reviewbindungen muessen gemeinsam vorliegen');
  const workspace = await realpath(path.resolve(trustedWorkspaceRoot));
  const snapshot = await fetchSnapshot({ commit });
  if (
    !(snapshot?.feedBytes instanceof Uint8Array) ||
    !(snapshot?.statusBytes instanceof Uint8Array) ||
    snapshot.feedBytes.length > maxInputBytes ||
    snapshot.statusBytes.length > legacyNewsLimits.statusBytes
  )
    fail('ungueltige begrenzte Snapshot-Antwort');
  const intake = snapshot.intake;
  if (intake?.commit !== commit) fail('Snapshot ist nicht an den angeforderten Commit gebunden');
  const observedAt = Date.parse(intake?.observedAt ?? '');
  if (!Number.isSafeInteger(observedAt) || observedAt < 0)
    fail('Intake-Beobachtungszeit ist ungueltig');
  const preparedAt = generatedAt ?? new Date(now()).toISOString();
  if (!isUtc(preparedAt) || Date.parse(preparedAt) < observedAt)
    fail('generatedAt muss ein UTC-Millisekundenwert nach der Intake-Beobachtung sein');

  if (reviewedBatchPath === undefined)
    return writeStoppedReceipt({
      workspace,
      outputDirectory,
      generatedAt: preparedAt,
      dryRun,
      state: 'awaiting-admission',
      intake,
    });

  if (
    !/^[a-f0-9]{64}$/u.test(previousInputSha256 ?? '') ||
    typeof previousInputPath !== 'string' ||
    typeof previousLedgerPath !== 'string'
  )
    fail('vorherige Eingabe, Hash und Ledger sind fuer einen geprueften Batch erforderlich');
  const [previous, reviewed, bindings] = await Promise.all([
    readTrustedJson(workspace, previousInputPath, 'vorherige Eingabe', maxInputBytes),
    readTrustedJson(workspace, reviewedBatchPath, 'gepruefter Batch', maxInputBytes),
    readTrustedJson(workspace, bindingsPath, 'Reviewbindungen', maxBindingsBytes),
  ]);
  if (hash(canonicalJson(previous.value)) !== previousInputSha256)
    fail('vorherige Eingabe ist nicht an ihren Hash gebunden');
  bindReviewedLegacyArticles({ intake, approvedInput: reviewed.value, bindings: bindings.value });
  const finalOutput = await inspectFreshOutput(workspace, outputDirectory);
  const transient = path.join(
    path.dirname(finalOutput),
    `.wrn-n-${randomBytes(4).toString('hex')}`,
  );
  await mkdir(transient, { recursive: false });
  try {
    if (hasArticleOverlap(previous.value, reviewed.value)) {
      await validateV3Input(previous.value, 'previous', transient);
      await validateV3Input(reviewed.value, 'reviewed', transient);
      if (alreadyPrepared(previous.value, reviewed.value))
        return writeStoppedReceipt({
          workspace,
          outputDirectory,
          generatedAt: preparedAt,
          dryRun,
          state: 'no-change',
          intake,
          review: noChangeReviewBinding(previousInputSha256, reviewed.value, bindings.value),
        });
    }
    const feedPath = path.join(transient, 'news-feed.json');
    const statusPath = path.join(transient, 'feed-status.json');
    await Promise.all([
      writeFile(feedPath, snapshot.feedBytes, { flag: 'wx' }),
      writeFile(statusPath, snapshot.statusBytes, { flag: 'wx' }),
    ]);
    const preparedOutput = path.join(transient, 'prepared-output');
    const prepared = await prepareLegacyNewsSupply({
      previousInputPath: previous.path,
      previousInputSha256,
      reviewedBatchPath: reviewed.path,
      bindingsPath: bindings.path,
      feedPath,
      statusPath,
      commit,
      observedAt,
      generatedAt: preparedAt,
      dryRun,
      previousLedgerPath,
      outputDirectory: preparedOutput,
      trustedWorkspaceRoot: workspace,
    });
    const preparedReceipt = await writePreparedReceipt({
      directory: prepared.outputDirectory,
      generatedAt: preparedAt,
      dryRun,
      intake,
      preparedReceipt: prepared.receipt,
    });
    await atomicRename(prepared.outputDirectory, finalOutput);
    return Object.freeze({
      state: 'prepared',
      ...prepared,
      outputDirectory: finalOutput,
      buildInputPath: path.join(finalOutput, 'merged-input.json'),
      publisher: Object.freeze({
        ...prepared.publisher,
        outputPath: path.join(finalOutput, 'publisher'),
      }),
      delivery: Object.freeze({
        ...prepared.delivery,
        outputDirectory: path.join(finalOutput, 'delivery'),
      }),
      receipt: preparedReceipt,
    });
  } finally {
    await rm(transient, { recursive: true, force: true });
  }
}

function cliOptions(args) {
  const values = new Map();
  const names = new Set([
    '--commit',
    '--output',
    '--workspace',
    '--previous',
    '--previous-sha256',
    '--ledger',
    '--reviewed',
    '--bindings',
    '--generated-at',
  ]);
  let dryRun = false;
  for (let index = 0; index < args.length;) {
    const name = args[index];
    if (name === '--dry-run') {
      if (dryRun) fail('ungueltige CLI-Option');
      dryRun = true;
      index += 1;
      continue;
    }
    const value = args[index + 1];
    if (
      name === '--dry-run' ||
      !names.has(name) ||
      !value ||
      value.startsWith('--') ||
      values.has(name)
    )
      fail('ungueltige CLI-Option');
    values.set(name, value);
    index += 2;
  }
  for (const required of ['--commit', '--output', '--workspace']) {
    if (!values.has(required)) fail('unvollstaendige CLI-Optionen');
  }
  return { values, dryRun };
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  try {
    const { values, dryRun } = cliOptions(process.argv.slice(2));
    const result = await runLegacyNewsSupply({
      commit: values.get('--commit'),
      outputDirectory: values.get('--output'),
      trustedWorkspaceRoot: values.get('--workspace'),
      previousInputPath: values.get('--previous'),
      previousInputSha256: values.get('--previous-sha256'),
      previousLedgerPath: values.get('--ledger'),
      reviewedBatchPath: values.get('--reviewed'),
      bindingsPath: values.get('--bindings'),
      generatedAt: values.get('--generated-at'),
      dryRun,
    });
    process.stdout.write(
      `${canonicalJson({
        state: result.state,
        outputDirectory: result.outputDirectory,
        publicationPerformed: false,
        dryRun,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `WRN continuous legacy news supply failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
