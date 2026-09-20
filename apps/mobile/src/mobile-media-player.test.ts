import { describe, expect, it, vi } from 'vitest';
import { createMobileMediaPlayer, type MobileMediaAudioElement } from './mobile-media-player';

const bytes = new Uint8Array([1, 2, 3, 4]);
const expiresAt = Date.now() + 1_000_000;
const hash = async () => {
  const result = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
};
const element = (): MobileMediaAudioElement => ({
  src: '',
  currentTime: 0,
  load: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  onpause: null,
  onended: null,
  onerror: null,
});
const context = async () => ({
  availability: 'local' as const,
  asset: {
    path: '/local.wav',
    bytes: bytes.byteLength,
    sha256: await hash(),
    expiresAt,
    identity: 'active',
  },
});
const response = (body = bytes, headers: Record<string, string> = {}) =>
  new Response(body, { status: 200, headers: { 'content-type': 'audio/wav', ...headers } });

const continuedRig = async (phase: 'pre-context' | 'play' | 'post-context', expiry = 60_000) => {
  const initial = await context();
  const stable = { ...initial, asset: { ...initial.asset, expiresAt: expiry } };
  let now = 0;
  let continuing = false;
  let plays = 0;
  let enter!: () => void;
  const entered = new Promise<void>((resolve) => {
    enter = resolve;
  });
  let resolve!: (value: typeof stable) => void;
  let reject!: (reason: Error) => void;
  const held = new Promise<typeof stable>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  const audio = element();
  audio.play = vi.fn(() => {
    plays += 1;
    if (continuing && phase === 'play') {
      enter();
      return held.then(() => undefined);
    }
    return Promise.resolve();
  });
  const request = vi.fn(async () => response());
  const factory = vi.fn(() => audio);
  const create = vi.fn(() => 'blob:rig');
  const revoke = vi.fn();
  const stateChanges = vi.fn();
  const onPause = vi.fn();
  const onEnded = vi.fn();
  const onInvalidated = vi.fn();
  const player = createMobileMediaPlayer({
    context: async () => {
      if (continuing && (phase === 'pre-context' || (phase === 'post-context' && plays === 2))) {
        enter();
        return held;
      }
      return stable;
    },
    clock: () => now,
    fetch: request,
    audio: factory,
    createObjectURL: create,
    revokeObjectURL: revoke,
    onState: stateChanges,
    onPause,
    onEnded,
    onInvalidated,
  });
  await player.start();
  audio.currentTime = 0.01;
  const old = [audio.onpause, audio.onended, audio.onerror] as const;
  audio.onpause?.(new Event('pause'));
  continuing = true;
  let settled = false;
  const pending = player.start().then(() => {
    settled = true;
  });
  await entered;
  const active = [audio.onpause, audio.onended, audio.onerror] as const;
  const picture = () => ({
    state: player.state(),
    position: audio.currentTime,
    src: audio.src,
    requests: request.mock.calls.length,
    factories: factory.mock.calls.length,
    made: create.mock.calls.length,
    revoked: revoke.mock.calls.length,
    loads: vi.mocked(audio.load).mock.calls.length,
    plays,
    pauses: onPause.mock.calls.length,
    ended: onEnded.mock.calls.length,
    invalidated: onInvalidated.mock.calls.map(([value]) => value),
    publications: stateChanges.mock.calls.map(([value]) => value),
    timers: vi.getTimerCount(),
  });
  const drain = async () => {
    for (let index = 0; index < 12; index += 1) await Promise.resolve();
  };
  return {
    player,
    audio,
    pending,
    picture,
    settled: () => settled,
    drain,
    active,
    setNow: (value: number) => {
      now = value;
    },
    fulfill: () => resolve(stable),
    fail: () => reject(new Error('held continuation failed')),
    oldEvents: (includeActive = true) => {
      for (const callbacks of includeActive ? [old, active] : [old]) {
        callbacks[0]?.(new Event('pause'));
        callbacks[1]?.(new Event('ended'));
        callbacks[2]?.(new Event('error'));
      }
    },
  };
};

