import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import {
  contentDirectoryManifestUrl,
  contentDirectorySequenceStorageKey,
  loadContentDirectoryWithRefresh,
} from './content-directory-refresh';

const emptyCount = Object.freeze({
  input: 0,
  accepted: 0,
  rejected: { url: 0, http: 0, metadata: 0 },
});
const sourceId = 'source-81ec7f67d7d7ef57502a09cbd55c8862d2a63a99c58de8f8181cbc6a89b25316';
const articleId = 'news-d5de26b47c50771979e01ccfb256c580aaa8a14ce1492a65b6b1826b4024073c';
const provenance = (path: 'news-feed.json' | 'sources-registry.json') => ({
  dataset: 'github' as const,
  repo: 'https://github.com/Blackfront161/Revolution-News-Data',
  commit: 'a'.repeat(40),
  path,
  inputSHA256: 'b'.repeat(64),
  observedAt: '2026-09-21T00:00:00.000Z',
  sourceDate: '2026-09-20T00:00:00.000Z',
  row: 0,
});
const snapshot: MobileContentDirectory = {
  schema: 'wrn.mobile-content-directory.v1',
  version: 1,
  sourceCommit: 'a'.repeat(40),
  observedAt: '2026-09-21T00:00:00.000Z',
  rights: 'metadata-and-links',
  articles: [
    {
      id: articleId,
      url: 'https://source.example/story',
      title: 'Reviewed story',
      sourceName: 'Reviewed source',
      language: 'en',
      publishedAt: '2026-09-20T00:00:00.000Z',
      topics: ['Movement News'],
      historical: false,
      endpointIds: [sourceId],
      observations: [
        {
          provenance: provenance('news-feed.json'),
          rawUrl: 'https://source.example/story',
          title: 'Reviewed story',
          sourceName: 'Reviewed source',
          language: 'en',
          rawLanguage: 'en',
          publishedAt: '2026-09-20T00:00:00.000Z',
          rawPublishedAt: '2026-09-20T00:00:00.000Z',
          topics: ['Movement News'],
          sourceHomepage: 'https://source.example/',
        },
      ],
    },
  ],
  sources: [
    {
      id: sourceId,
      url: 'https://source.example/',
      name: 'Reviewed source',
      languages: ['en'],
      mediaType: 'news',
      historicalHttp: false,
      accessNote: null,
      observations: [
        {
          provenance: provenance('sources-registry.json'),
          rawUrl: 'https://source.example/',
          name: 'Reviewed source',
          languages: ['en'],
          mediaType: 'news',
          status: 'active',
          active: true,
          homepage: 'https://source.example/',
          topics: ['Movement News'],
          originRegion: null,
          originCountry: null,
        },
      ],
    },
  ],
  sports: [],
  withdrawals: { articleIds: [], endpointIds: [] },
  reconciliation: {
    news: {
      app: emptyCount,
      github: { input: 1, accepted: 1, rejected: { url: 0, http: 0, metadata: 0 } },
      rawLinkUnion: 1,
      normalizedUrlUnionBeforeHttps: 1,
      collisions: 0,
    },
    sources: {
      app: emptyCount,
      github: { input: 1, accepted: 1, rejected: { url: 0, http: 0, metadata: 0 } },
      collisions: 0,
    },
  },
};
const bytes = new TextEncoder().encode(JSON.stringify(snapshot) + '\n');
const digest = async (value: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', value))]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
const jsonResponse = (value: BodyInit) =>
  new Response(value, { headers: { 'content-type': 'application/json' } });

describe('content directory remote refresh', () => {
  beforeEach(() => localStorage.clear());

  it('accepts a fresh hash/source-bound snapshot and records the rollback floor', async () => {
    const artifactSha256 = await digest(bytes);
    const manifest = {
      schema: 'wrn.content-directory-refresh.v1',
      sequence: 7,
      observedAt: snapshot.observedAt,
      artifactPath: `snapshots/directory-7-${artifactSha256}.json`,
      artifactSha256,
      source: {
        repository: 'https://github.com/Blackfront161/Revolution-News-Data',
        commit: snapshot.sourceCommit,
        newsPath: 'news-feed.json',
        sourcesPath: 'sources-registry.json',
      },
    };
    const request = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(JSON.stringify(manifest)))
      .mockResolvedValueOnce(jsonResponse(bytes));
    const result = await loadContentDirectoryWithRefresh({
      bundled: snapshot,
      endpoint: contentDirectoryManifestUrl,
      signal: new AbortController().signal,
      fetchImpl: request,
      storage: localStorage,
      now: Date.parse('2026-09-21T00:00:00.000Z'),
    });
    expect(result.source).toBe('remote');
    expect(result.sequence).toBe(7);
    expect(result.projection.articles).toHaveLength(1);
    expect(request).toHaveBeenNthCalledWith(
      2,
      new URL(`https://solinaridao.com/wrn-content-directory/${manifest.artifactPath}`),
      expect.objectContaining({ credentials: 'omit', redirect: 'error' }),
    );
    expect(JSON.parse(localStorage.getItem(contentDirectorySequenceStorageKey)!)).toEqual({
      sequence: 7,
      sha256: artifactSha256,
    });
  });

  it('falls back without fetching an artifact for stale, rollback or wrong endpoints', async () => {
    localStorage.setItem(
      contentDirectorySequenceStorageKey,
      JSON.stringify({ sequence: 8, sha256: 'a'.repeat(64) }),
    );
    const artifactSha256 = await digest(bytes);
    const manifest = {
      schema: 'wrn.content-directory-refresh.v1',
      sequence: 7,
      observedAt: snapshot.observedAt,
      artifactPath: `snapshots/directory-7-${artifactSha256}.json`,
      artifactSha256,
      source: {
        repository: 'https://github.com/Blackfront161/Revolution-News-Data',
        commit: snapshot.sourceCommit,
        newsPath: 'news-feed.json',
        sourcesPath: 'sources-registry.json',
      },
    };
    const request = vi.fn().mockResolvedValue(jsonResponse(JSON.stringify(manifest)));
    const rollback = await loadContentDirectoryWithRefresh({
      bundled: snapshot,
      endpoint: contentDirectoryManifestUrl,
      signal: new AbortController().signal,
      fetchImpl: request,
      storage: localStorage,
      now: Date.parse('2026-09-21T00:00:00.000Z'),
    });
    expect(rollback.source).toBe('bundled');
    expect(request).toHaveBeenCalledOnce();
    const wrongEndpoint = await loadContentDirectoryWithRefresh({
      bundled: snapshot,
      endpoint: 'https://example.invalid/current.json',
      signal: new AbortController().signal,
      fetchImpl: request,
    });
    expect(wrongEndpoint.source).toBe('bundled');
    expect(request).toHaveBeenCalledOnce();
  });

  it('rejects a tampered artifact and never advances its sequence', async () => {
    const artifactSha256 = await digest(bytes);
    const manifest = {
      schema: 'wrn.content-directory-refresh.v1',
      sequence: 7,
      observedAt: snapshot.observedAt,
      artifactPath: `snapshots/directory-7-${artifactSha256}.json`,
      artifactSha256,
      source: {
        repository: 'https://github.com/Blackfront161/Revolution-News-Data',
        commit: snapshot.sourceCommit,
        newsPath: 'news-feed.json',
        sourcesPath: 'sources-registry.json',
      },
    };
    const tampered = new Uint8Array(bytes);
    tampered[tampered.length - 2] ^= 1;
    const request = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(JSON.stringify(manifest)))
      .mockResolvedValueOnce(jsonResponse(tampered));
    const result = await loadContentDirectoryWithRefresh({
      bundled: snapshot,
      endpoint: contentDirectoryManifestUrl,
      signal: new AbortController().signal,
      fetchImpl: request,
      storage: localStorage,
      now: Date.parse('2026-09-21T00:00:00.000Z'),
    });
    expect(result.source).toBe('bundled');
    expect(localStorage.getItem(contentDirectorySequenceStorageKey)).toBeNull();
  });

  it('returns the validated bundle when an online request never responds', async () => {
    vi.useFakeTimers();
    try {
      let markRequested!: () => void;
      const requested = new Promise<void>((resolve) => {
        markRequested = resolve;
      });
      const request = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
        markRequested();
        return new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          ),
        );
      });
      const pending = loadContentDirectoryWithRefresh({
        bundled: snapshot,
        endpoint: contentDirectoryManifestUrl,
        signal: new AbortController().signal,
        fetchImpl: request,
      });
      await requested;
      await vi.advanceTimersByTimeAsync(8_000);
      await expect(pending).resolves.toMatchObject({ source: 'bundled', sequence: null });
      expect(request).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
