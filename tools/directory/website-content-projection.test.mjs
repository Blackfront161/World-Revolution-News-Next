import assert from 'node:assert/strict';
import test from 'node:test';
import baseline from '../../apps/website/src/features/directory/data/content-directory-v1.json' with { type: 'json' };
import { readFile } from 'node:fs/promises';
import {
  buildWebsiteContentProjection,
  projectionBytes,
  projectionHash,
  verifyWebsiteProjection,
} from './website-content-projection.mjs';
import { observePublishedWebsiteInputs } from './observe-website-projection-inputs.mjs';
const observedAt = '2026-09-30T16:00:00.000Z';
const passes = await readFile(
  new URL('../../apps/website/public/wrn-source-passes/current.json', import.meta.url),
);
const revocations = JSON.parse(
  await readFile(
    new URL('../../apps/website/public/wrn-source-pass-revocations/current.json', import.meta.url),
  ),
);
function input(mutate = () => {}, count = 1) {
  const rows = Array.from({ length: count }, (_, i) => ({
    link: `https://source${i % 90}.example/article-${i}`,
    title: `Recorded article ${i}`,
    quelleName: `Recorded Source ${i % 90}`,
    sourceHomepage: `https://source${i % 90}.example/`,
    language: 'en',
    pubDate: '2026-09-30T14:00:00Z',
    categories: ['News'],
    content: `UNLICENSED BODY ${i}`,
    image: 'https://tracker.example/image.png',
    audio: 'https://tracker.example/audio.mp3',
  }));
  const registry = {
    generatedAt: '2026-09-30T15:00:00.000Z',
    sources: Array.from({ length: Math.min(count, 90) }, (_, i) => ({
      canonicalUrl: `https://source${i}.example/`,
      homepage: `https://source${i}.example/`,
      name: `Recorded Source ${i}`,
      languages: ['en'],
      categories: ['News'],
      status: 'active',
    })),
  };
  const revocation = structuredClone(revocations);
  mutate(rows, registry, revocation);
  const feedBytes = projectionBytes(rows),
    sourceBytes = projectionBytes(registry),
    revocationBytes = projectionBytes(revocation);
  const statusBytes = projectionBytes({
    ok: true,
    lastSuccessfulFetchAt: '2026-09-30T15:00:00.000Z',
    lastPublishedAt: '2026-09-30T15:01:00.000Z',
    publication: { pending: false },
    news: { feedCount: rows.length, bytes: feedBytes.length },
  });
  const binding = {
    admissionPolicy: 'website-restricted-link-only-v1',
    importMode: 'metadata-only',
    commit: 'a'.repeat(40),
    observedAt,
    feedCount: rows.length,
    registerCount: registry.sources.length,
    hashes: {
      feed: projectionHash(feedBytes),
      registry: projectionHash(sourceBytes),
      status: projectionHash(statusBytes),
      sourcePass: projectionHash(passes),
      revocations: projectionHash(revocationBytes),
      baseline: projectionHash(projectionBytes(baseline)),
    },
  };
  return {
    baseline,
    feedBytes,
    sourceBytes,
    statusBytes,
    sourcePassBytes: passes,
    revocationBytes,
    binding,
    sequence: 42,
  };
}
function gate(result) {
  const directoryBytes = projectionBytes(result.document),
    reportBytes = projectionBytes(result.report),
    directorySha256 = projectionHash(directoryBytes);
  return {
    directoryBytes,
    reportBytes,
    lock: {
      upstream: result.report.upstream,
      directorySha256,
      reportSha256: projectionHash(reportBytes),
    },
    pointer: {
      schema: 'wrn.content-directory-refresh.v1',
      sequence: 42,
      observedAt,
      artifactSha256: directorySha256,
      artifactPath: `snapshots/directory-42-${directorySha256}.json`,
      source: {
        repository: 'https://github.com/Blackfront161/Revolution-News-Data',
        commit: result.document.sourceCommit,
        newsPath: 'news-feed.json',
        sourcesPath: 'sources-registry.json',
      },
    },
    now: Date.parse(observedAt),
  };
}
test('a broad 450-article candidate passes the real schemas, identities, report sets and pointer gate without body/media rights', async () => {
  const first = await buildWebsiteContentProjection(input(() => {}, 450)),
    second = await buildWebsiteContentProjection(input(() => {}, 450));
  assert.equal(first.report.counts.included, 450);
  assert.equal(first.report.counts.pendingSources, 90);
  assert.deepEqual(first, second);
  assert.equal((await verifyWebsiteProjection(gate(first))).status, 'PASS');
  assert.ok(!projectionBytes(first.document).includes('UNLICENSED BODY'));
  assert.ok(!projectionBytes(first.document).includes('tracker.example'));
  assert.ok(
    first.report.articles.every((d) => d.mediaExclusions.text === 'item-admission-required'),
  );
});
test('mutated input hashes, declared article and source identities fail before output', async () => {
  const badHash = input();
  badHash.binding.hashes.feed = 'f'.repeat(64);
  await assert.rejects(buildWebsiteContentProjection(badHash), /hash-feed/);
  await assert.rejects(
    buildWebsiteContentProjection(
      input((rows) => {
        rows[0].id = 'news-' + 'f'.repeat(64);
      }),
    ),
    /article-id/,
  );
  await assert.rejects(
    buildWebsiteContentProjection(
      input((rows, reg) => {
        reg.sources[0].id = 'source-' + 'f'.repeat(64);
      }),
    ),
    /source-id/,
  );
});
test('duplicate source endpoints block the complete candidate', async () => {
  await assert.rejects(
    buildWebsiteContentProjection(input((rows, reg) => reg.sources.push({ ...reg.sources[0] }))),
    /duplicate-source/,
  );
});
test('directory-only never admits feed articles; metadata-only never copies bodies', async () => {
  const restricted = await buildWebsiteContentProjection(
    input((rows, reg) => {
      reg.sources[0].importMode = 'directory-only';
    }, 2),
  );
  assert.equal(restricted.report.articles[0].reason, 'directory-only');
  assert.equal(restricted.report.counts.included, 1);
  assert.equal(restricted.report.counts.directoryOnlySources, 1);
  assert.ok(restricted.document.sources.some((s) => s.id === restricted.report.sources[0].id));
  await verifyWebsiteProjection(gate(restricted));
  const allDirectoryOnly = input(() => {}, 2);
  allDirectoryOnly.binding.importMode = 'directory-only';
  const noArticles = await buildWebsiteContentProjection(allDirectoryOnly);
  assert.equal(noArticles.report.counts.included, 0);
  assert.ok(noArticles.report.articles.every((d) => d.reason === 'directory-only'));
  const metadata = await buildWebsiteContentProjection(
    input((rows, reg) => {
      reg.sources[0].importMode = 'metadata-only';
      rows[0].importMode = 'metadata-only';
    }, 2),
  );
  assert.equal(metadata.report.counts.fullTextImported, 0);
  assert.ok(!projectionBytes(metadata.document).includes('UNLICENSED BODY'));
  const absent = input();
  delete absent.binding.admissionPolicy;
  await assert.rejects(buildWebsiteContentProjection(absent), /binding/);
});

