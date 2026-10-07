import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import { WebsiteArticleIllustration } from './WebsiteArticleIllustration';
import directory from '../projection/data/content-directory-v1.json';
import images from './app-article-images-v1.json';
import layout from './app-home-layout-v1.json';
import { getWebsiteHomeCopy } from './website-home-copy';

const lead = directory.articles.find((a) => a.id === layout.lead)! as DirectoryArticle;
const withImages = images.entries
  .slice(0, 2)
  .map((entry) => directory.articles.find((a) => a.id === entry.articleId)! as DirectoryArticle);

it('gives the current imageless App lead a labelled local illustration in every supported language', () => {
  expect(images.entries.some((entry) => entry.articleId === lead.id)).toBe(false);
  for (const language of uiLanguageIds) {
    const view = render(
      <WebsiteArticleIllustration
        article={lead}
        commit={directory.sourceCommit}
        language={language}
      />,
    );
    const picture = screen.getByRole('img');
    expect(picture.tagName.toLowerCase()).toBe('svg');
    expect(picture).toHaveAttribute('lang', language);
    expect(picture.closest('figure')).toHaveAttribute('data-wrn-topic-art', lead.id);
    expect(view.container.querySelector('img,a,foreignObject,script,image')).toBeNull();
    expect(
      screen.getByText(getWebsiteHomeCopy(language).illustrationCaption, { exact: false }),
    ).toBeVisible();
    view.unmount();
  }
});
it('keeps an admitted original and replaces a failed image without another remote request', () => {
  const article = withImages[0]!;
  const view = render(
    <WebsiteArticleIllustration article={article} commit={directory.sourceCommit} language="de" />,
  );
  const original = screen.getByRole('img');
  expect(original).toHaveAttribute('src', images.entries[0]!.imageUrl);
  expect(original).toHaveAttribute('referrerpolicy', 'no-referrer');
  fireEvent.error(original);
  expect(screen.getByRole('img').tagName.toLowerCase()).toBe('svg');
  expect(view.container.querySelector('img')).toBeNull();
  view.rerender(
    <WebsiteArticleIllustration
      article={withImages[1]!}
      commit={directory.sourceCommit}
      language="fr"
    />,
  );
  expect(screen.getByRole('img')).toHaveAttribute('src', images.entries[1]!.imageUrl);
});
it('does not turn an identity-mismatched source image into an admitted photograph', () => {
  const article = { ...withImages[0]!, title: 'A different article title' };
  const view = render(
    <WebsiteArticleIllustration article={article} commit={directory.sourceCommit} language="de" />,
  );
  expect(view.container.querySelector('img,a')).toBeNull();
  expect(screen.getByRole('img').tagName.toLowerCase()).toBe('svg');
  expect(view.container.textContent).toContain('Kein Foto');
});
