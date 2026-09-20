import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LocalSourcePreferencesV1, ProductionArticleV1 } from '@wrn/content-contracts';
import type {
  DirectoryArticle,
  DirectorySportNote,
  MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { projectSourcePreferences } from '@wrn/domain';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import {
  getDirectoryCopy,
  getDirectorySportLabels,
  formatDirectoryCopy,
} from '@wrn/ui-language/directory';
import { getProductionHomeCopy } from '@wrn/ui-language/production-home';
import { selectProductionHomeArticles } from './production-home-selection';

export type ProductionHomeDirectory = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
}>;

type HomeCard = (article: ProductionArticleV1, role: 'lead' | 'main' | 'further') => ReactNode;
type SportCategory = 'football' | 'fan-culture' | 'women';
type SportHomeItem =
  | { kind: 'article'; article: ProductionArticleV1; category: SportCategory | undefined }
  | { kind: 'note'; note: DirectorySportNote; category: SportCategory };

function orderDirectoryArticles(articles: readonly DirectoryArticle[], language: UiLanguage) {
  return [...articles].sort((left, right) => {
    const preferred = Number(right.language === language) - Number(left.language === language);
    if (preferred) return preferred;
    const leftTime = left.publishedAt === null ? -Infinity : Date.parse(left.publishedAt);
    const rightTime = right.publishedAt === null ? -Infinity : Date.parse(right.publishedAt);
    return rightTime - leftTime || left.id.localeCompare(right.id);
  });
}

function selectArchiveArticles(
  articles: readonly DirectoryArticle[],
  language: UiLanguage,
  preferences: LocalSourcePreferencesV1,
) {
  return projectSourcePreferences(
    orderDirectoryArticles(articles, language),
    preferences,
    'directory',
    (article) => article.endpointIds,
  ).slice(0, 5);
}

function selectSportNotes(
  notes: readonly DirectorySportNote[],
  preferences: LocalSourcePreferencesV1,
) {
  return projectSourcePreferences(
    [...notes].sort(
      (left, right) =>
        right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id),
    ),
    preferences,
    'directory',
    (note) => note.endpointIds,
  );
}

function selectSportArticles(
  articles: readonly ProductionArticleV1[],
  preferences: LocalSourcePreferencesV1,
): SportHomeItem[] {
  return projectSourcePreferences(
    articles.filter((article) => article.tags.includes('sports')),
    preferences,
    'production',
    (article) => [article.source.id],
  ).map((article) => ({
    kind: 'article' as const,
    article,
    category: (['football', 'fan-culture', 'women'] as const).find((tag) =>
      article.tags.includes(tag),
    ),
  }));
}

