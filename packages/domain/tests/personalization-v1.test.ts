import { describe, expect, it } from 'vitest';
import type { LocalArticle, LocalDiscoverIndexV1 } from '@wrn/content-contracts';

import { createLocalPersonalizationState, projectLocalPersonalizedArticles } from '../src/index.js';

function article(id: string, language: string): LocalArticle {
  return {
    id,
    title: id,
    teaser: id,
    publishedAt: '2026-08-30T12:00:00.000Z',
    originalUrl: `https://example.invalid/${id}`,
    source: { id: 'local-test-source', name: 'Local test source' },
    originalLanguage: language,
    tags: [],
    rights: { status: 'local-test', reference: 'local-fixture://test' },
    transformation: { status: 'original', reference: 'local-fixture://test' },
    translation: { status: 'not-requested', reference: 'local-fixture://test' },
  };
}

function index(entries: LocalDiscoverIndexV1['entries']): LocalDiscoverIndexV1 {
  return {
    contractVersion: '1.0.0',
    schema: 'wrn.local-discover-index.v1',
    revision: 'local-personalization-test',
    entries,
    integritySha256: 'a'.repeat(64),
  };
}

const articles = [
  article('wrn-test-art-personalization-1', 'en'),
  article('wrn-test-art-personalization-2', 'de'),
  article('wrn-test-art-personalization-3', 'en'),
  article('wrn-test-art-personalization-4', 'tr'),
];
const discoverIndex = index([
  { articleId: articles[0]!.id, region: 'Europa', topics: ['Basisarbeit'], format: 'news' },
  { articleId: articles[1]!.id, region: 'Nordamerika', topics: ['Fankultur'], format: 'news' },
  {
    articleId: articles[2]!.id,
    region: 'Lateinamerika',
    topics: ['Sport', 'Frauen'],
    format: 'news',
  },
  {
    articleId: articles[3]!.id,
    region: 'Local test region',
    topics: ['Technologie'],
    format: 'news',
  },
]);

describe('WRN-G3-017 local personalization domain', () => {
  it('creates only a nonempty, canonical V1 selection without a consent or reading-state field', () => {
    const state = createLocalPersonalizationState({
      interestIds: ['sport', 'fan-culture', 'sport'],
      regionIds: ['europe'],
      contentLanguageIds: ['en', 'de'],
    });
    expect(state).toMatchObject({
      interestIds: ['fan-culture', 'sport'],
      regionIds: ['europe'],
      contentLanguageIds: ['de', 'en'],
    });
    expect(
      createLocalPersonalizationState({ interestIds: [], regionIds: [], contentLanguageIds: [] }),
    ).toBeNull();
    expect(
      createLocalPersonalizationState({
        interestIds: ['future-interest'] as never[],
        regionIds: [],
        contentLanguageIds: [],
      }),
    ).toBeNull();
  });

  it('uses OR inside each selection, AND across dimensions and retains input article order', () => {
    const state = createLocalPersonalizationState({
      interestIds: ['movement-news', 'women-feminist'],
      regionIds: ['europe', 'latin-america-caribbean'],
      contentLanguageIds: ['en'],
    })!;
    expect(
      projectLocalPersonalizedArticles({ state, articles, discoverIndex }).map((item) => item.id),
    ).toEqual([articles[0]!.id, articles[2]!.id]);
  });

  it('maps only the bounded local test labels and exact original-language values', () => {
    const regional = createLocalPersonalizationState({
      interestIds: [],
      regionIds: ['north-america'],
      contentLanguageIds: [],
    })!;
    const language = createLocalPersonalizationState({
      interestIds: [],
      regionIds: [],
      contentLanguageIds: ['tr'],
    })!;
    const unmappedRegion = createLocalPersonalizationState({
      interestIds: [],
      regionIds: ['global'],
      contentLanguageIds: [],
    })!;
    expect(projectLocalPersonalizedArticles({ state: regional, articles, discoverIndex })).toEqual([
      articles[1],
    ]);
    expect(projectLocalPersonalizedArticles({ state: language, articles, discoverIndex })).toEqual([
      articles[3],
    ]);
    expect(
      projectLocalPersonalizedArticles({ state: unmappedRegion, articles, discoverIndex }),
    ).toEqual([]);
  });

  it('fails closed when the supplied active local article/index binding is incomplete or duplicate', () => {
    const state = createLocalPersonalizationState({
      interestIds: ['movement-news'],
      regionIds: [],
      contentLanguageIds: [],
    })!;
    expect(
      projectLocalPersonalizedArticles({
        state,
        articles: [articles[0]!, articles[0]!],
        discoverIndex,
      }),
    ).toEqual([]);
    expect(
      projectLocalPersonalizedArticles({ state, articles: [articles[0]!], discoverIndex }),
    ).toEqual([]);
  });
});
