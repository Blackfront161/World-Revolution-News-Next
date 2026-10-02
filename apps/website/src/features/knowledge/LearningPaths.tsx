import type { UiLanguage } from '@wrn/ui-language';
import { useEffect, useState } from 'react';
import type { AppCatalog } from '../events-media/app-catalog';
import { loadWebsiteAppCatalog } from '../events-media/events-media-loader';
import type { WebsiteKnowledge } from './knowledge-loader';
import { learningPathsForKnowledge, learningPodcastsForKnowledge } from './learning-paths';

export function LearningPaths({
  data,
  language,
  onOpenTerm,
}: {
  data: WebsiteKnowledge;
  language: UiLanguage;
  onOpenTerm: (id: string) => void;
}) {
  const editorialLanguage = language === 'de' ? 'de' : 'en';
  const [catalog, setCatalog] = useState<AppCatalog | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadWebsiteAppCatalog(controller.signal)
      .then((result) => setCatalog(result.current))
      .catch(() => {
        /* Books remain available if the audio snapshot fails validation. */
      });
    return () => controller.abort();
  }, []);
  const paths = learningPathsForKnowledge(data);
  const listening = learningPodcastsForKnowledge(data, catalog);
  return (
    <section
      className="website-learning-paths"
      aria-label={editorialLanguage === 'de' ? 'Lernpfade' : 'Learning paths'}
      lang={editorialLanguage}
    >
      <h2>{editorialLanguage === 'de' ? 'Lernpfade' : 'Learning paths'}</h2>
      <p>
        {editorialLanguage === 'de'
          ? 'Redaktionelle Lesepfade · Entwurf. Bücher öffnen bei der Originalquelle.'
          : 'Editorial reading paths · draft. Books open at their original source.'}
      </p>
      {!['de', 'en'].includes(language) ? (
        <p>
          These editorial notes are available in German and English. The English version is shown.
        </p>
      ) : null}
      {paths.map((path) => (
        <details key={path.id} data-learning-path={path.id}>
          <summary>
            {path.title[editorialLanguage]} · {path.entries.length}
          </summary>
          <ol>
            {path.entries.map((entry) => (
              <li key={entry.bookId} data-learning-book={entry.bookId}>
                <a
                  href={entry.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  lang={entry.book.languages[0]}
                >
                  {entry.book.title}
                </a>{' '}
                · {entry.book.languages.join(', ')}
                <p>{entry.note[editorialLanguage]}</p>
                <p>
                  {entry.terms.map((term) => (
                    <button type="button" key={term.id} onClick={() => onOpenTerm(term.id)}>
                      {term.title[editorialLanguage]}
                    </button>
                  ))}
                </p>
              </li>
            ))}
          </ol>
          {listening.find((item) => item.id === path.id)?.entries.length ? (
            <>
              <h3>Podcasts</h3>
              <ol>
                {listening
                  .find((item) => item.id === path.id)!
                  .entries.map((entry) => (
                    <li key={entry.episodeId} data-learning-podcast={entry.episodeId}>
                      <a
                        href={entry.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                      >
                        {entry.episode.title}
                      </a>
                      <p>{entry.note[editorialLanguage]}</p>
                      <p>
                        {entry.terms.map((term) => (
                          <button type="button" key={term.id} onClick={() => onOpenTerm(term.id)}>
                            {term.title[editorialLanguage]}
                          </button>
                        ))}
                      </p>
                    </li>
                  ))}
              </ol>
            </>
          ) : null}
        </details>
      ))}
    </section>
  );
}
