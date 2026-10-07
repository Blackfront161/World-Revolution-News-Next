import { useEffect, useMemo, useState } from 'react';
import { projectDirectorySourcePreferences } from '@wrn/domain';
import { useSourcePreferences } from '../../../../../packages/browser-content/src/source-preferences-ui';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
  type WebsiteContentDirectory,
} from '../directory/directory-loader';
import {
  loadNewsReadingState,
  newsReadingStorageKey,
  newsReadingChangedEvent,
} from './news-reading-state';

export function useWebsiteNews() {
  const [data, setData] = useState<WebsiteContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const preferences = useSourcePreferences();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const unsubscribe = subscribeWebsiteContentDirectory((next) => {
      if (active) setData(next);
    });
    void loadWebsiteContentDirectory(controller.signal).then(
      (next) => {
        if (active) {
          setData(next);
          setFailed(false);
        }
      },
      () => {
        if (active) {
          setData(null);
          setFailed(true);
        }
      },
    );
    return () => {
      active = false;
      controller.abort();
      unsubscribe();
    };
  }, [attempt]);
  const articles = useMemo(
    () =>
      data
        ? projectDirectorySourcePreferences({
            articles: data.projection.articles,
            sources: data.projection.sources,
            preferences: preferences.state,
          })
        : [],
    [data, preferences.state],
  );
  return { data, articles, failed, retry: () => setAttempt((value) => value + 1) };
}
export function useNewsReadingState() {
  const [result, setResult] = useState(() => loadNewsReadingState());
  useEffect(() => {
    const reload = () => setResult(loadNewsReadingState());
    const storage = (event: StorageEvent) => {
      if (event.key === newsReadingStorageKey || event.key === null) reload();
    };
    window.addEventListener(newsReadingChangedEvent, reload);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', reload);
    return () => {
      window.removeEventListener(newsReadingChangedEvent, reload);
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', reload);
    };
  }, []);
  return [result, setResult] as const;
}
