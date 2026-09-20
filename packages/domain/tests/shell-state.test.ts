import { describe, expect, it } from 'vitest';

import {
  createFeedStatusState,
  createDiscoverFacets,
  createReadyFeedState,
  displayOriginalLanguage,
  emptyDiscoverCriteria,
  feedStates,
  filterDiscoverArticles,
  getNavigationTarget,
  hasActiveDiscoverCriteria,
  hasResolvedShellState,
  isRecoverableShellState,
  isShellState,
  mobilePrimaryNavigationIds,
  normalizeDiscoverQuery,
  navigationTargetIds,
  parseShellState,
  parseNavigationTargetId,
  resolveNavigationTarget,
  createReaderLoadingState,
  archiveLifecycleResolutionKinds,
  createCanonicalArticleShareUrl,
  createLocalArchiveProjection,
  readerStateKinds,
  resolveLocalReaderState,
  resolveLocalArchiveLifecycle,
  shellStates,
  websiteCompactNavigationIds,
  websiteExpandedNavigationIds,
} from '../src/index.js';

const article = {
  id: 'wrn-test-art-alpha',
  title: 'Lokale Testmeldung Alpha',
  teaser: 'Diese selbst erstellte Testmeldung dient ausschliesslich der lokalen Darstellung.',
  publishedAt: '2026-08-23T10:00:00.000Z',
  originalUrl: 'https://fixture.invalid/articles/alpha',
  source: { id: 'wrn-test-source-local', name: 'Lokale Testquelle' },
  originalLanguage: 'und',
  tags: ['lokal'],
  rights: { status: 'fixture-authored', reference: 'wrn-g3-002-fixture' },
  transformation: { status: 'unknown' as const, reference: 'not-provided' },
  translation: { status: 'unknown' as const, reference: 'not-provided' },
};

const discoverArticles = [
  {
    ...article,
    id: 'wrn-test-art-alpha',
    title: 'Lokale Nachricht Europa',
    teaser: 'Eine lokale Testmeldung fuer Thema.',
  },
  {
    ...article,
    id: 'wrn-test-art-beta',
    title: 'Local analysis',
    teaser: 'A local fixture for technology.',
    originalLanguage: 'en',
  },
  {
    ...article,
    id: 'wrn-test-art-gamma',
    title: 'Nota local',
    teaser: 'Una prueba local para noticias.',
    originalLanguage: 'es',
  },
] as const;
const discoverIndex = {
  contractVersion: '1.0.0',
  schema: 'wrn.local-discover-index.v1',
  revision: 'test-index-v1',
  integritySha256: '0'.repeat(64),
  entries: [
    { articleId: 'wrn-test-art-alpha', region: 'Europa', topics: ['Lokales'], format: 'news' },
    {
      articleId: 'wrn-test-art-beta',
      region: 'Nordamerika',
      topics: ['Technologie'],
      format: 'analysis',
    },
    {
      articleId: 'wrn-test-art-gamma',
      region: 'Lateinamerika',
      topics: ['Lokales'],
      format: 'commentary',
    },
  ],
} as const;

describe('ShellState', () => {
  it('exports the complete, stable Foundation state set', () => {
    expect(shellStates).toEqual(['ready', 'loading', 'error', 'offline']);
  });

  it('accepts only exact supported string values', () => {
    for (const state of shellStates) {
      expect(isShellState(state)).toBe(true);
      expect(parseShellState(state)).toBe(state);
    }

    expect(isShellState('READY')).toBe(false);
    expect(isShellState(' loading ')).toBe(false);
    expect(isShellState(null)).toBe(false);
    expect(isShellState({ state: 'ready' })).toBe(false);
  });

  it('fails closed to null for unsupported values without coercion', () => {
    expect(parseShellState('unknown')).toBeNull();
    expect(parseShellState('READY')).toBeNull();
    expect(parseShellState(1)).toBeNull();
    expect(parseShellState(undefined)).toBeNull();
  });

  it('classifies recovery and resolution deterministically', () => {
    expect(isRecoverableShellState('error')).toBe(true);
    expect(isRecoverableShellState('offline')).toBe(true);
    expect(isRecoverableShellState('ready')).toBe(false);
    expect(hasResolvedShellState('loading')).toBe(false);
    expect(hasResolvedShellState('ready')).toBe(true);
    expect(hasResolvedShellState('error')).toBe(true);
    expect(hasResolvedShellState('offline')).toBe(true);
  });
});

