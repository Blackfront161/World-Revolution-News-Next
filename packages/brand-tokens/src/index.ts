/**
 * Platform-neutral semantic values. Navigation and screen composition remain
 * local to the mobile and website clients.
 */
export const brandTokenVersion = '0.3.0' as const;

export const brandAssetManifestVersion = 'wrn-brand-assets-v1' as const;

/**
 * These URLs resolve to owner-attested, locally shipped masters recorded in
 * ../assets/asset-manifest.json. No remote media or font is involved.
 */
export const brandAssetUrls = {
  solinaridaoMark: new URL('../assets/solinaridao-header-mark-filled.png', import.meta.url).href,
  wrnHeaderWordmark: new URL('../assets/wrn-future-header-white.png', import.meta.url).href,
} as const;

/**
 * Theme preferences are intentionally a small, versioned local contract. The
 * `system` preference resolves at runtime; it is never rendered as its own
 * palette or persisted as a device-specific result.
 */
export const themePreferenceIds = [
  'violet',
  'dark',
  'editorial',
  'oled',
  'soft',
  'pink',
  'light',
  'system',
  'contrast',
] as const;

export type ThemePreference = (typeof themePreferenceIds)[number];
export type EffectiveTheme = Exclude<ThemePreference, 'system'>;

export const themeStorageKey = 'wrn.theme-preference.v1' as const;

export const themePreferenceLabels: Readonly<Record<ThemePreference, string>> = {
  violet: 'Violett/Rot',
  dark: 'Rot/Cyan',
  editorial: 'Editorial Schwarz/Rot',
  oled: 'OLED',
  soft: 'Soft',
  pink: 'Pink',
  light: 'Hell',
  system: 'System',
  contrast: 'Kontrast',
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (themePreferenceIds as readonly string[]).includes(value);
}

/** Unknown input fails closed to the deterministic violet baseline. */
export function normalizeThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : 'violet';
}

export function resolveEffectiveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): EffectiveTheme {
  return preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;
}

export const shellLayout = {
  contentMaxWidth: '72rem',
  controlMinSize: '2.75rem',
  focusRingWidth: '0.1875rem',
} as const;

export const shellCopy = {
  brandName: 'Solinaridao',
  productName: 'World Revolution News',
  previewLabel: 'Lokale Vorschau',
  noParityClaim: 'Keine vollstaendige visuelle oder funktionale Paritaet wird behauptet.',
} as const;
