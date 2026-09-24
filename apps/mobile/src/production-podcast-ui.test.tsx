import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  chunkDeviceSpeechText,
  createBrowserDeviceSpeechAdapter,
  ProductionPodcastPanel,
  type ProductionDeviceSpeechAdapter,
} from '../../../packages/browser-content/src/production-podcast';
import type { ProductionOnlinePodcastAdapter } from '../../../packages/browser-content/src/production-podcast-online';

function adapter(): ProductionDeviceSpeechAdapter {
  return {
    voices: () => [{ id: 'de-device', name: 'Gerätestimme', language: 'de-DE' }],
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
  };
}

describe('production device podcast', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('exposes and speaks only voices that the browser marks as local', () => {
    const local = { voiceURI: 'local', name: 'Local', lang: 'de-DE', localService: true };
    const remote = { voiceURI: 'remote', name: 'Remote', lang: 'de-DE', localService: false };
    const speak = vi.fn();
    const synthesis = {
      getVoices: () => [remote, local],
      cancel: vi.fn(),
      speak,
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synthesis,
    });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        voice: unknown = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(readonly text: string) {}
      },
    );
    const browser = createBrowserDeviceSpeechAdapter();
    expect(browser?.voices()).toEqual([{ id: 'local', name: 'Local', language: 'de-DE' }]);
    const onError = vi.fn();
    browser?.speak({
      text: 'Text',
      language: 'de',
      voiceId: 'remote',
      rate: 1,
      onEnd: vi.fn(),
      onError,
    });
    expect(onError).toHaveBeenCalledOnce();
    expect(speak).not.toHaveBeenCalled();
  });
  it('splits long article speech without losing text or exceeding engine-safe chunks', () => {
    const source = Array.from({ length: 900 }, (_, index) => `Wort${index}`).join(' ');
    const chunks = chunkDeviceSpeechText(source);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => Array.from(chunk).length <= 1_200)).toBe(true);
    expect(chunks.join(' ')).toBe(source);
  });

  it('stays local and idle until chosen, then supports pause, resume, stop and cleanup', () => {
    const speech = adapter();
    const rendered = render(
      <ProductionPodcastPanel
        title="Belegter Titel"
        blocks={[
          { kind: 'paragraph', text: 'Erster Absatz.' },
          { kind: 'list', style: 'unordered', items: ['Punkt eins', 'Punkt zwei'] },
        ]}
        contentLanguage="de"
        language="de"
        adapter={speech}
      />,
    );
    expect(speech.speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Artikel anhören'));
    fireEvent.click(screen.getByRole('button', { name: 'Abspielen' }));
    expect(speech.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Belegter Titel\n\nErster Absatz.\n\nPunkt eins\n\nPunkt zwei',
        language: 'de',
        voiceId: 'de-device',
        rate: 1,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(speech.pause).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Fortsetzen' }));
    expect(speech.resume).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Stopp' }));
    expect(speech.stop).toHaveBeenCalledOnce();
    rendered.unmount();
    expect(speech.stop).toHaveBeenCalledTimes(2);
  });

  it('reports unavailable without invoking a provider or device API', () => {
    render(
      <ProductionPodcastPanel
        title="Article"
        blocks={[{ kind: 'paragraph', text: 'Text.' }]}
        contentLanguage="en"
        language="en"
        adapter={null}
      />,
    );
    fireEvent.click(screen.getByText('Listen to article'));
    expect(screen.getByRole('status')).toHaveTextContent(
      'No device voice is available in this browser.',
    );
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
  });

  it('uses an installed fallback when voices do not match the article language', () => {
    const speech = adapter();
    render(
      <ProductionPodcastPanel
        title="English article"
        blocks={[{ kind: 'paragraph', text: 'English text.' }]}
        contentLanguage="en"
        language="en"
        adapter={speech}
      />,
    );
    fireEvent.click(screen.getByText('Listen to article'));
    expect(screen.getByRole('combobox', { name: 'Voice' })).toHaveValue('de-device');
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(speech.speak).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', voiceId: 'de-device' }),
    );
  });

  it('keeps the online voice idle until a mode is chosen and sends only article authority', async () => {
    const generate = vi.fn<ProductionOnlinePodcastAdapter['generate']>(async () => ({
      kind: 'quota' as const,
    }));
    render(
      <ProductionPodcastPanel
        title="Artikel"
        blocks={[{ kind: 'paragraph', text: 'Dieser Text bleibt lokal.' }]}
        contentLanguage="en"
        language="de"
        adapter={null}
        onlineAdapter={{ generate }}
        authority={{
          articleId: 'article-1',
          articleRevision: 'revision-1',
          expiresAt: Date.now() + 60_000,
        }}
      />,
    );
    expect(generate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Artikel anhören'));
    fireEvent.click(screen.getByRole('button', { name: 'Kurz-Podcast' }));
    await waitFor(() => expect(generate).toHaveBeenCalledOnce());
    expect(generate.mock.calls[0]?.[0]).toMatchObject({
      articleId: 'article-1',
      articleRevision: 'revision-1',
    });
    expect(generate.mock.calls[0]?.[1]).toEqual({
      mode: 'short',
      language: 'de',
      voiceId: 'de-DE-KatjaNeural',
    });
    expect(JSON.stringify(generate.mock.calls[0])).not.toContain('Dieser Text bleibt lokal.');
    expect(
      screen.getByText('Das gemeinsame kostenlose Stimmenkontingent ist derzeit ausgeschöpft.'),
    ).toBeVisible();
  });

  it('stops device speech and aborts online generation when reader text or output language changes', async () => {
    const speech = adapter();
    let observedSignal: AbortSignal | null = null;
    const generate = vi.fn<ProductionOnlinePodcastAdapter['generate']>(
      async (_authority, _input, signal) => {
        observedSignal = signal;
        return await new Promise((resolve) =>
          signal.addEventListener('abort', () => resolve({ kind: 'discarded' }), { once: true }),
        );
      },
    );
    const authority = {
      articleId: 'article-1',
      articleRevision: 'revision-1',
      expiresAt: Date.now() + 60_000,
    };
    const rendered = render(
      <ProductionPodcastPanel
        title="Same title"
        blocks={[{ kind: 'paragraph', text: 'First revision.' }]}
        contentLanguage="en"
        language="de"
        adapter={speech}
        onlineAdapter={{ generate }}
        authority={authority}
      />,
    );
    fireEvent.click(screen.getByText('Artikel anhören'));
    fireEvent.click(screen.getByRole('button', { name: 'Kurz-Podcast' }));
    await waitFor(() => expect(generate).toHaveBeenCalledOnce());
    rendered.rerender(
      <ProductionPodcastPanel
        title="Same title"
        blocks={[{ kind: 'paragraph', text: 'Second revision.' }]}
        contentLanguage="en"
        language="en"
        adapter={speech}
        onlineAdapter={{ generate }}
        authority={authority}
      />,
    );
    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
    expect(speech.stop).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Listen to article'));
    fireEvent.click(screen.getByRole('button', { name: 'Short podcast' }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    expect(generate.mock.calls[1]?.[1]).toEqual({
      mode: 'short',
      language: 'en',
      voiceId: 'en-US-AriaNeural',
    });
  });
});
