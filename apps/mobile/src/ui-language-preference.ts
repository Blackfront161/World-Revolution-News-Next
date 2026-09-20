import {
  defaultUiLanguage,
  isRegisteredUiLanguage,
  isUiLanguage,
  type UiLanguage,
} from '@wrn/ui-language';

export const mobileUiLanguageStorageKey = 'wrn.mobile-ui-language.v1' as const;

/**
 * Missing, malformed, unknown, or unreadable values are a session-local
 * English fallback. They are intentionally neither repaired nor removed:
 * only a deliberate valid selection is allowed to mutate this key.
 */
export function loadMobileUiLanguage(): UiLanguage {
  try {
    const raw = window.localStorage.getItem(mobileUiLanguageStorageKey);
    return isUiLanguage(raw) && isRegisteredUiLanguage(raw) ? raw : defaultUiLanguage;
  } catch {
    return defaultUiLanguage;
  }
}

/** Returns false instead of claiming a persistence outcome after a storage failure. */
export function persistMobileUiLanguage(language: UiLanguage): boolean {
  try {
    window.localStorage.setItem(mobileUiLanguageStorageKey, language);
    return true;
  } catch {
    return false;
  }
}
