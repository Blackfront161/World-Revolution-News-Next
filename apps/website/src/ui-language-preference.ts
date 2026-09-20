import {
  defaultUiLanguage,
  isRegisteredUiLanguage,
  isUiLanguage,
  type UiLanguage,
} from '@wrn/ui-language';

export const websiteUiLanguageStorageKey = 'wrn.website-ui-language.v1' as const;
export const websiteUiLanguageHandoffParameter = 'lang' as const;

/**
 * A language preference is client-local. A non-readable or unknown raw value
 * is never repaired in place and therefore cannot silently destroy future data.
 */
export function loadWebsiteUiLanguage(): UiLanguage {
  try {
    const raw = window.localStorage.getItem(websiteUiLanguageStorageKey);
    return isUiLanguage(raw) && isRegisteredUiLanguage(raw) ? raw : defaultUiLanguage;
  } catch {
    return defaultUiLanguage;
  }
}

/** Returns false when local persistence is unavailable; the caller may retain the session value. */
export function persistWebsiteUiLanguage(language: UiLanguage): boolean {
  try {
    window.localStorage.setItem(websiteUiLanguageStorageKey, language);
    return true;
  } catch {
    return false;
  }
}

/**
 * The mobile header may hand one finite UI-language ID to the website. Multiple
 * or unknown values fail closed, so query parsing cannot broaden the local
 * language contract.
 */
export function readWebsiteUiLanguageHandoff(query: URLSearchParams): UiLanguage | null {
  const values = query.getAll(websiteUiLanguageHandoffParameter);
  if (values.length !== 1) return null;
  const value = values[0];
  return isUiLanguage(value) && isRegisteredUiLanguage(value) ? value : null;
}

/** Removes only the consumed handoff parameter and leaves routes, readers and hashes intact. */
export function clearWebsiteUiLanguageHandoff(query: URLSearchParams): void {
  query.delete(websiteUiLanguageHandoffParameter);
}
