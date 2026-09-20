import {
  isValidatedProductionMediaReadyV1,
  type ProductionMediaReadyV1,
  type ProductionMediaEpisodeV1,
  type ProductionMediaStreamV1,
  type ProductionMediaConsentV1,
  type ProductionMediaRightsV1,
} from '@wrn/content-contracts/production-media-v1';

export type ProductionMediaAudio = Pick<
  HTMLAudioElement,
  | 'src'
  | 'crossOrigin'
  | 'preload'
  | 'currentTime'
  | 'duration'
  | 'onloadedmetadata'
  | 'ondurationchange'
  | 'onerror'
  | 'onpause'
  | 'onended'
  | 'ontimeupdate'
  | 'load'
  | 'play'
  | 'pause'
  | 'removeAttribute'
>;
export type ProductionMediaPlayerContext = Readonly<{
  ready: ProductionMediaReadyV1;
  generation: string;
}>;
export type ProductionMediaPlaybackIdentity = Readonly<{
  episodeId: string;
  streamId: string;
  releaseRevision: string;
  streamRevision: string;
  generation: string;
}>;
export type ProductionMediaConsentPrompt = Readonly<{
  episode: ProductionMediaEpisodeV1;
  consent: ProductionMediaConsentV1;
  rights: ProductionMediaRightsV1;
}>;
export type ProductionMediaPlayerState = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  episodeId: string | null;
  positionMs: number;
  durationMs: number | null;
  error: 'stream-unavailable' | null;
}>;
type Termination = 'stopped' | 'expired' | 'changed' | 'disposed' | 'ended' | 'error';
type Authority = ProductionMediaPlayerContext &
  Readonly<{
    episode: ProductionMediaEpisodeV1;
    stream: ProductionMediaStreamV1;
    consent: ProductionMediaConsentV1;
    rights: ProductionMediaRightsV1;
    expiresAt: number;
    generatedAt: number;
  }>;
type Run = {
  authority: Authority;
  audio: ProductionMediaAudio;
  metadata: boolean;
  observedDurationMs: number;
  resumePositionMs: number;
  playEpoch: number;
  playResolved: boolean;
  deadline: number | null;
  startTimer: ReturnType<typeof setTimeout> | null;
  expiryTimer: ReturnType<typeof setTimeout> | null;
};
const startupMs = 15_000;
const durationToleranceMs = 5_000;
const silently = (operation: () => void) => {
  try {
    operation();
  } catch {
    /* Native detach and observer failures cannot restore ownership. */
  }
};