describe('FeedState', () => {
  it('exposes and constructs all six deterministic feed states', () => {
    expect(feedStates).toEqual([
      'loading',
      'empty',
      'error',
      'offline',
      'optional-absent',
      'ready',
    ]);

    for (const state of feedStates.filter((state) => state !== 'ready')) {
      expect(createFeedStatusState(state, `Lokaler Testzustand: ${state}`)).toEqual({
        kind: state,
        message: `Lokaler Testzustand: ${state}`,
      });
    }
  });

  it('binds the ready state to the exact active manifest IDs', () => {
    const state = createReadyFeedState(
      {
        revision: 'wrn-g3-002-fixture-v1',
        articleSets: {
          activeFeedIds: ['wrn-test-art-alpha'],
          archiveIds: ['wrn-test-art-alpha'],
          landingIds: [],
          redirectSourceIds: [],
          sitemapArticleIds: [],
        },
      },
      [article],
    );

    expect(state).toMatchObject({
      kind: 'ready',
      manifestRevision: 'wrn-g3-002-fixture-v1',
      articleIds: ['wrn-test-art-alpha'],
      articles: [{ sourceName: 'Lokale Testquelle', originalLanguage: 'und' }],
    });
    expect(() =>
      createReadyFeedState(
        {
          revision: 'wrn-g3-002-fixture-v1',
          articleSets: {
            activeFeedIds: ['wrn-test-art-missing'],
            archiveIds: ['wrn-test-art-alpha'],
            landingIds: [],
            redirectSourceIds: [],
            sitemapArticleIds: [],
          },
        },
        [article],
      ),
    ).toThrow('Ready-Feed weicht');
  });
});

describe('Navigation target contract', () => {
  it('exports unique stable IDs and the required client projections', () => {
    expect(new Set(navigationTargetIds).size).toBe(navigationTargetIds.length);
    expect(mobilePrimaryNavigationIds).toEqual(['home', 'following', 'discover', 'media', 'saved']);
    expect(websiteCompactNavigationIds).toEqual(['home', 'discover', 'media', 'saved', 'more']);
    expect(websiteExpandedNavigationIds).toEqual([
      'home',
      'discover',
      'media',
      'events',
      'knowledge',
      'solidarity',
      'saved',
      'more',
    ]);
  });

  it('parses only registered IDs and fails closed to Start for unknown local targets', () => {
    expect(parseNavigationTargetId('discover')).toBe('discover');
    expect(parseNavigationTargetId('Discover')).toBeNull();
    expect(parseNavigationTargetId('reader')).toBeNull();
    expect(parseNavigationTargetId('__proto__')).toBeNull();
    expect(parseNavigationTargetId('constructor')).toBeNull();
    expect(parseNavigationTargetId('toString')).toBeNull();
    expect(parseNavigationTargetId(null)).toBeNull();
    expect(resolveNavigationTarget('not-migrated')).toBe('home');
    expect(resolveNavigationTarget('__proto__')).toBe('home');
    expect(resolveNavigationTarget('constructor')).toBe('home');
    expect(resolveNavigationTarget('toString')).toBe('home');
    expect(getNavigationTarget('following')).toMatchObject({
      label: 'Für mich',
      laterSlice: 'spaetere lokale Personalisierung',
    });
  });
});

describe('local discover domain', () => {
  it('normalizes deterministic Unicode whitespace and keeps substring multi-term AND semantics', () => {
    expect(normalizeDiscoverQuery('  LOCAL\u3000fixture  ')).toEqual(['local', 'fixture']);
    expect(
      filterDiscoverArticles(discoverArticles, discoverIndex, { query: 'loca tech' }).articles,
    ).toEqual([expect.objectContaining({ id: 'wrn-test-art-beta' })]);
  });

  it('combines a single value from each facet while retaining article order', () => {
    expect(
      filterDiscoverArticles(discoverArticles, discoverIndex, {
        region: 'Europa',
        topic: 'Lokales',
        source: 'Lokale Testquelle',
        originalLanguage: 'und',
        format: 'news',
      }).articles.map((entry) => entry.id),
    ).toEqual(['wrn-test-art-alpha']);
    expect(
      filterDiscoverArticles(discoverArticles, discoverIndex, { format: 'interview' }).articles,
    ).toEqual([]);
  });

  it('keeps empty criteria explicit and shows unknown language without inventing it', () => {
    expect(hasActiveDiscoverCriteria(emptyDiscoverCriteria)).toBe(false);
    expect(hasActiveDiscoverCriteria({ ...emptyDiscoverCriteria, query: 'lokal' })).toBe(true);
    expect(displayOriginalLanguage('und')).toBe('Unbekannt');
  });

  it('fails facets closed for an equally large but foreign article ID set', () => {
    expect(() =>
      createDiscoverFacets(
        [...discoverArticles.slice(0, 2), { ...discoverArticles[2], id: 'wrn-test-art-foreign' }],
        discoverIndex,
      ),
    ).toThrow('vollstaendigen validierten Index');
  });
});

