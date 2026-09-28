import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LocalSourcePreferencesV1, ProductionArticleV1 } from '@wrn/content-contracts';
import type {
  DirectoryArticle,
  DirectorySource,
  DirectorySportNote,
  MobileContentDirectory,
} from '@wrn/content-contracts/mobile-content-directory-v1';
import { projectDirectorySourcePreferences, projectSourcePreferences } from '@wrn/domain';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import {
  getDirectoryCopy,
  getDirectorySportLabels,
  formatDirectoryCopy,
} from '@wrn/ui-language/directory';
import { getProductionHomeCopy } from '@wrn/ui-language/production-home';
import { selectProductionHomeArticles } from './production-home-selection';
import { AutomaticDirectoryTitle } from './automatic-directory-title';
import type { ProductionTranslationAdapter } from './production-translation';

export type ProductionHomeDirectory = Readonly<{
  document: MobileContentDirectory;
  projection: MobileContentDirectory;
}>;

type HomeCard = (
  article: ProductionArticleV1,
  role: 'lead' | 'main' | 'further',
  translateHomeText?: boolean,
) => ReactNode;
type SportCategory = 'football' | 'fan-culture' | 'women';
type SportHomeItem =
  | { kind: 'article'; article: ProductionArticleV1; category: SportCategory | undefined }
  | { kind: 'note'; note: DirectorySportNote; category: SportCategory };

function orderDirectoryArticles(
  articles: readonly DirectoryArticle[],
  language: UiLanguage,
  recentFirst = false,
) {
  return [...articles].sort((left, right) => {
    const preferred = Number(right.language === language) - Number(left.language === language);
    const leftTime = left.publishedAt === null ? -Infinity : Date.parse(left.publishedAt);
    const rightTime = right.publishedAt === null ? -Infinity : Date.parse(right.publishedAt);
    const recency = rightTime - leftTime;
    return recentFirst
      ? recency || preferred || left.id.localeCompare(right.id)
      : preferred || recency || left.id.localeCompare(right.id);
  });
}

function selectArchiveArticles(
  articles: readonly DirectoryArticle[],
  sources: readonly DirectorySource[],
  language: UiLanguage,
  preferences: LocalSourcePreferencesV1,
  recentFirst = false,
) {
  return projectDirectorySourcePreferences({
    articles: orderDirectoryArticles(articles, language, recentFirst),
    sources,
    preferences,
  }).slice(0, 5);
}

const websiteFreshnessCopy: Readonly<
  Record<
    UiLanguage,
    Readonly<{
      current: string;
      featured: string;
      latest: string;
      further: string;
    }>
  >