test('incomplete feed count and stale feed status fail closed', async () => {
  const truncated = input();
  truncated.binding.feedCount++;
  await assert.rejects(buildWebsiteContentProjection(truncated), /incomplete-or-stale/);
  const stale = input();
  stale.binding.observedAt = '2026-10-02T16:00:00.000Z';
  await assert.rejects(buildWebsiteContentProjection(stale), /stale or future publication/);
});

test('a bound source metadata prohibition blocks its feed link without granting any text rights', async () => {
  const overlay = JSON.parse(passes);
  const pass = overlay.records.find((p) =>
    p.endpoints.some((e) => baseline.sources.some((s) => s.id === e.endpointId)),
  );
  const endpoint = pass.endpoints.find((e) => baseline.sources.some((s) => s.id === e.endpointId));
  const canonical = baseline.sources.find((s) => s.id === endpoint.endpointId).url;
  pass.rights.find((r) => r.medium === 'metadata').status = 'prohibited';
  const candidate = input((rows, reg) => {
    rows[0].link = canonical + 'restricted-article';
    rows[0].sourceHomepage = canonical;
    rows[0].quelleName = pass.canonicalName;
    reg.sources[0].canonicalUrl = reg.sources[0].homepage = canonical;
    reg.sources[0].name = pass.canonicalName;
  }, 2);
  candidate.sourcePassBytes = projectionBytes(overlay);
  candidate.binding.hashes.sourcePass = projectionHash(candidate.sourcePassBytes);
  const result = await buildWebsiteContentProjection(candidate);
  assert.equal(result.report.articles[0].reason, 'metadata-prohibited');
  assert.equal(result.report.counts.fullTextImported, 0);
  await verifyWebsiteProjection(gate(result));
});
test('unsafe URLs, future dates, conflicting identities and missing provenance get per-row exclusions', async () => {
  const result = await buildWebsiteContentProjection(
    input((rows) => {
      rows[0].link = 'http://source0.example/article';
      rows[1].pubDate = '2026-10-01T00:00:00Z';
      rows[2].sourceHomepage = 'https://missing.example/';
      rows[3].title = '<script>bad</script>';
      rows[4].link = rows[5].link;
    }, 6),
  );
  assert.equal(result.report.counts.included, 0);
  assert.deepEqual(
    result.report.articles.map((d) => d.reason),
    [
      'insecure-url',
      'future-published-at',
      'incomplete-source-provenance',
      'invalid-schema',
      'identity-conflict',
      'duplicate-original-url',
    ],
  );
  await assert.rejects(verifyWebsiteProjection(gate(result)), /pointer-binding/);
});
test('an observed origin association retains missing-homepage links as unverified and never grants a pass', async () => {
  const result = await buildWebsiteContentProjection(
    input((rows) => {
      rows[0].sourceHomepage = '';
    }),
  );
  assert.equal(result.report.counts.included, 1);
  assert.equal(result.report.articles[0].sourceAssociation, 'observed-origin-and-name-unverified');
  assert.equal(result.report.articles[0].sourcePassStatus, 'pending-unverified');
  await verifyWebsiteProjection(gate(result));
});
test('source revocation excludes its links and survives the projected directory gate', async () => {
  const result = await buildWebsiteContentProjection(
    input((rows, reg, rev) => {
      rev.endpointIds = [`source-${projectionHash(reg.sources[0].canonicalUrl)}`];
    }),
  );
  assert.equal(result.report.articles[0].reason, 'source-revoked');
  assert.equal(result.report.sources[0].reason, 'source-revoked');
  // No current source/rows remain; a candidate with no upstream sources is not publishable.
  await assert.rejects(verifyWebsiteProjection(gate(result)), /pointer-binding/);
});

