import { useEffect, useMemo, useRef, useState } from 'react';
import type { UiLanguage } from '@wrn/ui-language';
import { getProductionPodcastCopy } from '@wrn/ui-language/production-podcast';
import type { ProductionReaderBlockV2 } from '@wrn/content-contracts';
import {
  productionOnlinePodcastVoices,
  type ProductionOnlinePodcastAdapter,
  type ProductionPodcastAuthority,
  type ProductionPodcastMode,
} from './production-podcast-online';

export type ProductionDeviceVoice = Readonly<{ id: string; name: string; language: string }>;

export type ProductionDeviceSpeechAdapter = Readonly<{
  voices(): readonly ProductionDeviceVoice[];
  subscribeVoicesChanged?(listener: () => void): () => void;
  speak(
    input: Readonly<{
      text: string;
      language: string;
      voiceId: string;
      rate: number;
      onEnd(): void;
      onError(): void;
    }>,
  ): void;
  pause(): void;
  resume(): void;
  stop(): void;
}>;

const maximumDeviceSpeechChunkCharacters = 1_200;

/** Keeps long articles reliable in browser speech engines that truncate one large utterance. */
export function chunkDeviceSpeechText(text: string): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  const flush = () => {
    if (current) chunks.push(current);
    current = '';
  };
  for (const word of words) {
    const characters = Array.from(word);
    if (characters.length > maximumDeviceSpeechChunkCharacters) {
      flush();
      for (let offset = 0; offset < characters.length; offset += maximumDeviceSpeechChunkCharacters)
        chunks.push(characters.slice(offset, offset + maximumDeviceSpeechChunkCharacters).join(''));
      continue;
    }
    if (
      current &&
      Array.from(current).length + 1 + characters.length > maximumDeviceSpeechChunkCharacters
    )
      flush();
    current = current ? `${current} ${word}` : word;
  }
  flush();
  return chunks;
}

export function createBrowserDeviceSpeechAdapter(): ProductionDeviceSpeechAdapter | null {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  )
    return null;
  const synthesis = window.speechSynthesis;
  let generation = 0;
  return {
    voices: () =>
      synthesis
        .getVoices()
        .filter((voice) => voice.localService === true)
        .map((voice) => ({ id: voice.voiceURI, name: voice.name, language: voice.lang })),
    subscribeVoicesChanged: (listener) => {
      synthesis.addEventListener('voiceschanged', listener);
      return () => synthesis.removeEventListener('voiceschanged', listener);
    },
    speak: ({ text, language, voiceId, rate, onEnd, onError }) => {
      const currentGeneration = ++generation;
      synthesis.cancel();
      const chunks = chunkDeviceSpeechText(text);
      const selectedVoice =
        synthesis
          .getVoices()
          .find((voice) => voice.voiceURI === voiceId && voice.localService === true) ?? null;
      if (selectedVoice === null) {
        onError();
        return;
      }
      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = language;
        utterance.rate = rate;
        utterance.voice = selectedVoice;
        if (index === chunks.length - 1)
          utterance.onend = () => {
            if (generation === currentGeneration) onEnd();
          };
        utterance.onerror = () => {
          if (generation === currentGeneration) onError();
        };
        synthesis.speak(utterance);
      });
    },
    pause: () => synthesis.pause(),
    resume: () => synthesis.resume(),
    stop: () => {
      generation += 1;
      synthesis.cancel();
    },
  };
}

function spokenText(title: string, blocks: readonly ProductionReaderBlockV2[]): string {
  const body = blocks.flatMap((block) => {
    if (block.kind === 'paragraph' || block.kind === 'heading' || block.kind === 'quote')
      return [block.text];
    if (block.kind === 'list') return block.items;
    return [];
  });
  return [title, ...body].join('\n\n').trim();
}

