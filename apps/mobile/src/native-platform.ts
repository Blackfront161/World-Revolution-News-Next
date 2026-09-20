import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { createBrowserShareAdapter } from '../../../packages/browser-content/src/browser-share';

const nativePluginName = 'WRNPlatform';
const canonicalArticleOrigin = 'https://solinaridao.com';
const safeArticleId = /^(?:wrn-test-art|wrn-art)-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const supportedTargets = new Set([
  'home',
  'following',
  'discover',
  'media',
  'events',
  'knowledge',
  'solidarity',
  'saved',
  'more',
  'help',
]);

type ShareAdapter = { readonly share: (url: string) => Promise<void> };

type RouteEvent = { readonly deliveryId?: unknown; readonly route?: unknown };
type BackEvent = { readonly requestId?: unknown };

export interface WRNPlatformPlugin {
  share(options: { readonly url: string }): Promise<void>;
  setWebReady(options: { readonly ready: boolean }): Promise<void>;
  acknowledgeBack(options: { readonly requestId: string }): Promise<void>;
  addListener(
    eventName: 'route' | 'back',
    listener: (event: RouteEvent | BackEvent) => void,
  ): Promise<PluginListenerHandle>;
}

export interface NativePlatformRuntime {
  readonly isAvailable: () => boolean;
  readonly plugin: WRNPlatformPlugin;
}

export interface NativePlatformSession {
  readonly shareAdapter: ShareAdapter;
  setHistorySession(session: string | null): void;
  start(): Promise<void>;
  dispose(): void;
}

const WRNPlatform = registerPlugin<WRNPlatformPlugin>(nativePluginName);

function nativeRuntime(): NativePlatformRuntime {
  return {
    isAvailable: () =>
      Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(nativePluginName),
    plugin: WRNPlatform,
  };
}

function isSafeArticleId(value: string): boolean {
  return safeArticleId.test(value);
}

/**
 * Revalidates the same canonical form that the domain share builder emits.
 * This structural check does not make an ID a known, shareable article.
 */
export function canonicalShareUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 256) return null;
  try {
    const parsed = new URL(value);
    const match = /^\/articles\/([^/]+)\/$/u.exec(parsed.pathname);
    if (
      parsed.protocol !== 'https:' ||
      parsed.origin !== canonicalArticleOrigin ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.port !== '' ||
      parsed.search !== '' ||
      parsed.hash !== '' ||
      match?.[1] === undefined ||
      !isSafeArticleId(match[1])
    ) {
      return null;
    }
    const canonical = `${canonicalArticleOrigin}/articles/${match[1]}/`;
    return value === canonical ? canonical : null;
  } catch {
    return null;
  }
}

/** Converts only explicit app-owned routes to the existing hash router. */
export function nativeRouteHash(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 160) return null;
  if (supportedTargets.has(value)) return `#${value}`;
  if (/^discover\/(?:news|sources|sport)$/u.test(value)) return `#${value}`;
  const article = /^article\/([^/]+)$/u.exec(value);
  if (article?.[1] !== undefined && isSafeArticleId(article[1])) return `#article/${article[1]}`;
  if (value === 'archive') return '#archive';
  const archive = /^archive\/([^/]+)$/u.exec(value);
  if (archive?.[1] !== undefined && isSafeArticleId(archive[1])) return `#archive/${archive[1]}`;
  return null;
}

function validDeliveryId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{0,15}$/u.test(value);
}

function validBackRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{0,15}$/u.test(value);
}

function managedHistoryPosition(historySession: string | null): number | null {
  const state = window.history.state;
  if (historySession === null || state === null || typeof state !== 'object') return null;
  if ((state as Record<string, unknown>).wrnHistorySession !== historySession) return null;
  const position = (state as Record<string, unknown>).wrnHistoryPosition;
  return Number.isSafeInteger(position) && typeof position === 'number' && position >= 0
    ? position
    : null;
}

function draftGuardIsActive(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function removeHandles(handles: readonly PluginListenerHandle[]): Promise<void> {
  // A failed removal must not leave the remaining handles registered, or create
  // an unhandled rejection during page teardown. Callbacks also check active.
  await Promise.allSettled(handles.map(async (handle) => handle.remove()));
}

/**
 * Creates a platform session without changing application routing contracts.
 * Startup is explicit so main.tsx can render the app before native Back is armed.
 */
export function createNativePlatformSession(
  runtime: NativePlatformRuntime = nativeRuntime(),
): NativePlatformSession {
  let active = true;
  let ready = false;
  let historySession: string | null = null;
  let startPromise: Promise<void> | null = null;
  const handles: PluginListenerHandle[] = [];
  const deliveredRouteIds: string[] = [];
  const browserShareAdapter = createBrowserShareAdapter();

  const shareAdapter: ShareAdapter = Object.freeze({
    async share(url: string): Promise<void> {
      const canonical = canonicalShareUrl(url);
      if (!active) throw new Error('Native platform session is disposed');
      if (canonical === null) throw new Error('Invalid canonical share URL');
      if (!runtime.isAvailable()) {
        await browserShareAdapter.share(canonical);
        return;
      }
      await runtime.plugin.share({ url: canonical });
    },
  });

  const onRoute = (event: RouteEvent | BackEvent) => {
    if (!active) return;
    const routeEvent = event as RouteEvent;
    if (
      !validDeliveryId(routeEvent.deliveryId) ||
      deliveredRouteIds.includes(routeEvent.deliveryId)
    ) {
      return;
    }
    const hash = nativeRouteHash(routeEvent.route);
    if (hash === null) return;
    deliveredRouteIds.push(routeEvent.deliveryId);
    if (deliveredRouteIds.length > 32) deliveredRouteIds.shift();
    if (window.location.hash !== hash) window.location.hash = hash;
  };

  const onBack = (event: RouteEvent | BackEvent) => {
    if (!active) return;
    const requestId = (event as BackEvent).requestId;
    if (!validBackRequestId(requestId)) return;
    const position = managedHistoryPosition(historySession);
    if (position !== null && position > 0) {
      window.history.back();
      return;
    }
    // A root acknowledgement is allowed only for the app's marked root entry.
    // A dirty support draft prevents it, leaving the existing guard in control.
    if (position !== 0 || draftGuardIsActive()) return;
    void runtime.plugin.acknowledgeBack({ requestId }).catch(() => undefined);
  };

  return {
    shareAdapter,
    setHistorySession(session): void {
      if (active) historySession = session;
    },
    start(): Promise<void> {
      if (startPromise !== null) return startPromise;
      startPromise = (async () => {
        try {
          if (!active || !runtime.isAvailable()) return;
          const routeHandle = await runtime.plugin.addListener('route', onRoute);
          if (!active) {
            await removeHandles([routeHandle]);
            return;
          }
          handles.push(routeHandle);
          const backHandle = await runtime.plugin.addListener('back', onBack);
          if (!active) {
            await removeHandles([backHandle, ...handles.splice(0)]);
            return;
          }
          handles.push(backHandle);
          await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          if (!active) return;
          await runtime.plugin.setWebReady({ ready: true });
          if (!active) {
            await runtime.plugin.setWebReady({ ready: false });
            return;
          }
          ready = true;
        } catch {
          active = false;
          historySession = null;
          await removeHandles(handles.splice(0));
        }
      })();
      return startPromise;
    },
    dispose(): void {
      active = false;
      historySession = null;
      if (ready) {
        void runtime.plugin.setWebReady({ ready: false }).catch(() => undefined);
        ready = false;
      }
      void removeHandles(handles.splice(0));
    },
  };
}