test('source revocation also withdraws historical links with missing homepages', async () => {
  const historical = baseline.articles.find(
    (a) =>
      a.endpointIds.length === 0 &&
      a.observations.some((o) => o.provenance.dataset === 'app' && !o.sourceHomepage),
  );
  assert.ok(historical, 'fixture contains a historical link without homepage provenance');
  const observation = historical.observations.find(
    (o) => o.provenance.dataset === 'app' && !o.sourceHomepage,
  );
  const origin = new URL(historical.url).origin + '/';
  const result = await buildWebsiteContentProjection(
    input((rows, reg, rev) => {
      reg.sources[0].canonicalUrl = reg.sources[0].homepage = origin;
      reg.sources[0].name = observation.sourceName;
      rows[0].link = origin + 'revoked-current-example';
      rows[0].sourceHomepage = '';
      rows[0].quelleName = observation.sourceName;
      rev.endpointIds = [`source-${projectionHash(origin)}`];
    }, 2),
  );
  assert.equal(result.report.articles[0].reason, 'source-revoked');
  assert.ok(result.document.withdrawals.articleIds.includes(historical.id));
  await verifyWebsiteProjection(gate(result));
});
test('hash tampering, stale or mixed pointers, unexplained omissions and media permission forgery are rejected', async () => {
  const result = await buildWebsiteContentProjection(input(() => {}, 2));
  const hash = gate(result);
  hash.directoryBytes[0] ^= 1;
  await assert.rejects(verifyWebsiteProjection(hash), /artifact-hash/);
  const stale = gate(result);
  stale.now += 86400001;
  await assert.rejects(verifyWebsiteProjection(stale), /stale-pointer/);
  const mixed = gate(result);
  mixed.pointer.source.commit = 'b'.repeat(40);
  await assert.rejects(verifyWebsiteProjection(mixed), /pointer-binding/);
  const omitted = structuredClone(result);
  omitted.report.articles.pop();
  await assert.rejects(verifyWebsiteProjection(gate(omitted)), /unexplained-gap/);
  const unjustified = structuredClone(result);
  unjustified.report.articles[0].status = 'excluded';
  unjustified.report.articles[0].reason = 'not-allowed-arbitrary-gap';
  await assert.rejects(verifyWebsiteProjection(gate(unjustified)), /unexplained-gap/);
  const rights = structuredClone(result);
  rights.report.articles[0].mediaExclusions.text = 'allowed';
  await assert.rejects(verifyWebsiteProjection(gate(rights)), /rights-decision/);
  const provenance = structuredClone(result);
  for (const a of provenance.document.articles)
    for (const o of a.observations)
      if (o.provenance.dataset === 'github') o.provenance.inputSHA256 = 'f'.repeat(64);
  provenance.report.directorySha256 = projectionHash(projectionBytes(provenance.document));
  await assert.rejects(verifyWebsiteProjection(gate(provenance)), /provenance-hash/);
});
test('published observation binds actual server bytes to the pinned upstream and rejects drift or network failure', async () => {
  const candidate = input();
  const files = {
    'news-feed.json': candidate.feedBytes,
    'feed-status.json': candidate.statusBytes,
    'sources-registry.json': candidate.sourceBytes,
  };
  const fetchImpl = async (value) => {
    const bytes = files[String(value).split('/').at(-1)];
    return new Response(bytes, {
      headers: { 'content-type': 'application/json', 'content-length': String(bytes.length) },
    });
  };
  const observed = await observePublishedWebsiteInputs({
    commit: candidate.binding.commit,
    fetchImpl,
    now: () => Date.parse(observedAt),
  });
  assert.equal(observed.publishedBytesMatchCommit, true);
  assert.deepEqual(Buffer.from(observed.files['news-feed.json']), candidate.feedBytes);
  await assert.rejects(
    observePublishedWebsiteInputs({
      commit: candidate.binding.commit,
      fetchImpl: async (value) =>
        String(value).includes('github.io')
          ? new Response('{}', { headers: { 'content-type': 'application/json' } })
          : fetchImpl(value),
      now: () => Date.parse(observedAt),
    }),
    /published-commit-mismatch/,
  );
  await assert.rejects(
    observePublishedWebsiteInputs({
      commit: candidate.binding.commit,
      fetchImpl: async () => {
        throw new TypeError('network failure');
      },
      now: () => Date.parse(observedAt),
    }),
    /network failure/,
  );
  await assert.rejects(
    observePublishedWebsiteInputs({
      commit: candidate.binding.commit,
      fetchImpl: async (value) =>
        String(value).includes('github.io')
          ? new Response('{}', {
              headers: { 'content-type': 'application/json', 'content-length': '99' },
            })
          : fetchImpl(value),
      now: () => Date.parse(observedAt),
    }),
    /published-truncated/,
  );
});
