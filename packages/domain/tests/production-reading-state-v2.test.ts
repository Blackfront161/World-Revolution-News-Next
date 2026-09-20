import { describe, expect, it } from 'vitest';
import {
  createEmptyProductionReadingStateV2,
  didProductionReadingStateUpdateExceedCapacityV2,
  isProductionReadingStateV2,
  markProductionArticleReadV2,
  ProductionReadingStateCapacityConflictError,
  reconcileProductionReadingStateV2,
  removeProductionReadingEntryV2,
  saveProductionReadingArticleV2,
  updateProductionReadingProgressV2,
  unsaveProductionReadingArticleV2,
  markProductionArticleUnreadV2,
  resetProductionReadingProgressV2,
  clearProductionReadingStateV2,
} from '../src/production-reading-state-v2.js';
import type { ProductionReadingStateV2 } from '../src/production-reading-state-v2.js';
const id = 'wrn-art-0123456789abcdef0123456789abcdef';
const timestamp = '2026-09-10T00:00:00.000Z';
const idAt = (index: number) => `wrn-art-${index.toString(16).padStart(32, '0')}` as const;

function stateWithRange(start: number, count: number, complete = false): ProductionReadingStateV2 {
  let state = createEmptyProductionReadingStateV2();
  for (let index = start; index < start + count; index += 1) {
    const articleId = idAt(index);
    state = saveProductionReadingArticleV2(state, articleId, timestamp);
    if (complete) {
      state = markProductionArticleReadV2(state, articleId, '2026-09-10T00:01:00.000Z');
      state = updateProductionReadingProgressV2(state, articleId, 0.5, '2026-09-10T00:02:00.000Z');
    }
  }
  return state;
}

