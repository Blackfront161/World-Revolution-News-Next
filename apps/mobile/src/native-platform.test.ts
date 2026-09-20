import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  canonicalShareUrl,
  createNativePlatformSession,
  nativeRouteHash,
  type NativePlatformRuntime,
  type WRNPlatformPlugin,
} from './native-platform';

type Listener = (event: Record<string, unknown>) => void;

function createRuntime(available = true): {
  readonly runtime: NativePlatformRuntime;
  readonly plugin: WRNPlatformPlugin;
  emit(name: 'route' | 'back', event: Record<string, unknown>): void;
  readonly removals: ReturnType<typeof vi.fn>;
} {
  const listeners = new Map<string, Listener>();
  const removals = vi.fn(async () => undefined);
  const plugin: WRNPlatformPlugin = {
    share: vi.fn(async () => undefined),
    setWebReady: vi.fn(async () => undefined),
    acknowledgeBack: vi.fn(async () => undefined),
    addListener: vi.fn(async (name: 'route' | 'back', listener: Listener) => {
      listeners.set(name, listener);
      return { remove: removals };
    }),
  };
  return {
    runtime: { isAvailable: () => available, plugin },
    plugin,
    emit(name, event) {
      listeners.get(name)?.(event);
    },
    removals,
  };
}

afterEach(() => {
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
});

describe('native platform validation', () => {
  it('accepts only exact canonical article share URLs', () => {
    expect(canonicalShareUrl('https://solinaridao.com/articles/wrn-test-art-cedar/')).toBe(
      'https://solinaridao.com/articles/wrn-test-art-cedar/',
    );
    expect(canonicalShareUrl('https://solinaridao.com/articles/wrn-art-future-item/')).toBe(
      'https://solinaridao.com/articles/wrn-art-future-item/',
    );
    expect(
      canonicalShareUrl('https://solinaridao.com/articles/wrn-test-art-cedar/?x=1'),
    ).toBeNull();
    expect(canonicalShareUrl('https://other.example/articles/wrn-test-art-cedar/')).toBeNull();
    expect(
      canonicalShareUrl('https://solinaridao.com/articles/wrn-test-art-cedar%2fextra/'),
    ).toBeNull();
  });

  it('maps only bounded app-owned routes to existing hashes', () => {
    expect(nativeRouteHash('discover/sources')).toBe('#discover/sources');
    expect(nativeRouteHash('article/wrn-art-future-item')).toBe('#article/wrn-art-future-item');
    expect(nativeRouteHash('archive/wrn-test-art-cedar')).toBe('#archive/wrn-test-art-cedar');
    expect(nativeRouteHash('https://other.example/')).toBeNull();
    expect(nativeRouteHash('article/wrn-art-good%2fbad')).toBeNull();
    expect(nativeRouteHash('../help')).toBeNull();
  });
});