describe('local reader domain', () => {
  const readerDetails = {
    contractVersion: '1.0.0',
    schema: 'wrn.local-reader-details.v1',
    revision: 'wrn-g3-006-reader-details-test-v1',
    entries: [
      {
        articleId: 'wrn-test-art-alpha',
        blocks: [{ kind: 'paragraph', text: 'Vollstaendiger lokaler Readertext.' }],
      },
    ],
    integritySha256: 'a'.repeat(64),
  } as const;
  const validDetails = { ok: true, errors: [], articleIds: ['wrn-test-art-alpha'] } as const;

  it('returns an explicit loading state without invented content', () => {
    expect(readerStateKinds).toEqual(['loading', 'ready', 'not-found', 'error']);
    expect(createReaderLoadingState()).toEqual({
      kind: 'loading',
      message: 'Lokaler Artikel wird validiert.',
    });
  });

  it('projects the existing article metadata together with only its validated local blocks', () => {
    const state = resolveLocalReaderState({
      requestedArticleId: 'wrn-test-art-alpha',
      articles: [article],
      details: readerDetails,
      detailsValidation: validDetails,
      offline: true,
    });

    expect(state).toMatchObject({
      kind: 'ready',
      article: {
        id: article.id,
        source: article.source,
        publishedAt: article.publishedAt,
        originalLanguage: article.originalLanguage,
        tags: article.tags,
      },
      detail: { articleId: article.id, blocks: [{ kind: 'paragraph' }] },
      isOffline: true,
    });
  });

  it('fails closed for invalid validation or an altered detail ID set and never uses the teaser', () => {
    expect(
      resolveLocalReaderState({
        requestedArticleId: article.id,
        articles: [article],
        details: readerDetails,
        detailsValidation: { ok: false, errors: ['Hashabweichung'], articleIds: [] },
        offline: false,
      }),
    ).toMatchObject({ kind: 'error' });
    expect(
      resolveLocalReaderState({
        requestedArticleId: article.id,
        articles: [article],
        details: { ...readerDetails, entries: [] },
        detailsValidation: validDetails,
        offline: false,
      }),
    ).toMatchObject({ kind: 'error' });
  });

  it('fails closed when positive validation IDs are missing, foreign, duplicate or stale', () => {
    const staleValidationIdSets = [
      [],
      ['wrn-test-art-foreign'],
      ['wrn-test-art-alpha', 'wrn-test-art-alpha'],
    ] as const;

    for (const articleIds of staleValidationIdSets) {
      expect(
        resolveLocalReaderState({
          requestedArticleId: article.id,
          articles: [article],
          details: readerDetails,
          detailsValidation: { ok: true, errors: [], articleIds },
          offline: false,
        }),
      ).toEqual({
        kind: 'error',
        message: 'Der lokale Artikelinhalt konnte nicht sicher validiert werden.',
      });
    }
  });

  it('does not treat invalid or unknown IDs as content', () => {
    for (const requestedArticleId of ['', null, 'wrn-test-art-unknown']) {
      expect(
        resolveLocalReaderState({
          requestedArticleId,
          articles: [article],
          details: readerDetails,
          detailsValidation: validDetails,
          offline: false,
        }),
      ).toEqual({
        kind: 'not-found',
        message: 'Der angeforderte Artikel wurde nicht gefunden.',
      });
    }
  });
});

