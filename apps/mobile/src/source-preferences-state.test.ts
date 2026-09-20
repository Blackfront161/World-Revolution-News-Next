import { afterEach, describe, expect, it, vi } from 'vitest';

import { canonicalJson } from '@wrn/content-contracts';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import { createSourcePreferencesStore } from '../../../packages/browser-content/src/source-preferences-state';

const mobileKey = 'wrn.mobile.source-preferences.v1';
const websiteKey = 'wrn.website.source-preferences.v1';
const next = setSourcePreference(emptySourcePreferences(), 'production', 'eff', 'follow')!;

afterEach(() => window.localStorage.clear());

describe('mobile source preferences local storage', () => {
  it('uses only the mobile key and permits a valid empty state after an authorized load', () => {
    window.localStorage.setItem(websiteKey, 'website-value');
    const store = createSourcePreferencesStore(mobileKey);
    const loaded = store.load();
    expect(loaded).toEqual({ kind: 'inactive', expectedRaw: null });
    expect(store.save(loaded, emptySourcePreferences())).toMatchObject({ kind: 'saved' });
    expect(window.localStorage.getItem(websiteKey)).toBe('website-value');
    store.dispose();
  });

  it.each([
    ['malformed', '{invalid'],
    ['future', '{"contractVersion":"2.0.0","schema":"future","choices":[]}'],
    [
      'duplicate',
      `{"contractVersion":"1.0.0","schema":"wrn.local-source-preferences.v1","choices":[{"catalog":"production","sourceId":"eff","action":"follow"},{"catalog":"production","sourceId":"eff","action":"hide"}]}`,
    ],
    ['oversized', `${canonicalJson(next)}${' '.repeat(65537)}`],
  ])('preserves %s raw data as protected and does not overwrite it', (_label, raw) => {
    window.localStorage.setItem(mobileKey, raw);
    const store = createSourcePreferencesStore(mobileKey);
    const loaded = store.load();
    expect(loaded).toEqual({ kind: 'protected', raw });
    expect(store.save(loaded, next)).toEqual({ kind: 'blocked' });
    expect(window.localStorage.getItem(mobileKey)).toBe(raw);
    store.dispose();
  });

  it('rejects wrong-store, consumed, and concurrent authorizations before a write', () => {
    const first = createSourcePreferencesStore(mobileKey);
    const second = createSourcePreferencesStore(mobileKey);
    const loaded = first.load();
    expect(second.save(loaded, next)).toEqual({ kind: 'blocked' });
    window.localStorage.setItem(mobileKey, canonicalJson(emptySourcePreferences()));
    expect(first.save(loaded, next)).toEqual({ kind: 'conflict' });
    expect(first.save(loaded, next)).toEqual({ kind: 'blocked' });
    first.dispose();
    second.dispose();
  });

  it('clears only an explicitly loaded ready document after an exact readback', () => {
    window.localStorage.setItem(mobileKey, canonicalJson(next));
    window.localStorage.setItem(websiteKey, 'website-value');
    const store = createSourcePreferencesStore(mobileKey);
    const loaded = store.load();
    expect(store.clear(loaded)).toEqual({ kind: 'cleared' });
    expect(window.localStorage.getItem(mobileKey)).toBeNull();
    expect(window.localStorage.getItem(websiteKey)).toBe('website-value');
    expect(store.clear(loaded)).toEqual({ kind: 'blocked' });
    store.dispose();
  });

  it('fails closed for quota, readback, and key-null storage invalidation', () => {
    const quota = createSourcePreferencesStore(mobileKey, {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    });
    expect(quota.save(quota.load(), next)).toEqual({ kind: 'write-failed' });
    quota.dispose();

    let raw: string | null = null;
    const mismatch = createSourcePreferencesStore(mobileKey, {
      getItem: () => raw,
      setItem: () => {
        raw = 'different';
      },
      removeItem: () => {
        raw = null;
      },
    });
    expect(mismatch.save(mismatch.load(), next)).toEqual({ kind: 'verification-failed' });
    mismatch.dispose();

    const storage = {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: vi.fn((key: string) => window.localStorage.removeItem(key)),
    };
    window.localStorage.setItem(mobileKey, canonicalJson(next));
    const eventStore = createSourcePreferencesStore(mobileKey, storage);
    const ready = eventStore.load();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(eventStore.clear(ready)).toEqual({ kind: 'conflict' });
    expect(storage.removeItem).not.toHaveBeenCalled();
    eventStore.dispose();
  });
});
