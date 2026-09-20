import { legacyAzureVoices, PodcastDefinitePreDispatchFailure } from './azure-speech-adapter.js';
import type {
  CanonicalPodcastArticle,
  PodcastAuthorization,
  PodcastAuthorizationContext,
  PodcastCacheEntry,
  PodcastGenerationRequest,
  PodcastGenerationResult,
  PodcastQuotaReservation,
  PodcastServicePorts,
} from './contracts.js';
import { podcastLanguages, podcastModes } from './contracts.js';

const maximumInputCodeUnits = 12_000;
const maximumAudioBytes = 25 * 1024 * 1024;
const cacheNamespace = 'wrn:podcast:v1';

function validId(value: string): boolean {
  return /^[A-Za-z0-9._:-]{1,160}$/u.test(value);
}

function supportedMode(value: string): value is PodcastGenerationRequest['mode'] {
  return (podcastModes as readonly string[]).includes(value);
}

function supportedLanguage(value: string): value is PodcastGenerationRequest['language'] {
  return (podcastLanguages as readonly string[]).includes(value);
}

function supportedVoice(language: PodcastGenerationRequest['language'], voiceId: string): boolean {
  return legacyAzureVoices[language].some((voice) => voice.id === voiceId);
}

function plainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function validRequest(value: unknown): value is PodcastGenerationRequest {
  return (
    plainRecord(value) &&
    exactKeys(value, ['articleId', 'mode', 'language', 'voiceId']) &&
    typeof value.articleId === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.language === 'string' &&
    typeof value.voiceId === 'string' &&
    validId(value.articleId) &&
    validId(value.voiceId) &&
    supportedMode(value.mode) &&
    supportedLanguage(value.language) &&
    supportedVoice(value.language, value.voiceId)
  );
}

function plainText(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) return false;
  }
  return value.trim().length > 0 && value.length <= maximumInputCodeUnits;
}

