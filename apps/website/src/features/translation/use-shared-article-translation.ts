import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  knownSourceLanguage,
  translateSharedArticle,
  type SharedArticleInput,
  type SharedArticleOutcome,
} from './shared-article-translation';

export function useSharedArticleTranslation(
  input: SharedArticleInput | null,
  binding: string,
  expiresAt: number,
) {
  const key = JSON.stringify([binding, expiresAt, input]);
  const current = useRef(key);
  useLayoutEffect(() => {
    current.current = key;
  }, [key]);
  const [attempt, setAttempt] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [state, setState] = useState<{
    key: string;
    outcome: SharedArticleOutcome | { kind: 'loading' };
  } | null>(null);
  const eligible =
    input !== null &&
    knownSourceLanguage(input.sourceLanguage) !== null &&
    knownSourceLanguage(input.sourceLanguage) !== input.targetLanguage;
  useEffect(() => {
    if (!eligible || !input || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
    const controller = new AbortController();
    let active = true;
    const offline = () => {
      controller.abort();
      setOnline(false);
      setState((previous) =>
        previous?.key === key && previous.outcome.kind === 'translated'
          ? previous
          : { key, outcome: { kind: 'offline' } },
      );
    };
    const connected = () => setOnline(true);
    window.addEventListener('offline', offline);
    window.addEventListener('online', connected);
    // StrictMode's discarded first mount must not spend a provider request.
    queueMicrotask(() => {
      if (!active || controller.signal.aborted) return;
      setState({ key, outcome: { kind: 'loading' } });
      void translateSharedArticle(input, controller.signal).then((outcome) => {
        if (
          active &&
          current.current === key &&
          !controller.signal.aborted &&
          expiresAt > Date.now()
        )
          setState({ key, outcome });
      });
    });
    const expiry = setTimeout(
      () => {
        controller.abort();
        setState({ key, outcome: { kind: 'discarded' } });
      },
      Math.min(2147483647, Math.max(0, expiresAt - Date.now())),
    );
    return () => {
      active = false;
      controller.abort();
      clearTimeout(expiry);
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', connected);
    };
    // The immutable key contains the complete public input and local authority.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, eligible, attempt]);
  const unknownLanguage = input !== null && knownSourceLanguage(input.sourceLanguage) === null;
  const outcome = unknownLanguage
    ? { kind: 'unavailable' as const }
    : eligible && state?.key === key
      ? state.outcome
      : null;
  return { outcome, online, retry: () => setAttempt((value) => value + 1) };
}