export function ProductionPodcastPanel({
  title,
  blocks,
  contentLanguage,
  language,
  adapter,
  onlineAdapter = null,
  authority = null,
}: Readonly<{
  title: string;
  blocks: readonly ProductionReaderBlockV2[];
  contentLanguage: string;
  language: UiLanguage;
  adapter: ProductionDeviceSpeechAdapter | null;
  onlineAdapter?: ProductionOnlinePodcastAdapter | null;
  authority?: ProductionPodcastAuthority | null;
}>) {
  const copy = getProductionPodcastCopy(language);
  const [voices, setVoices] = useState<readonly ProductionDeviceVoice[]>(
    () => adapter?.voices() ?? [],
  );
  const matchingVoice = voices.find((voice) =>
    voice.language.toLowerCase().startsWith(contentLanguage.toLowerCase().split('-')[0] ?? ''),
  );
  const [voiceId, setVoiceId] = useState(matchingVoice?.id ?? voices[0]?.id ?? '');
  useEffect(() => {
    const refresh = () => {
      const next = adapter?.voices() ?? [];
      setVoices(next);
      setVoiceId((current) => {
        if (current && next.some((voice) => voice.id === current)) return current;
        return (
          next.find((voice) =>
            voice.language
              .toLowerCase()
              .startsWith(contentLanguage.toLowerCase().split('-')[0] ?? ''),
          )?.id ??
          next[0]?.id ??
          ''
        );
      });
    };
    refresh();
    return adapter?.subscribeVoicesChanged?.(refresh);
  }, [adapter, contentLanguage]);
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<'ready' | 'playing' | 'paused' | 'finished' | 'failed'>(
    'ready',
  );
  const onlineLanguage = language;
  const onlineVoices = productionOnlinePodcastVoices[onlineLanguage];
  const [onlineVoiceId, setOnlineVoiceId] = useState(onlineVoices[0]?.id ?? '');
  const effectiveOnlineVoiceId = onlineVoices.some((voice) => voice.id === onlineVoiceId)
    ? onlineVoiceId
    : (onlineVoices[0]?.id ?? '');
  const [onlineState, setOnlineState] = useState<
    'idle' | 'loading' | 'ready' | 'quota' | 'unavailable' | 'error'
  >('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const onlineRequest = useRef<AbortController | null>(null);
  const identity = `${authority?.articleId ?? ''}:${authority?.articleRevision ?? ''}:${contentLanguage}:${language}:${effectiveOnlineVoiceId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const text = useMemo(() => spokenText(title, blocks), [title, blocks]);
  useEffect(() => {
    setStatus('ready');
    return () => adapter?.stop();
  }, [adapter, text, contentLanguage, voiceId, rate]);
  useEffect(() => () => onlineRequest.current?.abort(), []);
  useEffect(() => {
    onlineRequest.current?.abort();
    setOnlineState('idle');
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [identity]);
  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );
  const available = adapter !== null && voices.length > 0 && text.length > 0;
  const start = () => {
    if (!adapter || !available) return;
    adapter.speak({
      text,
      language: contentLanguage,
      voiceId,
      rate,
      onEnd: () => setStatus('finished'),
      onError: () => setStatus('failed'),
    });
    setStatus('playing');
  };
  const startOnline = async (mode: ProductionPodcastMode) => {
    if (!onlineAdapter || !authority || !effectiveOnlineVoiceId) return;
    onlineRequest.current?.abort();
    const controller = new AbortController();
    onlineRequest.current = controller;
    const currentIdentity = identity;
    setOnlineState('loading');
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    const result = await onlineAdapter.generate(
      authority,
      { mode, language: onlineLanguage, voiceId: effectiveOnlineVoiceId },
      controller.signal,
      () => identityRef.current === currentIdentity,
    );
    if (controller.signal.aborted || identityRef.current !== currentIdentity) return;
    onlineRequest.current = null;
    if (result.kind === 'ready') {
      const bytes = new Uint8Array(result.bytes.byteLength);
      bytes.set(result.bytes);
      setAudioUrl(URL.createObjectURL(new Blob([bytes.buffer], { type: 'audio/mpeg' })));
      setOnlineState('ready');
    } else if (result.kind === 'quota') setOnlineState('quota');
    else if (result.kind === 'unavailable') setOnlineState('unavailable');
    else setOnlineState('error');
  };
  return (
    <details className="production-podcast" lang={language}>
      <summary>{copy.title}</summary>
      {onlineAdapter && authority && onlineVoices.length > 0 && (
        <section className="production-podcast__online" aria-label={copy.onlineVoice}>
          <p>
            <strong>{copy.onlineVoice}</strong>
          </p>
          <p className="production-podcast__privacy">{copy.onlinePrivacy}</p>
          <label>
            {copy.voice}
            <select
              value={effectiveOnlineVoiceId}
              onChange={(event) => setOnlineVoiceId(event.target.value)}
            >
              {onlineVoices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
          <div className="production-podcast__actions">
            <button
              type="button"
              disabled={onlineState === 'loading'}
              onClick={() => void startOnline('short')}
            >
              {copy.short}
            </button>
            <button
              type="button"
              disabled={onlineState === 'loading'}
              onClick={() => void startOnline('full')}
            >
              {copy.full}
            </button>
            {onlineState === 'loading' && (
              <button
                type="button"
                onClick={() => {
                  onlineRequest.current?.abort();
                  setOnlineState('idle');
                }}
              >
                {copy.cancel}
              </button>
            )}
          </div>
          <p role="status">
            {onlineState === 'loading'
              ? copy.generating
              : onlineState === 'ready'
                ? copy.onlineReady
                : onlineState === 'quota'
                  ? copy.quota
                  : onlineState === 'unavailable' || onlineState === 'error'
                    ? copy.onlineUnavailable
                    : ''}
          </p>
          {audioUrl && <audio controls preload="metadata" src={audioUrl} />}
        </section>
      )}
      <p>
        <strong>{copy.deviceVoice}</strong>
      </p>
      <p className="production-podcast__privacy">{copy.privacy}</p>
      {available ? (
        <>
          <label>
            {copy.voice}
            <select value={voiceId} onChange={(event) => setVoiceId(event.target.value)}>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} · {voice.language}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.rate}
            <select value={rate} onChange={(event) => setRate(Number(event.target.value))}>
              {[0.85, 1, 1.15, 1.3].map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </label>
          <div className="production-podcast__actions">
            {status === 'paused' ? (
              <button
                type="button"
                onClick={() => {
                  adapter.resume();
                  setStatus('playing');
                }}
              >
                {copy.resume}
              </button>
            ) : (
              <button type="button" onClick={start}>
                {copy.play}
              </button>
            )}
            <button
              type="button"
              disabled={status !== 'playing'}
              onClick={() => {
                adapter.pause();
                setStatus('paused');
              }}
            >
              {copy.pause}
            </button>
            <button
              type="button"
              disabled={status === 'ready' || status === 'finished'}
              onClick={() => {
                adapter.stop();
                setStatus('ready');
              }}
            >
              {copy.stop}
            </button>
          </div>
          <p role="status">{copy[status]}</p>
        </>
      ) : (
        <p role="status">{copy.unavailable}</p>
      )}
    </details>
  );
}
