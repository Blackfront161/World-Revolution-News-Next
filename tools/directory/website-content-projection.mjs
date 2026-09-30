import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectLegacyNewsSnapshot } from '../legacy-news-ingestion.mjs';
import { buildLiveContentDirectory } from './prepare-live-content-directory.mjs';
import {
  writePreparedDirectoryRefresh,
  validateDirectoryRefresh,
} from './prepare-content-directory-refresh.mjs';
import {
  normaliseDirectoryUrl,
  directoryEndpointIds,
  validateMobileContentDirectory,
  validateMobileContentDirectoryIds,
} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';
import {
  validateSourcePassOverlayV1,
  validateSourcePassOverlayEndpointIdsV1,
} from '../../packages/content-contracts/src/directory/source-pass-overlay-v1.ts';
import { isSourcePassRevocationsV1 } from '../../packages/content-contracts/src/directory/source-pass-revocations-v1.ts';

export const projectionHash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const projectionBytes = (value) => Buffer.from(JSON.stringify(value) + '\n');
export function websiteProjectionSummary(report) {
  const reasons = {};
  for (const decision of report.articles)
    if (decision.reason) reasons[decision.reason] = (reasons[decision.reason] ?? 0) + 1;
  return {
    directorySha256: report.directorySha256,
    sequence: report.sequence,
    commit: report.upstream.commit,
    observedAt: report.upstream.observedAt,
    feedTime: report.feedTime,
    registerTime: report.registerTime,
    newestArticleAt: report.newestArticleAt,
    counts: report.counts,
    reasons,
    directoryOnlyEndpointIds: report.sources
      .filter((d) => d.status !== 'excluded' && d.importMode === 'directory-only')
      .map((d) => d.id)
      .sort(),
    admissionPolicy: report.upstream.admissionPolicy,
    articleSourcePassPending: report.articles.filter(
      (d) => d.status !== 'excluded' && d.sourcePassStatus === 'pending-unverified',
    ).length,
  };
}
const fail = (reason) => {
  throw new Error(`website-projection:${reason}`);
};
const url = (value) => normaliseDirectoryUrl(value, { allowHttp: true });
const articleUrl = (value) => normaliseDirectoryUrl(value, { news: true, allowHttp: true });
const sourceId = (value) => (value ? `source-${projectionHash(value)}` : null);
const articleId = (value) => (value ? `news-${projectionHash(value)}` : null);
const deniedMedia = {
  text: 'item-admission-required',
  image: 'item-rights-required',
  audio: 'item-rights-required',
  logo: 'item-rights-required',
  teaser: 'no-reviewed-teaser',
};
const nowValid = (value, now) =>
  Number.isFinite(Date.parse(value)) &&
  Date.parse(value) <= now &&
  now - Date.parse(value) <= 86400000;

