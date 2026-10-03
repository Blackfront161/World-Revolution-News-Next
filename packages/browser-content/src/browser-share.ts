import type { UiLanguage } from '@wrn/ui-language';

export type ShareOptions = Readonly<{
  translationLanguage?: UiLanguage;
  title?: string;
  sourceName?: string;
}>;
export type ShareAdapter = {
  readonly share: (url: string, options?: ShareOptions) => Promise<void>;
};

const translatedAttribution: Readonly<Record<UiLanguage, string>> = {
  de: 'Übersetzt mit World Revolution News',
  en: 'Translated with World Revolution News',
  es: 'Traducido con World Revolution News',
  fr: 'Traduit avec World Revolution News',
  it: 'Tradotto con World Revolution News',
  pt: 'Traduzido com World Revolution News',
  ru: 'Переведено с помощью World Revolution News',
  el: 'Μεταφράστηκε με το World Revolution News',
  tr: 'World Revolution News ile çevrildi',
};

const canonicalOrigin = 'https://solinaridao.com';
const hasControls = (value: string) =>
  [...value].some((character) => character.codePointAt(0)! < 32 || character === '\x7f');
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

export function canonicalShareText(url: string, options?: ShareOptions): string {
  if (!isCanonicalShareUrl(url)) throw new Error('Invalid canonical share URL');
  const language = options?.translationLanguage;
  const attribution =
    language && Object.hasOwn(translatedAttribution, language)
      ? translatedAttribution[language]
      : undefined;
  const title = options?.title;
  const source = options?.sourceName;
  if (
    title !== undefined &&
    (typeof title !== 'string' || title.length > 2000 || /[<>]/u.test(title) || hasControls(title))
  )
    throw new Error('Invalid share title');
  if (
    source !== undefined &&
    (typeof source !== 'string' ||
      source.length > 500 ||
      /[<>]/u.test(source) ||
      hasControls(source))
  )
    throw new Error('Invalid share source');
  return attribution
    ? `${title ? `${title}${source ? ` · ${source}` : ''}\n` : ''}${attribution}\n${url}`
    : url;
}

export type BrowserShareEnvironment = Readonly<{
  readonly navigator?: Readonly<{
    readonly share?: (data: {
      readonly url?: string;
      readonly text?: string;
      readonly title?: string;
    }) => Promise<void>;
    readonly clipboard?: Readonly<{
      readonly writeText?: (text: string) => Promise<void>;
    }>;
  }>;
}>;

export function createBrowserShareAdapter(
  environment: BrowserShareEnvironment = globalThis,
): ShareAdapter {
  return Object.freeze({
    async share(url: string, options?: ShareOptions): Promise<void> {
      const shareText = canonicalShareText(url, options);
      const navigator = environment.navigator;
      if (typeof navigator?.share === 'function') {
        await navigator.share(
          shareText === url
            ? { url }
            : {
                url,
                text: shareText.slice(0, -(url.length + 1)),
                ...(options?.title ? { title: options.title } : {}),
              },
        );
        return;
      }
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(shareText);
        return;
      }
      throw new Error('Sharing is unavailable in this browser');
    },
  });
}
