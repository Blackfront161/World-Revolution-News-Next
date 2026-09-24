import type { UiLanguage } from '@wrn/ui-language';

export type ProductionPodcastMode = 'short' | 'full';
export type ProductionPodcastAuthority = Readonly<{
  articleId: string;
  articleRevision: string;
  expiresAt: number;
}>;
export type ProductionOnlinePodcastResult =
  | Readonly<{ kind: 'ready'; bytes: Uint8Array; audioSha256: string; expiresAt: number }>
  | Readonly<{ kind: 'quota' | 'unavailable' | 'discarded' | 'error' }>;
export type ProductionOnlinePodcastAdapter = Readonly<{
  generate(
    authority: ProductionPodcastAuthority,
    input: Readonly<{ mode: ProductionPodcastMode; language: UiLanguage; voiceId: string }>,
    signal: AbortSignal,
    isCurrent: () => boolean,
  ): Promise<ProductionOnlinePodcastResult>;
}>;

export const productionOnlinePodcastVoices: Readonly<
  Record<UiLanguage, readonly Readonly<{ id: string; name: string }>[]>
> = Object.freeze({
  en: [
    { id: 'en-US-AriaNeural', name: 'Aria' },
    { id: 'en-US-GuyNeural', name: 'Guy' },
  ],
  de: [
    { id: 'de-DE-KatjaNeural', name: 'Katja' },
    { id: 'de-DE-ConradNeural', name: 'Conrad' },
  ],
  es: [
    { id: 'es-ES-ElviraNeural', name: 'Elvira' },
    { id: 'es-ES-AlvaroNeural', name: 'Álvaro' },
  ],
  fr: [
    { id: 'fr-FR-DeniseNeural', name: 'Denise' },
    { id: 'fr-FR-HenriNeural', name: 'Henri' },
  ],
  it: [
    { id: 'it-IT-ElsaNeural', name: 'Elsa' },
    { id: 'it-IT-DiegoNeural', name: 'Diego' },
  ],
  pt: [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca' },
    { id: 'pt-BR-AntonioNeural', name: 'Antônio' },
  ],
  ru: [
    { id: 'ru-RU-SvetlanaNeural', name: 'Светлана' },
    { id: 'ru-RU-DmitryNeural', name: 'Дмитрий' },
  ],
  el: [
    { id: 'el-GR-AthinaNeural', name: 'Αθηνά' },
    { id: 'el-GR-NestorasNeural', name: 'Νέστορας' },
  ],
  tr: [
    { id: 'tr-TR-EmelNeural', name: 'Emel' },
    { id: 'tr-TR-AhmetNeural', name: 'Ahmet' },
  ],
});

const maximumAudioBytes = 25 * 1024 * 1024;
const maximumJsonBytes = 2_048;
const maximumGrantMilliseconds = 5 * 60 * 1000;

function endpoint(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' &&
      parsed.pathname === '/v1/podcasts' &&
      !parsed.search &&
      !parsed.hash &&
      !parsed.username &&
      !parsed.password
      ? parsed
      : null;
  } catch {
    return null;
  }
}

async function boundedBytes(response: Response, maximum: number): Promise<Uint8Array | null> {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > maximum)) {
    await response.body?.cancel().catch(() => undefined);
    return null;
  }
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maximum) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of chunks) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

/** No adapter exists without an exact HTTPS build-time endpoint. */
export function createProductionOnlinePodcastAdapter(
  value: unknown,
  ports: { fetch?: typeof fetch; now?: () => number; online?: () => boolean } = {},
): ProductionOnlinePodcastAdapter | null {
  const base = endpoint(value);
  if (!base) return null;
  const request = ports.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const now = ports.now ?? Date.now;
  const online = ports.online ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  return Object.freeze({
    async generate(authority, input, callerSignal, isCurrent) {
      if (!online() || callerSignal.aborted || !isCurrent() || now() > authority.expiresAt)
        return { kind: 'discarded' };
      if (
        !productionOnlinePodcastVoices[input.language].some((voice) => voice.id === input.voiceId)
      )
        return { kind: 'error' };
      const controller = new AbortController();
      const abort = () => controller.abort();
      callerSignal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(), 60_000);
      const current = () =>
        !controller.signal.aborted && online() && isCurrent() && now() <= authority.expiresAt;
      try {
        const created = await request(base.href, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            articleId: authority.articleId,
            mode: input.mode,
            language: input.language,
            voiceId: input.voiceId,
          }),
          signal: controller.signal,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
          redirect: 'error',
        });
        if (!current() || created.redirected) return { kind: 'discarded' };
        if (created.status === 429) {
          await created.body?.cancel().catch(() => undefined);
          return { kind: 'quota' };
        }
        if (
          !created.ok ||
          !/^application\/json(?:\s*;|$)/iu.test(created.headers.get('content-type') ?? '')
        ) {
          await created.body?.cancel().catch(() => undefined);
          return { kind: 'unavailable' };
        }
        const jsonBytes = await boundedBytes(created, maximumJsonBytes);
        if (!jsonBytes || !current()) return { kind: 'error' };
        const value: unknown = JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes),
        );
        if (!value || typeof value !== 'object' || Array.isArray(value)) return { kind: 'error' };
        const response = value as Record<string, unknown>;
        if (
          Object.keys(response).sort().join(',') !== 'audioPath,audioSha256,expiresAt,status' ||
          !['cached', 'generated'].includes(String(response.status)) ||
          typeof response.audioPath !== 'string' ||
          !/^\/v1\/podcasts\/audio\/[A-Za-z0-9_-]{24,512}$/u.test(response.audioPath) ||
          typeof response.audioSha256 !== 'string' ||
          !/^[a-f0-9]{64}$/u.test(response.audioSha256) ||
          typeof response.expiresAt !== 'string'
        )
          return { kind: 'error' };
        const expiresAt = Date.parse(response.expiresAt);
        const grantNow = now();
        if (
          !Number.isFinite(expiresAt) ||
          expiresAt <= grantNow ||
          expiresAt > grantNow + maximumGrantMilliseconds
        )
          return { kind: 'error' };
        const audioUrl = new URL(response.audioPath, base.origin);
        const audio = await request(audioUrl.href, {
          method: 'GET',
          headers: { accept: 'audio/mpeg' },
          signal: controller.signal,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
          redirect: 'error',
        });
        if (
          !current() ||
          audio.redirected ||
          !audio.ok ||
          audio.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'audio/mpeg'
        ) {
          await audio.body?.cancel().catch(() => undefined);
          return { kind: 'error' };
        }
        const bytes = await boundedBytes(audio, maximumAudioBytes);
        if (
          !bytes ||
          bytes.byteLength === 0 ||
          !current() ||
          (await sha256(bytes)) !== response.audioSha256
        )
          return { kind: 'error' };
        return { kind: 'ready', bytes, audioSha256: response.audioSha256, expiresAt };
      } catch {
        return { kind: controller.signal.aborted ? 'discarded' : 'error' };
      } finally {
        clearTimeout(timer);
        callerSignal.removeEventListener('abort', abort);
        controller.abort();
      }
    },
  });
}
