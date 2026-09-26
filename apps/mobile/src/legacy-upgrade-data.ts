export interface LegacySavedArticle {
  readonly key: string;
  readonly title: string;
  readonly source: string;
  readonly content: string;
  readonly read: boolean;
  readonly progress: number | null;
}

export interface LegacyOrphanReading {
  readonly key: string;
  readonly title: string;
  readonly read: boolean;
  readonly progress: number | null;
}

const maxArticles = 200;
const maxText = 200_000;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function bounded(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function articleKey(value: Record<string, unknown>): string {
  const link = bounded(value.link, 2048).trim();
  if (link) return link;
  const id = bounded(value.id, 2048).trim();
  if (id) return id;
  return readingKey(value);
}

function readingKey(value: Record<string, unknown>): string {
  const link = bounded(value.link, 2048).trim();
  if (link) return link;
  // reading-state.js uses source::title::date even when the article has an ID.
  const source = bounded(value.quelleName, 300);
  const title = bounded(value.title, 500);
  const date = bounded(value.pubDate || value.eventStart, 100);
  return source || title || date ? `${source}::${title}::${date}` : '';
}

export function parseLegacyBookmarks(
  raw: string | null,
  offline: unknown = null,
  readRaw: string | null = null,
  positionsRaw: string | null = null,
): readonly LegacySavedArticle[] {
  if (raw === null || raw.length > 4_000_000) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed) || parsed.length > maxArticles) return [];
  let readList: unknown = null;
  let positions: unknown = null;
  try {
    if (readRaw !== null && readRaw.length < 100_000) readList = JSON.parse(readRaw);
  } catch {
    /* Invalid old read list. */
  }
  try {
    if (positionsRaw !== null && positionsRaw.length < 100_000)
      positions = JSON.parse(positionsRaw);
  } catch {
    /* Invalid old positions. */
  }
  const readKeys = new Set(
    Array.isArray(readList) && readList.length <= maxArticles
      ? readList.filter((item): item is string => typeof item === 'string' && item.length <= 2048)
      : [],
  );
  const positionItems = record(positions);
  const offlineByKey = new Map<string, Record<string, unknown>>();
  if (Array.isArray(offline) && offline.length <= maxArticles) {
    for (const candidate of offline) {
      const item = record(candidate);
      if (item) {
        const key = articleKey(item);
        if (key && !offlineByKey.has(key)) offlineByKey.set(key, item);
      }
    }
  }
  const result: LegacySavedArticle[] = [];
  const seen = new Set<string>();
  for (const candidate of parsed) {
    const item = record(candidate);
    if (!item) continue;
    const key = articleKey(item);
    if (!key || seen.has(key)) continue;
    const title = bounded(item.title, 500);
    if (!title) continue;
    const cached = offlineByKey.get(key);
    const content = bounded(cached?.content, maxText) || bounded(item.content, maxText);
    const legacyReadingKey = readingKey(item);
    const oldPosition = positionItems ? record(positionItems[legacyReadingKey]) : null;
    const fraction = oldPosition?.ratio;
    const progress =
      typeof fraction === 'number' && Number.isFinite(fraction) && fraction > 0 && fraction < 1
        ? fraction
        : null;
    result.push({
      key,
      title,
      source: bounded(item.quelleName ?? item.sourceName, 300),
      content,
      read: readKeys.has(legacyReadingKey),
      progress,
    });
    seen.add(key);
  }
  return result;
}

function safeLegacyHttpUrl(value: unknown): boolean {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 2048 ||
    !(value.startsWith('https://') || value.startsWith('http://'))
  )
    return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) &&
      !['.local', '.localhost', '.internal', '.invalid', '.test'].some((suffix) =>
        url.hostname.endsWith(suffix),
      )
    );
  } catch {
    return false;
  }
}

function safeLegacyCompositeKey(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 512 ||
    value.includes('://') ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    return false;
  const parts = value.split('::');
  return (
    parts.length === 3 &&
    parts[0]!.length <= 300 &&
    parts[1]!.length > 0 &&
    parts[1]!.length <= 500 &&
    parts[2]!.length <= 100
  );
}

function safeLegacyReadingKey(value: unknown): value is string {
  return safeLegacyHttpUrl(value) || safeLegacyCompositeKey(value);
}