describe('WRN-G3-008 local archive lifecycle domain', () => {
  const archiveArticle = {
    ...article,
    id: 'wrn-test-art-g3-008-historical',
    publishedAt: '2024-04-18T14:30:00.000Z',
  } as const;
  const lifecycle = {
    contractVersion: '1.0.0',
    schema: 'wrn.local-archive-lifecycle.v1',
    revision: 'wrn-g3-008-domain-test-v1',
    sourceContent: {
      articlePayloadSha256: 'a'.repeat(64),
      readerDetailsRevision: 'reader-v1',
      readerDetailsIntegritySha256: 'b'.repeat(64),
    },
    activeArticleIds: ['wrn-test-art-alpha'],
    archiveArticleIds: ['wrn-test-art-alpha', 'wrn-test-art-g3-008-historical'],
    shareableArticleIds: ['wrn-test-art-alpha', 'wrn-test-art-g3-008-historical'],
    aliases: [
      {
        sourceId: 'wrn-test-art-g3-008-old-historical',
        targetId: 'wrn-test-art-g3-008-historical',
      },
      {
        sourceId: 'wrn-test-art-g3-008-revoked',
        targetId: 'wrn-test-art-g3-008-historical',
      },
    ],
    gone: [{ id: 'wrn-test-art-g3-008-gone', category: 'removed' }],
    revocations: {
      revision: 2,
      previousRevision: 1,
      entries: [
        {
          id: 'wrn-test-art-g3-008-revoked',
          status: 'blocked',
          category: 'rights-or-safety',
        },
      ],
    },
    integritySha256: 'c'.repeat(64),
  } as const;
  const validLifecycle = {
    ok: true,
    errors: [],
    archiveArticleIds: lifecycle.archiveArticleIds,
    revocationRevision: lifecycle.revocations.revision,
  } as const;

  it('exposes every explicit lifecycle state and never resolves an unsafe ID as content', () => {
    expect(archiveLifecycleResolutionKinds).toEqual([
      'canonical-active',
      'canonical-archived',
      'redirected',
      'gone',
      'revoked',
      'unknown',
      'invalid',
    ]);
    expect(
      resolveLocalArchiveLifecycle({
        requestedArticleId: 'wrn-test-art-alpha',
        lifecycle,
        lifecycleValidation: validLifecycle,
      }),
    ).toEqual({ kind: 'canonical-active', canonicalId: 'wrn-test-art-alpha' });
    expect(
      resolveLocalArchiveLifecycle({
        requestedArticleId: 'wrn-test-art-g3-008-historical',
        lifecycle,
        lifecycleValidation: validLifecycle,
      }),
    ).toEqual({ kind: 'canonical-archived', canonicalId: 'wrn-test-art-g3-008-historical' });
    expect(
      resolveLocalArchiveLifecycle({
        requestedArticleId: '../wrn-test-art-alpha',
        lifecycle,
        lifecycleValidation: validLifecycle,
      }),
    ).toMatchObject({ kind: 'invalid' });
    expect(
      resolveLocalArchiveLifecycle({
        requestedArticleId: 'wrn-test-art-g3-008-unknown',
        lifecycle,
        lifecycleValidation: validLifecycle,
      }),
    ).toMatchObject({ kind: 'unknown' });
  });

  it('normalizes only a safe alias and lets revocation override a former alias without payload or share', () => {
    const redirected = resolveLocalArchiveLifecycle({
      requestedArticleId: 'wrn-test-art-g3-008-old-historical',
      lifecycle,
      lifecycleValidation: validLifecycle,
    });
    expect(redirected).toEqual({
      kind: 'redirected',
      canonicalId: 'wrn-test-art-g3-008-historical',
    });
    expect(createCanonicalArticleShareUrl(lifecycle, redirected)).toBeNull();

    for (const requestedArticleId of ['wrn-test-art-g3-008-gone', 'wrn-test-art-g3-008-revoked']) {
      const state = resolveLocalArchiveLifecycle({
        requestedArticleId,
        lifecycle,
        lifecycleValidation: validLifecycle,
      });
      expect(state).toMatchObject({
        kind: requestedArticleId.endsWith('gone') ? 'gone' : 'revoked',
      });
      expect(state).not.toHaveProperty('canonicalId');
      expect(state).not.toHaveProperty('article');
      expect(createCanonicalArticleShareUrl(lifecycle, state)).toBeNull();
    }
  });

  it('fails closed before alias, content or share when lifecycle validation is stale', () => {
    const state = resolveLocalArchiveLifecycle({
      requestedArticleId: 'wrn-test-art-alpha',
      lifecycle,
      lifecycleValidation: { ...validLifecycle, revocationRevision: 1 },
    });
    expect(state).toMatchObject({ kind: 'invalid' });
    expect(createCanonicalArticleShareUrl(lifecycle, state)).toBeNull();
  });

  it('projects deterministic canonical archive cards only after an exact validation binding', () => {
    expect(
      createLocalArchiveProjection({
        lifecycle,
        lifecycleValidation: validLifecycle,
        articles: [article, archiveArticle],
      }),
    ).toEqual({
      kind: 'ready',
      articles: [
        expect.objectContaining({ id: 'wrn-test-art-alpha', lifecycle: 'active' }),
        expect.objectContaining({ id: 'wrn-test-art-g3-008-historical', lifecycle: 'historical' }),
      ],
    });
    expect(
      createLocalArchiveProjection({
        lifecycle,
        lifecycleValidation: validLifecycle,
        articles: [article],
      }),
    ).toMatchObject({ kind: 'error', articles: [] });
  });

  it('creates only an exact canonical public share URL', () => {
    const canonical = resolveLocalArchiveLifecycle({
      requestedArticleId: 'wrn-test-art-g3-008-historical',
      lifecycle,
      lifecycleValidation: validLifecycle,
    });
    expect(createCanonicalArticleShareUrl(lifecycle, canonical)).toBe(
      'https://solinaridao.com/articles/wrn-test-art-g3-008-historical/',
    );
  });
});
