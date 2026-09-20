import { describe, expect, it } from 'vitest';
import {
  defaultUiLanguage,
  englishUiCopy,
  formatUiCopy,
  getUiCopy,
  getMobileMediaCopy,
  isUiLanguage,
  normalizeUiLanguage,
  registeredUiLanguages,
  uiCopyByLanguage,
  uiCopyKey,
  uiLanguageDirections,
  uiLanguageIds,
  mobileMediaCopyByLanguage,
} from './index';

function placeholdersByKey(copy: Readonly<Record<string, string>>) {
  return Object.fromEntries(
    Object.entries(copy).map(([key, value]) => [
      key,
      [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/gu)].map((match) => match[1]).sort(),
    ]),
  );
}

describe('G3-013 UI language contract', () => {
  it('allows exactly the nine attested IDs and fails closed to English', () => {
    expect(uiLanguageIds).toEqual(['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);
    expect(isUiLanguage('de')).toBe(true);
    expect(isUiLanguage('de-DE')).toBe(false);
    expect(normalizeUiLanguage(null)).toBe(defaultUiLanguage);
    expect(normalizeUiLanguage('unknown')).toBe(defaultUiLanguage);
  });

  it('keeps every contract key complete in the canonical English foundation', () => {
    expect(Object.keys(englishUiCopy).sort()).toEqual(Object.values(uiCopyKey).sort());
    expect(Object.values(englishUiCopy).every((value) => value.trim().length > 0)).toBe(true);
    expect(registeredUiLanguages).toEqual(uiLanguageIds);
    expect(Object.keys(uiCopyByLanguage).sort()).toEqual([...uiLanguageIds].sort());
    for (const language of uiLanguageIds) {
      const copy = getUiCopy(language);
      expect(Object.keys(copy).sort()).toEqual(Object.values(uiCopyKey).sort());
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
      expect(placeholdersByKey(copy)).toEqual(placeholdersByKey(englishUiCopy));
    }
    expect(Object.values(uiLanguageDirections)).toEqual(Array(9).fill('ltr'));
  });

  it('formats only explicitly named values', () => {
    expect(formatUiCopy('Language: {language}', { language: 'English' })).toBe('Language: English');
    expect(formatUiCopy('Language: {language}', {})).toBe('Language: {language}');
  });

  it('keeps the isolated P4-B media register complete for every bound UI language', () => {
    const englishKeys = Object.keys(getMobileMediaCopy('en')).sort();
    expect(Object.keys(mobileMediaCopyByLanguage).sort()).toEqual([...uiLanguageIds].sort());
    for (const language of uiLanguageIds) {
      const copy = getMobileMediaCopy(language);
      expect(Object.keys(copy).sort()).toEqual(englishKeys);
      expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
    }
    expect(getMobileMediaCopy('de').continue).toBe('Fortsetzen');
    expect(getMobileMediaCopy('tr').localDelivery).toContain('üçüncü');
  });

  it('freezes the twelve P3 website-shell English keys without placeholders', () => {
    const shellKeys = [
      'websiteShellTitle',
      'websiteShellScope',
      'websiteShellEnable',
      'websiteShellUpdate',
      'websiteShellRemove',
      'websiteShellUncontrolled',
      'websiteShellSaved',
      'websiteShellActive',
      'websiteShellWaiting',
      'websiteShellWorking',
      'websiteShellRemoved',
      'websiteShellProtected',
    ] as const;
    expect(shellKeys).toHaveLength(12);
    expect(shellKeys.map((key) => uiCopyKey[key])).toEqual(shellKeys);
    expect(shellKeys.map((key) => englishUiCopy[key])).toEqual([
      'Website offline shell',
      'This function manages the website interface and library, help, source, news, event and media-directory metadata. Full articles, audio/video files and personal preferences are managed separately. A small protection marker remains, and pages already controlled by this interface may stay controlled until they close.',
      'Save website shell',
      'Check for shell update',
      'Remove website shell',
      'No website shell controls this page yet.',
      'The website interface is saved. Close all pages of this website, then reopen it to use the saved interface.',
      'Website shell controls this page. It does not prove news or media are saved.',
      'An update is waiting. Close all pages using this website, then reopen it.',
      'The website shell operation is still being verified.',
      'Website shell removed. A small protection marker remains.',
      'Offline website availability cannot be confirmed. Storage may be unavailable or protected.',
    ]);
    expect(placeholdersByKey(englishUiCopy)).toMatchObject(
      Object.fromEntries(shellKeys.map((key) => [key, []])),
    );
  });

  it('freezes the eight additive Outcome-A English keys without placeholders', () => {
    const outcomeAKeys = [
      'websiteShellReadinessLabel',
      'websiteShellUpdateAttemptLabel',
      'websiteShellUpdateNotStarted',
      'websiteShellUpdateRunning',
      'websiteShellUpdateSucceeded',
      'websiteShellUpdateFailed',
      'websiteShellUpdateIndeterminate',
      'websiteShellUpdateRetry',
    ] as const;
    expect(outcomeAKeys).toHaveLength(8);
    expect(outcomeAKeys.map((key) => uiCopyKey[key])).toEqual(outcomeAKeys);
    expect(outcomeAKeys.map((key) => englishUiCopy[key])).toEqual([
      'Website availability',
      'Last update check',
      'No update check has been started in this session.',
      'Checking for an update.',
      'The update check completed successfully.',
      'The update check could not be completed.',
      'The update request was sent, but the result could not be confirmed.',
      'Try update check again',
    ]);
    expect(placeholdersByKey(englishUiCopy)).toMatchObject(
      Object.fromEntries(outcomeAKeys.map((key) => [key, []])),
    );
  });
});
