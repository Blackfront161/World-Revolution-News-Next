import { useContext, type ReactNode } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { directoryArticlePath } from './directory-article-url';
import { DirectoryReaderNavigation } from './directory-reader-navigation';
export function DirectoryArticleLink({
  id,
  language,
  children,
  contentLanguage,
}: {
  id: string;
  language: UiLanguage;
  children: ReactNode;
  contentLanguage?: string | undefined;
}) {
  const open = useContext(DirectoryReaderNavigation);
  return (
    <a
      href={directoryArticlePath(id, language)}
      lang={contentLanguage}
      data-reader-trigger={id}
      onClick={(event) => {
        if (
          !open ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        open(id, event.currentTarget);
      }}
    >
      {children}
    </a>
  );
}