/** Metadata/link admission only; existing full-text, safety and media admission are separate. */
export async function buildWebsiteContentProjection({
  baseline,
  feedBytes,
  statusBytes,
  sourceBytes,
  sourcePassBytes,
  revocationBytes,
  binding,
  sequence,
}) {
  const blobs = {
    feed: feedBytes,
    status: statusBytes,
    registry: sourceBytes,
    sourcePass: sourcePassBytes,
    revocations: revocationBytes,
    baseline: projectionBytes(baseline),
  };
  if (
    !binding ||
    binding.admissionPolicy !== 'website-restricted-link-only-v1' ||
    !['metadata-only', 'directory-only'].includes(binding.importMode) ||
    !/^[a-f0-9]{40}$/.test(binding.commit ?? '') ||
    !Number.isFinite(Date.parse(binding.observedAt))
  )
    fail('binding');
  for (const [name, bytes] of Object.entries(blobs)) {
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.length > 4 * 1024 * 1024 ||
      projectionHash(bytes) !== binding.hashes?.[name]
    )
      fail(`hash-${name}`);
  }
  const now = Date.parse(binding.observedAt);
  const intake = inspectLegacyNewsSnapshot({
    feedBytes,
    statusBytes,
    commit: binding.commit,
    observedAt: now,
  });
  const rows = JSON.parse(feedBytes),
    registry = JSON.parse(sourceBytes),
    passes = JSON.parse(sourcePassBytes),
    revocations = JSON.parse(revocationBytes);
  if (
    !Array.isArray(registry.sources) ||
    registry.sources.length !== binding.registerCount ||
    rows.length !== binding.feedCount ||
    !nowValid(registry.generatedAt, now)
  )
    fail('incomplete-or-stale-input');
  if (
    !validateSourcePassOverlayV1(passes) ||
    !(await validateSourcePassOverlayEndpointIdsV1(passes, baseline)) ||
    !isSourcePassRevocationsV1(revocations)
  )
    fail('source-pass-contract');
  const document = await buildLiveContentDirectory({
    baseline,
    feedBytes,
    sourceBytes,
    intake,
    commit: binding.commit,
  });
  const revoked = new Set([...baseline.withdrawals.endpointIds, ...revocations.endpointIds]);
  const excludedArticles = new Set(baseline.withdrawals.articleIds);
  const canonicalSources = new Map();
  for (const [index, row] of registry.sources.entries()) {
    const identity = sourceId(url(row?.canonicalUrl ?? row?.url ?? row?.homepage));
    if (identity && canonicalSources.has(identity)) fail('duplicate-source');
    if (identity) canonicalSources.set(identity, index);
    if (row?.id !== undefined && row.id !== identity) fail('source-id');
  }
  const sourceDecisions = registry.sources.map((row, index) => {
    const importMode = row.importMode ?? binding.importMode;
    const normalized = url(row?.canonicalUrl ?? row?.url ?? row?.homepage),
      id = sourceId(normalized);
    const projected = document.sources.find(
      (entry) =>
        entry.id === id &&
        entry.observations.some(
          (o) => o.provenance.dataset === 'github' && o.provenance.row === index,
        ),
    );
    const matches = passes.records.filter((pass) =>
      pass.endpoints.some((endpoint) => endpoint.endpointId === id),
    );
    const reason = !['metadata-only', 'directory-only'].includes(importMode)
      ? 'unsupported-import-mode'
      : !normalized
        ? 'invalid-schema'
        : normalized.startsWith('http:')
          ? 'insecure-url'
          : revoked.has(id)
            ? 'source-revoked'
            : !projected
              ? 'invalid-schema'
              : matches.length > 1
                ? 'ambiguous-source-pass'
                : null;
    return {
      row: index,
      upstreamRecordSha256: projectionHash(projectionBytes(row)),
      id,
      importMode,
      status: reason ? 'excluded' : matches.length ? 'matched-pass' : 'pending-unverified',
      sourcePassId: matches.length === 1 ? matches[0].id : null,
      reason,
      mediaExclusions: deniedMedia,
    };
  });
  const candidates = new Map(intake.candidates.map((entry) => [entry.index, entry]));
  const rejected = new Map(intake.rejected.map((entry) => [entry.index, entry.reason]));
  const associatedSourceRows = (homepage, normalized, recordedName) =>
    registry.sources.flatMap((source, i) => {
      const aliases = [source.canonicalUrl, source.url, source.homepage].map(url).filter(Boolean);
      const exactHomepage = homepage && aliases.includes(homepage);
      const observedOrigin =
        !homepage &&
        normalized &&
        source.name === recordedName &&
        aliases.some((value) => new URL(value).origin === new URL(normalized).origin);
      return exactHomepage || observedOrigin ? [i] : [];
    });
  const decisions = rows.map((row, index) => {
    const normalized = articleUrl(row?.link),
      id = articleId(normalized);
    if (row?.id !== undefined && row.id !== id) fail('article-id');
    const candidate = candidates.get(index);
    const projected = document.articles.find(
      (entry) =>
        entry.id === id &&
        entry.observations.some(
          (o) => o.provenance.dataset === 'github' && o.provenance.row === index,
        ),
    );
    // Exact homepage aliases are authoritative associations. Missing homepages may use
    // exact original-link origins plus recorded names, but remain explicitly unverified.
    const homepage = url(row?.sourceHomepage);
    const sourceRows = associatedSourceRows(homepage, normalized, candidate?.sourceName);
    const endpoints = sourceRows.map((i) => sourceDecisions[i].id).filter(Boolean);
    const admittedSources = sourceRows.filter((i) => sourceDecisions[i].status !== 'excluded');
    const directoryOnly =
      row?.importMode === 'directory-only' ||
      sourceRows.some((i) => sourceDecisions[i].importMode === 'directory-only');
    const prohibitedMetadata = passes.records.some(
      (pass) =>
        pass.endpoints.some((endpoint) => endpoints.includes(endpoint.endpointId)) &&
        pass.rights.some((right) => right.medium === 'metadata' && right.status === 'prohibited'),
    );
    const reason =
      rejected.get(index) ??
      (row?.importMode !== undefined &&
      !['metadata-only', 'directory-only'].includes(row.importMode)
        ? 'unsupported-import-mode'
        : directoryOnly
          ? 'directory-only'
          : prohibitedMetadata
            ? 'metadata-prohibited'
            : !normalized
              ? 'invalid-schema'
              : normalized.startsWith('http:')
                ? 'insecure-url'
                : candidate?.identityConflict
                  ? 'identity-conflict'
                  : !projected
                    ? 'invalid-schema'
                    : excludedArticles.has(id)
                      ? 'article-revoked'
                      : endpoints.some((endpoint) => revoked.has(endpoint))
                        ? 'source-revoked'
                        : admittedSources.length === 0
                          ? 'incomplete-source-provenance'
                          : null);
    return {
      row: index,
      upstreamRecordSha256: projectionHash(projectionBytes(row)),
      id,
      sourceIds: endpoints.sort(),
      importMode: directoryOnly ? 'directory-only' : 'metadata-only',
      sourceAssociation: homepage ? 'exact-homepage' : 'observed-origin-and-name-unverified',
      status: reason ? 'excluded' : 'metadata-link-only',
      reason,
      sourcePassStatus:
        homepage && admittedSources.some((i) => sourceDecisions[i].status === 'matched-pass')
          ? 'matched-pass'
          : 'pending-unverified',
      publishedAt: candidate?.publishedAt ?? null,
      editorialClassificationPending: row?.editorialReview === true,
      mediaExclusions: deniedMedia,
    };
  });
  const acceptedRows = new Set(decisions.filter((d) => d.status !== 'excluded').map((d) => d.row));
  for (const decision of decisions)
    if (decision.reason === 'source-revoked' && decision.id) excludedArticles.add(decision.id);
  const acceptedSourceRows = new Set(
    sourceDecisions.filter((d) => d.status !== 'excluded').map((d) => d.row),
  );
  document.sources = document.sources.flatMap((entry) => {
    const observations = entry.observations.filter(
      (o) => o.provenance.dataset === 'app' || acceptedSourceRows.has(o.provenance.row),
    );
    if (!observations.length) return [];
    const display =
      observations.findLast((o) => o.provenance.dataset === 'github') ?? observations.at(-1);
    return [
      {
        ...entry,
        name: display.name,
        languages: display.languages,
        mediaType: display.mediaType,
        observations,
      },
    ];
  });
  // Preserve historical observations, but remove newly rejected rows from the public projection.
  document.articles = document.articles.flatMap((entry) => {
    const observations = entry.observations.filter(
      (o) => o.provenance.dataset === 'app' || acceptedRows.has(o.provenance.row),
    );
    if (!observations.length) return [];
    const display =
      observations.findLast((o) => o.provenance.dataset === 'github') ?? observations.at(-1);
    const current = observations.findLast((o) => o.provenance.dataset === 'github');
    return [
      {
        ...entry,
        title: display.title,
        sourceName: display.sourceName,
        language: display.language,
        publishedAt: display.publishedAt,
        topics: display.topics,
        endpointIds: directoryEndpointIds(
          observations.map((o) => o.sourceHomepage),
          document.sources,
        ),
        historical: !current,
        observations,
      },
    ];
  });
  document.withdrawals.endpointIds = [...revoked]
    .filter((id) => document.sources.some((s) => s.id === id))
    .sort();
  // A source withdrawal also covers retained history whose homepage was missing.
  // Origin/name association can restrict access; it cannot grant a source pass.
  for (const entry of document.articles)
    if (
      entry.observations.some((o) =>
        associatedSourceRows(
          url(o.sourceHomepage),
          articleUrl(o.url ?? entry.url),
          o.sourceName,
        ).some((i) => revoked.has(sourceDecisions[i].id)),
      )
    )
      excludedArticles.add(entry.id);
  document.withdrawals.articleIds = [...excludedArticles]
    .filter((id) => document.articles.some((a) => a.id === id))
    .sort();
  // Contract reconciliation counts observations, including retained history.
  const oldAccepted = document.reconciliation.news.github.accepted;
  document.reconciliation.news.github.accepted = acceptedRows.size;
  document.reconciliation.news.github.rejected.metadata += oldAccepted - acceptedRows.size;
  document.reconciliation.news.collisions =
    document.reconciliation.news.app.accepted + acceptedRows.size - document.articles.length;
  const oldSources = document.reconciliation.sources.github.accepted;
  document.reconciliation.sources.github.accepted = acceptedSourceRows.size;
  document.reconciliation.sources.github.rejected.metadata += oldSources - acceptedSourceRows.size;
  document.reconciliation.sources.collisions =
    document.reconciliation.sources.app.accepted +
    acceptedSourceRows.size -
    document.sources.length;
  document.sports = document.sports.map((s) => ({
    ...s,
    articleId: document.articles.find((a) => a.url === s.url)?.id ?? null,
    endpointIds: directoryEndpointIds([s.sourceHomepage], document.sources),
  }));
  if (
    !validateMobileContentDirectory(document) ||
    !(await validateMobileContentDirectoryIds(document))
  )
    fail('projected-contract');
  const bytes = projectionBytes(document);
  const acceptedIds = decisions
    .filter((d) => d.status !== 'excluded')
    .map((d) => d.id)
    .sort();
  const sourceIds = sourceDecisions
    .filter((d) => d.status !== 'excluded')
    .map((d) => d.id)
    .sort();
  const feedSources = [
    ...new Set(rows.map((row) => row?.quelleName ?? row?.sourceName ?? row?.source)),
  ].map((observedName) => {
    const rowNumbers = rows.flatMap((row, i) =>
      (row?.quelleName ?? row?.sourceName ?? row?.source) === observedName ? [i] : [],
    );
    const endpoints = [...new Set(rowNumbers.flatMap((i) => decisions[i].sourceIds))].sort();
    const missingPassEndpointIds = endpoints.filter(
      (id) => !sourceDecisions.some((d) => d.id === id && d.status === 'matched-pass'),
    );
    return {
      observedName,
      labelSha256: projectionHash(String(observedName)),
      rows: rowNumbers,
      sourceIds: endpoints,
      missingPassEndpointIds,
      status:
        missingPassEndpointIds.length || !endpoints.length ? 'pending-unverified' : 'matched-pass',
      missingProvenanceRows: rowNumbers.filter(
        (i) => decisions[i].reason === 'incomplete-source-provenance',
      ),
    };
  });
  const report = {
    schema: 'wrn.website-content-parity.v1',
    sequence,
    upstream: binding,
    feedTime: intake.publishedAt,
    registerTime: new Date(registry.generatedAt).toISOString(),
    directorySha256: projectionHash(bytes),
    sourcePassRevision: passes.revision,
    revocationRevision: revocations.revision,
    counts: {
      feed: rows.length,
      feedSources: new Set(rows.map((row) => row?.quelleName ?? row?.sourceName ?? row?.source))
        .size,
      registry: registry.sources.length,
      included: acceptedIds.length,
      metadataLinkOnly: acceptedIds.length,
      fullTextImported: 0,
      directoryOnlySources: sourceDecisions.filter(
        (d) => d.status !== 'excluded' && d.importMode === 'directory-only',
      ).length,
      metadataOnlySources: sourceDecisions.filter(
        (d) => d.status !== 'excluded' && d.importMode === 'metadata-only',
      ).length,
      excluded: rows.length - acceptedIds.length,
      matchedSources: sourceDecisions.filter((d) => d.status === 'matched-pass').length,
      pendingSources: sourceDecisions.filter((d) => d.status === 'pending-unverified').length,
      excludedSources: sourceDecisions.filter((d) => d.status === 'excluded').length,
      directoryArticles: document.articles.length,
      directorySources: document.sources.length,
    },
    commonArticleIds: acceptedIds,
    missingArticleIds: decisions.filter((d) => d.status === 'excluded').map((d) => d.id),
    commonSourceIds: sourceIds,
    missingSourceIds: sourceDecisions.filter((d) => d.status === 'excluded').map((d) => d.id),
    newestArticleAt:
      decisions
        .filter((d) => d.status !== 'excluded')
        .map((d) => d.publishedAt)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
    freshness: {
      observedAt: binding.observedAt,
      publicationAgeMs: now - Date.parse(intake.publishedAt),
      maximumAgeMs: 86400000,
      upstreamWarnings: intake.upstreamWarnings,
    },
    articles: decisions,
    sources: sourceDecisions,
    feedSources,
    publicationPerformed: false,
  };
  return { document, report };
}