async function sha256(value: string | Uint8Array): Promise<string> {
  const source = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  // Copy into an ArrayBuffer-backed view: WebCrypto deliberately does not accept SharedArrayBuffer views.
  const input = new Uint8Array(source.byteLength);
  input.set(source);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function authorizationContext(
  article: CanonicalPodcastArticle,
  request: PodcastGenerationRequest,
): PodcastAuthorizationContext {
  return {
    articleId: article.id,
    articleRevision: article.revision,
    mode: request.mode,
    language: request.language,
    voiceId: request.voiceId,
  };
}

async function admitted(
  ports: PodcastServicePorts,
  context: PodcastAuthorizationContext,
  signal: AbortSignal,
): Promise<boolean> {
  const decisions = await Promise.all([
    ports.admission.authorize(context, { signal }),
    ports.consent.authorize(context, { signal }),
    ports.rights.authorize(context, { signal }),
    ports.moderation.authorize(context, { signal }),
  ]);
  return decisions.every((value) => approved(value, context));
}

function approved(value: PodcastAuthorization, context: PodcastAuthorizationContext): boolean {
  return (
    value.allowed &&
    value.articleId === context.articleId &&
    value.articleRevision === context.articleRevision
  );
}

function validCached(
  entry: PodcastCacheEntry,
  article: CanonicalPodcastArticle,
  request: PodcastGenerationRequest,
  textSha256: string,
): boolean {
  return (
    entry.schema === 'wrn.podcast-cache-entry.v1' &&
    entry.articleId === article.id &&
    entry.articleRevision === article.revision &&
    entry.mode === request.mode &&
    entry.language === request.language &&
    entry.voiceId === request.voiceId &&
    entry.textSha256 === textSha256 &&
    entry.audio.byteLength > 0 &&
    entry.audio.byteLength <= maximumAudioBytes &&
    /^[a-f0-9]{64}$/u.test(entry.audioSha256)
  );
}

export interface PodcastService {
  readonly generate: (
    request: unknown,
    callerSignal?: AbortSignal,
  ) => Promise<PodcastGenerationResult>;
}

export function createPodcastService(ports: PodcastServicePorts): PodcastService {
  return {
    async generate(request, callerSignal) {
      if (!ports.configuration.enabled) return { status: 'disabled' };
      if (
        ports.configuration.resourceVerification !== 'verified' ||
        !validId(ports.configuration.sharedResourceId)
      )
        return { status: 'unavailable' };
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (callerSignal?.aborted) controller.abort();
      else callerSignal?.addEventListener('abort', abort, { once: true });
      const signal = controller.signal;
      const mayCommit = () => !signal.aborted;
      try {
        if (signal.aborted || !validRequest(request)) return { status: 'failed' };
        const article = await ports.canonicalArticles.resolve(request.articleId, { signal });
        if (
          !article ||
          !validId(article.id) ||
          !validId(article.revision) ||
          article.id !== request.articleId ||
          article.textLanguage !== request.language ||
          !plainText(article.title)
        )
          return { status: 'not-admitted' };
        const text = request.mode === 'full' ? article.approvedFullText : article.approvedShortText;
        if (text === null || !plainText(text)) return { status: 'not-admitted' };
        const context = authorizationContext(article, request);
        if (!(await admitted(ports, context, signal))) return { status: 'not-admitted' };
        const textSha256 = await sha256(JSON.stringify({ title: article.title, text }));
        const cacheKey = `${cacheNamespace}:${await sha256(JSON.stringify({ articleId: article.id, revision: article.revision, textSha256, mode: request.mode, language: request.language, voiceId: request.voiceId }))}`;
        const cached = await ports.cache.get(cacheKey, { signal });
        // Cache I/O may race a withdrawal. Re-authorize before either returning or starting quota/provider work.
        if (signal.aborted || !(await admitted(ports, context, signal)) || signal.aborted)
          return { status: 'not-admitted' };
        if (
          cached &&
          validCached(cached, article, request, textSha256) &&
          cached.audioSha256 === (await sha256(cached.audio))
        )
          return { status: 'cached', cacheKey, audioSha256: cached.audioSha256 };
        const reservation: PodcastQuotaReservation = {
          sharedResourceId: ports.configuration.sharedResourceId,
          operationId: crypto.randomUUID(),
          utf16CodeUnits: article.title.length + text.length,
          storageBytes: maximumAudioBytes,
        };
        if (!(await ports.quota.reserve(reservation, { signal })))
          return { status: 'quota-denied' };
        let audio: Uint8Array;
        try {
          audio = await ports.synthesis.synthesize(
            { language: request.language, voiceId: request.voiceId, title: article.title, text },
            { signal },
          );
        } catch (error) {
          if (error instanceof PodcastDefinitePreDispatchFailure)
            await ports.quota.releaseDefinitePreDispatch(reservation);
          return { status: 'failed' };
        }
        if (audio.byteLength === 0 || audio.byteLength > maximumAudioBytes)
          return { status: 'failed' };
        // A provider call may have consumed quota. Never release after this point.
        if (!(await admitted(ports, context, signal)) || !mayCommit())
          return { status: 'not-admitted' };
        const audioSha256 = await sha256(audio);
        const entry: PodcastCacheEntry = {
          schema: 'wrn.podcast-cache-entry.v1',
          articleId: article.id,
          articleRevision: article.revision,
          mode: request.mode,
          language: request.language,
          voiceId: request.voiceId,
          textSha256,
          audio,
          audioSha256,
          createdAt: ports.clock.now().toISOString(),
        };
        await ports.storage.putPrivate(
          {
            key: cacheKey,
            bytes: audio,
            sha256: audioSha256,
            contentType: 'audio/mpeg',
            articleId: article.id,
            articleRevision: article.revision,
            mode: request.mode,
            voiceId: request.voiceId,
          },
          { signal, mayCommit },
        );
        await ports.cache.put(cacheKey, entry, { signal, mayCommit });
        return { status: 'generated', cacheKey, audioSha256 };
      } catch {
        return { status: 'failed' };
      } finally {
        callerSignal?.removeEventListener('abort', abort);
      }
    },
  };
}
