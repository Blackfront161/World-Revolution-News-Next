import { describe, expect, it } from 'vitest';

import type {
  ArchiveLifecycleValidationResult,
  LocalArchiveLifecycleV1,
} from '@wrn/content-contracts';
import { isLocalReadingStateV1 as contractReadingStateValidator } from '@wrn/content-contracts';

import {
  clearAllLocalReadingData,
  clearLocalReadMarkers,
  clearLocalSavedArticles,
  createEmptyLocalReadingState,
  isLocalReadingStateV1,
  markLocalArticleRead,
  markLocalArticleUnread,
  migrateLegacyLocalReadingState,
  reconcileLocalReadingState,
  removeLocalReadingArticle,
  resetLocalReadingProgress,
  saveLocalReadingArticle,
  updateLocalReadingProgress,
  type LocalReadingStateV1,
} from '../src/index.js';

const alpha = 'wrn-test-art-g3-008-active';
const historical = 'wrn-test-art-g3-008-historical';
const oldHistorical = 'wrn-test-art-g3-008-old-historical';
const gone = 'wrn-test-art-g3-008-gone';
const revoked = 'wrn-test-art-g3-008-revoked';
const unknown = 'wrn-test-art-g3-008-unknown';

const lifecycle = {
  contractVersion: '1.0.0',
  schema: 'wrn.local-archive-lifecycle.v1',
  revision: 'test-lifecycle',
  sourceContent: {
    articlePayloadSha256: 'a'.repeat(64),
    readerDetailsRevision: 'test-reader',
    readerDetailsIntegritySha256: 'b'.repeat(64),
  },
  activeArticleIds: [alpha],
  archiveArticleIds: [alpha, historical],
  shareableArticleIds: [alpha, historical],
  aliases: [
    { sourceId: oldHistorical, targetId: historical },
    { sourceId: revoked, targetId: historical },
  ],
  gone: [{ id: gone, category: 'removed' }],
  revocations: {
    revision: 2,
    previousRevision: 1,
    entries: [{ id: revoked, status: 'blocked', category: 'rights-or-safety' }],
  },
  integritySha256: 'c'.repeat(64),
} as const satisfies LocalArchiveLifecycleV1;

const lifecycleValidation = {
  ok: true,
  errors: [],
  archiveArticleIds: lifecycle.archiveArticleIds,
  revocationRevision: lifecycle.revocations.revision,
} as const satisfies ArchiveLifecycleValidationResult;

