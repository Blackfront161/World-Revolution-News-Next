import type { PodcastLanguage, PodcastSynthesisPort } from './contracts.js';

const maxAudioBytes = 25 * 1024 * 1024;
const defaultTimeoutMilliseconds = 55_000;

export interface AzureVoice {
  readonly id: string;
  readonly locale: string;
}

export const legacyAzureVoices: Readonly<Record<PodcastLanguage, readonly AzureVoice[]>> =
  Object.freeze({
    en: [
      { id: 'en-US-AriaNeural', locale: 'en-US' },
      { id: 'en-US-GuyNeural', locale: 'en-US' },
    ],
    de: [
      { id: 'de-DE-KatjaNeural', locale: 'de-DE' },
      { id: 'de-DE-ConradNeural', locale: 'de-DE' },
    ],
    es: [
      { id: 'es-ES-ElviraNeural', locale: 'es-ES' },
      { id: 'es-ES-AlvaroNeural', locale: 'es-ES' },
    ],
    fr: [
      { id: 'fr-FR-DeniseNeural', locale: 'fr-FR' },
      { id: 'fr-FR-HenriNeural', locale: 'fr-FR' },
    ],
    it: [
      { id: 'it-IT-ElsaNeural', locale: 'it-IT' },
      { id: 'it-IT-DiegoNeural', locale: 'it-IT' },
    ],
    pt: [
      { id: 'pt-BR-FranciscaNeural', locale: 'pt-BR' },
      { id: 'pt-BR-AntonioNeural', locale: 'pt-BR' },
    ],
    ru: [
      { id: 'ru-RU-SvetlanaNeural', locale: 'ru-RU' },
      { id: 'ru-RU-DmitryNeural', locale: 'ru-RU' },
    ],
    el: [
      { id: 'el-GR-AthinaNeural', locale: 'el-GR' },
      { id: 'el-GR-NestorasNeural', locale: 'el-GR' },
    ],
    tr: [
      { id: 'tr-TR-EmelNeural', locale: 'tr-TR' },
      { id: 'tr-TR-AhmetNeural', locale: 'tr-TR' },
    ],
  });

export class PodcastDefinitePreDispatchFailure extends Error {
  public constructor() {
    super('Azure Speech was not dispatched.');
    this.name = 'PodcastDefinitePreDispatchFailure';
  }
}

export class PodcastAzureAdapterError extends Error {
  public constructor() {
    super('Azure Speech synthesis failed.');
    this.name = 'PodcastAzureAdapterError';
  }
}

export interface AzureSpeechAdapterOptions {
  readonly region: string;
  readonly subscriptionKey: string;
  readonly fetch: typeof fetch;
  readonly timeoutMilliseconds?: number;
  readonly maximumAudioBytes?: number;
}

function validRegion(value: string): boolean {
  return /^[a-z0-9-]{2,64}$/u.test(value);
}

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === "'") return '&apos;';
    return '&quot;';
  });
}

export function azureSpeechSsml(voice: AzureVoice, title: string, text: string): string {
  const body = escapeXml(text)
    .replace(/\r?\n{2,}/gu, '<break time="650ms"/>')
    .replace(/\r?\n/gu, '<break time="300ms"/>');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.locale}"><voice name="${voice.id}"><prosody rate="0%">${escapeXml(title)}<break time="900ms"/>${body}</prosody></voice></speak>`;
}

function voiceFor(language: PodcastLanguage, voiceId: string): AzureVoice | undefined {
  return legacyAzureVoices[language].find((voice) => voice.id === voiceId);
}

async function boundedAudio(response: Response, maximum: number): Promise<Uint8Array> {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > maximum)) {
    void response.body?.cancel().catch(() => {});
    throw new PodcastAzureAdapterError();
  }
  const type = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (type !== 'audio/mpeg') {
    void response.body?.cancel().catch(() => {});
    throw new PodcastAzureAdapterError();
  }
  if (!response.body) throw new PodcastAzureAdapterError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const step = await reader.read();
      if (step.done) break;
      length += step.value.byteLength;
      if (length > maximum) {
        void reader.cancel().catch(() => {});
        throw new PodcastAzureAdapterError();
      }
      chunks.push(step.value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function createAzureSpeechAdapter(options: AzureSpeechAdapterOptions): PodcastSynthesisPort {
  const region = options.region.trim().toLowerCase();
  const timeoutMilliseconds = options.timeoutMilliseconds ?? defaultTimeoutMilliseconds;
  const maximum = options.maximumAudioBytes ?? maxAudioBytes;
  if (
    !validRegion(region) ||
    options.subscriptionKey.length === 0 ||
    typeof options.fetch !== 'function' ||
    !Number.isSafeInteger(timeoutMilliseconds) ||
    timeoutMilliseconds < 1_000 ||
    timeoutMilliseconds > 60_000 ||
    !Number.isSafeInteger(maximum) ||
    maximum < 1 ||
    maximum > maxAudioBytes
  )
    throw new PodcastDefinitePreDispatchFailure();
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  return {
    async synthesize(input, { signal }) {
      if (signal.aborted) throw new PodcastDefinitePreDispatchFailure();
      const voice = voiceFor(input.language, input.voiceId);
      if (!voice || input.title.length === 0 || input.text.length === 0)
        throw new PodcastDefinitePreDispatchFailure();
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      signal.addEventListener('abort', onAbort, { once: true });
      const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);
      try {
        const response = await options.fetch.call(globalThis, endpoint, {
          method: 'POST',
          // workerd accepts manual/follow only. Manual keeps 3xx local; !ok below rejects it without following.
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'content-type': 'application/ssml+xml; charset=utf-8',
            accept: 'audio/mpeg',
            'ocp-apim-subscription-key': options.subscriptionKey,
            'x-microsoft-outputformat': 'audio-24khz-48kbitrate-mono-mp3',
            'user-agent': 'WorldRevolutionNews',
          },
          body: azureSpeechSsml(voice, input.title, input.text),
        });
        if (!response.ok) {
          void response.body?.cancel().catch(() => {});
          throw new PodcastAzureAdapterError();
        }
        return await boundedAudio(response, maximum);
      } catch (error) {
        if (error instanceof PodcastAzureAdapterError) throw error;
        throw new PodcastAzureAdapterError();
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', onAbort);
      }
    },
  };
}
