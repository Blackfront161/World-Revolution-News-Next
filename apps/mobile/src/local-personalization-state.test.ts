import { afterEach, describe, expect, it, vi } from 'vitest';
import { canonicalJson } from '@wrn/content-contracts';
import { createLocalPersonalizationState } from '@wrn/domain';

import {
  createMobilePersonalizationStore,
  mobilePersonalizationStorageKey,
} from './local-personalization-state';

const otherKey = 'wrn.mobile-local-reading-state.v1';
const next = createLocalPersonalizationState({
  interestIds: ['movement-news'],
  regionIds: ['europe'],
  contentLanguageIds: ['en'],
})!;

afterEach(() => {
  window.localStorage.clear();
});

describe('WRN-G3-017 mobile local personalization storage', () => {
  it('leaves a first start inactive without a write and saves exactly one canonical V1 key after a bound load', () => {
    window.localStorage.setItem(otherKey, 'separate-reading-state');
    window.localStorage.setItem('wrn.mobile-ui-language.v1', 'de');
    window.localStorage.setItem('wrn.theme-preference.v1', 'pink');
    const store = createMobilePersonalizationStore();
    const loaded = store.load();
    expect(loaded).toEqual({ kind: 'inactive', expectedRaw: null });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    expect(store.save(loaded, next)).toMatchObject({ kind: 'saved', state: next });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBe(canonicalJson(next));
    expect(window.localStorage.getItem(otherKey)).toBe('separate-reading-state');
    store.dispose();
  });

  it.each([
    ['future V2', '{"contractVersion":2,"future":"opaque"}'],
    ['malformed JSON', '{not valid JSON'],
    ['foreign field', `${canonicalJson(next).slice(0, -1)},"foreign":true}`],
    ['over-cap serialized document', `${canonicalJson(next)}${' '.repeat(4097)}`],
  ])('preserves %s byte-identically as protected and blocks normal save', (_label, raw) => {
    window.localStorage.setItem(mobilePersonalizationStorageKey, raw);
    const store = createMobilePersonalizationStore();
    const loaded = store.load();
    expect(loaded).toEqual({ kind: 'protected', raw });
    expect(store.save(loaded, next)).toEqual({ kind: 'blocked' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBe(raw);
    store.dispose();
  });

  it('stops missing -> future and ready A -> ready B stale saves before mutation', () => {
    const store = createMobilePersonalizationStore();
    const missing = store.load();
    const future = '{"contractVersion":2,"future":"opaque"}';
    window.localStorage.setItem(mobilePersonalizationStorageKey, future);
    expect(store.save(missing, next)).toEqual({ kind: 'conflict' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBe(future);

    const before = createLocalPersonalizationState({
      interestIds: ['football'],
      regionIds: [],
      contentLanguageIds: ['de'],
    })!;
    const replacement = createLocalPersonalizationState({
      interestIds: ['fan-culture'],
      regionIds: [],
      contentLanguageIds: ['tr'],
    })!;
    const rawA = canonicalJson(before);
    const rawB = canonicalJson(replacement);
    window.localStorage.setItem(mobilePersonalizationStorageKey, rawA);
    const readyA = store.load();
    window.localStorage.setItem(mobilePersonalizationStorageKey, rawB);
    expect(store.save(readyA, next)).toEqual({ kind: 'conflict' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBe(rawB);
    store.dispose();
  });

  it('stops on a pre-read error or an observed storage conflict without calling setItem', () => {
    let getCalls = 0;
    let setCalls = 0;
    const backing = new Map<string, string>();
    const storage = {
      getItem(key: string) {
        getCalls++;
        if (getCalls > 1) throw new Error('blocked');
        return backing.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        setCalls++;
        backing.set(key, value);
      },
      removeItem(key: string) {
        backing.delete(key);
      },
    };
    const store = createMobilePersonalizationStore(storage);
    const loaded = store.load();
    expect(store.save(loaded, next)).toEqual({ kind: 'unavailable' });
    expect(setCalls).toBe(0);
    store.dispose();

    const conflictStore = createMobilePersonalizationStore();
    const conflictLoad = conflictStore.load();
    window.dispatchEvent(new StorageEvent('storage', { key: mobilePersonalizationStorageKey }));
    expect(conflictStore.save(conflictLoad, next)).toEqual({ kind: 'conflict' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    conflictStore.dispose();
  });

  it('reports quota/write and exact readback failures without a false success', () => {
    const failingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    const failing = createMobilePersonalizationStore(failingStorage);
    expect(failing.save(failing.load(), next)).toEqual({ kind: 'write-failed' });
    failing.dispose();

    let value: string | null = null;
    const mismatchStorage = {
      getItem: () => value,
      setItem: () => {
        value = 'different-after-write';
      },
      removeItem: () => {
        value = null;
      },
    };
    const mismatch = createMobilePersonalizationStore(mismatchStorage);
    expect(mismatch.save(mismatch.load(), next)).toEqual({ kind: 'verification-failed' });
    mismatch.dispose();
  });

  it.each(['ready-to-ready', 'ready-to-future', 'protected-to-ready'] as const)(
    'preserves newer data from another adapter when an old clear is confirmed: %s',
    (scenario) => {
      const future = '{"contractVersion":2,"future":"newer producer"}';
      const replacement = createLocalPersonalizationState({
        interestIds: ['fan-culture'],
        regionIds: [],
        contentLanguageIds: ['de'],
      })!;
      const storage = {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, raw: string) => window.localStorage.setItem(key, raw),
        removeItem: vi.fn((key: string) => window.localStorage.removeItem(key)),
      };
      storage.setItem(
        mobilePersonalizationStorageKey,
        scenario === 'protected-to-ready' ? '{invalid old document' : canonicalJson(next),
      );
      storage.setItem(otherKey, 'foreign-state');
      const first = createMobilePersonalizationStore(storage);
      const second = createMobilePersonalizationStore(storage);
      try {
        const oldConfirmation = first.load();
        if (scenario === 'protected-to-ready') {
          expect(second.clear(second.load())).toEqual({ kind: 'cleared' });
        }
        if (scenario === 'ready-to-future') {
          // Simulate a newer schema producer; the V1 adapter must preserve it.
          storage.setItem(mobilePersonalizationStorageKey, future);
          expect(second.load()).toEqual({ kind: 'protected', raw: future });
        } else {
          expect(second.save(second.load(), replacement)).toMatchObject({ kind: 'saved' });
        }
        storage.removeItem.mockClear();
        const expected = scenario === 'ready-to-future' ? future : canonicalJson(replacement);
        expect(first.clear(oldConfirmation)).toEqual({ kind: 'conflict' });
        expect(storage.removeItem).not.toHaveBeenCalled();
        expect(storage.getItem(mobilePersonalizationStorageKey)).toBe(expected);
        expect(storage.getItem(otherKey)).toBe('foreign-state');
        expect(first.clear(oldConfirmation)).toEqual({ kind: 'blocked' });
        expect(storage.removeItem).not.toHaveBeenCalled();
      } finally {
        first.dispose();
        second.dispose();
      }
    },
  );

  it('blocks an observed ABA conflict before clear even when the original bytes return', () => {
    const raw = canonicalJson(next);
    const storage = {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: vi.fn((key: string) => window.localStorage.removeItem(key)),
    };
    storage.setItem(mobilePersonalizationStorageKey, raw);
    const store = createMobilePersonalizationStore(storage);
    try {
      const loaded = store.load();
      storage.setItem(mobilePersonalizationStorageKey, '{different intermediate value');
      window.dispatchEvent(new StorageEvent('storage', { key: mobilePersonalizationStorageKey }));
      storage.setItem(mobilePersonalizationStorageKey, raw);
      expect(store.clear(loaded)).toEqual({ kind: 'conflict' });
      expect(storage.removeItem).not.toHaveBeenCalled();
      expect(storage.getItem(mobilePersonalizationStorageKey)).toBe(raw);
      expect(store.clear(loaded)).toEqual({ kind: 'blocked' });
    } finally {
      store.dispose();
    }
  });

  it('does not remove anything if the fresh clear read fails and consumes the authorization', () => {
    const raw = canonicalJson(next);
    const storage = {
      getItem: vi.fn(() => raw),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const store = createMobilePersonalizationStore(storage);
    try {
      const loaded = store.load();
      storage.getItem.mockImplementation(() => {
        throw new Error('read unavailable');
      });
      expect(store.clear(loaded)).toEqual({ kind: 'unavailable' });
      expect(storage.removeItem).not.toHaveBeenCalled();
      expect(store.clear(loaded)).toEqual({ kind: 'blocked' });
      expect(storage.getItem).toHaveBeenCalledTimes(2);
      expect(storage.removeItem).not.toHaveBeenCalled();
    } finally {
      store.dispose();
    }
  });

  it('clears only the opaque ready/protected key after readback null and keeps foreign keys untouched', () => {
    const raw = '{"contractVersion":2,"future":"opaque"}';
    window.localStorage.setItem(mobilePersonalizationStorageKey, raw);
    window.localStorage.setItem(otherKey, 'foreign-state');
    const protectedStore = createMobilePersonalizationStore();
    expect(protectedStore.clear(protectedStore.load())).toEqual({ kind: 'cleared' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    expect(window.localStorage.getItem(otherKey)).toBe('foreign-state');
    protectedStore.dispose();

    window.localStorage.setItem(mobilePersonalizationStorageKey, canonicalJson(next));
    const readyStore = createMobilePersonalizationStore();
    expect(readyStore.clear(readyStore.load())).toEqual({ kind: 'cleared' });
    expect(window.localStorage.getItem(mobilePersonalizationStorageKey)).toBeNull();
    expect(window.localStorage.getItem(otherKey)).toBe('foreign-state');
    readyStore.dispose();

    const verificationStorage = {
      getItem: () => 'still-there',
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const verificationStore = createMobilePersonalizationStore(verificationStorage);
    const loaded = verificationStore.load();
    expect(loaded.kind).toBe('protected');
    expect(verificationStore.clear(loaded)).toEqual({ kind: 'verification-failed' });
    verificationStore.dispose();

    const inaccessibleStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const inaccessibleStore = createMobilePersonalizationStore(inaccessibleStorage);
    expect(inaccessibleStore.load()).toEqual({ kind: 'unavailable' });
    inaccessibleStore.dispose();

    const removeFailureStorage = {
      getItem: () => raw,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const removeFailureStore = createMobilePersonalizationStore(removeFailureStorage);
    expect(removeFailureStore.clear(removeFailureStore.load())).toEqual({ kind: 'remove-failed' });
    removeFailureStore.dispose();
  });
});
