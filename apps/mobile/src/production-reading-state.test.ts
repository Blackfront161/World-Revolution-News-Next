import { describe, expect, it, vi } from 'vitest';
import {
  createEmptyProductionReadingStateV2,
  isProductionReadingStateV2,
  markProductionArticleReadV2,
  productionReadingStateMaxEntriesV2,
  saveProductionReadingArticleV2,
  updateProductionReadingProgressV2,
} from '@wrn/domain';
import type { ProductionReadingStateV2 } from '@wrn/domain';
import {
  createProductionReadingStateStore,
  productionReadingStateStorageKey,
} from './production-reading-state';

const id = 'wrn-art-0123456789abcdef0123456789abcdef';
const time = '2026-09-10T00:00:00.000Z';
const idAt = (index: number) => `wrn-art-${index.toString(16).padStart(32, '0')}`;

function memory(initial: string | null = null) {
  let raw = initial;
  return {
    getItem: vi.fn((key: string) => (key === productionReadingStateStorageKey ? raw : null)),
    setItem: vi.fn((_: string, value: string) => {
      raw = value;
    }),
    raw: () => raw,
  };
}

function stateWithRange(start: number, count: number): ProductionReadingStateV2 {
  let state = createEmptyProductionReadingStateV2();
  for (let index = start; index < start + count; index += 1) {
    state = saveProductionReadingArticleV2(state, idAt(index), time);
  }
  return state;
}

function stateWithFullEntryAndOther(): ProductionReadingStateV2 {
  const withAllFields = updateProductionReadingProgressV2(
    markProductionArticleReadV2(
      saveProductionReadingArticleV2(createEmptyProductionReadingStateV2(), id, time),
      id,
      '2026-09-10T00:01:00.000Z',
    ),
    id,
    0.5,
    '2026-09-10T00:02:00.000Z',
  );
  return saveProductionReadingArticleV2(withAllFields, idAt(2), time);
}

function stateJustUnderByteCapacity(): ProductionReadingStateV2 {
  const candidate = {
    contractVersion: '2.0.0' as const,
    schema: 'wrn.production-reading-state.v2' as const,
    revision: 'wrn-production-reading-state-v2' as const,
    entries: [
      ...Array.from({ length: 164 }, (_, index) => ({
        articleId: idAt(index + 1),
        savedAt: time,
        readAt: time,
        progress: {
          fraction: index < 6 ? 0.010000001 : 0.01,
          updatedAt: time,
        },
      })),
      { articleId: idAt(165), savedAt: time },
    ],
  };
  if (!isProductionReadingStateV2(candidate)) throw new Error('expected valid byte-boundary state');
  return candidate;
}

