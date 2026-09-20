export type MobileMediaPlayback = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export type MobileMediaAvailability = 'local' | 'offline' | 'stale' | 'blocked' | 'storage-failure';
export type MobileMediaAsset = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
  expiresAt: number;
  identity?: string;
}>;
export type MobileMediaAudioElement = {
  src: string;
  load(): void;
  play(): Promise<void>;
  pause(): void;
  currentTime: number;
  onpause: ((event: Event) => void) | null;
  onended: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
};
export type MobileMediaPlayerState = Readonly<{
  playback: MobileMediaPlayback;
  availability: MobileMediaAvailability;
  error: 'network-error' | 'invalid' | 'storage-failure' | null;
}>;
export type MobileMediaPlayerContext =
  | Readonly<{ availability: 'local'; asset: MobileMediaAsset }>
  | Readonly<{ availability: Exclude<MobileMediaAvailability, 'local'> }>;
export type MobileMediaPlayerDependencies = Readonly<{
  context(): Promise<MobileMediaPlayerContext | null>;
  fetch?: typeof fetch;
  clock?: () => number;
  audio?: () => MobileMediaAudioElement;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  onState?: (state: MobileMediaPlayerState) => void;
  onPause?: (positionMs: number) => void;
  onEnded?: () => void;
  onInvalidated?: (availability: MobileMediaAvailability) => void;
}>;

const maximumBytes = 262144;
const declaredLength = (value: string | null): number | null | undefined =>
  value === null ? undefined : /^\d+$/.test(value) ? Number(value) : null;
const makeState = (
  playback: MobileMediaPlayback,
  availability: MobileMediaAvailability,
  error: MobileMediaPlayerState['error'] = null,
): MobileMediaPlayerState => Object.freeze({ playback, availability, error });
const identity = (
  context: Extract<MobileMediaPlayerContext, Readonly<{ availability: 'local' }>>,
) =>
  [
    context.availability,
    context.asset.path,
    context.asset.bytes,
    context.asset.sha256,
    context.asset.expiresAt,
    context.asset.identity ?? '',
  ].join('|');
const digest = async (bytes: Uint8Array) => {
  const value = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

async function readBody(
  response: Response,
  signal: AbortSignal,
): Promise<{ kind: 'ready'; bytes: Uint8Array } | { kind: 'invalid' | 'network-error' }> {
  if (!response.body) return { kind: 'invalid' };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      if (signal.aborted) return { kind: 'network-error' };
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        return { kind: 'invalid' };
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { kind: 'ready', bytes };
  } catch {
    return { kind: 'network-error' };
  } finally {
    reader.releaseLock();
  }
}

