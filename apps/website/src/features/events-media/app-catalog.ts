import {
  validateProductionEventsMediaV1,
  type ProductionEventsMediaDocumentV1,
} from '@wrn/content-contracts/production-events-media-v1';

export const catalogKinds = ['radio', 'podcasts', 'videos', 'library', 'events'] as const;
export type CatalogKind = (typeof catalogKinds)[number];
export type AppCatalogRecord = {
  id: string;
  title: string;
  source: string;
  url: string;
  language: string;
  publishedAt: string | null;
  country: string | null;
};
export type AppCatalog = {
  schema: string;
  rights: string;
  repository: string;
  commit: string;
  observedAt: string;
  inputs: { path: string; sha256: string; bytes: number }[];
  collections: Record<CatalogKind, AppCatalogRecord[]>;
  rejected: unknown[];
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const controls = (v: string, includeSpace = false) =>
  [...v].some((c) => c.charCodeAt(0) <= (includeSpace ? 32 : 31) || c.charCodeAt(0) === 127);
const plain = (v: unknown, max: number): v is string =>
  typeof v === 'string' && !!v.trim() && v.length <= max && !/[<>]/u.test(v) && !controls(v);
const iso = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v));
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
function https(v: unknown) {
  try {
    const u = new URL(v as string);
    return (
      typeof v === 'string' &&
      v.length <= 4096 &&
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !controls(v, true)
    );
  } catch {
    return false;
  }
}
export function validateAppCatalog(v: unknown): v is AppCatalog {
  if (
    !object(v) ||
    !exact(v, [
      'schema',
      'rights',
      'repository',
      'commit',
      'observedAt',
      'inputs',
      'collections',
      'rejected',
    ]) ||
    v.schema !== 'wrn.website-current-app-catalog.v1' ||
    v.rights !== 'metadata-original-link-only' ||
    v.repository !== 'https://github.com/Blackfront161/Revolution-News-Data' ||
    typeof v.commit !== 'string' ||
    !/^[a-f0-9]{40}$/.test(v.commit) ||
    !iso(v.observedAt) ||
    !Array.isArray(v.rejected) ||
    v.rejected.length !== 0 ||
    !Array.isArray(v.inputs) ||
    v.inputs.length !== 5 ||
    !object(v.collections) ||
    !exact(v.collections, [...catalogKinds])
  )
    return false;
  const inputNames = [
    'radio-stations.json',
    'podcasts.json',
    'video-feed.json',
    'library-feed.json',
    'events-feed.json',
  ];
  if (
    !v.inputs.every(
      (p, i) =>
        object(p) &&
        exact(p, ['path', 'sha256', 'bytes']) &&
        p.path === inputNames[i] &&
        hash(p.sha256) &&
        Number.isSafeInteger(p.bytes) &&
        Number(p.bytes) > 0 &&
        Number(p.bytes) <= 4194304,
    )
  )
    return false;
  const ids = new Set<string>();
  const collections = v.collections;
  return catalogKinds.every((kind) => {
    const rows = collections[kind];
    return (
      Array.isArray(rows) &&
      rows.length <= (kind === 'podcasts' ? 3000 : 1000) &&
      rows.every((r) => {
        if (
          !object(r) ||
          !exact(r, ['id', 'title', 'source', 'url', 'language', 'publishedAt', 'country']) ||
          typeof r.id !== 'string' ||
          !/^app-[a-f0-9]{64}$/.test(r.id) ||
          ids.has(r.id) ||
          !plain(r.title, 500) ||
          !plain(r.source, 300) ||
          !https(r.url) ||
          typeof r.language !== 'string' ||
          !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(r.language) ||
          !(r.publishedAt === null || iso(r.publishedAt)) ||
          !(r.country === null || plain(r.country, 100))
        )
          return false;
        ids.add(r.id);
        return true;
      })
    );
  });
}