function stateJustUnderByteCapacity(): ProductionReadingStateV2 {
  const candidate = {
    contractVersion: '2.0.0' as const,
    schema: 'wrn.production-reading-state.v2' as const,
    revision: 'wrn-production-reading-state-v2' as const,
    entries: [
      ...Array.from({ length: 164 }, (_, index) => ({
        articleId: idAt(index + 1),
        savedAt: timestamp,
        readAt: timestamp,
        progress: {
          fraction: index < 6 ? 0.010000001 : 0.01,
          updatedAt: timestamp,
        },
      })),
      { articleId: idAt(165), savedAt: timestamp },
    ],
  };
  if (!isProductionReadingStateV2(candidate)) throw new Error('expected valid byte-boundary state');
  return candidate;
}
describe('production reading state v2', () => {
  it('removes only the requested field and clears without changing unrelated fields', () => {
    const initial = updateProductionReadingProgressV2(
      markProductionArticleReadV2(
        saveProductionReadingArticleV2(createEmptyProductionReadingStateV2(), id, timestamp),
        id,
        '2026-09-10T00:01:00.000Z',
      ),
      id,
      0.5,
      '2026-09-10T00:02:00.000Z',
    );
    expect(unsaveProductionReadingArticleV2(initial, id).entries[0]).toEqual({
      articleId: id,
      readAt: '2026-09-10T00:02:00.000Z',
      progress: { fraction: 0.5, updatedAt: '2026-09-10T00:02:00.000Z' },
    });
    expect(markProductionArticleUnreadV2(initial, id).entries[0]?.savedAt).toBe(timestamp);
    expect(resetProductionReadingProgressV2(initial, id).entries[0]?.progress).toBeUndefined();
    expect(clearProductionReadingStateV2(initial, 'saved').entries[0]?.readAt).toBe(
      '2026-09-10T00:02:00.000Z',
    );
    expect(clearProductionReadingStateV2(initial, 'all').entries).toEqual([]);
  });
  it('removes the entire requested entry while retaining unrelated entries', () => {
    const withAllFields = updateProductionReadingProgressV2(
      markProductionArticleReadV2(
        saveProductionReadingArticleV2(createEmptyProductionReadingStateV2(), id, timestamp),
        id,
        '2026-09-10T00:01:00.000Z',
      ),
      id,
      0.5,
      '2026-09-10T00:02:00.000Z',
    );
    const initial = saveProductionReadingArticleV2(withAllFields, idAt(2), timestamp);
    const before = JSON.stringify(initial);
    const removed = removeProductionReadingEntryV2(initial, id);
    expect(removed.entries).toEqual([{ articleId: idAt(2), savedAt: timestamp }]);
    expect(isProductionReadingStateV2(removed)).toBe(true);
    expect(Object.isFrozen(removed)).toBe(true);
    expect(JSON.stringify(initial)).toBe(before);
  });
  it('stores, reads and converges monotonically for production IDs', () => {
    const saved = saveProductionReadingArticleV2(
      createEmptyProductionReadingStateV2(),
      id,
      '2026-09-10T00:00:00.000Z',
    );
    const progressed = updateProductionReadingProgressV2(
      saved,
      id,
      0.5,
      '2026-09-10T00:01:00.000Z',
    );
    const read = markProductionArticleReadV2(progressed, id, '2026-09-10T00:02:00.000Z');
    const merged = reconcileProductionReadingStateV2(saved, read);
    expect(isProductionReadingStateV2(merged)).toBe(true);
    expect(merged.entries[0]).toEqual({
      articleId: id,
      savedAt: '2026-09-10T00:00:00.000Z',
      readAt: '2026-09-10T00:02:00.000Z',
      progress: { fraction: 0.5, updatedAt: '2026-09-10T00:01:00.000Z' },
    });
  });
  it('rejects fixture and traversal IDs without changing the v2 state', () => {
    const start = createEmptyProductionReadingStateV2();
    expect(
      saveProductionReadingArticleV2(start, 'wrn-test-art-alpha', '2026-09-10T00:00:00.000Z'),
    ).toBe(start);
    expect(updateProductionReadingProgressV2(start, '../bad', 1, '2026-09-10T00:00:00.000Z')).toBe(
      start,
    );
  });
  it('reports byte capacity for valid save, read, and progress changes below 200 entries', () => {
    const source = stateJustUnderByteCapacity();
    const before = JSON.stringify(source);
    expect(source.entries).toHaveLength(165);
    expect(
      didProductionReadingStateUpdateExceedCapacityV2(source, {
        kind: 'save',
        articleId: idAt(166),
        savedAt: timestamp,
      }),
    ).toBe(true);
    expect(
      didProductionReadingStateUpdateExceedCapacityV2(source, {
        kind: 'read',
        articleId: idAt(165),
        readAt: timestamp,
      }),
    ).toBe(true);
    expect(
      didProductionReadingStateUpdateExceedCapacityV2(source, {
        kind: 'progress',
        articleId: idAt(165),
        fraction: 0.5,
        updatedAt: timestamp,
      }),
    ).toBe(true);
    expect(saveProductionReadingArticleV2(source, idAt(166), timestamp)).toBe(source);
    expect(markProductionArticleReadV2(source, idAt(165), timestamp)).toBe(source);
    expect(updateProductionReadingProgressV2(source, idAt(165), 0.5, timestamp)).toBe(source);
    expect(JSON.stringify(source)).toBe(before);
  });
  it('keeps valid older progress and invalid inputs as non-capacity no-ops', () => {
    const current = updateProductionReadingProgressV2(
      saveProductionReadingArticleV2(createEmptyProductionReadingStateV2(), id, timestamp),
      id,
      0.5,
      '2026-09-10T00:02:00.000Z',
    );
    expect(updateProductionReadingProgressV2(current, id, 0.5, '2026-09-10T00:01:00.000Z')).toEqual(
      current,
    );
    expect(
      didProductionReadingStateUpdateExceedCapacityV2(current, {
        kind: 'progress',
        articleId: id,
        fraction: 0.5,
        updatedAt: '2026-09-10T00:01:00.000Z',
      }),
    ).toBe(false);
    expect(updateProductionReadingProgressV2(current, id, 0, timestamp)).toBe(current);
    expect(
      didProductionReadingStateUpdateExceedCapacityV2(current, {
        kind: 'progress',
        articleId: id,
        fraction: 0,
        updatedAt: timestamp,
      }),
    ).toBe(false);
  });
  it('merges the complete union commutatively, associatively and without synthesizing readAt', () => {
    const withoutReadAt = {
      contractVersion: '2.0.0' as const,
      schema: 'wrn.production-reading-state.v2' as const,
      revision: 'wrn-production-reading-state-v2' as const,
      entries: [{ articleId: id, progress: { fraction: 0.95, updatedAt: timestamp } }],
    } satisfies ProductionReadingStateV2;
    const laterProgress = {
      ...withoutReadAt,
      entries: [
        {
          articleId: id,
          progress: { fraction: 0.95, updatedAt: '2026-09-10T00:01:00.000Z' },
        },
      ],
    } satisfies ProductionReadingStateV2;
    const mergedProgress = reconcileProductionReadingStateV2(withoutReadAt, laterProgress);
    expect(mergedProgress.entries[0]).toEqual({
      articleId: id,
      progress: { fraction: 0.95, updatedAt: '2026-09-10T00:01:00.000Z' },
    });

    const left = stateWithRange(1, 2);
    const middle = stateWithRange(2, 2);
    const right = stateWithRange(3, 2);
    expect(reconcileProductionReadingStateV2(left, middle)).toEqual(
      reconcileProductionReadingStateV2(middle, left),
    );
    expect(
      reconcileProductionReadingStateV2(reconcileProductionReadingStateV2(left, middle), right),
    ).toEqual(
      reconcileProductionReadingStateV2(left, reconcileProductionReadingStateV2(middle, right)),
    );
    expect(reconcileProductionReadingStateV2(left, left)).toEqual(left);
  });
  it('accepts a full 200-entry union without dropping entries', () => {
    const left = stateWithRange(1, 100);
    const right = stateWithRange(101, 100);
    const merged = reconcileProductionReadingStateV2(left, right);
    expect(merged.entries).toHaveLength(200);
    expect(reconcileProductionReadingStateV2(merged, right)).toEqual(merged);
    expect(reconcileProductionReadingStateV2(right, left)).toEqual(merged);
  });
  it('throws one named conflict for every over-capacity order and preserves both inputs', () => {
    const left = stateWithRange(1, 100);
    const right = stateWithRange(101, 101);
    const leftBefore = JSON.stringify(left);
    const rightBefore = JSON.stringify(right);
    expect(() => reconcileProductionReadingStateV2(left, right)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
    expect(() => reconcileProductionReadingStateV2(right, left)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
    expect(JSON.stringify(left)).toBe(leftBefore);
    expect(JSON.stringify(right)).toBe(rightBefore);

    const fullLeft = stateWithRange(1, 200);
    const fullRight = stateWithRange(201, 200);
    expect(() => reconcileProductionReadingStateV2(fullLeft, fullRight)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
    expect(() => reconcileProductionReadingStateV2(fullRight, fullLeft)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
  });
  it('throws the same conflict for a byte-only union without losing either replica', () => {
    const left = stateWithRange(1, 100, true);
    const right = stateWithRange(101, 100, true);
    expect(isProductionReadingStateV2(left)).toBe(true);
    expect(isProductionReadingStateV2(right)).toBe(true);
    const leftBefore = JSON.stringify(left);
    const rightBefore = JSON.stringify(right);
    expect(() => reconcileProductionReadingStateV2(left, right)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
    expect(() => reconcileProductionReadingStateV2(right, left)).toThrow(
      ProductionReadingStateCapacityConflictError,
    );
    expect(JSON.stringify(left)).toBe(leftBefore);
    expect(JSON.stringify(right)).toBe(rightBefore);
  });
});
