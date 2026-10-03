import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  getUiCopy,
  isUiLanguage,
  uiLanguageIds,
  uiLanguageNativeNames,
  type UiLanguage,
} from '@wrn/ui-language';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import { AutomaticDirectoryTitle } from '../../../../../packages/browser-content/src/automatic-directory-title';
import {
  createBrowserDeviceSpeechAdapter,
  ProductionPodcastPanel,
} from '../../../../../packages/browser-content/src/production-podcast';
import { productionTranslationAdapter } from '../../production-translation-adapter';
import { homeReadingSummary } from '../home/home-editorial';
import { getWebsiteHomeCopy } from '../home/website-home-copy';
import { WebsiteArticleIllustration } from '../home/WebsiteArticleIllustration';
import { changeNewsReadingState, type NewsReadingChange } from './news-reading-state';
import { directoryArticlePath } from './directory-article-url';
import { useWebsiteNews, useNewsReadingState } from './use-website-news';
import './news-reader.css';

export function WebsiteDirectoryReader({
  articleId,
  language,
  onClose,
  headingRef,
}: {
  articleId: string;
  language: UiLanguage;
  onClose(): void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { data, articles, failed, retry } = useWebsiteNews();
  const ui = getUiCopy(language),
    copy = getWebsiteHomeCopy(language),
    directoryCopy = getDirectoryCopy(language);
  const [version, setVersion] = useState<{ ui: UiLanguage; value: UiLanguage }>({
    ui: language,
    value: language,
  });
  const readingLanguage = version.ui === language ? version.value : language;
  const [size, setSize] = useState(100);
  const [deviceSpeech] = useState(createBrowserDeviceSpeechAdapter);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useNewsReadingState();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const article = articles.find((item) => item.id === articleId);
  const commit = data?.document.sourceCommit ?? '';
  const note = article ? homeReadingSummary(article, commit, readingLanguage) : null;
  const saved = reading.state.entries.find((entry) => entry.articleId === articleId);
  useEffect(() => {
    headingRef.current?.focus();
  }, [articleId, article, headingRef]);
  const mutate = async (action: NewsReadingChange) => {
    if (busy) return;
    setBusy(true);
    const result = await changeNewsReadingState(action);
    if (!mounted.current) return;
    setReading(result);
    setBusy(false);
    setStatus(
      result.kind === 'ready'
        ? action.kind === 'saved'
          ? action.value
            ? ui.savedAdded
            : ui.savedRemoved
          : ''
        : result.kind === 'read-only'
          ? ui.localStateProtected
          : result.kind === 'capacity-conflict'
            ? copy.capacity
            : ui.localStateNotSaved,
    );
  };
  const shareUrl = directoryArticlePath(articleId, readingLanguage);
  const canonical = `https://solinaridao.com${shareUrl}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonical);
      if (mounted.current) setStatus(copy.copied);
    } catch {
      if (mounted.current) setStatus(copy.shareFailed);
    }
  };
  const share = async () => {
    if (!article) return;
    if (typeof navigator.share !== 'function') return copyLink();
    try {
      await navigator.share({
        title: note?.headline ?? article.title,
        text: `${note?.headline ?? article.title} · ${article.sourceName}`,
        url: canonical,
      });
    } catch (error) {
      if (mounted.current && !(error instanceof DOMException && error.name === 'AbortError'))
        setStatus(copy.shareFailed);
    }
  };
  return (
    <section className="website-news-reader" aria-labelledby="website-page-title">
      <button type="button" className="news-reader-back" onClick={onClose}>
        ← {ui.back}
      </button>
      {!data ? (
        <>
          <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
            {ui.news}
          </h1>
          <p role={failed ? 'alert' : 'status'}>{failed ? directoryCopy.loadError : ui.loading}</p>
          {failed && (
            <button type="button" onClick={retry}>
              {directoryCopy.retry}
            </button>
          )}
        </>
      ) : !article ? (
        <>
          <h1 id="website-page-title" ref={headingRef} tabIndex={-1}>
            {ui.articleUnavailable}
          </h1>
          <p role="status">{ui.unavailableArticleDetail}</p>
        </>
      ) : (
        <>
          <p className="news-reader-source">
            {article.sourceName}
            {article.publishedAt && (
              <>
                {' '}
                ·{' '}
                <time dateTime={article.publishedAt}>
                  {new Intl.DateTimeFormat(language, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(article.publishedAt))}
                </time>
              </>
            )}
          </p>
          <h1
            id="website-page-title"
            ref={headingRef}
            tabIndex={-1}
            lang={note?.language ?? (article.language === 'und' ? undefined : article.language)}
          >
            {note?.headline ?? (
              <AutomaticDirectoryTitle
                article={article}
                directoryRevision={`${commit}:${data.document.observedAt}`}
                language={readingLanguage}
                adapter={productionTranslationAdapter}
                position={0}
              />
            )}
          </h1>
          <div className="news-reader-toolbar" aria-label={ui.localReadingData}>
            <button
              type="button"
              disabled={busy || reading.kind === 'read-only'}
              aria-pressed={saved?.saved ?? false}
              onClick={() => void mutate({ kind: 'saved', articleId, value: !saved?.saved })}
            >
              {saved?.saved ? '★' : '☆'} {saved?.saved ? ui.removeFromSaved : ui.saveForLater}
            </button>
            <button
              type="button"
              disabled={busy || reading.kind === 'read-only'}
              aria-pressed={saved?.read ?? false}
              onClick={() => void mutate({ kind: 'read', articleId, value: !saved?.read })}
            >
              ✓ {saved?.read ? ui.markUnread : ui.markRead}
            </button>
            <button type="button" onClick={() => void share()}>
              ↗ {ui.share}
            </button>
            {note && (
              <label>
                {copy.versions}
                <select
                  value={readingLanguage}
                  onChange={(event) => {
                    if (isUiLanguage(event.target.value)) {
                      setVersion({ ui: language, value: event.target.value });
                      setStatus('');
                    }
                  }}
                >
                  {uiLanguageIds.map((id) => (
                    <option value={id} key={id}>
                      {uiLanguageNativeNames[id]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              {copy.textSize}
              <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                {[100, 125, 150, 200].map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p role="status" aria-live="polite">
            {reading.kind === 'read-only' ? ui.localStateProtected : status}
          </p>
          <WebsiteArticleIllustration article={article} commit={commit} language={language} eager />
          <div className="news-reader-body" style={{ fontSize: `${size}%` }}>
            {note && (
              <section aria-labelledby="news-reader-note">
                <h2 id="news-reader-note">
                  {copy.noteTitle} · {uiLanguageNativeNames[readingLanguage]}
                </h2>
                <p className="news-reader-note" lang={note.language}>
                  {note.text}
                </p>
                <ProductionPodcastPanel
                  key={`${articleId}:${readingLanguage}`}
                  title={note.headline ?? article.title}
                  blocks={[{ kind: 'paragraph', text: note.text }]}
                  contentLanguage={note.language}
                  language={language}
                  adapter={deviceSpeech}
                />
              </section>
            )}
            <aside className="news-reader-availability">
              <p>{copy.metadataNotice}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {ui.openOriginalSource} ↗
              </a>
            </aside>
            <details>
              <summary>{copy.originalHeadline}</summary>
              <p lang={article.language === 'und' ? undefined : article.language}>
                {article.title}
              </p>
            </details>
          </div>
          <div className="news-reader-share-link">
            <label>
              {copy.copyLink}
              <input value={canonical} readOnly onFocus={(event) => event.currentTarget.select()} />
            </label>
            <button type="button" onClick={() => void copyLink()}>
              {copy.copyLink}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