export async function unpackWebsiteCatalog(
  candidate: unknown,
  signal: AbortSignal,
): Promise<{ history: ProductionEventsMediaDocumentV1; current: AppCatalog }> {
  signal.throwIfAborted();
  if (
    !object(candidate) ||
    !(candidate.schema === 'wrn.website-events-media-package.v1'
      ? exact(candidate, ['schema', 'history', 'current'])
      : candidate.schema === 'wrn.website-events-media-package.v2' &&
        exact(candidate, ['schema', 'history', 'current', 'supplement'])) ||
    !validateAppCatalog(candidate.current) ||
    !object(candidate.history)
  )
    throw new TypeError('website-catalog-invalid');
  const base = candidate.current;
  let current = base;
  if (candidate.schema === 'wrn.website-events-media-package.v2') {
    const delta = candidate.supplement;
    if (
      !object(delta) ||
      !exact(delta, [
        'schema',
        'rights',
        'repository',
        'commit',
        'baselineCommit',
        'observedAt',
        'inputs',
        'collections',
      ]) ||
      ![
        'wrn.website-reviewed-app-catalog-delta.v1',
        'wrn.website-reviewed-app-catalog-delta.v2',
      ].includes(String(delta.schema)) ||
      delta.rights !== 'metadata-original-link-only' ||
      delta.repository !== 'https://github.com/Blackfront161/World-Revolution-News-App.git' ||
      typeof delta.commit !== 'string' ||
      !/^[a-f0-9]{40}$/.test(delta.commit) ||
      typeof delta.baselineCommit !== 'string' ||
      !/^[a-f0-9]{40}$/.test(delta.baselineCommit) ||
      !iso(delta.observedAt) ||
      !Array.isArray(delta.inputs) ||
      delta.inputs.length !==
        (delta.schema === 'wrn.website-reviewed-app-catalog-delta.v2' ? 4 : 3) ||
      !delta.inputs.every(
        (input, index) =>
          object(input) &&
          exact(input, ['path', 'sha256', 'bytes']) &&
          input.path ===
            [
              'podcasts.json',
              'library-feed.json',
              'podcast-content-policy.json',
              'video-feed.json',
            ][index] &&
          hash(input.sha256) &&
          Number.isSafeInteger(input.bytes) &&
          Number(input.bytes) > 0 &&
          Number(input.bytes) <= 4194304,
      ) ||
      !object(delta.collections) ||
      !exact(
        delta.collections,
        delta.schema === 'wrn.website-reviewed-app-catalog-delta.v2'
          ? ['podcasts', 'library', 'videos']
          : ['podcasts', 'library'],
      ) ||
      !Array.isArray(delta.collections.podcasts) ||
      delta.collections.podcasts.length > 55 ||
      !Array.isArray(delta.collections.library) ||
      delta.collections.library.length > 10 ||
      (delta.schema === 'wrn.website-reviewed-app-catalog-delta.v2' &&
        (!Array.isArray(delta.collections.videos) || delta.collections.videos.length > 20))
    )
      throw new TypeError('website-catalog-supplement-invalid');
    // Closed metadata fields, HTTPS, unique IDs and bounds use the existing validator.
    current = {
      ...base,
      collections: {
        ...base.collections,
        podcasts: [...base.collections.podcasts, ...delta.collections.podcasts],
        library: [...base.collections.library, ...delta.collections.library],
        ...(delta.schema === 'wrn.website-reviewed-app-catalog-delta.v2'
          ? {
              videos: [
                ...base.collections.videos,
                ...(delta.collections.videos as AppCatalogRecord[]),
              ],
            }
          : {}),
      },
    };
    if (!validateAppCatalog(current)) throw new TypeError('website-catalog-supplement-invalid');
  }
  const h = candidate.history;
  if (
    !exact(h, ['encoding', 'bytes', 'sha256', 'payload']) ||
    h.encoding !== 'gzip-base64' ||
    !Number.isSafeInteger(h.bytes) ||
    Number(h.bytes) <= 0 ||
    Number(h.bytes) > 4194304 ||
    !hash(h.sha256) ||
    typeof h.payload !== 'string' ||
    h.payload.length > 5592408 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(h.payload)
  )
    throw new TypeError('website-history-invalid');
  const compressed = Uint8Array.from(atob(h.payload), (c) => c.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const abort = () => {
    void reader.cancel(signal.reason).catch(() => {});
  };
  signal.addEventListener('abort', abort, { once: true });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const result = await reader.read();
      signal.throwIfAborted();
      if (result.done) break;
      length += result.value.length;
      if (length > Number(h.bytes) || length > 4194304) throw new TypeError('website-history-cap');
      chunks.push(result.value);
    }
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (length !== h.bytes) throw new TypeError('website-history-length');
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  signal.throwIfAborted();
  if (digest !== h.sha256) throw new TypeError('website-history-hash');
  const history: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!validateProductionEventsMediaV1(history)) throw new TypeError('events-media-invalid');
  return { history, current };
}
