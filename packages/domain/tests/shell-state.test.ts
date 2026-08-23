import { describe, expect, it } from 'vitest';

import {
  createFeedStatusState,
  createReadyFeedState,
  feedStates,
  hasResolvedShellState,
  isRecoverableShellState,
  isShellState,
  parseShellState,
  shellStates,
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