export function createMobileMediaPlayer(dependencies: MobileMediaPlayerDependencies) {
  const request = dependencies.fetch ?? fetch;
  const clock = dependencies.clock ?? Date.now;
  const audio = dependencies.audio ?? (() => document.createElement('audio'));
  const create = dependencies.createObjectURL ?? URL.createObjectURL;
  const revoke = dependencies.revokeObjectURL ?? URL.revokeObjectURL;
  let mounted = true;
  let run = 0;
  let controller: AbortController | null = null;
  let timeout: Readonly<{ token: number; id: ReturnType<typeof setTimeout> }> | null = null;
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;
  let element: MobileMediaAudioElement | null = null;
  let objectUrl: string | null = null;
  let availability: MobileMediaAvailability = 'local';
  let playback: MobileMediaPlayback = 'idle';
  let lastError: MobileMediaPlayerState['error'] = null;
  let verifiedBytes = false;
  let verifiedIdentity: string | null = null;
  let verifiedExpiry: number | null = null;
  const publish = () => dependencies.onState?.(makeState(playback, availability, lastError));
  const owns = (
    token: number,
    signal: AbortSignal,
    expectedElement?: MobileMediaAudioElement,
    expectedUrl?: string,
  ) =>
    mounted &&
    token === run &&
    !signal.aborted &&
    (expectedElement === undefined || element === expectedElement) &&
    (expectedUrl === undefined || objectUrl === expectedUrl);
  const revokeOnce = () => {
    if (objectUrl !== null) {
      const value = objectUrl;
      objectUrl = null;
      try {
        revoke(value);
      } catch {
        // A browser revoke failure must not resurrect a terminal run.
      }
    }
  };
  const detach = () => {
    // Terminal events must also settle any guarded continuation await.
    controller?.abort();
    if (timeout !== null) clearTimeout(timeout.id);
    timeout = null;
    if (expiryTimer !== null) clearTimeout(expiryTimer);
    expiryTimer = null;
    if (element !== null) {
      const previous = element;
      element = null;
      previous.onpause = previous.onended = previous.onerror = null;
      try {
        previous.pause();
      } catch {
        /* terminal cleanup continues */
      }
      try {
        previous.src = '';
        previous.load();
      } catch {
        /* terminal cleanup continues */
      }
    }
    revokeOnce();
    verifiedBytes = false;
    verifiedIdentity = null;
    verifiedExpiry = null;
  };
  const invalidate = (nextAvailability: MobileMediaAvailability = availability, notify = true) => {
    run += 1;
    availability = nextAvailability;
    controller?.abort();
    controller = null;
    detach();
    playback = 'idle';
    lastError = nextAvailability === 'storage-failure' ? 'storage-failure' : null;
    if (notify && mounted) publish();
    dependencies.onInvalidated?.(nextAvailability);
  };
  const terminal = (token: number, signal: AbortSignal, error: MobileMediaPlayerState['error']) => {
    if (!owns(token, signal)) return;
    detach();
    playback = 'error';
    // A current persistence recheck is a terminal availability transition as
    // well as a player error.  Other terminal categories intentionally retain
    // their existing availability semantics.
    if (error === 'storage-failure') availability = 'storage-failure';
    lastError = error;
    publish();
  };
  const currentContext = async (): Promise<MobileMediaPlayerContext | null> => {
    try {
      return await dependencies.context();
    } catch {
      return { availability: 'storage-failure' };
    }
  };
  const stillCurrent = async (token: number, signal: AbortSignal, expected: string) => {
    if (!owns(token, signal)) return { kind: 'gone' as const };
    const next = await currentContext();
    if (!owns(token, signal)) return { kind: 'gone' as const };
    if (next === null) return { kind: 'invalid' as const, availability: 'stale' as const };
    if (next.availability === 'storage-failure') return { kind: 'storage-failure' as const };
    if (next.availability !== 'local')
      return { kind: 'invalid' as const, availability: next.availability };
    if (clock() >= next.asset.expiresAt || identity(next) !== expected)
      return { kind: 'invalid' as const, availability: 'stale' as const };
    return { kind: 'ready' as const, context: next };
  };
  const bindHandlers = (
    token: number,
    signal: AbortSignal,
    created: MobileMediaAudioElement,
    url: string,
  ) => {
    created.onpause = () => {
      if (owns(token, signal, created, url) && playback === 'playing') {
        playback = 'paused';
        lastError = null;
        publish();
        dependencies.onPause?.(Math.max(0, Math.trunc(created.currentTime * 1000)));
      }
    };
    created.onended = () => {
      if (owns(token, signal, created, url)) {
        detach();
        playback = 'ended';
        lastError = null;
        publish();
        dependencies.onEnded?.();
      }
    };
    created.onerror = () => {
      if (owns(token, signal, created, url)) terminal(token, signal, 'invalid');
    };
  };
  const awaitBound = <T>(value: Promise<T>, signal: AbortSignal) =>
    new Promise<{ kind: 'ready'; value: T } | { kind: 'gone' } | { kind: 'rejected' }>(
      (resolve) => {
        let settled = false;
        const finish = (
          result: { kind: 'ready'; value: T } | { kind: 'gone' } | { kind: 'rejected' },
        ) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener('abort', aborted);
          resolve(result);
        };
        const aborted = () => finish({ kind: 'gone' });
        signal.addEventListener('abort', aborted, { once: true });
        void value.then(
          (result) => finish({ kind: 'ready', value: result }),
          () => finish({ kind: 'rejected' }),
        );
        if (signal.aborted) aborted();
      },
    );
  const continuingContext = async (signal: AbortSignal, expected: string) => {
    const next = await awaitBound(currentContext(), signal);
    if (next.kind !== 'ready') return next;
    if (next.value === null) return { kind: 'invalid' as const, availability: 'stale' as const };
    if (next.value.availability === 'storage-failure') return { kind: 'storage-failure' as const };
    if (next.value.availability !== 'local')
      return { kind: 'invalid' as const, availability: next.value.availability };
    if (clock() >= next.value.asset.expiresAt || identity(next.value) !== expected)
      return { kind: 'invalid' as const, availability: 'stale' as const };
    return { kind: 'ready' as const, context: next.value };
  };
  const canContinuePaused = () =>
    playback === 'paused' &&
    verifiedBytes &&
    element !== null &&
    objectUrl !== null &&
    verifiedIdentity !== null &&
    verifiedExpiry !== null;
  const continuePaused = async () => {
    const preservedElement = element;
    const preservedUrl = objectUrl;
    const expected = verifiedIdentity;
    const preservedExpiry = verifiedExpiry;
    if (
      preservedElement === null ||
      preservedUrl === null ||
      expected === null ||
      preservedExpiry === null
    )
      return;

    run += 1;
    controller?.abort();
    if (timeout !== null) clearTimeout(timeout.id);
    timeout = null;
    if (expiryTimer !== null) clearTimeout(expiryTimer);
    expiryTimer = null;
    const token = run;
    controller = new AbortController();
    const signal = controller.signal;
    bindHandlers(token, signal, preservedElement, preservedUrl);
    let phase: 'context' | 'play' = 'context';
    const deadline = Object.freeze({
      token,
      id: setTimeout(() => {
        if (!owns(token, signal, preservedElement, preservedUrl)) return;
        if (clock() >= preservedExpiry) {
          invalidate('stale');
          return;
        }
        controller?.abort();
        detach();
        playback = 'error';
        availability = phase === 'context' ? 'storage-failure' : 'local';
        lastError = phase === 'context' ? 'storage-failure' : 'network-error';
        publish();
      }, 5000),
    });
    timeout = deadline;
    expiryTimer = setTimeout(
      () => {
        if (owns(token, signal, preservedElement, preservedUrl)) invalidate('stale');
      },
      Math.max(0, preservedExpiry - clock()),
    );
    // The Hub uses this existing callback as its lifecycle-epoch handoff.  It
    // intentionally happens after the new owner is bound and before any await.
    dependencies.onInvalidated?.('local');
    try {
      const beforePlay = await continuingContext(signal, expected);
      if (!owns(token, signal, preservedElement, preservedUrl)) return;
      if (beforePlay.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (beforePlay.kind !== 'ready') {
        if (beforePlay.kind === 'invalid') invalidate(beforePlay.availability);
        return;
      }
      phase = 'play';
      const played = await awaitBound(
        Promise.resolve().then(() =>
          owns(token, signal, preservedElement, preservedUrl) ? preservedElement.play() : undefined,
        ),
        signal,
      );
      if (!owns(token, signal, preservedElement, preservedUrl)) return;
      if (played.kind === 'rejected') {
        terminal(token, signal, 'network-error');
        return;
      }
      if (played.kind !== 'ready') return;
      phase = 'context';
      const afterPlay = await continuingContext(signal, expected);
      if (!owns(token, signal, preservedElement, preservedUrl)) return;
      if (afterPlay.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (afterPlay.kind !== 'ready') {
        if (afterPlay.kind === 'invalid') invalidate(afterPlay.availability);
        return;
      }
      playback = 'playing';
      lastError = null;
      publish();
    } finally {
      if (timeout === deadline) {
        clearTimeout(deadline.id);
        timeout = null;
      }
    }
  };
  const start = async () => {
    if (canContinuePaused()) {
      await continuePaused();
      return;
    }
    invalidate(availability, false);
    const token = run;
    controller = new AbortController();
    const signal = controller.signal;
    const initial = await currentContext();
    if (!owns(token, signal)) return;
    if (
      initial === null ||
      initial.availability !== 'local' ||
      clock() >= initial.asset.expiresAt
    ) {
      const nextAvailability =
        initial?.availability === 'blocked'
          ? 'blocked'
          : initial?.availability === 'storage-failure'
            ? 'storage-failure'
            : 'stale';
      invalidate(nextAvailability);
      return;
    }
    const expected = identity(initial);
    availability = 'local';
    playback = 'loading';
    lastError = null;
    publish();
    expiryTimer = setTimeout(
      () => {
        if (owns(token, signal)) invalidate('stale');
      },
      Math.max(0, initial.asset.expiresAt - clock()),
    );
    const localTimeout = Object.freeze({
      token,
      id: setTimeout(() => {
        if (!owns(token, signal)) return;
        controller?.abort();
        detach();
        playback = 'error';
        lastError = 'network-error';
        publish();
      }, 5000),
    });
    timeout = localTimeout;
    try {
      const beforeRequest = await stillCurrent(token, signal, expected);
      if (beforeRequest.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (beforeRequest.kind !== 'ready') {
        if (beforeRequest.kind === 'invalid') invalidate(beforeRequest.availability);
        return;
      }
      const response = await request(beforeRequest.context.asset.path, {
        signal,
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
      if (!owns(token, signal)) return;
      const length = declaredLength(response.headers.get('content-length'));
      if (
        response.status !== 200 ||
        response.headers.has('content-range') ||
        response.headers.get('content-type') !== 'audio/wav' ||
        length === null ||
        (length !== undefined &&
          (length > maximumBytes || length !== beforeRequest.context.asset.bytes))
      ) {
        terminal(token, signal, 'invalid');
        return;
      }
      const read = await readBody(response, signal);
      if (!owns(token, signal)) return;
      if (
        read.kind !== 'ready' ||
        read.bytes.byteLength !== beforeRequest.context.asset.bytes ||
        read.bytes.byteLength > maximumBytes ||
        (await digest(read.bytes)) !== beforeRequest.context.asset.sha256
      ) {
        terminal(token, signal, read.kind === 'network-error' ? 'network-error' : 'invalid');
        return;
      }
      const beforeDecoder = await stillCurrent(token, signal, expected);
      if (beforeDecoder.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (beforeDecoder.kind !== 'ready') {
        if (beforeDecoder.kind === 'invalid') invalidate(beforeDecoder.availability);
        return;
      }
      const blobBytes = read.bytes.buffer.slice(
        read.bytes.byteOffset,
        read.bytes.byteOffset + read.bytes.byteLength,
      ) as ArrayBuffer;
      objectUrl = create(new Blob([blobBytes], { type: 'audio/wav' }));
      if (!owns(token, signal)) {
        revokeOnce();
        return;
      }
      const created = audio();
      const url = objectUrl;
      element = created;
      bindHandlers(token, signal, created, url);
      const beforeSrc = await stillCurrent(token, signal, expected);
      if (beforeSrc.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (beforeSrc.kind !== 'ready') {
        if (beforeSrc.kind === 'invalid') invalidate(beforeSrc.availability);
        return;
      }
      verifiedBytes = true;
      verifiedIdentity = expected;
      verifiedExpiry = beforeSrc.context.asset.expiresAt;
      created.src = url;
      created.load();
      const beforePlay = await stillCurrent(token, signal, expected);
      if (beforePlay.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (beforePlay.kind !== 'ready') {
        if (beforePlay.kind === 'invalid') invalidate(beforePlay.availability);
        return;
      }
      await created.play();
      if (!owns(token, signal, created, url)) return;
      const afterPlay = await stillCurrent(token, signal, expected);
      if (afterPlay.kind === 'storage-failure') {
        terminal(token, signal, 'storage-failure');
        return;
      }
      if (afterPlay.kind !== 'ready') {
        if (afterPlay.kind === 'invalid') invalidate(afterPlay.availability);
        return;
      }
      playback = 'playing';
      lastError = null;
      publish();
    } catch {
      if (owns(token, signal)) terminal(token, signal, 'network-error');
    } finally {
      if (timeout === localTimeout) {
        clearTimeout(localTimeout.id);
        timeout = null;
      }
    }
  };
  const pause = () => {
    if (playback === 'playing') element?.pause();
  };
  const seek = (positionMs: number) => {
    if (
      !verifiedBytes ||
      element === null ||
      (playback !== 'playing' && playback !== 'paused') ||
      !Number.isSafeInteger(positionMs) ||
      positionMs < 0
    )
      return false;
    element.currentTime = positionMs / 1000;
    return true;
  };
  const stop = (nextAvailability: MobileMediaAvailability = availability) =>
    invalidate(nextAvailability);
  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    invalidate(availability, false);
  };
  return Object.freeze({
    start,
    pause,
    seek,
    stop,
    unmount,
    invalidate,
    state: () => makeState(playback, availability, lastError),
  });
}