export function ProductionHome({
  articles,
  language,
  sourcePreferences,
  renderCard,
  loadDirectory,
  onBrowseDirectory,
  onBrowseSport,
  regionalEvents,
}: Readonly<{
  articles: readonly ProductionArticleV1[];
  language: UiLanguage;
  sourcePreferences: LocalSourcePreferencesV1;
  renderCard: HomeCard;
  loadDirectory?: ((signal: AbortSignal) => Promise<ProductionHomeDirectory>) | undefined;
  onBrowseDirectory?: (() => void) | undefined;
  onBrowseSport?: (() => void) | undefined;
  regionalEvents?: ReactNode;
}>) {
  const copy = getProductionHomeCopy(language);
  const directoryCopy = getDirectoryCopy(language);
  const sportLabels = getDirectorySportLabels(language);
  const ui = getUiCopy(language);
  const sportCategoryLabels = {
    all: directoryCopy.all,
    football: ui.sportFootball,
    'fan-culture': ui.sportFanculture,
    women: ui.sportWomen,
  };
  const [sportCategory, setSportCategory] = useState<'all' | 'football' | 'fan-culture' | 'women'>(
    'all',
  );
  const selection = useMemo(() => selectProductionHomeArticles(articles), [articles]);
  const [directory, setDirectory] = useState<Readonly<{
    loader: NonNullable<typeof loadDirectory>;
    value: ProductionHomeDirectory;
  }> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setDirectory(null);
    setFailed(false);
    if (!loadDirectory) return;
    const controller = new AbortController();
    let active = true;
    Promise.resolve()
      .then(() => loadDirectory(controller.signal))
      .then(
        (next) => {
          if (active) setDirectory({ loader: loadDirectory, value: next });
        },
        () => {
          if (active && !controller.signal.aborted) setFailed(true);
        },
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, loadDirectory]);
  const currentDirectory =
    directory !== null && directory.loader === loadDirectory ? directory.value : null;
  const archive = useMemo(
    () =>
      currentDirectory
        ? selectArchiveArticles(currentDirectory.projection.articles, language, sourcePreferences)
        : [],
    [currentDirectory, language, sourcePreferences],
  );
  const sport = useMemo<SportHomeItem[]>(() => {
    const fullArticles = selectSportArticles(articles, sourcePreferences);
    const notes = currentDirectory
      ? selectSportNotes(currentDirectory.projection.sports, sourcePreferences)
          .filter((note) => !articles.some((article) => article.originalUrl === note.url))
          .map((note) => ({ kind: 'note' as const, note, category: note.category }))
      : [];
    return [...fullArticles, ...notes].sort((left, right) => {
      const leftDate = left.kind === 'article' ? left.article.publishedAt : left.note.publishedAt;
      const rightDate =
        right.kind === 'article' ? right.article.publishedAt : right.note.publishedAt;
      return (
        rightDate.localeCompare(leftDate) ||
        (left.kind === 'article' ? left.article.id : left.note.id).localeCompare(
          right.kind === 'article' ? right.article.id : right.note.id,
        )
      );
    });
  }, [currentDirectory, sourcePreferences, articles]);
  const visibleSport = sport
    .filter(
      (item) =>
        sportCategory === 'all' ||
        (item.kind === 'article'
          ? item.article.tags.includes(sportCategory)
          : item.category === sportCategory),
    )
    .slice(0, 3);
  return (
    <div className="production-home" data-testid="production-home">
      {selection.lead && (
        <section aria-labelledby="production-home-lead">
          <h2 id="production-home-lead">{copy.featured}</h2>
          {renderCard(selection.lead, 'lead')}
        </section>
      )}
      {selection.main.length > 0 && (
        <section aria-labelledby="production-home-main">
          <h2 id="production-home-main">{copy.latest}</h2>
          <div className="production-home__compact">
            {selection.main.map((article) => renderCard(article, 'main'))}
          </div>
        </section>
      )}
      {loadDirectory && (
        <>
          {currentDirectory === null ? (
            <section aria-labelledby="production-home-sport">
              <h2 id="production-home-sport">{ui.sportAndFanculture}</h2>
              {failed ? (
                <>
                  <p role="alert">{directoryCopy.loadError}</p>
                  <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                    {directoryCopy.retry}
                  </button>
                </>
              ) : (
                <p role="status">{directoryCopy.loading}</p>
              )}
            </section>
          ) : (
            <section aria-labelledby="production-home-sport">
              <h2 id="production-home-sport">{ui.sportAndFanculture}</h2>
              <p>{directoryCopy.sportNote}</p>
              <div
                className="production-home__sport-filters"
                role="group"
                aria-label={sportLabels.category}
              >
                {(
                  [
                    ['all', directoryCopy.all],
                    ['football', ui.sportFootball],
                    ['fan-culture', ui.sportFanculture],
                    ['women', ui.sportWomen],
                  ] as const
                ).map(([category, label]) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={sportCategory === category}
                    onClick={() => setSportCategory(category)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {visibleSport.length === 0 && <p role="status">{directoryCopy.noResults}</p>}
              <div className="production-home__sport">
                {visibleSport.map((item, index) => {
                  if (item.kind === 'article')
                    return (
                      <div key={item.article.id}>
                        {renderCard(item.article, index === 0 ? 'lead' : 'main')}
                      </div>
                    );
                  const note = item.note;
                  return (
                    <article
                      key={note.id}
                      data-home-sport-note={note.id}
                      data-sport-role={index === 0 ? 'feature' : 'secondary'}
                    >
                      <h3 lang="en">{note.title}</h3>
                      <p lang={language === 'de' ? 'de' : 'en'}>
                        {language === 'de' ? note.noteDe : note.noteEn}
                      </p>
                      {language !== 'de' && language !== 'en' && (
                        <p>
                          {sportLabels.noteLanguage}: {sportLabels.fallback}
                        </p>
                      )}
                      <dl>
                        <dt>{sportLabels.author}</dt>
                        <dd>
                          {note.author} · {note.publisher}
                        </dd>
                        <dt>{sportLabels.published}</dt>
                        <dd>
                          <time dateTime={note.publishedAt}>{note.publishedAt}</time>
                        </dd>
                        <dt>{sportLabels.category}</dt>
                        <dd>{sportCategoryLabels[note.category]}</dd>
                      </dl>
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                      >
                        {directoryCopy.originalLink}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    </article>
                  );
                })}
              </div>
              {onBrowseSport && (
                <button
                  type="button"
                  className="production-home__sport-browse"
                  onClick={onBrowseSport}
                >
                  {ui.allSportNews}
                </button>
              )}
            </section>
          )}
        </>
      )}
      {regionalEvents}
      {selection.further.length > 0 && (
        <section aria-labelledby="production-home-further">
          <h2 id="production-home-further">{copy.further}</h2>
          <div className="production-home__compact">
            {selection.further.map((article) => renderCard(article, 'further'))}
          </div>
        </section>
      )}
      {currentDirectory && (
        <section aria-labelledby="production-home-archive">
          <h2 id="production-home-archive">{copy.archive}</h2>
          <p>{copy.archiveIntro}</p>
          <p className="production-home__snapshot">
            {formatDirectoryCopy(directoryCopy.snapshot, {
              date: currentDirectory.document.observedAt.slice(0, 10),
            })}
          </p>
          <ul className="production-home__archive">
            {archive.map((article) => (
              <li key={article.id} data-home-directory-article={article.id}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  lang={article.language}
                >
                  {article.title}
                  <span aria-hidden="true"> ↗</span>
                </a>
                <span>
                  {' '}
                  · {article.sourceName}
                  {article.publishedAt ? ` · ${article.publishedAt.slice(0, 10)}` : ''} ·{' '}
                  {article.language}
                </span>
              </li>
            ))}
          </ul>
          {onBrowseDirectory && (
            <button type="button" onClick={onBrowseDirectory}>
              {copy.browseArchive}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
