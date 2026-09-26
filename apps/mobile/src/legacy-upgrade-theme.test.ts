import { describe, expect, it, vi } from 'vitest';
import { themeStorageKey } from '@wrn/brand-tokens';
import { importLegacyTheme } from './legacy-upgrade-theme';

function storage(current: string | null, legacy: string | null) {
  const data = new Map<string, string>();
  if (current !== null) data.set(themeStorageKey, current);
  if (legacy !== null) data.set('wrn_theme_style', legacy);
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    value: (key: string) => data.get(key) ?? null,
  };
}

describe('2.1.1 theme upgrade', () => {
  it.each([
    ['theme-dark', 'dark'],
    ['theme-light', 'light'],
    ['theme-oled', 'oled'],
    ['theme-contrast', 'contrast'],
    ['theme-soft', 'soft'],
  ])('maps exact %s to %s and retains the old key', (legacy, expected) => {
    const store = storage(null, legacy);
    expect(importLegacyTheme(store)).toBe(expected);
    expect(store.value(themeStorageKey)).toBe(expected);
    expect(store.value('wrn_theme_style')).toBe(legacy);
  });

  it('never overrides an explicit new or unknown future value', () => {
    const store = storage('pink', 'theme-dark');
    expect(importLegacyTheme(store)).toBeNull();
    expect(store.value(themeStorageKey)).toBe('pink');
    const unknown = storage(null, 'theme-violet');
    expect(importLegacyTheme(unknown)).toBeNull();
    expect(unknown.setItem).not.toHaveBeenCalled();
  });
});
