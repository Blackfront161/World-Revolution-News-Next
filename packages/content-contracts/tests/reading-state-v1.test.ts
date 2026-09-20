import { describe, expect, it } from 'vitest';

import {
  localReadingStateContractVersion,
  localReadingStateRevision,
  localReadingStateSchema,
  validateLocalReadingStateV1,
} from '../src/index.js';

function createCandidate() {
  return {
    contractVersion: localReadingStateContractVersion,
    schema: localReadingStateSchema,
    revision: localReadingStateRevision,
    entries: [
      {
        articleId: 'wrn-test-art-g3-008-active',
        savedAt: '2026-08-26T08:00:00.000Z',
        progress: { fraction: 0.42, updatedAt: '2026-08-26T08:01:00.000Z' },
      },
      {
        articleId: 'wrn-test-art-g3-008-historical',
        readAt: '2026-08-26T08:02:00.000Z',
      },
    ],
  } as const;
}

describe('WRN-G3-011 local reading-state v1 contract', () => {
  it('accepts an ID-only, sorted, minimal local state', () => {
    const result = validateLocalReadingStateV1(createCandidate());
    expect(result).toMatchObject({
      ok: true,
      errors: [],
      articleIds: ['wrn-test-art-g3-008-active', 'wrn-test-art-g3-008-historical'],
    });
    expect(result.bytes).toBeGreaterThan(0);
  });

  it('fails closed for version changes, foreign fields, duplicate IDs and invalid values', () => {
    const candidate = createCandidate();
    const invalidStates = [
      { ...candidate, contractVersion: '2.0.0' },
      { ...candidate, unexpected: 'payload' },
      { ...candidate, entries: [candidate.entries[0], candidate.entries[0]] },
      {
        ...candidate,
        entries: [{ ...candidate.entries[0], title: 'Must never persist' }, candidate.entries[1]],
      },
      {
        ...candidate,
        entries: [
          {
            ...candidate.entries[0],
            progress: { fraction: 0.001, updatedAt: '2026-08-26T08:01:00.000Z' },
          },
          candidate.entries[1],
        ],
      },
      {
        ...candidate,
        entries: [
          {
            ...candidate.entries[0],
            savedAt: 'not-a-date',
          },
          candidate.entries[1],
        ],
      },
    ];

    for (const invalid of invalidStates) {
      expect(validateLocalReadingStateV1(invalid).ok).toBe(false);
    }
  });

  it('rejects an entry with no permitted state or an unsafe article ID', () => {
    const candidate = createCandidate();
    expect(
      validateLocalReadingStateV1({ ...candidate, entries: [{ articleId: 'wrn-test-art-empty' }] })
        .ok,
    ).toBe(false);
    expect(
      validateLocalReadingStateV1({
        ...candidate,
        entries: [
          { articleId: '../wrn-test-art-g3-008-active', savedAt: '2026-08-26T08:00:00.000Z' },
        ],
      }).ok,
    ).toBe(false);
  });
});
