import { afterEach, describe, expect, it, vi } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import {
  loadMobileUiLanguage,
  mobileUiLanguageStorageKey,
  persistMobileUiLanguage,
} from './ui-language-preference';

afterEach(() => {
  window.localStorage.removeItem(mobileUiLanguageStorageKey);
  vi.restoreAllMocks();
});

describe('mobile UI-language preference', () => {
  it('uses English without creating a first-start storage value', () => {
    expect(loadMobileUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBeNull();
  });

  it('does not repair an invalid raw value and persists an explicit valid choice', () => {
    window.localStorage.setItem(mobileUiLanguageStorageKey, 'future-v2');
    expect(loadMobileUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBe('future-v2');
    expect(persistMobileUiLanguage('en')).toBe(true);
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBe('en');
  });

  it('restores every registered catalog ID without expanding the finite storage contract', () => {
    for (const language of uiLanguageIds) {
      window.localStorage.setItem(mobileUiLanguageStorageKey, language);
      expect(loadMobileUiLanguage()).toBe(language);
    }
    window.localStorage.setItem(mobileUiLanguageStorageKey, 'de-DE');
    expect(loadMobileUiLanguage()).toBe('en');
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBe('de-DE');
  });

  it('fails closed without mutating an unreadable raw value or claiming a failed write', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadMobileUiLanguage()).toBe('en');
    expect(getItem).toHaveBeenCalledWith(mobileUiLanguageStorageKey);
    getItem.mockRestore();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(persistMobileUiLanguage('en')).toBe(false);
    expect(window.localStorage.getItem(mobileUiLanguageStorageKey)).toBeNull();
    expect(mobileUiLanguageStorageKey).toBe('wrn.mobile-ui-language.v1');
  });
});