describe('headless media player boundary', () => {
  const lifecycleCauses = [
    ['release expiry', 'stale'],
    ['rights expiry', 'stale'],
    ['source block', 'blocked'],
    ['series block', 'blocked'],
    ['episode block', 'blocked'],
    ['asset block', 'blocked'],
  ] as const;
  const lifecycleSinks = [
    ['before asset load', 1],
    ['during body and digest', 3],
    ['after object URL', 4],
    ['during play setup', 5],
    ['during pause', Number.POSITIVE_INFINITY],
    ['before resume save', Number.POSITIVE_INFINITY],
    ['after resume save before cleanup', Number.POSITIVE_INFINITY],
  ] as const;

  it.each(
    lifecycleCauses.flatMap(([cause, availability]) =>
      lifecycleSinks.map(([sink, invalidAt]) => [cause, availability, sink, invalidAt] as const),
    ),
  )(
    'invalidates %s at %s before any later decoder or resume sink',
    async (_cause, availability, _sink, invalidAt) => {
      const audio = element();
      const request = vi.fn().mockResolvedValue(response());
      const create = vi.fn().mockReturnValue('blob:matrix');
      const revoke = vi.fn();
      let contextCalls = 0;
      const player = createMobileMediaPlayer({
        context: async () => {
          contextCalls += 1;
          if (contextCalls >= invalidAt) return { availability };
          return context();
        },
        fetch: request,
        audio: () => audio,
        createObjectURL: create,
        revokeObjectURL: revoke,
      });
      await player.start();
      if (invalidAt === Number.POSITIVE_INFINITY) player.stop(availability);
      expect(player.state()).toEqual({ playback: 'idle', availability, error: null });
      expect(request).toHaveBeenCalledTimes(invalidAt === 1 ? 0 : 1);
      expect(revoke).toHaveBeenCalledTimes(invalidAt > 3 ? 1 : 0);
      expect(player.seek(1)).toBe(false);
    },
  );

  it('never requests an asset before explicit user start', async () => {
    const request = vi.fn();
    const player = createMobileMediaPlayer({ context: async () => null, fetch: request });
    expect(request).not.toHaveBeenCalled();
    await player.start();
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects unavailable context without decoder allocation', async () => {
    const audio = vi.fn();
    const player = createMobileMediaPlayer({ context: async () => null, audio });
    await player.start();
    expect(audio).not.toHaveBeenCalled();
    expect(player.state()).toMatchObject({ playback: 'idle', availability: 'stale' });
  });

  it('accepts a headerless, hash-bound local body only after user play', async () => {
    const audio = element();
    const request = vi.fn().mockResolvedValue(response());
    const create = vi.fn().mockReturnValue('blob:one');
    const player = createMobileMediaPlayer({
      context,
      fetch: request,
      audio: () => audio,
      createObjectURL: create,
      revokeObjectURL: vi.fn(),
    });
    await player.start();
    expect(request).toHaveBeenCalledWith(
      '/local.wav',
      expect.objectContaining({
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      }),
    );
    expect(create).toHaveBeenCalledOnce();
    expect(audio.src).toBe('blob:one');
    expect(player.state()).toMatchObject({
      playback: 'playing',
      availability: 'local',
      error: null,
    });
  });

  it('keeps a verified paused element, URL, and position for a second user play', async () => {
    const factory = vi.fn().mockImplementation(() => element());
    const request = vi.fn().mockImplementation(() => response());
    const create = vi.fn().mockReturnValue('blob:continued');
    const invalidated = vi.fn();
    const player = createMobileMediaPlayer({
      context,
      fetch: request,
      audio: factory,
      createObjectURL: create,
      revokeObjectURL: vi.fn(),
      onInvalidated: invalidated,
    });

    await player.start();
    const first = factory.mock.results[0]?.value as MobileMediaAudioElement;
    first.currentTime = 0.01;
    first.onpause?.(new Event('pause'));
    await player.start();

    expect(player.state()).toEqual({ playback: 'playing', availability: 'local', error: null });
    expect(first.currentTime).toBe(0.01);
    expect(request).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(first.load).toHaveBeenCalledTimes(1);
    expect(invalidated).toHaveBeenCalledTimes(2);
    expect(invalidated).toHaveBeenLastCalledWith('local');
  });

  it.each([
    ['pre-context', 4_999],
    ['pre-context', 5_000],
    ['pre-context', 5_001],
    ['play', 4_999],
    ['play', 5_000],
    ['play', 5_001],
    ['post-context', 4_999],
    ['post-context', 5_000],
    ['post-context', 5_001],
  ] as const)('uses one continuation deadline during %s at %sms', async (phase, elapsed) => {
    vi.useFakeTimers();
    try {
      const rig = await continuedRig(phase);
      const initialStates = [
        { playback: 'loading', availability: 'local', error: null },
        { playback: 'playing', availability: 'local', error: null },
        { playback: 'paused', availability: 'local', error: null },
      ];
      const before = {
        state: initialStates[2],
        position: 0.01,
        src: 'blob:rig',
        requests: 1,
        factories: 1,
        made: 1,
        revoked: 0,
        loads: 1,
        plays: phase === 'pre-context' ? 1 : 2,
        pauses: 1,
        ended: 0,
        invalidated: ['local', 'local'],
        publications: initialStates,
        timers: 2,
      };
      expect(rig.picture()).toEqual(before);
      expect(rig.settled()).toBe(false);
      rig.setNow(elapsed);
      await vi.advanceTimersByTimeAsync(elapsed);
      if (elapsed === 4_999) {
        expect(rig.picture()).toEqual(before);
        expect(rig.settled()).toBe(false);
        rig.fulfill();
        await rig.pending;
        const playing = { playback: 'playing', availability: 'local', error: null };
        expect(rig.picture()).toEqual({
          ...before,
          state: playing,
          plays: 2,
          publications: [...initialStates, playing],
          timers: 1,
        });
        const after = rig.picture();
        rig.oldEvents(false);
        await rig.drain();
        expect(rig.picture()).toEqual(after);
      } else {
        await rig.drain();
        expect(rig.settled()).toBe(true);
        const failure = {
          playback: 'error',
          availability: phase === 'play' ? 'local' : 'storage-failure',
          error: phase === 'play' ? 'network-error' : 'storage-failure',
        };
        const terminal = {
          ...before,
          state: failure,
          src: '',
          revoked: 1,
          loads: 2,
          publications: [...initialStates, failure],
          timers: 0,
        };
        expect(rig.picture()).toEqual(terminal);
        if (elapsed === 5_000) rig.fulfill();
        else rig.fail();
        await rig.drain();
        await rig.pending;
        rig.oldEvents();
        expect(rig.picture()).toEqual(terminal);
      }
      rig.player.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('fails closed on a continuation context identity loss and expiry without reloading bytes', async () => {
    const stable = await context();
    const audio = element();
    const request = vi.fn().mockImplementation(() => response());
    const create = vi.fn().mockReturnValue('blob:context-loss');
    const revoke = vi.fn();
    let continuationRead = 0;
    const player = createMobileMediaPlayer({
      context: async () => {
        continuationRead += 1;
        if (continuationRead === 7) return { availability: 'blocked' as const };
        return stable;
      },
      fetch: request,
      audio: () => audio,
      createObjectURL: create,
      revokeObjectURL: revoke,
    });

    await player.start();
    audio.currentTime = 0.01;
    audio.onpause?.(new Event('pause'));
    await player.start();

    expect(player.state()).toEqual({ playback: 'idle', availability: 'blocked', error: null });
    expect(audio.currentTime).toBe(0.01);
    expect(audio.src).toBe('');
    expect(request).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(audio.load).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('fails closed on an expiry found after continuation play without reloading bytes', async () => {
    const original = await context();
    const stable = { ...original, asset: { ...original.asset, expiresAt: 60_000 } };
    const expired = { ...stable, asset: { ...stable.asset, expiresAt: 0 } };
    const audio = element();
    const request = vi.fn().mockImplementation(() => response());
    const create = vi.fn().mockReturnValue('blob:post-expiry');
    const revoke = vi.fn();
    let reads = 0;
    const player = createMobileMediaPlayer({
      context: async () => {
        reads += 1;
        return reads === 8 ? expired : stable;
      },
      clock: () => 1,
      fetch: request,
      audio: () => audio,
      createObjectURL: create,
      revokeObjectURL: revoke,
    });

    await player.start();
    audio.currentTime = 0.01;
    audio.onpause?.(new Event('pause'));
    await player.start();

    expect(player.state()).toEqual({ playback: 'idle', availability: 'stale', error: null });
    expect(audio.currentTime).toBe(0.01);
    expect(audio.src).toBe('');
    expect(request).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(audio.load).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('settles a stopped continuation and leaves late context and old DOM callbacks inert', async () => {
    const stable = await context();
    let release: ((value: typeof stable) => void) | undefined;
    const held = new Promise<typeof stable>((resolve) => {
      release = resolve;
    });
    const audio = element();
    const request = vi.fn().mockImplementation(() => response());
    const create = vi.fn().mockReturnValue('blob:late');
    const revoke = vi.fn();
    let continuing = false;
    const player = createMobileMediaPlayer({
      context: async () => (continuing ? held : stable),
      fetch: request,
      audio: () => audio,
      createObjectURL: create,
      revokeObjectURL: revoke,
    });

    await player.start();
    audio.currentTime = 0.01;
    const oldPause = audio.onpause;
    audio.onpause?.(new Event('pause'));
    continuing = true;
    const resumed = player.start();
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
    player.stop();
    await resumed;
    const beforeLate = player.state();
    oldPause?.(new Event('pause'));
    audio.onended?.(new Event('ended'));
    audio.onerror?.(new Event('error'));
    release?.(stable);
    await Promise.resolve();

    expect(player.state()).toEqual(beforeLate);
    expect(beforeLate).toEqual({ playback: 'idle', availability: 'local', error: null });
    expect(audio.currentTime).toBe(0.01);
    expect(audio.src).toBe('');
    expect(request).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(audio.load).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it.each(['pre-context', 'play', 'post-context'] as const)(
    'honors the preserved expiry while %s is held, including its deadline tie',
    async (phase) => {
      vi.useFakeTimers();
      try {
        const rig = await continuedRig(phase, 5_000);
        rig.setNow(4_999);
        await vi.advanceTimersByTimeAsync(4_999);
        expect(rig.settled()).toBe(false);
        expect(rig.picture().state).toEqual({
          playback: 'paused',
          availability: 'local',
          error: null,
        });
        rig.setNow(5_000);
        await vi.advanceTimersByTimeAsync(1);
        await rig.pending;
        expect(rig.picture()).toMatchObject({
          state: { playback: 'idle', availability: 'stale', error: null },
          src: '',
          requests: 1,
          factories: 1,
          made: 1,
          revoked: 1,
          loads: 2,
          position: 0.01,
          timers: 0,
        });
        const beforeLate = rig.picture();
        rig.fail();
        await rig.drain();
        rig.oldEvents();
        rig.setNow(5_001);
        await vi.advanceTimersByTimeAsync(1);
        expect(rig.picture()).toEqual(beforeLate);
        rig.player.unmount();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('keeps a new run intact when the old continuation deadline and captured events arrive', async () => {
    vi.useFakeTimers();
    try {
      const rig = await continuedRig('pre-context');
      rig.setNow(1_000);
      await vi.advanceTimersByTimeAsync(1_000);
      rig.player.stop();
      await rig.pending;
      rig.fulfill();
      await rig.drain();
      await rig.player.start();
      const before = rig.picture();
      expect(before).toMatchObject({
        state: { playback: 'playing', availability: 'local', error: null },
        requests: 2,
        factories: 2,
        made: 2,
        revoked: 1,
        loads: 3,
        plays: 2,
        src: 'blob:rig',
        position: 0.01,
        timers: 1,
      });
      rig.oldEvents();
      rig.setNow(5_000);
      await vi.advanceTimersByTimeAsync(4_000);
      expect(rig.picture()).toEqual(before);
      rig.player.unmount();
      expect(rig.picture()).toMatchObject({ src: '', revoked: 2, loads: 4, timers: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(['pre-context', 'play', 'post-context'] as const)(
    'settles a current decoder error even with a held %s promise',
    async (phase) => {
      vi.useFakeTimers();
      try {
        const rig = await continuedRig(phase);
        rig.active[2]?.(new Event('error'));
        await rig.drain();
        const settledBeforeForeignReply = rig.settled();
        const terminalPicture = rig.picture();
        rig.fail();
        await rig.drain();
        await rig.pending;
        expect(settledBeforeForeignReply).toBe(true);
        expect(terminalPicture).toMatchObject({
          state: { playback: 'error', availability: 'local', error: 'invalid' },
          src: '',
          requests: 1,
          factories: 1,
          made: 1,
          revoked: 1,
          loads: 2,
          timers: 0,
        });
        expect(rig.picture()).toEqual(terminalPicture);
        rig.player.unmount();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it.each(
    (['pre-context', 'play', 'post-context'] as const).flatMap((phase) =>
      (['stop', 'unmount'] as const).flatMap((action) =>
        (['resolve', 'reject'] as const).map((outcome) => [phase, action, outcome] as const),
      ),
    ),
  )(
    'fences %s after %s including a late %s and captured events',
    async (phase, action, outcome) => {
      vi.useFakeTimers();
      try {
        const rig = await continuedRig(phase);
        rig.player[action]();
        await rig.pending;
        expect(rig.settled()).toBe(true);
        const before = rig.picture();
        expect(before).toMatchObject({
          state: { playback: 'idle', availability: 'local', error: null },
          position: 0.01,
          src: '',
          requests: 1,
          factories: 1,
          made: 1,
          revoked: 1,
          loads: 2,
          plays: phase === 'pre-context' ? 1 : 2,
          pauses: 1,
          ended: 0,
          timers: 0,
        });
        if (outcome === 'resolve') rig.fulfill();
        else rig.fail();
        await rig.drain();
        rig.oldEvents();
        rig.setNow(60_001);
        await vi.advanceTimersByTimeAsync(60_001);
        expect(rig.picture()).toEqual(before);
        rig.player.unmount();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it.each(['pre-context', 'play', 'post-context'] as const)(
    'maps a genuine %s rejection without a second asset request',
    async (phase) => {
      vi.useFakeTimers();
      try {
        const rig = await continuedRig(phase);
        rig.fail();
        await rig.pending;
        expect(rig.picture()).toMatchObject({
          state: {
            playback: 'error',
            availability: phase === 'play' ? 'local' : 'storage-failure',
            error: phase === 'play' ? 'network-error' : 'storage-failure',
          },
          position: 0.01,
          src: '',
          requests: 1,
          factories: 1,
          made: 1,
          revoked: 1,
          loads: 2,
          plays: phase === 'pre-context' ? 1 : 2,
          timers: 0,
        });
        const before = rig.picture();
        rig.oldEvents();
        await rig.drain();
        expect(rig.picture()).toEqual(before);
        rig.player.unmount();
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('keeps malformed length and decoder bytes away from an audio element', async () => {
    const audio = vi.fn();
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(response(bytes, { 'content-length': 'nope' })),
      audio,
    });
    await player.start();
    expect(audio).not.toHaveBeenCalled();
    expect(player.state()).toMatchObject({ playback: 'error', error: 'invalid' });
  });

  it('revokes a generated URL exactly once on ended and ignores its late events', async () => {
    const audio = element();
    const revoke = vi.fn();
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(response()),
      audio: () => audio,
      createObjectURL: () => 'blob:one',
      revokeObjectURL: revoke,
    });
    await player.start();
    audio.onended?.(new Event('ended'));
    audio.onended?.(new Event('ended'));
    audio.onerror?.(new Event('error'));
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(player.state()).toMatchObject({ playback: 'ended', error: null });
  });

  it('invalidates an old pending context result before it can request', async () => {
    let resolve: ((value: Awaited<ReturnType<typeof context>>) => void) | undefined;
    const first = new Promise<Awaited<ReturnType<typeof context>>>((done) => {
      resolve = done;
    });
    const request = vi.fn().mockResolvedValue(response());
    const player = createMobileMediaPlayer({
      context: vi
        .fn()
        .mockImplementationOnce(() => first)
        .mockImplementation(context),
      fetch: request,
      audio: element,
      createObjectURL: () => 'blob:one',
      revokeObjectURL: vi.fn(),
    });
    const pending = player.start();
    player.stop();
    resolve?.(await context());
    await pending;
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    [
      'redirect status',
      new Response(bytes, { status: 302, headers: { 'content-type': 'audio/wav' } }),
    ],
    [
      'partial response',
      new Response(bytes, { status: 206, headers: { 'content-type': 'audio/wav' } }),
    ],
    ['content range', response(bytes, { 'content-range': 'bytes 0-3/4' })],
    ['mime', response(bytes, { 'content-type': 'audio/mpeg' })],
    ['declared mismatch', response(bytes, { 'content-length': '5' })],
  ])('keeps %s away from the decoder', async (_name, rejected) => {
    const audio = vi.fn();
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(rejected),
      audio,
    });
    await player.start();
    expect(audio).not.toHaveBeenCalled();
    expect(player.state()).toMatchObject({ playback: 'error', error: 'invalid' });
  });

  it('uses the exact five-second deadline and makes old timeout callbacks inert', async () => {
    vi.useFakeTimers();
    try {
      const sha256 = await hash();
      let resolve: ((response: Response) => void) | undefined;
      const pending = new Promise<Response>((done) => {
        resolve = done;
      });
      const player = createMobileMediaPlayer({
        context: async () => ({
          availability: 'local' as const,
          asset: { path: '/local.wav', bytes: 4, sha256, expiresAt: 9_999_999, identity: 'active' },
        }),
        clock: () => 0,
        fetch: vi.fn().mockReturnValue(pending),
      });
      const starting = player.start();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(4_999);
      expect(player.state().playback).toBe('loading');
      await vi.advanceTimersByTimeAsync(1);
      expect(player.state()).toMatchObject({ playback: 'error', error: 'network-error' });
      player.stop();
      resolve?.(response());
      await starting;
      expect(player.state().playback).toBe('idle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps run B protected when a late run A finally settles', async () => {
    vi.useFakeTimers();
    try {
      const sha256 = await hash();
      let resolveA: ((value: Response) => void) | undefined;
      let resolveB: ((value: Response) => void) | undefined;
      const pendingA = new Promise<Response>((resolve) => {
        resolveA = resolve;
      });
      const pendingB = new Promise<Response>((resolve) => {
        resolveB = resolve;
      });
      const request = vi.fn().mockReturnValueOnce(pendingA).mockReturnValueOnce(pendingB);
      const player = createMobileMediaPlayer({
        context: async () => ({
          availability: 'local' as const,
          asset: { path: '/local.wav', bytes: 4, sha256, expiresAt: 9_999_999, identity: 'A/B' },
        }),
        clock: () => 0,
        fetch: request,
      });
      const startingA = player.start();
      await vi.advanceTimersByTimeAsync(0);
      const startingB = player.start();
      await vi.advanceTimersByTimeAsync(0);
      resolveA?.(response());
      await startingA;
      await vi.advanceTimersByTimeAsync(4_999);
      expect(player.state().playback).toBe('loading');
      await vi.advanceTimersByTimeAsync(1);
      expect(player.state()).toMatchObject({ playback: 'error', error: 'network-error' });
      resolveB?.(response());
      await startingB;
    } finally {
      vi.useRealTimers();
    }
  });

  it('maps a context persistence rejection to a distinct storage failure', async () => {
    const player = createMobileMediaPlayer({
      context: async () => Promise.reject(new Error('idb')),
      fetch: vi.fn(),
    });
    await player.start();
    expect(player.state()).toEqual({
      playback: 'idle',
      availability: 'storage-failure',
      error: 'storage-failure',
    });
  });

  it.each([
    ['before the asset request', 2, 0, 0, 0],
    ['after body verification before the decoder', 3, 1, 0, 0],
    ['before src attachment', 4, 1, 1, 0],
    ['immediately before play', 5, 1, 1, 0],
    ['after fulfilled play before success publication', 6, 1, 1, 1],
  ] as const)(
    'atomically terminalizes a current storage failure %s',
    async (_boundary, failingContextCall, expectedRequests, expectedUrls, expectedPlay) => {
      const audio = element();
      const request = vi.fn().mockResolvedValue(response());
      const create = vi.fn().mockReturnValue('blob:storage-boundary');
      const revoke = vi.fn();
      const states: unknown[] = [];
      let calls = 0;
      const player = createMobileMediaPlayer({
        context: async () => {
          calls += 1;
          return calls === failingContextCall
            ? { availability: 'storage-failure' as const }
            : context();
        },
        fetch: request,
        audio: () => audio,
        createObjectURL: create,
        revokeObjectURL: revoke,
        onState: (state) => states.push(state),
      });

      await player.start();

      expect(request).toHaveBeenCalledTimes(expectedRequests);
      expect(create).toHaveBeenCalledTimes(expectedUrls);
      expect(audio.play).toHaveBeenCalledTimes(expectedPlay);
      expect(audio.src).toBe('');
      expect(revoke).toHaveBeenCalledTimes(expectedUrls);
      expect(player.seek(1)).toBe(false);
      expect(player.state()).toEqual({
        playback: 'error',
        availability: 'storage-failure',
        error: 'storage-failure',
      });
      expect(states.at(-1)).toEqual(player.state());
    },
  );

  it('does not allow a seek until verified bytes are attached to the current user run', async () => {
    const audio = element();
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(response()),
      audio: () => audio,
      createObjectURL: () => 'blob:one',
      revokeObjectURL: vi.fn(),
    });
    expect(player.seek(1)).toBe(false);
    await player.start();
    expect(player.seek(1)).toBe(true);
    expect(audio.currentTime).toBeCloseTo(0.001);
    player.stop('stale');
    expect(player.seek(1)).toBe(false);
  });

  it.each([
    ['one byte below descriptor', new Uint8Array([1, 2, 3])],
    ['one byte above descriptor', new Uint8Array([1, 2, 3, 4, 5])],
    ['one byte above the body cap', new Uint8Array(262145)],
  ])('keeps %s out of the decoder', async (_name, body) => {
    const audio = vi.fn();
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(response(body)),
      audio,
    });
    await player.start();
    expect(audio).not.toHaveBeenCalled();
    expect(player.state()).toMatchObject({ playback: 'error', error: 'invalid' });
  });

  it.each([
    [
      'create object URL',
      {
        createObjectURL: () => {
          throw new Error('create');
        },
      },
    ],
    [
      'load decoder',
      {
        audio: () => ({
          ...element(),
          load: () => {
            throw new Error('load');
          },
        }),
      },
    ],
    [
      'play rejection',
      { audio: () => ({ ...element(), play: async () => Promise.reject(new Error('play')) }) },
    ],
  ])('contains %s faults in the current run', async (_name, fault) => {
    const player = createMobileMediaPlayer({
      context,
      fetch: vi.fn().mockResolvedValue(response()),
      ...fault,
    });
    await player.start();
    expect(player.state()).toMatchObject({ playback: 'error', error: 'network-error' });
    expect(player.seek(1)).toBe(false);
  });

  it.each(['stale', 'blocked'] as const)(
    'invalidates before detaching and revoking a %s active run',
    async (availability) => {
      const audio = element();
      const revoke = vi.fn();
      const invalidated = vi.fn();
      const player = createMobileMediaPlayer({
        context,
        fetch: vi.fn().mockResolvedValue(response()),
        audio: () => audio,
        createObjectURL: () => 'blob:lifecycle',
        revokeObjectURL: revoke,
        onInvalidated: invalidated,
      });
      await player.start();
      player.stop(availability);
      expect(player.state()).toMatchObject({ playback: 'idle', availability });
      expect(revoke).toHaveBeenCalledTimes(1);
      expect(audio.src).toBe('');
      expect(audio.pause).toHaveBeenCalledOnce();
      expect(invalidated).toHaveBeenLastCalledWith(availability);
    },
  );
});
