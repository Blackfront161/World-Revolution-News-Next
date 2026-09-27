import { useEffect, useState } from 'react';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { loadBundledSourcePassOverlay, type SourcePassLoadResult } from './source-pass-overlay';

export type SourcePassLoadState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'ready'; value: SourcePassLoadResult }>
  | Readonly<{ kind: 'invalid' }>;

export function useSourcePassOverlay(
  directory: MobileContentDirectory | null,
): SourcePassLoadState {
  const [state, setState] = useState<SourcePassLoadState>({ kind: 'loading' });
  useEffect(() => {
    if (directory === null) {
      setState({ kind: 'loading' });
      return;
    }
    let active = true;
    const controller = new AbortController();
    const online = navigator.onLine;
    setState({ kind: 'loading' });
    loadBundledSourcePassOverlay(directory, {
      signal: controller.signal,
      online: false,
      refreshOverlay: false,
      allowDirect: !online,
    })
      .then((value) => {
        if (!active) return;
        if (value === null) {
          setState({ kind: 'invalid' });
          return;
        }
        setState({ kind: 'ready', value });
        loadBundledSourcePassOverlay(directory, { signal: controller.signal, online })
          .then((refreshed) => {
            if (active && refreshed !== null) setState({ kind: 'ready', value: refreshed });
          })
          .catch(() => undefined);
      })
      .catch(() => {
        if (active && !controller.signal.aborted) setState({ kind: 'invalid' });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [directory]);
  return state;
}