/** Inert until its own exact current consent prompt is explicitly confirmed. */
export function createProductionMediaPlayer(
  ports: Readonly<{
    context(): ProductionMediaPlayerContext | null;
    allowedOrigins: ReadonlySet<string>;
    audio?: () => ProductionMediaAudio;
    now?: () => number;
    online?: () => boolean;
    onState?: (state: ProductionMediaPlayerState) => void;
    onExplicitPause?: (identity: ProductionMediaPlaybackIdentity, positionMs: number) => void;
    onTerminated?: (identity: ProductionMediaPlaybackIdentity, reason: Termination) => void;
  }>,
) {
  const origins = new Set(ports.allowedOrigins);
  const now = () => {
    try {
      return (ports.now ?? Date.now)();
    } catch {
      return NaN;
    }
  };
  const online = () => {
    try {
      return (ports.online ?? (() => navigator.onLine))() === true;
    } catch {
      return false;
    }
  };
  const makeAudio = ports.audio ?? (() => document.createElement('audio'));
  let live = true;
  let commandEpoch = 0;
  let run: Run | null = null;
  let pending: {
    prompt: ProductionMediaConsentPrompt;
    authority: Authority;
    position: number;
  } | null = null;
  let state: ProductionMediaPlayerState = Object.freeze({
    phase: 'idle',
    episodeId: null,
    positionMs: 0,
    durationMs: null,
    error: null,
  });
  const currentState = () => state;
  const currentCommand = (epoch: number) => live && commandEpoch === epoch;
  const currentRun = (r: Run, epoch: number) => currentCommand(epoch) && run === r;
  const identity = (a: Authority): ProductionMediaPlaybackIdentity =>
    Object.freeze({
      episodeId: a.episode.id,
      streamId: a.stream.id,
      releaseRevision: a.ready.pointer.releaseRevision,
      streamRevision: a.stream.streamRevision,
      generation: a.generation,
    });
  function authority(episodeId: string): Authority | null {
    const epoch = commandEpoch;
    try {
      const context = ports.context();
      if (!currentCommand(epoch)) return null;
      const time = now();
      if (
        !currentCommand(epoch) ||
        !context ||
        !isValidatedProductionMediaReadyV1(context.ready) ||
        typeof context.generation !== 'string' ||
        !/^[a-zA-Z0-9:-]{1,128}$/.test(context.generation) ||
        !Number.isFinite(time)
      )
        return null;
      const { ready, generation } = context;
      const generatedAt = Date.parse(ready.descriptor.generatedAt),
        expiresAt = Date.parse(ready.descriptor.validUntil);
      if (time < generatedAt || time >= expiresAt) return null;
      const episode = ready.documents.manifest.episodes.find((row) => row.id === episodeId);
      const stream = ready.documents.manifest.streams.find((row) => row.episodeId === episodeId);
      const consent = ready.documents.consent.entries.find((row) => row.episodeId === episodeId);
      const rights = ready.documents.rights.entries.find((row) => row.episodeId === episodeId);
      if (!episode || !stream || !consent || !rights || !origins.has(stream.origin)) return null;
      return Object.freeze({
        ready,
        generation,
        episode,
        stream,
        consent,
        rights,
        generatedAt,
        expiresAt,
      });
    } catch {
      return null;
    }
  }
  const same = (a: Authority) => {
    const current = authority(a.episode.id);
    return current !== null && current.ready === a.ready && current.generation === a.generation;
  };
  const sameCommand = (a: Authority, epoch: number) =>
    currentCommand(epoch) && same(a) && currentCommand(epoch);
  const limit = (r: Run) =>
    Math.max(0, Math.min(r.authority.stream.durationMs, r.observedDurationMs) - 1);
  const position = (r: Run) =>
    Number.isFinite(r.audio.currentTime)
      ? Math.min(limit(r), Math.max(0, Math.round(r.audio.currentTime * 1000)))
      : 0;
  function publish(
    phase: ProductionMediaPlayerState['phase'],
    id = run?.authority.episode.id ?? null,
    previous = state,
  ) {
    state = Object.freeze({
      phase,
      episodeId: id,
      positionMs: run?.metadata ? position(run) : phase === 'idle' ? 0 : previous.positionMs,
      durationMs: run?.metadata
        ? Math.min(run.authority.stream.durationMs, run.observedDurationMs)
        : phase === 'idle'
          ? null
          : previous.durationMs,
      error: phase === 'error' ? 'stream-unavailable' : null,
    });
    silently(() => ports.onState?.(state));
  }
  function terminate(reason: Termination) {
    const terminalEpoch = ++commandEpoch;
    const old = run;
    run = null;
    pending = null;
    if (old) {
      old.playEpoch++;
      if (old.startTimer !== null) clearTimeout(old.startTimer);
      if (old.expiryTimer !== null) clearTimeout(old.expiryTimer);
      old.audio.onloadedmetadata =
        old.audio.ondurationchange =
        old.audio.onerror =
        old.audio.onpause =
        old.audio.onended =
        old.audio.ontimeupdate =
          null;
      silently(() => old.audio.pause());
      silently(() => old.audio.removeAttribute('src'));
      silently(() => old.audio.load());
    }
    if (commandEpoch === terminalEpoch)
      publish(
        reason === 'ended' ? 'ended' : reason === 'error' ? 'error' : 'idle',
        reason === 'ended' || reason === 'error'
          ? (old?.authority.episode.id ?? state.episodeId)
          : null,
      );
    if (old) silently(() => ports.onTerminated?.(identity(old.authority), reason));
  }
  function owns(r: Run): boolean {
    if (!live || run !== r) return false;
    const epoch = commandEpoch;
    const accepted = same(r.authority);
    if (!currentRun(r, epoch)) return false;
    if (!accepted) {
      const time = now();
      if (currentRun(r, epoch)) terminate(time >= r.authority.expiresAt ? 'expired' : 'changed');
      return false;
    }
    return true;
  }
  function checkStart(r: Run): boolean {
    if (!owns(r)) return false;
    const epoch = commandEpoch;
    const time = now();
    if (!currentRun(r, epoch)) return false;
    if (!Number.isFinite(time) || (r.deadline !== null && time >= r.deadline)) {
      terminate('error');
      return false;
    }
    return true;
  }
  function canStartOnline(r: Run): boolean {
    if (!owns(r)) return false;
    const epoch = commandEpoch;
    const connected = online();
    if (!currentRun(r, epoch)) return false;
    if (!connected) {
      terminate('stopped');
      return false;
    }
    return true;
  }
  function finishStart(r: Run) {
    if (!checkStart(r) || !r.metadata || !r.playResolved || state.phase !== 'loading') return;
    if (r.startTimer !== null) clearTimeout(r.startTimer);
    r.startTimer = null;
    r.deadline = null;
    publish('playing');
  }
  function start(r: Run, initial = false) {
    if (!owns(r)) return;
    const command = commandEpoch;
    const time = now();
    if (!currentRun(r, command)) return;
    if (!Number.isFinite(time)) {
      terminate('error');
      return;
    }
    const epoch = ++r.playEpoch;
    r.playResolved = false;
    r.deadline = time + startupMs;
    r.startTimer = setTimeout(() => {
      if (owns(r) && r.playEpoch === epoch) terminate('error');
    }, startupMs);
    try {
      if (initial ? !canStartOnline(r) : !owns(r)) return;
      const work = r.audio.play(); // Must remain in the confirming user gesture.
      void work.then(
        () => {
          if (r.playEpoch !== epoch || !checkStart(r)) return;
          r.playResolved = true;
          finishStart(r);
        },
        () => {
          if (r.playEpoch === epoch && owns(r)) terminate('error');
        },
      );
    } catch {
      if (owns(r)) terminate('error');
    }
  }
  function expiry(r: Run) {
    if (!owns(r)) return;
    const epoch = commandEpoch;
    const time = now();
    if (!currentRun(r, epoch)) return;
    r.expiryTimer = setTimeout(
      () => {
        if (owns(r)) expiry(r);
      },
      Math.max(1, r.authority.expiresAt - time),
    );
  }
  return Object.freeze({
    getState: currentState,
    prepareConsent(episodeId: string, resumePositionMs = 0): ProductionMediaConsentPrompt | null {
      const epoch = ++commandEpoch;
      pending = null;
      const a = authority(episodeId);
      if (
        !a ||
        !currentCommand(epoch) ||
        !online() ||
        !currentCommand(epoch) ||
        !Number.isSafeInteger(resumePositionMs) ||
        resumePositionMs < 0
      )
        return null;
      const prompt = Object.freeze({ episode: a.episode, consent: a.consent, rights: a.rights });
      pending = { prompt, authority: a, position: resumePositionMs };
      return prompt;
    },
    cancelConsent() {
      commandEpoch++;
      pending = null;
    },
    confirmPlay(prompt: ProductionMediaConsentPrompt): boolean {
      const invocation = commandEpoch;
      const selection = pending;
      pending = null;
      if (
        !selection ||
        selection.prompt !== prompt ||
        !sameCommand(selection.authority, invocation) ||
        !online() ||
        !currentCommand(invocation)
      )
        return false;
      const expectedEpoch = invocation + 1;
      terminate('stopped');
      if (!sameCommand(selection.authority, expectedEpoch)) return false;
      let audio: ProductionMediaAudio;
      try {
        audio = makeAudio();
      } catch {
        if (commandEpoch === expectedEpoch) publish('error', selection.authority.episode.id);
        return false;
      }
      if (!sameCommand(selection.authority, expectedEpoch)) return false;
      const r: Run = {
        authority: selection.authority,
        audio,
        metadata: false,
        observedDurationMs: 0,
        resumePositionMs: selection.position,
        playEpoch: 0,
        playResolved: false,
        deadline: null,
        startTimer: null,
        expiryTimer: null,
      };
      run = r;
      audio.onloadedmetadata = () => {
        if (!checkStart(r)) return;
        const duration = audio.duration * 1000;
        if (
          !Number.isFinite(duration) ||
          duration <= 0 ||
          Math.abs(duration - r.authority.stream.durationMs) > durationToleranceMs
        ) {
          terminate('error');
          return;
        }
        if (r.metadata) return;
        r.observedDurationMs = duration;
        r.metadata = true;
        try {
          audio.currentTime = Math.min(r.resumePositionMs, limit(r)) / 1000;
        } catch {
          terminate('error');
          return;
        }
        finishStart(r);
      };
      audio.ondurationchange = () => {
        if (!r.metadata || !checkStart(r)) return;
        const duration = audio.duration * 1000;
        if (
          !Number.isFinite(duration) ||
          duration <= 0 ||
          Math.abs(duration - r.authority.stream.durationMs) > durationToleranceMs
        ) {
          terminate('error');
          return;
        }
        r.observedDurationMs = duration;
        try {
          audio.currentTime = position(r) / 1000;
        } catch {
          if (owns(r)) terminate('error');
          return;
        }
        if (owns(r)) publish(state.phase);
      };
      audio.onerror = () => {
        if (owns(r)) terminate('error');
      };
      audio.onended = () => {
        if (owns(r)) terminate('ended');
      };
      audio.onpause = () => {
        if (!owns(r) || state.phase === 'paused') return;
        if (state.phase === 'loading') terminate('stopped');
        else if (state.phase === 'playing') publish('paused');
      };
      audio.ontimeupdate = () => {
        if (owns(r) && r.metadata && (state.phase === 'playing' || state.phase === 'paused'))
          publish(state.phase);
      };
      expiry(r);
      if (!owns(r)) return false;
      publish(
        'loading',
        r.authority.episode.id,
        Object.freeze({ ...state, positionMs: 0, durationMs: null }),
      );
      if (!owns(r)) return false;
      try {
        audio.crossOrigin = 'anonymous';
        audio.preload = 'none';
        if (!canStartOnline(r)) return false;
        audio.src = r.authority.stream.url;
        start(r, true);
        return run === r;
      } catch {
        if (owns(r)) terminate('error');
        return false;
      }
    },
    pause(): boolean {
      const r = run;
      if (!r || !owns(r)) return false;
      if (state.phase === 'loading') {
        terminate('stopped');
        return true;
      }
      if (state.phase !== 'playing') return false;
      const at = position(r);
      publish('paused');
      if (!owns(r)) return false;
      try {
        r.audio.pause();
      } catch {
        if (owns(r)) terminate('error');
        return false;
      }
      if (!owns(r) || currentState().phase !== 'paused') return false;
      silently(() => ports.onExplicitPause?.(identity(r.authority), at));
      return true;
    },
    continue(): boolean {
      const r = run;
      if (!r || !owns(r) || !r.metadata || state.phase !== 'paused') return false;
      publish('loading');
      if (!owns(r)) return false;
      start(r);
      return run === r;
    },
    seek(positionMs: number): boolean {
      const r = run;
      if (
        !r ||
        !owns(r) ||
        !r.metadata ||
        (state.phase !== 'playing' && state.phase !== 'paused') ||
        !Number.isFinite(positionMs)
      )
        return false;
      try {
        r.audio.currentTime = Math.min(limit(r), Math.max(0, positionMs)) / 1000;
      } catch {
        if (owns(r)) terminate('error');
        return false;
      }
      if (!owns(r)) return false;
      publish(state.phase);
      return true;
    },
    refresh() {
      const selection = pending;
      const epoch = commandEpoch;
      if (selection && !same(selection.authority) && currentCommand(epoch) && pending === selection)
        pending = null;
      if (run) owns(run);
    },
    stop() {
      terminate('stopped');
    },
    dispose() {
      if (!live) return;
      live = false;
      terminate('disposed');
    },
  });
}
