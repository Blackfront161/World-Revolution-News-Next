import { describe, expect, it, vi } from 'vitest';
import { createBrowserShareAdapter, isCanonicalShareUrl } from './browser-share';

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

  it('reports unavailable sharing honestly', async () => {
    await expect(createBrowserShareAdapter({ navigator: {} }).share(url)).rejects.toThrow(
      'unavailable',
    );
  });
});
