import { expect, it } from 'vitest';
import type { DirectoryArticle, DirectorySource } from '@wrn/content-contracts/mobile-content-directory-v1';
import {
  createLocalPersonalizationState,
  emptySourcePreferences,
  projectDirectorySourcePreferences,
  projectPersonalizedDirectoryArticles,
  setSourcePreference,
} from './index.js';

function article(
  id: string,
  topics: string[],
  language: string,
  historical = false,
): DirectoryArticle {
  return {
    id,
    url: `https://example.org/${id}`,
    title: id,
    sourceName: 'Example source',
    language,
    publishedAt: '2026-09-26T12:00:00Z',
    topics,
    historical,
    endpointIds: [],
    observations: [],
  };
}

it('matches explicit dimensions and keeps current directory order without guessing language', () => {
  const state = createLocalPersonalizationState({
    interestIds: ['movement-news'],
    regionIds: ['europe'],
    contentLanguageIds: ['en'],
  });
  expect(state).not.toBeNull();
  const articles = [
    article('first', ['Movement News', 'Europe'], 'en'),
    article('unknown-language', ['Movement News', 'Europe'], 'und'),
    article('other-region', ['Movement News', 'Asia'], 'en'),
    article('other-interest', ['Cyberactivism', 'Europe'], 'en'),
    article('historical', ['Movement News', 'Europe'], 'en', true),
    article('last', ['Movement News', 'Europe'], 'en'),
  ];
  expect(projectPersonalizedDirectoryArticles({ state: state!, articles })).toEqual([
    articles[0],
    articles[5],
  ]);
});

it('uses the declared region labels when interest and language are open', () => {
  const state = createLocalPersonalizationState({
    interestIds: [],
    regionIds: ['latin-america-caribbean'],
    contentLanguageIds: [],
  });
  expect(state).not.toBeNull();
  const articles = [
    article('latin-america', ['Latin America'], 'und'),
    article('north-america', ['North America'], 'en'),
  ];
  expect(projectPersonalizedDirectoryArticles({ state: state!, articles })).toEqual([
    articles[0],
  ]);
});

it('does not infer sport news from unrelated directory topics', () => {
  const state = createLocalPersonalizationState({
    interestIds: ['sport'],
    regionIds: [],
    contentLanguageIds: [],
  });
  expect(state).not.toBeNull();
  expect(
    projectPersonalizedDirectoryArticles({
      state: state!,
      articles: [article('movement', ['Movement News'], 'en')],
    }),
  ).toEqual([]);
});

it('hides legacy articles without endpoint IDs by their recorded source name', () => {
  const effId = `source-${'a'.repeat(64)}`;
  const sources: DirectorySource[] = [{
    id: effId,
    url: 'https://eff.org',
    name: 'EFF',
    languages: ['en'],
    mediaType: null,
    historicalHttp: false,
    accessNote: null,
    observations: [],
  }];
  const preferences = setSourcePreference(emptySourcePreferences(), 'directory', effId, 'hide')!;
  const eff = { ...article('eff', ['Movement News'], 'en'), sourceName: 'EFF' };
  const other = { ...article('other', ['Movement News'], 'en'), sourceName: 'Other' };
  expect(projectDirectorySourcePreferences({ articles: [eff, other], sources, preferences })).toEqual([other]);
});

it('gives hide priority over follow for articles linked to both sources', () => {
  const hideId = `source-${'a'.repeat(64)}`;
  const followId = `source-${'b'.repeat(64)}`;
  const sources: DirectorySource[] = [
    { id: hideId, url: 'https://hidden.example', name: 'Hidden', languages: ['en'], mediaType: null, historicalHttp: false, accessNote: null, observations: [] },
    { id: followId, url: 'https://followed.example', name: 'Followed', languages: ['en'], mediaType: null, historicalHttp: false, accessNote: null, observations: [] },
  ];
  const hidden = setSourcePreference(emptySourcePreferences(), 'directory', hideId, 'hide')!;
  const preferences = setSourcePreference(hidden, 'directory', followId, 'follow')!;
  const both = { ...article('both', ['Movement News'], 'en'), endpointIds: [hideId, followId] };
  const ordinary = article('ordinary', ['Movement News'], 'en');
  const followed = { ...article('followed', ['Movement News'], 'en'), endpointIds: [followId] };
  expect(projectDirectorySourcePreferences({ articles: [ordinary, both, followed], sources, preferences })).toEqual([followed, ordinary]);
  expect(projectDirectorySourcePreferences({ articles: [ordinary, both, followed], sources, preferences, includeHidden: true })).toEqual([followed, ordinary, both]);
});
