import { themeStorageKey, type ThemePreference } from '@wrn/brand-tokens';

const legacyThemes: Readonly<Record<string, ThemePreference>> = {
  'theme-dark': 'dark',
  'theme-light': 'light',
  'theme-oled': 'oled',
  'theme-contrast': 'contrast',
  'theme-soft': 'soft',
};

/** Import only a known 2.1.1 choice when the V8 preference has never been set. */
export function importLegacyTheme(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): ThemePreference | null {
  try {
    if (storage.getItem(themeStorageKey) !== null) return null;
    const legacy = storage.getItem('wrn_theme_style');
    if (legacy === null || !Object.hasOwn(legacyThemes, legacy)) return null;
    const mapped = legacyThemes[legacy]!;
    try {
      storage.setItem(themeStorageKey, mapped);
    } catch {
      /* Keep the session preference. */
    }
    return mapped;
  } catch {
    return null;
  }
}