describe('production reading state adapter', () => {
  it('writes only v2 and reloads save/read/progress', () => {
    const storage = memory();
    const store = createProductionReadingStateStore(storage);
    expect(store.change({ kind: 'save', articleId: id, time }).kind).toBe('ready');
    expect(
      store.change({ kind: 'read', articleId: id, time: '2026-09-10T00:01:00.000Z' }).kind,
    ).toBe('ready');
    expect(
      store.change({
        kind: 'progress',
        articleId: id,
        fraction: 0.5,
        time: '2026-09-10T00:02:00.000Z',
      }).state.entries[0]?.progress?.fraction,
    ).toBe(0.5);
    expect(storage.setItem).toHaveBeenCalledWith(
      productionReadingStateStorageKey,
      expect.any(String),
    );
    expect(store.load().state.entries).toHaveLength(1);
    expect(storage.getItem.mock.calls.map(([key]) => key)).toEqual([
      productionReadingStateStorageKey,
      productionReadingStateStorageKey,
      productionReadingStateStorageKey,
      productionReadingStateStorageKey,
    ]);
  });
  it('leaves corrupt bytes untouched and distinguishes throwing writes', () => {
    const corrupt = memory('{bad');
    const readonly = createProductionReadingStateStore(corrupt);
    expect(readonly.load().kind).toBe('read-only');
    expect(readonly.change({ kind: 'save', articleId: id, time }).kind).toBe('read-only');
    expect(corrupt.raw()).toBe('{bad');
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(
      createProductionReadingStateStore(failing).change({ kind: 'save', articleId: id, time }).kind,
    ).toBe('write-failed');
  });
  it('becomes read-only when storage reads throw and never attempts a write', () => {
    const setItem = vi.fn();
    const unavailable = {
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem,
    };
    const store = createProductionReadingStateStore(unavailable);
    expect(store.load().kind).toBe('read-only');
    expect(store.change({ kind: 'save', articleId: id, time }).kind).toBe('read-only');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('becomes read-only when the default localStorage getter throws', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        get localStorage() {
          throw new Error('localStorage unavailable');
        },
      },
    });
    try {
      const store = createProductionReadingStateStore();
      expect(store.load().kind).toBe('read-only');
      expect(store.change({ kind: 'save', articleId: id, time }).kind).toBe('read-only');
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
      else delete (globalThis as { window?: unknown }).window;
    }
  });
  it('normalizes valid parsed bytes to an immutable snapshot', () => {
    const source = updateProductionReadingProgressV2(stateWithRange(1, 1), idAt(1), 0.5, time);
    const store = createProductionReadingStateStore(memory(JSON.stringify(source)));
    const state = store.load().state;
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.entries)).toBe(true);
    expect(Object.isFrozen(state.entries[0])).toBe(true);
    expect(Object.isFrozen(state.entries[0]?.progress)).toBe(true);
  });
  it('removes one full reading entry without changing an unrelated entry', () => {
    const storage = memory(JSON.stringify(stateWithFullEntryAndOther()));
    const outcome = createProductionReadingStateStore(storage).change({
      kind: 'remove',
      articleId: id,
    });
    expect(outcome.kind).toBe('ready');
    expect(outcome.state.entries).toEqual([{ articleId: idAt(2), savedAt: time }]);
    expect(JSON.parse(storage.raw()!).entries).toEqual([{ articleId: idAt(2), savedAt: time }]);
  });
  it('preserves full-entry storage bytes when remove cannot be written', () => {
    const raw = JSON.stringify(stateWithFullEntryAndOther());
    const storage = {
      getItem: (key: string) => (key === productionReadingStateStorageKey ? raw : null),
      setItem: () => {
        throw new Error('quota');
      },
    };
    const outcome = createProductionReadingStateStore(storage).change({
      kind: 'remove',
      articleId: id,
    });
    expect(outcome.kind).toBe('write-failed');
    expect(outcome.state.entries).toHaveLength(2);
    expect(raw).toBe(JSON.stringify(stateWithFullEntryAndOther()));
  });
  it('returns capacity conflict and preserves bytes for byte-limited save, read, and progress', () => {
    const raw = JSON.stringify(stateJustUnderByteCapacity());
    const saveStorage = memory(raw);
    const readStorage = memory(raw);
    const progressStorage = memory(raw);
    expect(
      createProductionReadingStateStore(saveStorage).change({
        kind: 'save',
        articleId: idAt(166),
        time,
      }).kind,
    ).toBe('capacity-conflict');
    expect(
      createProductionReadingStateStore(readStorage).change({
        kind: 'read',
        articleId: idAt(165),
        time,
      }).kind,
    ).toBe('capacity-conflict');
    expect(
      createProductionReadingStateStore(progressStorage).change({
        kind: 'progress',
        articleId: idAt(165),
        fraction: 0.5,
        time,
      }).kind,
    ).toBe('capacity-conflict');
    for (const storage of [saveStorage, readStorage, progressStorage]) {
      expect(storage.raw()).toBe(raw);
      expect(storage.setItem).not.toHaveBeenCalled();
    }
  });
  it('rejects a new save at the exported 200-entry capacity without reporting success', () => {
    const full = stateWithRange(1, productionReadingStateMaxEntriesV2);
    const raw = JSON.stringify(full);
    const storage = memory(raw);
    const outcome = createProductionReadingStateStore(storage).change({
      kind: 'save',
      articleId: idAt(productionReadingStateMaxEntriesV2 + 1),
      time,
    });
    expect(outcome.kind).toBe('capacity-conflict');
    expect(outcome.state.entries).toHaveLength(productionReadingStateMaxEntriesV2);
    expect(storage.raw()).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('retains both over-capacity replicas and leaves stored bytes untouched during reconcile', () => {
    const left = stateWithRange(1, 100);
    const right = stateWithRange(101, 101);
    const storage = memory('{preserve-me}');
    const outcome = createProductionReadingStateStore(storage).reconcile(left, right);
    expect(outcome.kind).toBe('capacity-conflict');
    if (outcome.kind !== 'capacity-conflict') throw new Error('expected capacity conflict');
    expect(outcome.left).toBe(left);
    expect(outcome.right).toBe(right);
    expect(storage.raw()).toBe('{preserve-me}');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
