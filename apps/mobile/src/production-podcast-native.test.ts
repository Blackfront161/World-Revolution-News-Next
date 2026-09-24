import { describe, expect, it, vi } from 'vitest';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  createNativeDeviceSpeechAdapter,
  type NativeTtsRuntime,
  type WRNTtsPlugin,
} from './production-podcast-adapter';

function runtime(voices: unknown) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const plugin: WRNTtsPlugin = {
    getVoices: vi.fn(async () => ({ voices })),
    speak: vi.fn(async () => undefined),
    pause: vi.fn(async () => undefined),
    resume: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    addListener: vi.fn(async (name, listener) => {
      listeners.set(name, listener);
      return { remove: vi.fn(async () => undefined) } as PluginListenerHandle;
    }),
  };
  return {
    value: { available: () => true, plugin } satisfies NativeTtsRuntime,
    plugin,
    listeners,
  };
}

describe('native Android device speech adapter', () => {
  it('loads only validated native voices and relays bounded chunks and completion', async () => {
    const native = runtime([{ id: 'en-us-x-local', name: 'Local English', language: 'en-US' }]);
    const adapter = createNativeDeviceSpeechAdapter(native.value)!;
    const changed = vi.fn();
    const unsubscribe = adapter.subscribeVoicesChanged!(changed);
    await vi.waitFor(() => expect(adapter.voices()).toHaveLength(1));

    const onEnd = vi.fn();
    const onError = vi.fn();
    adapter.speak({
      text: `${'word '.repeat(400)}finished`,
      language: 'en',
      voiceId: 'en-us-x-local',
      rate: 1.25,
      onEnd,
      onError,
    });
    await vi.waitFor(() => expect(native.plugin.speak).toHaveBeenCalledOnce());
    const request = vi.mocked(native.plugin.speak).mock.calls[0]?.[0];
    expect(request?.chunks.length).toBeGreaterThan(1);
    expect(request?.chunks.every((chunk) => Array.from(chunk).length <= 1_200)).toBe(true);
    expect(request).toMatchObject({ language: 'en', voiceId: 'en-us-x-local', rate: 1.25 });
    native.listeners.get('ttsState')?.({ requestId: request?.requestId, status: 'finished' });
    expect(onEnd).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('fails closed for malformed native voice data and invalidates stopped callbacks', async () => {
    const native = runtime([{ id: 'voice', name: 'Voice', language: 'not a language' }]);
    const adapter = createNativeDeviceSpeechAdapter(native.value)!;
    adapter.subscribeVoicesChanged!(() => undefined);
    await vi.waitFor(() => expect(native.plugin.getVoices).toHaveBeenCalledOnce());
    expect(adapter.voices()).toEqual([]);

    const onEnd = vi.fn();
    adapter.speak({
      text: 'local text',
      language: 'en',
      voiceId: 'voice',
      rate: 1,
      onEnd,
      onError: vi.fn(),
    });
    await vi.waitFor(() => expect(native.plugin.speak).toHaveBeenCalledOnce());
    const requestId = vi.mocked(native.plugin.speak).mock.calls[0]?.[0].requestId;
    adapter.stop();
    native.listeners.get('ttsState')?.({ requestId, status: 'finished' });
    expect(onEnd).not.toHaveBeenCalled();
    expect(native.plugin.stop).toHaveBeenCalledOnce();
  });

  it('returns null when the native bridge is unavailable', () => {
    const native = runtime([]);
    expect(createNativeDeviceSpeechAdapter({ ...native.value, available: () => false })).toBeNull();
  });
});
