import { expect, it } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import { getWebsiteHomeCopy } from './website-home-copy';
import { websiteArticleIllustration } from './article-illustration';
import images from './home-additional-illustrations-v1.json';
import directory from '../projection/data/content-directory-v1.json';

it('has complete Home, reader and illustration labels for every supported language', () => {
  const keys = Object.keys(getWebsiteHomeCopy('en'));
  for (const language of uiLanguageIds) {
    const copy = getWebsiteHomeCopy(language);
    expect(Object.keys(copy)).toEqual(keys);
    for (const text of Object.values(copy))
      expect(typeof text === 'string' && text.trim().length > 0).toBe(true);
  }
});
it('additional images cannot follow another title, URL, historical record or directory revision', () => {
  for (const image of images.entries) {
    const article = directory.articles.find(
      (item) => item.id === image.articleId,
    )! as DirectoryArticle;
    expect(websiteArticleIllustration(article, directory.sourceCommit)).toContain(image.asset);
    for (const changed of [
      { ...article, title: 'Changed' },
      { ...article, url: 'https://other.invalid/' },
      { ...article, historical: true },
      { ...article, id: `news-${'f'.repeat(64)}` },
    ])
      expect(websiteArticleIllustration(changed, directory.sourceCommit)).toBeNull();
    expect(websiteArticleIllustration(article, 'f'.repeat(40))).toBeNull();
  }
});
