import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import baseline from '../../apps/mobile/src/features/directory/data/content-directory-v1.json' with { type: 'json' };
import { inspectLegacyNewsSnapshot } from '../legacy-news-ingestion.mjs';
import {
  buildLiveContentDirectory,
  fetchLegacySourceRegistry,
  liveDirectorySourceLimit,
  prepareLiveContentDirectory,
} from './prepare-live-content-directory.mjs';

const commit = 'a'.repeat(40);
const observedAt = '2026-09-25T00:00:00.000Z';
const rows = [
  {
    link: 'https://example.net/current?utm_source=feed',
    title: 'Current metadata record',
    quelleName: 'Example News',
    language: 'en',
    pubDate: '2026-09-24T22:00:00Z',
    categories: ['Movement News'],
    sourceHomepage: 'https://example.net/',
    content: 'RIGHTS NOT GRANTED',
    images: ['DO NOT COPY'],
  },
  {
    link: 'http://example.net/insecure',
    title: 'Insecure record',
    quelleName: 'Example News',
    pubDate: '2026-09-24T21:00:00Z',
  },
  {
    link: 'https://example.net/invalid',
    title: '<b>Markup is rejected by the directory contract</b>',
    quelleName: 'Example News',
    pubDate: '2026-09-24T20:00:00Z',
  },
];
const feedBytes = Buffer.from(JSON.stringify(rows));
const statusBytes = Buffer.from(
  JSON.stringify({
    ok: true,
    lastSuccessfulFetchAt: '2026-09-24T23:00:00.000Z',
    lastPublishedAt: '2026-09-24T23:01:00.000Z',
    publication: { pending: false },
    news: { feedCount: rows.length, bytes: feedBytes.length },
  }),
);
const intake = inspectLegacyNewsSnapshot({
  feedBytes,
  statusBytes,
  commit,
  observedAt: Date.parse(observedAt),
});
const sourceRegistry = {
  generatedAt: '2026-09-24T23:02:00.000Z',
  sources: [
    {
      canonicalUrl: 'https://example.net/feed',
      name: 'Example News',
      languages: ['en'],
      mediaType: 'news',
      status: 'active',
      active: true,
      homepage: 'https://example.net/',
      categories: ['Movement News'],
      originRegion: 'Global',
      originCountry: null,
    },
    { canonicalUrl: 'http://example.net/feed', name: 'Insecure source' },
    { canonicalUrl: 'https://example.net/bad', name: '<b>Bad</b>' },
  ],
};
const sourceBytes = Buffer.from(JSON.stringify(sourceRegistry));
const response = (bytes) =>
  new Response(bytes, {
    headers: {
      'content-type': 'application/json',
      'content-length': String(bytes.length),
    },
  });

test('replaces current observations while retaining only the verified app history', async () => {
  const document = await buildLiveContentDirectory({
    baseline,
    feedBytes,
    sourceBytes,
    intake,
    commit,
  });
  const appOnly = baseline.articles.find(
    (article) =>
      article.observations.some((item) => item.provenance.dataset === 'app') &&
      !article.observations.some((item) => item.provenance.dataset === 'github'),
  );
  const githubOnly = baseline.articles.find(
    (article) =>
      !article.observations.some((item) => item.provenance.dataset === 'app') &&
      article.observations.some((item) => item.provenance.dataset === 'github'),
  );
  assert.ok(appOnly);
  assert.ok(githubOnly);
  assert.ok(document.articles.some((article) => article.id === appOnly.id && article.historical));
  assert.ok(!document.articles.some((article) => article.id === githubOnly.id));
  const current = document.articles.find((article) => article.title === 'Current metadata record');
  assert.ok(current);
  assert.equal(current.url, 'https://example.net/current');
  assert.equal(current.historical, false);
  assert.equal(current.endpointIds.length, 1);
  assert.deepEqual(document.reconciliation.news.github, {
    input: 3,
    accepted: 1,
    rejected: { url: 0, http: 1, metadata: 1 },
  });
  assert.deepEqual(document.reconciliation.sources.github, {
    input: 3,
    accepted: 1,
    rejected: { url: 0, http: 1, metadata: 1 },
  });
  assert.ok(
    document.articles
      .flatMap((article) => article.observations)
      .filter((item) => item.provenance.dataset === 'github')
      .every((item) => item.provenance.commit === commit),
  );
  assert.ok(
    document.articles
      .flatMap((article) => article.observations)
      .every((item) => item.provenance.observedAt === observedAt),
  );
  assert.doesNotMatch(JSON.stringify(document), /RIGHTS NOT GRANTED|DO NOT COPY/u);
  assert.equal(
    JSON.stringify(document),
    JSON.stringify(
      await buildLiveContentDirectory({
        baseline,
        feedBytes,
        sourceBytes,
        intake,
        commit,
      }),
    ),
  );
});

test('fetches the exact commit with credential-free, non-redirecting bounded transport', async () => {
  let request;
  const result = await fetchLegacySourceRegistry({
    commit,
    fetchImpl: async (url, options) => {
      request = { url: String(url), options };
      return response(sourceBytes);
    },
  });
  assert.deepEqual(result, sourceBytes);
  assert.equal(
    request.url,
    `https://raw.githubusercontent.com/Blackfront161/Revolution-News-Data/${commit}/sources-registry.json`,
  );
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.redirect, 'error');
  await assert.rejects(
    () =>
      fetchLegacySourceRegistry({
        commit,
        fetchImpl: async () =>
          new Response('{}', {
            headers: {
              'content-type': 'application/json',
              'content-length': String(liveDirectorySourceLimit + 1),
            },
          }),
      }),
    /source-size/u,
  );
});

test('writes an immutable review packet and a non-publication receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wrn-live-directory-'));
  const output = join(root, 'directory-refresh');
  const requested = [];
  const result = await prepareLiveContentDirectory({
    baseline,
    commit,
    sequence: 202609250001,
    output,
    now: () => Date.parse(observedAt),
    fetchImpl: async (url) => {
      requested.push(String(url));
      if (String(url).endsWith('/feed-status.json')) return response(statusBytes);
      if (String(url).endsWith('/news-feed.json')) return response(feedBytes);
      if (String(url).endsWith('/sources-registry.json')) return response(sourceBytes);
      throw new Error('unexpected request');
    },
  });
  assert.equal(requested.length, 3);
  assert.equal(result.receipt.dryRun, true);
  assert.equal(result.receipt.publicationPerformed, false);
  assert.equal(result.receipt.commit, commit);
  const manifest = JSON.parse(await readFile(join(output, 'current.json'), 'utf8'));
  assert.equal(manifest.sequence, 202609250001);
  assert.equal(manifest.source.commit, commit);
  assert.equal(
    JSON.parse(await readFile(`${output}-receipt.json`, 'utf8')).manifest.artifactSha256,
    manifest.artifactSha256,
  );
  assert.ok(await readFile(join(output, manifest.artifactPath)));
});
