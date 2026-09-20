import { describe, expect, it } from 'vitest';
import {
  validateMobileContentDirectory,
  projectMobileContentDirectory,
  normaliseDirectoryUrl,
  type MobileContentDirectory,
} from './mobile-content-directory-v1.js';
const aid = 'news-' + '1'.repeat(64),
  sid = 'source-' + '2'.repeat(64),
  sportId = 'sport-' + '3'.repeat(64);
const at = '2026-09-09T04:37:14.725Z';
function document(): MobileContentDirectory {
  const provenance = {
    dataset: 'github' as const,
    repo: 'https://github.com/Blackfront161/Revolution-News-Data',
    commit: 'a'.repeat(40),
    inputSHA256: 'b'.repeat(64),
    observedAt: at,
    sourceDate: at,
    row: 0,
  };
  const observation = {
    provenance: { ...provenance, path: 'news-feed.json' },
    rawUrl: 'https://example.com/news',
    title: 'News',
    sourceName: 'Publisher',
    language: 'en',
    rawLanguage: 'en',
    publishedAt: at,
    rawPublishedAt: at,
    topics: ['Sport'],
    sourceHomepage: 'https://example.com/',
  };
  const count = () => ({ input: 1, accepted: 1, rejected: { url: 0, http: 0, metadata: 0 } });
  const empty = () => ({ input: 0, accepted: 0, rejected: { url: 0, http: 0, metadata: 0 } });
  return {
    schema: 'wrn.mobile-content-directory.v1',
    version: 1,
    sourceCommit: provenance.commit,
    observedAt: at,
    rights: 'metadata-and-links',
    articles: [
      {
        id: aid,
        url: observation.rawUrl,
        title: observation.title,
        sourceName: observation.sourceName,
        language: 'en',
        publishedAt: at,
        topics: ['Sport'],
        historical: false,
        endpointIds: [sid],
        observations: [observation],
      },
    ],
    sources: [
      {
        id: sid,
        url: 'http://example.com/feed',
        name: 'Publisher',
        languages: ['en'],
        mediaType: 'news',
        historicalHttp: true,
        accessNote: 'insecure-url',
        observations: [
          {
            provenance: { ...provenance, path: 'sources-registry.json' },
            rawUrl: 'http://example.com/feed',
            name: 'Publisher',
            languages: ['en'],
            mediaType: 'news',
            status: 'active',
            active: true,
            homepage: 'https://example.com/',
            topics: [],
            originRegion: null,
            originCountry: null,
          },
        ],
      },
    ],
    sports: [
      {
        id: sportId,
        title: 'News',
        url: observation.rawUrl,
        publisher: 'Publisher',
        author: 'Author',
        publishedAt: '2026-09-09',
        category: 'football',
        noteDe: 'Eigener Hinweis.',
        noteEn: 'Own reading note.',
        rights: 'wrn-editorial-reading-note',
        observedAt: at,
        sourceHomepage: 'https://example.com/',
        articleId: aid,
        endpointIds: [sid],
      },
    ],
    withdrawals: { articleIds: [], endpointIds: [] },
    reconciliation: {
      news: {
        app: empty(),
        github: count(),
        rawLinkUnion: 1,
        normalizedUrlUnionBeforeHttps: 1,
        collisions: 0,
      },
      sources: { app: empty(), github: count(), collisions: 0 },
    },
  };
}
describe('directory contract', () => {
  it('accepts attributed metadata and preserves a nonclickable HTTP endpoint', () =>
    expect(validateMobileContentDirectory(document())).toBe(true));
  it.each([
    ['unknown top field', (d: MobileContentDirectory) => Object.assign(d, { body: 'copied' })],
    [
      'unknown article content',
      (d: MobileContentDirectory) => Object.assign(d.articles[0]!, { content: 'copied' }),
    ],
    [
      'unknown image',
      (d: MobileContentDirectory) =>
        Object.assign(d.sources[0]!, { image: 'https://example.com/a.png' }),
    ],
    [
      'unknown observation',
      (d: MobileContentDirectory) =>
        Object.assign(d.articles[0]!.observations[0]!, { body: 'copied' }),
    ],
    [
      'missing provenance hash',
      (d: MobileContentDirectory) => {
        d.articles[0]!.observations[0]!.provenance.inputSHA256 = '';
      },
    ],
    [
      'bad commit',
      (d: MobileContentDirectory) => {
        d.sourceCommit = 'latest';
      },
    ],
    [
      'bad date',
      (d: MobileContentDirectory) => {
        d.observedAt = '2026-02-30T00:00:00.000Z';
      },
    ],
    [
      'bad language',
      (d: MobileContentDirectory) => {
        d.articles[0]!.observations[0]!.language = 'whatever';
      },
    ],
    [
      'missing HTTP reason',
      (d: MobileContentDirectory) => {
        d.sources[0]!.accessNote = null;
      },
    ],
    [
      'missing note rights',
      (d: MobileContentDirectory) => Object.assign(d.sports[0]!, { rights: 'metadata-and-links' }),
    ],
    [
      'invalid sport date',
      (d: MobileContentDirectory) => {
        d.sports[0]!.publishedAt = '2026-02-30';
      },
    ],
    [
      'short ID',
      (d: MobileContentDirectory) => {
        d.articles[0]!.id = 'news-one';
      },
    ],
    [
      'unknown withdrawal',
      (d: MobileContentDirectory) => {
        d.withdrawals.articleIds = ['news-' + '9'.repeat(64)];
      },
    ],
    [
      'duplicate withdrawal',
      (d: MobileContentDirectory) => {
        d.withdrawals.endpointIds = [sid, sid];
      },
    ],
    [
      'withdrawal cap',
      (d: MobileContentDirectory) => {
        d.withdrawals.articleIds = Array(101).fill(aid);
      },
    ],
    [
      'duplicate article',
      (d: MobileContentDirectory) => {
        d.articles.push(structuredClone(d.articles[0]!));
      },
    ],
    [
      'title too long',
      (d: MobileContentDirectory) => {
        d.articles[0]!.title = 'a'.repeat(501);
      },
    ],
    [
      'HTML note',
      (d: MobileContentDirectory) => {
        d.sports[0]!.noteEn = '<b>note</b>';
      },
    ],
    [
      'control note',
      (d: MobileContentDirectory) => {
        d.sports[0]!.noteEn = 'note\u007f';
      },
    ],
    [
      'topic cap',
      (d: MobileContentDirectory) => {
        d.articles[0]!.observations[0]!.topics = Array(101).fill('topic');
      },
    ],
    [
      'missing endpoint ref',
      (d: MobileContentDirectory) => {
        d.articles[0]!.endpointIds = [];
      },
    ],
    [
      'wrong sport relationship',
      (d: MobileContentDirectory) => {
        d.sports[0]!.articleId = null;
      },
    ],
    [
      'wrong reconciliation',
      (d: MobileContentDirectory) => {
        d.reconciliation.news.github.input = 10;
      },
    ],
    [
      'row beyond input',
      (d: MobileContentDirectory) => {
        d.sources[0]!.observations[0]!.provenance.row = 2;
      },
    ],
    [
      'altered display metadata',
      (d: MobileContentDirectory) => {
        d.sources[0]!.name = 'Unobserved name';
      },
    ],
  ])('rejects %s', (_label, mutate) => {
    const d = document();
    mutate(d);
    expect(validateMobileContentDirectory(d)).toBe(false);
  });
  it.each([
    'http://example.com/news',
    'https://user:pass@example.com/news',
    'https://127.0.0.1/a',
    'https://[::1]/a',
    'https://2130706433/a',
    'https://localhost/a',
    'https://x.localhost/a',
    'https://a.local/a',
    'https://a.internal/a',
    'https://home.arpa/a',
    'https://a.home.arpa/a',
    ' https://example.com/a',
    'https://example.com/a b',
    'https://example.com/\n',
    'https:/example.com/a',
    'javascript:alert(1)',
  ])('rejects unsafe news URL %s', (url) =>
    expect(normaliseDirectoryUrl(url, { news: true })).toBeNull(),
  );
  it('cascades endpoint and article withdrawals through linked and standalone sport notes', () => {
    const d = document();
    d.sports.push({
      ...d.sports[0]!,
      id: 'sport-' + '4'.repeat(64),
      url: 'https://example.com/extra',
      articleId: null,
    });
    expect(validateMobileContentDirectory(d)).toBe(true);
    d.withdrawals.endpointIds = [sid];
    expect(validateMobileContentDirectory(d)).toBe(true);
    expect(projectMobileContentDirectory(d)).toMatchObject({
      sources: [],
      articles: [],
      sports: [],
    });
    d.withdrawals = { endpointIds: [], articleIds: [aid] };
    expect(projectMobileContentDirectory(d).sports.map((s) => s.articleId)).toEqual([null]);
    expect(projectMobileContentDirectory(d).sources).toHaveLength(1);
    expect(d.articles).toHaveLength(1);
  });
  it('rejects cyclic input and runtime bytes over 3 MiB', () => {
    const d = document();
    Object.assign(d, { extra: 'x'.repeat(3 * 1024 * 1024) });
    expect(validateMobileContentDirectory(d)).toBe(false);
    Object.assign(d, { extra: d });
    expect(validateMobileContentDirectory(d)).toBe(false);
  });
});
