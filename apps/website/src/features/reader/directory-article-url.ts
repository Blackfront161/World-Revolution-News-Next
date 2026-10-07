import { isUiLanguage, type UiLanguage } from '@wrn/ui-language';
export const isWebsiteNewsId = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 69 && /^news-[a-f0-9]{64}$/.test(value);
export function directoryArticlePath(articleId: string, language: UiLanguage): string {
  if (!isWebsiteNewsId(articleId) || !isUiLanguage(language))
    throw new Error('Invalid website news identity');
  return `/?article=${articleId}&lang=${language}#home`;
}
