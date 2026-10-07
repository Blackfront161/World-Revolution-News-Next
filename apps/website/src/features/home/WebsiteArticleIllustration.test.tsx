import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import type { DirectoryArticle } from '@wrn/content-contracts/mobile-content-directory-v1';
import { WebsiteArticleIllustration } from './WebsiteArticleIllustration';
import directory from '../projection/data/content-directory-v1.json';
import images from './app-article-images-v1.json';
import reviewed from './reviewed-article-images-v1.json';
import { originalArticleImage } from './reviewed-article-images';
const lead = directory.articles.find(
  (a) => a.id === reviewed.entries[0]!.articleId,
)! as DirectoryArticle;
it('uses the verified photograph of the exact lead article in every language', () => {
  for (const language of uiLanguageIds) {
    const view = render(
      <WebsiteArticleIllustration
        article={lead}
        commit={directory.sourceCommit}
        language={language}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', reviewed.entries[0]!.imageUrl);
    expect(screen.getByRole('img')).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(screen.getByText(/Adrian Wyld/)).toBeVisible();
    expect(
      view.container.querySelector('svg,[data-wrn-illustration],[data-wrn-topic-art]'),
    ).toBeNull();
    view.unmount();
  }
});
it('never replaces a failed photograph with unrelated artwork and resets for the next exact article', () => {
  const view = render(
    <WebsiteArticleIllustration article={lead} commit={directory.sourceCommit} language="de" />,
  );
  fireEvent.error(screen.getByRole('img'));
  expect(view.container.querySelector('figure,img,svg')).toBeNull();
  const e = reviewed.entries[1]!,
    article = directory.articles.find((a) => a.id === e.articleId)! as DirectoryArticle;
  view.rerender(
    <WebsiteArticleIllustration article={article} commit={directory.sourceCommit} language="fr" />,
  );
  expect(screen.getByRole('img')).toHaveAttribute('src', e.imageUrl);
});
it('rejects changed identities, changed immutable feeds and historical articles', () => {
  for (const article of [
    { ...lead, title: 'Different article' },
    { ...lead, url: 'https://www.aptnnews.ca/another/' },
    { ...lead, sourceName: 'Other source' },
    { ...lead, historical: true },
  ]) {
    const view = render(
      <WebsiteArticleIllustration
        article={article}
        commit={directory.sourceCommit}
        language="de"
      />,
    );
    expect(view.container.querySelector('img,svg')).toBeNull();
    view.unmount();
  }
  const view = render(
    <WebsiteArticleIllustration
      article={lead}
      commit={directory.sourceCommit}
      imageRegister={{
        ...images,
        imageBytesHosted: false,
        imageBytesOffline: false,
        feedSha256: '0'.repeat(64),
      }}
      language="de"
    />,
  );
  expect(view.container.querySelector('img,svg')).toBeNull();
});
it('suppresses a publisher site logo for a text that has no article picture', () => {
  const e = reviewed.entries.find((e) => e.imageUrl === null)!,
    article = directory.articles.find((a) => a.id === e.articleId)! as DirectoryArticle;
  const view = render(
    <WebsiteArticleIllustration article={article} commit={directory.sourceCommit} language="de" />,
  );
  expect(view.container.querySelector('figure,img,svg')).toBeNull();
});
it('does not restore disproved feed pictures after a data or feed update', () => {
  for (const entry of reviewed.entries.filter(
    (entry) => entry.imageUrl === null || entry.sourceName === 'Agência Pública',
  )) {
    const article = directory.articles.find(
      (article) => article.id === entry.articleId,
    )! as DirectoryArticle;
    expect(
      originalArticleImage(article, directory.sourceCommit, {
        ...images,
        imageBytesHosted: false,
        imageBytesOffline: false,
        feedSha256: '0'.repeat(64),
      }),
    ).toBeNull();
    expect(
      originalArticleImage(article, '0'.repeat(40), {
        ...images,
        imageBytesHosted: false,
        imageBytesOffline: false,
        dataCommit: '0'.repeat(40),
      }),
    ).toBeNull();
  }
});
