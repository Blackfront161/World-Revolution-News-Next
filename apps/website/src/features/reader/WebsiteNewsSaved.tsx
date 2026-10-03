import { useState } from 'react';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getWebsiteHomeCopy } from '../home/website-home-copy';
import { homeReadingSummary } from '../home/home-editorial';
import { DirectoryArticleLink } from './directory-article-link';
import { useWebsiteNews, useNewsReadingState } from './use-website-news';
import { changeNewsReadingState, type NewsReadingChange } from './news-reading-state';
import './news-reader.css';

export function WebsiteNewsSaved({ language }: { language: UiLanguage }) {
  const { data, articles } = useWebsiteNews();
  const [reading, setReading] = useNewsReadingState();
  const [view, setView] = useState<'saved' | 'read'>('saved');
  const [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [status, setStatus] = useState('');
  const copy = getWebsiteHomeCopy(language),
    ui = getUiCopy(language);
  const mutate = async (change: NewsReadingChange) => {
    if (busy) return;
    setBusy(true);
    const next = await changeNewsReadingState(change);
    setReading(next);
    setBusy(false);
    setConfirm(false);
    setStatus(
      next.kind === 'ready'
        ? change.kind === 'clear'
          ? ui.localStateDeleted
          : ui.savedRemoved
        : next.kind === 'read-only'
          ? ui.localStateProtected
          : ui.localStateNotSaved,
    );
  };
  return (
    <section className="website-news-saved" aria-labelledby="news-saved-title">
      <h2 id="news-saved-title">{copy.savedNews}</h2>
      <p>{ui.savedIntro}</p>
      <nav className="news-reader-toolbar" aria-label={ui.localReadingData}>
        <button type="button" aria-pressed={view === 'saved'} onClick={() => setView('saved')}>
          {ui.readLater}
        </button>
        <button type="button" aria-pressed={view === 'read'} onClick={() => setView('read')}>
          {ui.read}
        </button>
      </nav>
      {reading.kind === 'read-only' && <p role="alert">{ui.localStateProtected}</p>}
      <p role="status" aria-live="polite">
        {status}
      </p>
      {!reading.state.entries.some((entry) => entry[view]) && (
        <p>{view === 'saved' ? ui.savedEmpty : ui.readEmpty}</p>
      )}
      <ul>
        {reading.state.entries
          .filter((entry) => entry[view])
          .map((entry) => {
            const article = articles.find((item) => item.id === entry.articleId);
            return (
              <li key={entry.articleId}>
                {data && article ? (
                  <>
                    <DirectoryArticleLink id={article.id} language={language}>
                      {homeReadingSummary(article, data.document.sourceCommit, language)
                        ?.headline ?? article.title}
                    </DirectoryArticleLink>
                    <p>{article.sourceName}</p>
                  </>
                ) : (
                  <p>{ui.locallyUnavailable}</p>
                )}
                <button
                  type="button"
                  disabled={busy || reading.kind === 'read-only'}
                  onClick={() =>
                    void mutate({ kind: view, articleId: entry.articleId, value: false })
                  }
                >
                  {view === 'saved' ? ui.removeFromSaved : ui.markUnread}
                </button>
              </li>
            );
          })}
      </ul>
      {reading.state.entries.length > 0 && (
        <button
          type="button"
          disabled={busy || reading.kind === 'read-only'}
          onClick={() => setConfirm(true)}
        >
          {copy.clearNews}
        </button>
      )}
      {confirm && (
        <div role="group" aria-label={copy.clearNews}>
          <p>{ui.clearReadingDataDetail}</p>
          <button type="button" disabled={busy} onClick={() => void mutate({ kind: 'clear' })}>
            {ui.deleteNow}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirm(false)}>
            {ui.cancel}
          </button>
        </div>
      )}
    </section>
  );
}