> = {
  de: {
    current: 'Aktuelle Meldungen',
    featured: 'Lesestück im Blickpunkt',
    latest: 'Geprüfte Lesestücke',
    further: 'Weitere Lesestücke',
  },
  en: {
    current: 'Current reports',
    featured: 'Featured reading piece',
    latest: 'Reviewed reading pieces',
    further: 'More reading pieces',
  },
  es: {
    current: 'Noticias actuales',
    featured: 'Lectura destacada',
    latest: 'Lecturas revisadas',
    further: 'Más lecturas',
  },
  fr: {
    current: 'Actualités récentes',
    featured: 'Lecture à la une',
    latest: 'Lectures vérifiées',
    further: 'Autres lectures',
  },
  it: {
    current: 'Notizie attuali',
    featured: 'Lettura in evidenza',
    latest: 'Letture verificate',
    further: 'Altre letture',
  },
  pt: {
    current: 'Notícias atuais',
    featured: 'Leitura em destaque',
    latest: 'Leituras verificadas',
    further: 'Mais leituras',
  },
  ru: {
    current: 'Актуальные сообщения',
    featured: 'Главный материал для чтения',
    latest: 'Проверенные материалы',
    further: 'Другие материалы',
  },
  el: {
    current: 'Τρέχουσες ειδήσεις',
    featured: 'Προτεινόμενο ανάγνωσμα',
    latest: 'Ελεγμένα αναγνώσματα',
    further: 'Περισσότερα αναγνώσματα',
  },
  tr: {
    current: 'Güncel haberler',
    featured: 'Öne çıkan okuma',
    latest: 'İncelenmiş okumalar',
    further: 'Diğer okumalar',
  },
};

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
  hasOriginalImage,
  loadDirectory,
  onBrowseDirectory,
  onBrowseSport,
  regionalEvents,
  prioritizeCurrentLinks = false,
  brandMarkUrl,
  translationAdapter = null,
}: Readonly<{
  articles: readonly ProductionArticleV1[];
  language: UiLanguage;
  sourcePreferences: LocalSourcePreferencesV1;
  renderCard: HomeCard;
  hasOriginalImage?: ((article: ProductionArticleV1) => boolean) | undefined;
  loadDirectory?: ((signal: AbortSignal) => Promise<ProductionHomeDirectory>) | undefined;
  onBrowseDirectory?: (() => void) | undefined;
  onBrowseSport?: (() => void) | undefined;
  regionalEvents?: ReactNode;
  prioritizeCurrentLinks?: boolean | undefined;
  brandMarkUrl?: string | undefined;
  translationAdapter?: ProductionTranslationAdapter | null;
}>) {
  const copy = getProductionHomeCopy(language);
  const freshnessCopy = websiteFreshnessCopy[language];
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
  const selection = useMemo(
    () =>
      selectProductionHomeArticles(
        currentDirectory
          ? articles.filter((article) => !article.tags.includes('sports'))
          : articles,
      ),
    [articles, currentDirectory],
  );
  const frontPage = useMemo(() => {
    const top = selection.lead ? [selection.lead, ...selection.main] : [...selection.main];
    const imageIndex = hasOriginalImage ? top.findIndex(hasOriginalImage) : -1;
    if (imageIndex <= 0) return { lead: selection.lead, main: selection.main };
    // Keep the same reviewed articles; give the first licensed image the visual lead.
    return {
      lead: top[imageIndex] ?? null,
      main: top.filter((_, index) => index !== imageIndex),
    };
  }, [selection, hasOriginalImage]);
  const archive = useMemo(
    () =>
      currentDirectory
        ? selectArchiveArticles(
            currentDirectory.projection.articles,
            currentDirectory.projection.sources,
            language,
            sourcePreferences,
            prioritizeCurrentLinks,
          )
        : [],
    [currentDirectory, language, sourcePreferences, prioritizeCurrentLinks],
  );
  const sport = useMemo<SportHomeItem[]>(() => {
    const fullArticles = selectSportArticles(articles, sourcePreferences);
    const notes = currentDirectory
      ? selectSportNotes(currentDirectory.projection.sports, sourcePreferences)
          .filter((note) => !articles.some((article) => article.originalUrl === note.url))
          .map((note) => ({ kind: 'note' as const, note, category: note.category }))
      : [];
    return [...fullArticles, ...notes].sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'article' ? -1 : 1;
      if (left.kind === 'article' && right.kind === 'article') {
        const imagePriority =
          Number(hasOriginalImage?.(right.article) ?? false) -
          Number(hasOriginalImage?.(left.article) ?? false);
        if (imagePriority) return imagePriority;
      }
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
  }, [currentDirectory, sourcePreferences, articles, hasOriginalImage]);
  const visibleSport = sport
    .filter(
      (item) =>
        sportCategory === 'all' ||
        (item.kind === 'article'
          ? item.article.tags.includes(sportCategory)
          : item.category === sportCategory),
    )
    .slice(0, 3);
  const directoryNews = currentDirectory && (
    <section
      aria-labelledby="production-home-archive"
      className={prioritizeCurrentLinks ? 'production-home__current' : undefined}
    >
      {brandMarkUrl && (
        <img
          className="production-home__brand-mark"
          src={brandMarkUrl}
          alt=""
          width="94"
          height="80"
        />
      )}
      <h2 id="production-home-archive">
        {prioritizeCurrentLinks ? freshnessCopy.current : copy.archive}
      </h2>
      <p>{copy.archiveIntro}</p>
      <p className="production-home__snapshot">
        {formatDirectoryCopy(directoryCopy.snapshot, {
          date: currentDirectory.document.observedAt.slice(0, 10),
        })}
      </p>
      <ul className="production-home__archive">
        {archive.map((article, position) => (
          <li key={article.id} data-home-directory-article={article.id}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              lang={article.language === 'und' ? undefined : article.language}
            >
              <AutomaticDirectoryTitle
                article={article}
                directoryRevision={`${currentDirectory.document.sourceCommit}:${currentDirectory.document.observedAt}`}
                language={language}
                adapter={translationAdapter}
                position={position}
              />
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
  );
  return (
    <div className="production-home" data-testid="production-home">
      {prioritizeCurrentLinks &&
        (directoryNews || (
          <section aria-labelledby="production-home-archive">
            <h2 id="production-home-archive">{freshnessCopy.current}</h2>
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
        ))}
      {(frontPage.lead || frontPage.main.length > 0) && (
        <div className="production-home__lead-grid">
          {frontPage.lead && (
            <section aria-labelledby="production-home-lead">
              <h2 id="production-home-lead">
                {prioritizeCurrentLinks ? freshnessCopy.featured : copy.featured}
              </h2>
              {renderCard(frontPage.lead, 'lead', true)}
            </section>
          )}
          {frontPage.main.length > 0 && (
            <section aria-labelledby="production-home-main">
              <h2 id="production-home-main">
                {prioritizeCurrentLinks ? freshnessCopy.latest : copy.latest}
              </h2>
              <div className="production-home__compact">
                {frontPage.main.map((article) => renderCard(article, 'main', true))}
              </div>
            </section>
          )}
        </div>
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
          <h2 id="production-home-further">
            {prioritizeCurrentLinks ? freshnessCopy.further : copy.further}
          </h2>
          <div className="production-home__compact">
            {selection.further.map((article) => renderCard(article, 'further'))}
          </div>
        </section>
      )}
      {!prioritizeCurrentLinks && directoryNews}
    </div>
  );
}