function bookmarkedReadingKeys(raw: string | null): ReadonlySet<string> {
  if (raw === null || raw.length > 4_000_000) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > maxArticles) return new Set();
    return new Set(
      parsed
        .map(record)
        .filter((item): item is Record<string, unknown> => item !== null)
        .map(readingKey),
    );
  } catch {
    return new Set();
  }
}

/** Strict, read-only projection of valid URL or old composite records absent from bookmarks. */
export function parseLegacyOrphanReading(
  bookmarksRaw: string | null,
  readRaw: string | null,
  positionsRaw: string | null,
): readonly LegacyOrphanReading[] {
  const bookmarked = new Set([
    ...parseLegacyBookmarks(bookmarksRaw).map((article) => article.key),
    ...bookmarkedReadingKeys(bookmarksRaw),
  ]);
  let reads: unknown = null;
  let positions: unknown = null;
  try {
    if (readRaw !== null && readRaw.length <= 500_000) reads = JSON.parse(readRaw);
  } catch {
    /* Invalid legacy bytes remain untouched. */
  }
  try {
    if (positionsRaw !== null && positionsRaw.length <= 500_000)
      positions = JSON.parse(positionsRaw);
  } catch {
    /* Invalid legacy bytes remain untouched. */
  }
  const readKeys =
    Array.isArray(reads) && reads.length <= maxArticles
      ? new Set<string>(reads.filter(safeLegacyReadingKey))
      : new Set<string>();
  const positionItems = record(positions);
  const positionKeys =
    positionItems && Object.keys(positionItems).length <= maxArticles
      ? Object.keys(positionItems)
      : [];
  const result: LegacyOrphanReading[] = [];
  for (const key of new Set([...readKeys, ...positionKeys])) {
    if (!safeLegacyReadingKey(key) || bookmarked.has(key)) continue;
    const position = positionItems ? record(positionItems[key]) : null;
    const ratio = position?.ratio;
    const progress =
      typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0 && ratio < 1 ? ratio : null;
    if (!readKeys.has(key) && progress === null) continue;
    const title =
      bounded(position?.title, 500) ||
      (safeLegacyHttpUrl(key) ? new URL(key).hostname : key.split('::')[1]!);
    result.push({ key, title, read: readKeys.has(key), progress });
    if (result.length >= maxArticles) break;
  }
  return result;
}

export function hasLegacySavedArticles(): boolean {
  try {
    const bookmarks = window.localStorage.getItem('wrn_bookmarks');
    const reads = window.localStorage.getItem('wrn_read_list');
    const positions = window.localStorage.getItem('wrn_read_positions');
    return (
      parseLegacyBookmarks(bookmarks).length > 0 ||
      parseLegacyOrphanReading(bookmarks, reads, positions).length > 0
    );
  } catch {
    return false;
  }
}

/** Reads the 2.1.1 database without upgrading its schema or changing any records. */
export async function readLegacyOfflineArticles(
  factory: IDBFactory | undefined = globalThis.indexedDB,
): Promise<unknown> {
  if (!factory?.databases) return null;
  try {
    const databases = await factory.databases();
    if (!databases.some((entry) => entry.name === 'world-revolution-news' && entry.version === 1))
      return null;
    return await new Promise<unknown>((resolve) => {
      let settled = false;
      const finish = (value: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 2000);
      const request = factory.open('world-revolution-news');
      request.onupgradeneeded = () => request.transaction?.abort();
      request.onerror = () => finish(null);
      request.onblocked = () => finish(null);
      request.onsuccess = () => {
        const db = request.result;
        if (settled) {
          db.close();
          return;
        }
        if (db.version !== 1) {
          db.close();
          finish(null);
          return;
        }
        if (!db.objectStoreNames.contains('datasets')) {
          db.close();
          finish(null);
          return;
        }
        try {
          const transaction = db.transaction('datasets', 'readonly');
          const get = transaction.objectStore('datasets').get('news-app-2-saved-articles');
          get.onsuccess = () => {
            db.close();
            finish(record(get.result)?.data ?? null);
          };
          get.onerror = () => {
            db.close();
            finish(null);
          };
          transaction.onabort = () => {
            db.close();
            finish(null);
          };
        } catch {
          db.close();
          finish(null);
        }
      };
    });
  } catch {
    return null;
  }
}