/** Hash/set closure and pointer freshness must pass before a local website candidate is usable. */
export async function verifyWebsiteProjection({
  directoryBytes,
  reportBytes,
  lock,
  pointer,
  now = Date.now(),
}) {
  if (
    projectionHash(directoryBytes) !== lock.directorySha256 ||
    projectionHash(reportBytes) !== lock.reportSha256
  )
    fail('artifact-hash');
  const document = JSON.parse(directoryBytes),
    report = JSON.parse(reportBytes);
  if (
    !validateMobileContentDirectory(document) ||
    !(await validateMobileContentDirectoryIds(document)) ||
    report.schema !== 'wrn.website-content-parity.v1'
  )
    fail('contract');
  if (
    report.directorySha256 !== lock.directorySha256 ||
    document.sourceCommit !== report.upstream.commit ||
    report.sequence !== pointer.sequence ||
    !(await validateDirectoryRefresh(pointer, directoryBytes, pointer.sequence - 1))
  )
    fail('pointer-binding');
  if (
    !nowValid(pointer.observedAt, now) ||
    !nowValid(report.feedTime, now) ||
    !nowValid(report.registerTime, now)
  )
    fail('stale-pointer');
  if (JSON.stringify(report.upstream) !== JSON.stringify(lock.upstream)) fail('upstream-binding');
  if (
    !Array.isArray(report.feedSources) ||
    report.feedSources.length !== report.counts.feedSources ||
    report.feedSources
      .flatMap((s) => s.rows)
      .sort((a, b) => a - b)
      .some((row, i) => row !== i) ||
    report.feedSources.flatMap((s) => s.rows).length !== report.counts.feed
  )
    fail('feed-source-gap');
  for (const observation of [...document.articles, ...document.sources]
    .flatMap((entry) => entry.observations)
    .filter((o) => o.provenance.dataset === 'github')) {
    if (
      observation.provenance.inputSHA256 !==
      report.upstream.hashes[observation.provenance.path === 'news-feed.json' ? 'feed' : 'registry']
    )
      fail('provenance-hash');
  }
  const exclusionReasons = new Set([
    'invalid-record',
    'invalid-metadata',
    'invalid-schema',
    'future-published-at',
    'duplicate-original-url',
    'insecure-url',
    'identity-conflict',
    'article-revoked',
    'source-revoked',
    'incomplete-source-provenance',
    'ambiguous-source-pass',
    'unsupported-import-mode',
    'directory-only',
    'metadata-prohibited',
  ]);
  const validDecisions = (entries, count, statuses) =>
    Array.isArray(entries) &&
    entries.length === count &&
    entries.every(
      (d, i) =>
        d.row === i &&
        /^[a-f0-9]{64}$/.test(d.upstreamRecordSha256) &&
        statuses.includes(d.status) &&
        ['metadata-only', 'directory-only'].includes(d.importMode) &&
        (d.status === 'excluded' ? exclusionReasons.has(d.reason) : d.reason === null),
    );
  if (
    !validDecisions(report.articles, report.upstream.feedCount, [
      'excluded',
      'metadata-link-only',
    ]) ||
    !validDecisions(report.sources, report.upstream.registerCount, [
      'excluded',
      'matched-pass',
      'pending-unverified',
    ])
  )
    fail('unexplained-gap');
  const included = report.articles.filter((d) => d.status !== 'excluded');
  if (
    report.upstream.admissionPolicy !== 'website-restricted-link-only-v1' ||
    included.some((d) => d.importMode !== 'metadata-only') ||
    report.counts.metadataLinkOnly !== included.length ||
    report.counts.fullTextImported !== 0 ||
    report.counts.directoryOnlySources !==
      report.sources.filter((d) => d.status !== 'excluded' && d.importMode === 'directory-only')
        .length ||
    report.counts.metadataOnlySources !==
      report.sources.filter((d) => d.status !== 'excluded' && d.importMode === 'metadata-only')
        .length
  )
    fail('admission-policy');
  const actual = document.articles.flatMap((a) =>
    a.observations
      .filter((o) => o.provenance.dataset === 'github')
      .map((o) => ({ id: a.id, row: o.provenance.row })),
  );
  if (
    included.length !== report.counts.included ||
    report.counts.feed !== report.articles.length ||
    report.counts.excluded !== report.articles.length - included.length ||
    actual.length !== included.length ||
    included.some((d) => !actual.some((a) => a.row === d.row && a.id === d.id)) ||
    JSON.stringify(included.map((d) => d.id).sort()) !== JSON.stringify(report.commonArticleIds)
  )
    fail('unexplained-gap');
  if (
    new Set(included.map((d) => d.id)).size !== included.length ||
    document.articles.some((a) => 'content' in a || 'image' in a || 'teaser' in a)
  )
    fail('metadata-rights');
  if (
    report.articles.some((d) => JSON.stringify(d.mediaExclusions) !== JSON.stringify(deniedMedia))
  )
    fail('rights-decision');
  const admittedSources = report.sources.filter((d) => d.status !== 'excluded');
  if (
    new Set(admittedSources.map((d) => d.id)).size !== admittedSources.length ||
    JSON.stringify(admittedSources.map((d) => d.id).sort()) !==
      JSON.stringify(report.commonSourceIds) ||
    report.counts.registry !== report.sources.length ||
    report.counts.pendingSources !==
      report.sources.filter((d) => d.status === 'pending-unverified').length ||
    report.counts.matchedSources !==
      report.sources.filter((d) => d.status === 'matched-pass').length ||
    report.counts.excludedSources !== report.sources.length - admittedSources.length
  )
    fail('source-gap');
  if (
    JSON.stringify(report.articles.filter((d) => d.status === 'excluded').map((d) => d.id)) !==
      JSON.stringify(report.missingArticleIds) ||
    JSON.stringify(report.sources.filter((d) => d.status === 'excluded').map((d) => d.id)) !==
      JSON.stringify(report.missingSourceIds)
  )
    fail('missing-ids');
  const actualSources = document.sources.flatMap((s) =>
    s.observations
      .filter((o) => o.provenance.dataset === 'github')
      .map((o) => ({ id: s.id, row: o.provenance.row })),
  );
  if (
    actualSources.length !== admittedSources.length ||
    admittedSources.some((d) => !actualSources.some((s) => s.id === d.id && s.row === d.row)) ||
    report.counts.directoryArticles !== document.articles.length ||
    report.counts.directorySources !== document.sources.length
  )
    fail('source-gap');
  const newest =
    included
      .map((d) => d.publishedAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  if (
    newest !== report.newestArticleAt ||
    included.some((d) => Date.parse(d.publishedAt) > Date.parse(report.upstream.observedAt))
  )
    fail('freshness');
  return {
    status: 'PASS',
    counts: report.counts,
    sequence: pointer.sequence,
    directorySha256: lock.directorySha256,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [configPath, output] = process.argv.slice(2);
  if (!configPath || !output) fail('usage: config.json new-output-directory');
  const config = JSON.parse(await readFile(resolve(configPath)));
  const inputs = {};
  for (const name of ['baseline', 'feed', 'status', 'registry', 'sourcePass', 'revocations'])
    inputs[name] = await readFile(resolve(config.paths[name]));
  const result = await buildWebsiteContentProjection({
    baseline: JSON.parse(inputs.baseline),
    feedBytes: inputs.feed,
    statusBytes: inputs.status,
    sourceBytes: inputs.registry,
    sourcePassBytes: inputs.sourcePass,
    revocationBytes: inputs.revocations,
    binding: config.binding,
    sequence: config.sequence,
  });
  const staging = resolve(`${output}.staging-${process.pid}`);
  await mkdir(staging);
  const pointer = await writePreparedDirectoryRefresh({
    document: result.document,
    sequence: config.sequence,
    output: resolve(staging, 'directory'),
  });
  const directoryBytes = projectionBytes(result.document),
    reportBytes = projectionBytes(result.report);
  const lock = {
    schema: 'wrn.website-projection-lock.v1',
    upstream: config.binding,
    directorySha256: projectionHash(directoryBytes),
    reportSha256: projectionHash(reportBytes),
  };
  await verifyWebsiteProjection({
    directoryBytes,
    reportBytes,
    lock,
    pointer,
    now: Date.parse(config.binding.observedAt),
  });
  await writeFile(resolve(staging, 'report.json'), reportBytes, { flag: 'wx' });
  await writeFile(resolve(staging, 'lock.json'), projectionBytes(lock), { flag: 'wx' });
  await writeFile(
    resolve(staging, 'summary.json'),
    projectionBytes(websiteProjectionSummary(result.report)),
    { flag: 'wx' },
  );
  await rename(staging, resolve(output));
  console.log(JSON.stringify({ publicationPerformed: false, ...result.report.counts, lock }));
}