describe('native platform session', () => {
  it('rejects unbound, missing and foreign history sessions and follows App session rotation', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { runtime, plugin, emit } = createRuntime();
    const session = createNativePlatformSession(runtime);
    await session.start();
    for (const position of [0, 2]) {
      window.history.replaceState(
        { wrnHistorySession: 'current', wrnHistoryPosition: position },
        '',
        '/#home',
      );
      emit('back', { requestId: '10' });
    }
    expect(back).not.toHaveBeenCalled();
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
    session.setHistorySession('current');
    for (const identity of [undefined, 'previous', 'unknown']) {
      for (const position of [0, 2]) {
        window.history.replaceState(
          { wrnHistorySession: identity, wrnHistoryPosition: position },
          '',
          '/#home',
        );
        emit('back', { requestId: '11' });
      }
    }
    expect(back).not.toHaveBeenCalled();
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
    session.setHistorySession('rotated');
    window.history.replaceState(
      { wrnHistorySession: 'current', wrnHistoryPosition: 0 },
      '',
      '/#home',
    );
    emit('back', { requestId: '12' });
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
    window.history.replaceState(
      { wrnHistorySession: 'rotated', wrnHistoryPosition: 0 },
      '',
      '/#home',
    );
    emit('back', { requestId: '13' });
    expect(plugin.acknowledgeBack).toHaveBeenCalledWith({ requestId: '13' });
    session.setHistorySession(null);
    emit('back', { requestId: '14' });
    expect(plugin.acknowledgeBack).toHaveBeenCalledTimes(1);
    session.dispose();
  });

  it('ignores queued route and Back callbacks after disposal while removals are pending', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { runtime, plugin, emit, removals } = createRuntime();
    removals.mockImplementation(() => new Promise<void>(() => undefined));
    const session = createNativePlatformSession(runtime);
    await session.start();
    window.history.replaceState({ wrnHistoryPosition: 2 }, '', '/#home');
    session.dispose();
    emit('route', { deliveryId: '20', route: 'help' });
    emit('back', { requestId: '21' });
    expect(window.location.hash).toBe('#home');
    expect(back).not.toHaveBeenCalled();
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
  });
  it('keeps browser startup and uses browser sharing without the plugin', async () => {
    const { runtime, plugin } = createRuntime(false);
    const writeText = vi.fn(async () => undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    try {
      const session = createNativePlatformSession(runtime);
      await session.start();
      await session.shareAdapter.share('https://solinaridao.com/articles/wrn-test-art-cedar/');
      expect(plugin.addListener).not.toHaveBeenCalled();
      expect(plugin.share).not.toHaveBeenCalled();
      expect(writeText).toHaveBeenCalledWith(
        'https://solinaridao.com/articles/wrn-test-art-cedar/',
      );
    } finally {
      if (originalClipboard === undefined) {
        delete (window.navigator as { clipboard?: unknown }).clipboard;
      } else {
        Object.defineProperty(window.navigator, 'clipboard', originalClipboard);
      }
    }
  });

  it('contains availability and removal failures, including late registration', async () => {
    const failed = createRuntime();
    const unavailable = createNativePlatformSession({
      ...failed.runtime,
      isAvailable: () => {
        throw new Error('Unavailable native runtime');
      },
    });
    await expect(unavailable.start()).resolves.toBeUndefined();
    const { runtime, removals, emit, plugin } = createRuntime();
    removals.mockRejectedValue(new Error('Listener already removed'));
    const session = createNativePlatformSession(runtime);
    await session.start();
    session.dispose();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    emit('route', { deliveryId: '24', route: 'help' });
    expect(window.location.hash).toBe('');
    expect(removals).toHaveBeenCalledTimes(2);
    expect(plugin.setWebReady).toHaveBeenLastCalledWith({ ready: false });

    const late = createRuntime();
    let resolveListener: ((handle: PluginListenerHandle) => void) | undefined;
    vi.mocked(late.plugin.addListener).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveListener = resolve;
        }),
    );
    const lateSession = createNativePlatformSession(late.runtime);
    const started = lateSession.start();
    lateSession.dispose();
    resolveListener?.({
      remove: async () => {
        throw new Error('Late removal failed');
      },
    });
    await expect(started).resolves.toBeUndefined();
    expect(late.plugin.setWebReady).not.toHaveBeenCalled();
  });

  it('disarms instead of rearming when disposal races pending readiness', async () => {
    const { runtime, plugin, emit } = createRuntime();
    let resolveReady: (() => void) | undefined;
    vi.mocked(plugin.setWebReady).mockImplementation(({ ready }) =>
      ready
        ? new Promise<void>((resolve) => {
            resolveReady = resolve;
          })
        : Promise.resolve(),
    );
    const session = createNativePlatformSession(runtime);
    const started = session.start();
    await vi.waitFor(() => expect(resolveReady).toBeDefined());
    session.dispose();
    resolveReady?.();
    await started;
    expect(plugin.setWebReady).toHaveBeenLastCalledWith({ ready: false });
    emit('route', { deliveryId: '25', route: 'help' });
    expect(window.location.hash).toBe('');
  });

  it('delivers a retained route once and removes listeners during cleanup', async () => {
    const { runtime, plugin, emit, removals } = createRuntime();
    const session = createNativePlatformSession(runtime);
    await session.start();
    emit('route', { deliveryId: '1', route: 'discover/news' });
    emit('route', { deliveryId: '1', route: 'help' });
    expect(window.location.hash).toBe('#discover/news');
    expect(plugin.setWebReady).toHaveBeenCalledWith({ ready: true });
    session.dispose();
    await Promise.resolve();
    expect(plugin.setWebReady).toHaveBeenCalledWith({ ready: false });
    expect(removals).toHaveBeenCalledTimes(2);
  });

  it('removes a listener that resolves after the session has been disposed', async () => {
    let resolveListener: ((handle: PluginListenerHandle) => void) | undefined;
    const remove = vi.fn(async () => undefined);
    const plugin: WRNPlatformPlugin = {
      share: vi.fn(async () => undefined),
      setWebReady: vi.fn(async () => undefined),
      acknowledgeBack: vi.fn(async () => undefined),
      addListener: vi.fn(
        () =>
          new Promise<PluginListenerHandle>((resolve) => {
            resolveListener = resolve;
          }),
      ),
    };
    const session = createNativePlatformSession({ isAvailable: () => true, plugin });
    const started = session.start();
    session.dispose();
    resolveListener?.({ remove });
    await started;
    expect(remove).toHaveBeenCalledOnce();
    expect(plugin.setWebReady).not.toHaveBeenCalled();
  });

  it('uses guarded history and only acknowledges the marked root request', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { runtime, plugin, emit } = createRuntime();
    const session = createNativePlatformSession(runtime);
    session.setHistorySession('current');
    await session.start();
    window.history.replaceState(
      { wrnHistorySession: 'current', wrnHistoryPosition: 2 },
      '',
      '/#discover/news',
    );
    emit('back', { requestId: '5' });
    expect(back).toHaveBeenCalledOnce();
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
    window.history.replaceState(
      { wrnHistorySession: 'current', wrnHistoryPosition: 0 },
      '',
      '/#home',
    );
    emit('back', { requestId: '6' });
    await Promise.resolve();
    expect(plugin.acknowledgeBack).toHaveBeenCalledWith({ requestId: '6' });
    emit('back', { requestId: '0' });
    expect(plugin.acknowledgeBack).toHaveBeenCalledTimes(1);
  });

  it('does not acknowledge root Back while the existing dirty-draft guard is active', async () => {
    const beforeUnload = (event: Event) => event.preventDefault();
    window.addEventListener('beforeunload', beforeUnload);
    const { runtime, plugin, emit } = createRuntime();
    const session = createNativePlatformSession(runtime);
    session.setHistorySession('current');
    await session.start();
    window.history.replaceState(
      { wrnHistorySession: 'current', wrnHistoryPosition: 0 },
      '',
      '/#help',
    );
    emit('back', { requestId: '7' });
    await Promise.resolve();
    expect(plugin.acknowledgeBack).not.toHaveBeenCalled();
    window.removeEventListener('beforeunload', beforeUnload);
  });
});
