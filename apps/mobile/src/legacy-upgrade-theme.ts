import { themeStorageKey, type ThemePreference } from '@wrn/brand-tokens';

const legacyThemes: Readonly<Record<string, ThemePreference>> = {
  'theme-dark': 'dark',
  'theme-light': 'light',
  'theme-oled': 'oled',
  'theme-contrast': 'contrast',
  'theme-soft': 'soft',
};

const activeLegacyThemes = new Set<ThemePreference>([
  'dark',
  'oled',
  'soft',
  'pink',
  'light',
  'system',
  'contrast',
]);

function readActiveLegacyTheme(raw: string | null): ThemePreference | null {
  if (raw === null) return null;
  try {
    const settings: unknown = JSON.parse(raw);
    if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) return null;
    const theme = (settings as Record<string, unknown>).theme;
    return typeof theme === 'string' && activeLegacyThemes.has(theme as ThemePreference)
      ? (theme as ThemePreference)
      : null;
  } catch {
    return null;
  }
}

/** Import only a known 2.1.1 choice when the new preference has never been set. */
export function importLegacyTheme(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): ThemePreference | null {
  try {
    if (storage.getItem(themeStorageKey) !== null) return null;
    // The active 2.1.1 UI stores settings as JSON. Older screens used a separate key.
    const active = readActiveLegacyTheme(storage.getItem('wrn_next_ui_settings_v1'));
    const legacy = storage.getItem('wrn_theme_style');
    const mapped =
      active ??
      (legacy !== null && Object.hasOwn(legacyThemes, legacy) ? legacyThemes[legacy]! : null);
    if (mapped === null) return null;
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