describe('WRN-G3-011 local reading-state domain', () => {
  it('exposes the existing V1 validator and required state type through the public domain boundary', () => {
    const state: LocalReadingStateV1 = createEmptyLocalReadingState();
    expect(isLocalReadingStateV1).toBe(contractReadingStateValidator);
    expect(isLocalReadingStateV1(state)).toBe(true);
  });

  it('keeps save, read and progress independent and deterministic', () => {
    const saved = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      alpha,
      '2026-08-26T08:00:00.000Z',
    );
    const progressed = updateLocalReadingProgress(saved, alpha, 0.42, '2026-08-26T08:01:00.000Z');
    const read = markLocalArticleRead(progressed, alpha, '2026-08-26T08:02:00.000Z');
    const removed = removeLocalReadingArticle(read, alpha);

    expect(removed.entries).toEqual([
      {
        articleId: alpha,
        readAt: '2026-08-26T08:02:00.000Z',
        progress: { fraction: 0.42, updatedAt: '2026-08-26T08:01:00.000Z' },
      },
    ]);
    expect(markLocalArticleUnread(removed, alpha).entries).toEqual([
      {
        articleId: alpha,
        progress: { fraction: 0.42, updatedAt: '2026-08-26T08:01:00.000Z' },
      },
    ]);
  });

  it('keeps production and traversal IDs outside the fixture-v1 state', () => {
    const state = createEmptyLocalReadingState();
    expect(
      saveLocalReadingArticle(
        state,
        'wrn-art-0123456789abcdef0123456789abcdef',
        '2026-08-26T08:00:00.000Z',
      ),
    ).toBe(state);
    expect(
      saveLocalReadingArticle(state, '../wrn-test-art-alpha', '2026-08-26T08:00:00.000Z'),
    ).toBe(state);
  });

  it('normalizes finite progress and handles minimum and read thresholds centrally', () => {
    const start = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      alpha,
      '2026-08-26T08:00:00.000Z',
    );
    const belowMinimum = updateLocalReadingProgress(
      start,
      alpha,
      0.001,
      '2026-08-26T08:01:00.000Z',
    );
    expect(belowMinimum.entries[0]).toEqual({
      articleId: alpha,
      savedAt: '2026-08-26T08:00:00.000Z',
    });

    const atEnd = updateLocalReadingProgress(belowMinimum, alpha, 2, '2026-08-26T08:02:00.000Z');
    expect(atEnd.entries[0]).toEqual({
      articleId: alpha,
      savedAt: '2026-08-26T08:00:00.000Z',
      readAt: '2026-08-26T08:02:00.000Z',
      progress: { fraction: 1, updatedAt: '2026-08-26T08:02:00.000Z' },
    });
    expect(updateLocalReadingProgress(atEnd, alpha, Number.NaN, '2026-08-26T08:03:00.000Z')).toBe(
      atEnd,
    );
    expect(resetLocalReadingProgress(atEnd, alpha).entries[0]).toEqual({
      articleId: alpha,
      savedAt: '2026-08-26T08:00:00.000Z',
      readAt: '2026-08-26T08:02:00.000Z',
    });
  });

  it('clears only the requested reading-state scope', () => {
    const start = markLocalArticleRead(
      saveLocalReadingArticle(createEmptyLocalReadingState(), alpha, '2026-08-26T08:00:00.000Z'),
      historical,
      '2026-08-26T08:01:00.000Z',
    );
    expect(clearLocalSavedArticles(start).entries).toEqual([
      { articleId: historical, readAt: '2026-08-26T08:01:00.000Z' },
    ]);
    expect(clearLocalReadMarkers(start).entries).toEqual([
      { articleId: alpha, savedAt: '2026-08-26T08:00:00.000Z' },
    ]);
    expect(clearAllLocalReadingData(start).entries).toEqual([]);
  });

  it('canonicalizes aliases but keeps unavailable safe IDs payload-free and removable', () => {
    let state = createEmptyLocalReadingState();
    for (const articleId of [oldHistorical, gone, revoked, unknown]) {
      state = saveLocalReadingArticle(state, articleId, '2026-08-26T08:00:00.000Z');
    }
    const result = reconcileLocalReadingState({ state, lifecycle, lifecycleValidation });
    expect(result.kind).toBe('ready');
    expect(result.state.entries.map((entry) => entry.articleId)).toEqual([
      gone,
      historical,
      revoked,
      unknown,
    ]);
    expect(result.unavailableArticleIds).toEqual([gone, revoked, unknown]);
    expect(
      result.state.entries.every((entry) => Object.keys(entry).every((key) => key !== 'title')),
    ).toBe(true);
  });

  it('migrates only explicit mappings, keeps unknown IDs payload-free and is idempotent', () => {
    const existing = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      alpha,
      '2026-08-26T09:00:00.000Z',
    );
    const input = {
      legacy: {
        identityMap: [
          { legacyKey: 'legacy://alpha', articleId: alpha },
          { legacyKey: 'legacy://old', articleId: oldHistorical },
          { legacyKey: 'legacy://unknown', articleId: unknown },
        ],
        bookmarks: [
          { key: 'legacy://alpha', savedAt: '2026-08-26T08:00:00.000Z' },
          { key: 'legacy://old', savedAt: '2026-08-26T08:00:00.000Z' },
          { key: 'legacy://unknown', savedAt: '2026-08-26T08:00:00.000Z' },
          { key: 'legacy://unmapped', savedAt: '2026-08-26T08:00:00.000Z' },
        ],
        readList: [{ key: 'legacy://old', readAt: '2026-08-26T08:01:00.000Z' }],
        positions: [
          { key: 'legacy://alpha', fraction: 0.75, updatedAt: '2026-08-26T08:02:00.000Z' },
        ],
      },
      existingState: existing,
      lifecycle,
      lifecycleValidation,
    } as const;
    const first = migrateLegacyLocalReadingState(input);
    const second = migrateLegacyLocalReadingState({ ...input, existingState: first.state });

    expect(first.kind).toBe('ready');
    expect(first.state).toEqual(second.state);
    expect(first.unmappedLegacyKeyCount).toBe(1);
    expect(first.unavailableArticleIds).toEqual([unknown]);
    expect(first.state.entries.find((entry) => entry.articleId === alpha)?.savedAt).toBe(
      '2026-08-26T09:00:00.000Z',
    );
    expect(JSON.stringify(first.state)).not.toContain('legacy://');
  });

  it('fails closed without changing V1 data when the lifecycle binding is stale', () => {
    const existing = saveLocalReadingArticle(
      createEmptyLocalReadingState(),
      alpha,
      '2026-08-26T08:00:00.000Z',
    );
    const result = migrateLegacyLocalReadingState({
      legacy: { identityMap: [], bookmarks: [], readList: [], positions: [] },
      existingState: existing,
      lifecycle,
      lifecycleValidation: { ...lifecycleValidation, revocationRevision: 1 },
    });
    expect(result).toMatchObject({ kind: 'invalid', state: existing });
  });
});
