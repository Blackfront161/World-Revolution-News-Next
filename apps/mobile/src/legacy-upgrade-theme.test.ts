import { describe, expect, it, vi } from 'vitest';
import { themeStorageKey } from '@wrn/brand-tokens';
import { importLegacyTheme } from './legacy-upgrade-theme';

function storage(current: string | null, legacy: string | null, active: string | null = null) {
  const data = new Map<string, string>();
  if (current !== null) data.set(themeStorageKey, current);
  if (legacy !== null) data.set('wrn_theme_style', legacy);
  if (active !== null) data.set('wrn_next_ui_settings_v1', active);
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    value: (key: string) => data.get(key) ?? null,
  };
}

describe('2.1.1 theme upgrade', () => {
  it.each(['dark', 'oled', 'soft', 'pink', 'light', 'system', 'contrast'])(
    'imports the active 2.1.1 JSON theme %s without deleting the old settings',
    (theme) => {
      const raw = JSON.stringify({ theme, fontSize: 'large', density: 'compact' });
      const store = storage(null, 'theme-light', raw);
      expect(importLegacyTheme(store)).toBe(theme);
      expect(store.value(themeStorageKey)).toBe(theme);
      expect(store.value('wrn_next_ui_settings_v1')).toBe(raw);
    },
  );

  it('ignores malformed and unknown active settings, then safely falls back', () => {
    expect(importLegacyTheme(storage(null, null, '{'))).toBeNull();
    expect(importLegacyTheme(storage(null, null, '{"theme":"future"}'))).toBeNull();
    expect(importLegacyTheme(storage(null, 'theme-dark', '{"theme":"future"}'))).toBe('dark');
    expect(importLegacyTheme(storage('pink', 'theme-dark', '{"theme":"oled"}'))).toBeNull();
  });

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
