import { afterEach, describe, expect, it, vi } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import {
  loadWebsiteUiLanguage,
  persistWebsiteUiLanguage,
  readWebsiteUiLanguageHandoff,
  clearWebsiteUiLanguageHandoff,
  websiteUiLanguageHandoffParameter,
  websiteUiLanguageStorageKey,
} from './ui-language-preference';

afterEach(() => {
  window.localStorage.removeItem(websiteUiLanguageStorageKey);
  vi.restoreAllMocks();
});

describe('website UI-language preference', () => {
  it('uses English without creating a first-start storage value', () => {
    expect(loadWebsiteUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBeNull();
  });

  it('does not repair an invalid raw value and persists an explicit valid choice', () => {
    window.localStorage.setItem(websiteUiLanguageStorageKey, 'future-v2');
    expect(loadWebsiteUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('future-v2');
    expect(persistWebsiteUiLanguage('en')).toBe(true);
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('en');
  });

  it('restores every registered catalog ID without expanding the finite storage contract', () => {
    for (const language of uiLanguageIds) {
      window.localStorage.setItem(websiteUiLanguageStorageKey, language);
      expect(loadWebsiteUiLanguage()).toBe(language);
    }
    window.localStorage.setItem(websiteUiLanguageStorageKey, 'de-DE');
    expect(loadWebsiteUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBe('de-DE');
  });

  it('fails closed without mutating an unreadable raw value or claiming a failed write', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadWebsiteUiLanguage()).toBe('en');
    expect(getItem).toHaveBeenCalledWith(websiteUiLanguageStorageKey);
    getItem.mockRestore();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(persistWebsiteUiLanguage('en')).toBe(false);
    expect(window.localStorage.getItem(websiteUiLanguageStorageKey)).toBeNull();
    expect(websiteUiLanguageStorageKey).toBe('wrn.website-ui-language.v1');
  });

  it('accepts exactly one registered handoff ID and removes only that parameter', () => {
    const query = new URLSearchParams('article=bound-id&lang=de');
    expect(readWebsiteUiLanguageHandoff(query)).toBe('de');
    clearWebsiteUiLanguageHandoff(query);
    expect(query.toString()).toBe('article=bound-id');
    expect(websiteUiLanguageHandoffParameter).toBe('lang');
  });

  it.each(['lang=future-v2', 'lang=de&lang=tr', 'lang=', 'language=de'])(
    'rejects invalid or duplicate handoff parameters: %s',
    (raw) => {
      expect(readWebsiteUiLanguageHandoff(new URLSearchParams(raw))).toBeNull();
    },
  );
});
