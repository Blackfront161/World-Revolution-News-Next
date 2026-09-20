export type ShareAdapter = { readonly share: (url: string) => Promise<void> };

const canonicalOrigin = 'https://solinaridao.com';
const canonicalPath = /^\/articles\/(?:wrn-test-art|wrn-art)-[a-z0-9]+(?:-[a-z0-9]+)*\/$/u;

export function isCanonicalShareUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 256) return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      parsed.origin === canonicalOrigin &&
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.port === '' &&
      parsed.search === '' &&
      parsed.hash === '' &&
      canonicalPath.test(parsed.pathname) &&
      value === `${canonicalOrigin}${parsed.pathname}`
    );
  } catch {
    return false;
  }
}

export type BrowserShareEnvironment = Readonly<{
  readonly navigator?: Readonly<{
    readonly share?: (data: { readonly url: string }) => Promise<void>;
    readonly clipboard?: Readonly<{
      readonly writeText?: (text: string) => Promise<void>;
    }>;
  }>;
}>;

export function createBrowserShareAdapter(
  environment: BrowserShareEnvironment = globalThis,
): ShareAdapter {
  return Object.freeze({
    async share(url: string): Promise<void> {
      if (!isCanonicalShareUrl(url)) throw new Error('Invalid canonical share URL');
      const navigator = environment.navigator;
      if (typeof navigator?.share === 'function') {
        await navigator.share({ url });
        return;
      }
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        return;
      }
      throw new Error('Sharing is unavailable in this browser');
    },
  });
}
