import { describe, expect, it, vi } from 'vitest';
import {
  canonicalShareText,
  createBrowserShareAdapter,
  isCanonicalShareUrl,
} from './browser-share';

const url = 'https://solinaridao.com/articles/wrn-test-art-cedar/';

describe('browser sharing', () => {
  it('accepts only canonical article URLs', () => {
    expect(isCanonicalShareUrl(url)).toBe(true);
    expect(isCanonicalShareUrl(`${url}?x=1`)).toBe(false);
    expect(isCanonicalShareUrl('https://example.invalid/articles/wrn-test-art-cedar/')).toBe(false);
    expect(isCanonicalShareUrl('https://solinaridao.com:443/articles/wrn-test-art-cedar/')).toBe(
      false,
    );
    expect(isCanonicalShareUrl('https://solinaridao.com/articles/./wrn-test-art-cedar/')).toBe(
      false,
    );
    expect(isCanonicalShareUrl(`\n${url}`)).toBe(false);
  });

  it('uses Web Share and preserves cancellation as a rejection', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    await expect(createBrowserShareAdapter({ navigator: { share } }).share(url)).rejects.toThrow(
      'cancelled',
    );
    expect(share).toHaveBeenCalledWith({ url });
  });

  it('falls back to clipboard when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await createBrowserShareAdapter({ navigator: { clipboard: { writeText } } }).share(url);
    expect(writeText).toHaveBeenCalledWith(url);
  });

  it('shares only a fixed translation attribution and the canonical link when requested', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const options = { translationLanguage: 'de' as const };
    const expected = `Übersetzt mit World Revolution News\n${url}`;
    await createBrowserShareAdapter({ navigator: { share } }).share(url, options);
    await createBrowserShareAdapter({ navigator: { clipboard: { writeText } } }).share(
      url,
      options,
    );
    expect(share).toHaveBeenCalledWith({
      url,
      text: 'Übersetzt mit World Revolution News',
    });
    expect(writeText).toHaveBeenCalledWith(expected);
    expect(canonicalShareText(url, { translationLanguage: 'en' })).toBe(
      `Translated with World Revolution News\n${url}`,
    );
    expect(canonicalShareText(url)).toBe(url);
    expect(canonicalShareText(url, { translationLanguage: 'toString' as 'de' })).toBe(url);
    expect(() => canonicalShareText(`${url}?x=1`, options)).toThrow('Invalid canonical');
  });

  it('reports unavailable sharing honestly', async () => {
    await expect(createBrowserShareAdapter({ navigator: {} }).share(url)).rejects.toThrow(
      'unavailable',
    );
  });
  it('shares a completed translated title and source through native and clipboard sharing', async () => {
    const options = {
      translationLanguage: 'fr' as const,
      title: 'Titre traduit',
      sourceName: 'Original publisher',
    };
    const share = vi.fn(async () => {}),
      writeText = vi.fn(async () => {});
    await createBrowserShareAdapter({ navigator: { share } }).share(url, options);
    await createBrowserShareAdapter({ navigator: { clipboard: { writeText } } }).share(
      url,
      options,
    );
    expect(share).toHaveBeenCalledWith({
      title: 'Titre traduit',
      text: 'Titre traduit · Original publisher\nTraduit avec World Revolution News',
      url,
    });
    expect(writeText).toHaveBeenCalledWith(
      `Titre traduit · Original publisher\nTraduit avec World Revolution News\n${url}`,
    );
    expect(() => canonicalShareText(url, { ...options, title: 'Injected\nextra' })).toThrow(
      'Invalid share title',
    );
  });
});
