import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import {
  chunkDeviceSpeechText,
  createBrowserDeviceSpeechAdapter,
  type ProductionDeviceSpeechAdapter,
  type ProductionDeviceVoice,
} from '../../../packages/browser-content/src/production-podcast';
import { createProductionOnlinePodcastAdapter } from '../../../packages/browser-content/src/production-podcast-online';

type NativeVoiceResponse = { readonly voices?: unknown };
type NativeTtsState = { readonly requestId?: unknown; readonly status?: unknown };

export interface WRNTtsPlugin {
  getVoices(): Promise<NativeVoiceResponse>;
  speak(options: {
    readonly requestId: string;
    readonly chunks: readonly string[];
    readonly language: string;
    readonly voiceId: string;
    readonly rate: number;
  }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'ttsVoicesChanged' | 'ttsState',
    listener: (event: NativeTtsState) => void,
  ): Promise<PluginListenerHandle>;
}

export interface NativeTtsRuntime {
  readonly available: () => boolean;
  readonly plugin: WRNTtsPlugin;
}

const nativeTtsName = 'WRNTts';
const WRNTts = registerPlugin<WRNTtsPlugin>(nativeTtsName);

function defaultNativeTtsRuntime(): NativeTtsRuntime {
  return {
    available: () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(nativeTtsName),
    plugin: WRNTts,
  };
}

function safeVoices(value: unknown): readonly ProductionDeviceVoice[] {
  if (!Array.isArray(value)) return [];
  const voices: ProductionDeviceVoice[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    if (
      Object.keys(record).sort().join(',') !== 'id,language,name' ||
      typeof record.id !== 'string' ||
      typeof record.name !== 'string' ||
      typeof record.language !== 'string' ||
      record.id.length === 0 ||
      record.id.length > 256 ||
      record.name.length === 0 ||
      record.name.length > 256 ||
      !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(record.language)
    )
      return [];
    voices.push({ id: record.id, name: record.name, language: record.language });
  }
  return voices;
}

export function createNativeDeviceSpeechAdapter(
  runtime: NativeTtsRuntime = defaultNativeTtsRuntime(),
): ProductionDeviceSpeechAdapter | null {
  if (!runtime.available()) return null;
  let voices: readonly ProductionDeviceVoice[] = [];
  let generation = 0;
  let active: Readonly<{ requestId: string; onEnd(): void; onError(): void }> | undefined;
  const voiceListeners = new Set<() => void>();
  let setup: Promise<void> | null = null;
  const refresh = async () => {
    const result = await runtime.plugin.getVoices();
    voices = safeVoices(result.voices);
    for (const listener of voiceListeners) listener();
  };
  const ensureSetup = () => {
    setup ??= (async () => {
      await runtime.plugin.addListener(
        'ttsVoicesChanged',
        () => void refresh().catch(() => undefined),
      );
      await runtime.plugin.addListener('ttsState', (event) => {
        if (
          !active ||
          event.requestId !== active.requestId ||
          !['finished', 'error'].includes(String(event.status))
        )
          return;
        const completed = active;
        active = undefined;
        if (event.status === 'finished') completed.onEnd();
        else completed.onError();
      });
      await refresh();
    })().catch(() => {
      voices = [];
      for (const listener of voiceListeners) listener();
    });
    return setup;
  };
  return {
    voices: () => voices,
    subscribeVoicesChanged: (listener) => {
      voiceListeners.add(listener);
      void ensureSetup();
      return () => voiceListeners.delete(listener);
    },
    speak: ({ text, language, voiceId, rate, onEnd, onError }) => {
      const requestId = String(++generation);
      active = { requestId, onEnd, onError };
      void ensureSetup()
        .then(() => {
          if (active?.requestId !== requestId) return;
          return runtime.plugin.speak({
            requestId,
            chunks: chunkDeviceSpeechText(text),
            language,
            voiceId,
            rate,
          });
        })
        .catch(() => {
          if (active?.requestId !== requestId) return;
          active = undefined;
          onError();
        });
    },
    pause: () => void runtime.plugin.pause().catch(() => undefined),
    resume: () => void runtime.plugin.resume().catch(() => undefined),
    stop: () => {
      generation += 1;
      active = undefined;
      void runtime.plugin.stop().catch(() => undefined);
    },
  };
}

export const productionDeviceSpeechAdapter =
  createNativeDeviceSpeechAdapter() ?? createBrowserDeviceSpeechAdapter();

export const productionOnlinePodcastAdapter = createProductionOnlinePodcastAdapter(
  import.meta.env.VITE_WRN_PODCAST_ENDPOINT,
);
