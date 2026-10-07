import { withWebsiteReadingStateLock } from '../../local-reading-state';
import { isWebsiteNewsId } from './directory-article-url';

export const newsReadingStorageKey = 'wrn.website-news-reading-state.v1';
export const newsReadingChangedEvent = 'wrn-website-news-reading-changed';
export type NewsReadingEntry = Readonly<{ articleId: string; saved: boolean; read: boolean }>;
export type NewsReadingState = Readonly<{
  schema: 'wrn.website-news-reading-state.v1';
  entries: readonly NewsReadingEntry[];
}>;
export type NewsReadingResult = Readonly<{
  kind: 'ready' | 'read-only' | 'write-failed' | 'capacity-conflict';
  state: NewsReadingState;
}>;
const empty = (): NewsReadingState => ({
  schema: 'wrn.website-news-reading-state.v1',
  entries: [],
});
const maxEntries = 500,
  maxBytes = 128 * 1024;
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
function valid(value: unknown): value is NewsReadingState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as NewsReadingState;
  return (
    Object.keys(record).sort().join(',') === 'entries,schema' &&
    record.schema === newsReadingStorageKey &&
    Array.isArray(record.entries) &&
    record.entries.length <= maxEntries &&
    new Set(record.entries.map((entry) => entry?.articleId)).size === record.entries.length &&
    record.entries.every(
      (entry) =>
        entry &&
        Object.keys(entry).sort().join(',') === 'articleId,read,saved' &&
        isWebsiteNewsId(entry.articleId) &&
        typeof entry.saved === 'boolean' &&
        typeof entry.read === 'boolean' &&
        (entry.saved || entry.read),
    )
  );
}
function parse(raw: string | null): NewsReadingResult {
  if (raw === null) return { kind: 'ready', state: empty() };
  try {
    if (raw.length > maxBytes || new TextEncoder().encode(raw).length > maxBytes)
      return { kind: 'read-only', state: empty() };
    const state: unknown = JSON.parse(raw);
    return valid(state) ? { kind: 'ready', state } : { kind: 'read-only', state: empty() };
  } catch {
    return { kind: 'read-only', state: empty() };
  }
}
export function loadNewsReadingState(storage?: Pick<Storage, 'getItem'>): NewsReadingResult {
  try {
    return parse((storage ?? window.localStorage).getItem(newsReadingStorageKey));
  } catch {
    return { kind: 'read-only', state: empty() };
  }
}
export type NewsReadingChange =
  | Readonly<{ kind: 'saved' | 'read'; articleId: string; value: boolean }>
  | Readonly<{ kind: 'clear' }>;
export async function changeNewsReadingState(
  action: NewsReadingChange,
  storage?: StoragePort,
  coordinate: <T>(operation: () => T) => Promise<T> = withWebsiteReadingStateLock,
): Promise<NewsReadingResult> {
  try {
    const target = storage ?? window.localStorage;
    const result = await coordinate((): NewsReadingResult => {
      const raw = target.getItem(newsReadingStorageKey),
        current = parse(raw);
      if (current.kind !== 'ready') return current;
      if (
        action.kind !== 'clear' &&
        (!isWebsiteNewsId(action.articleId) || typeof action.value !== 'boolean')
      )
        return { kind: 'write-failed', state: current.state };
      const entries = [...current.state.entries];
      if (action.kind === 'clear') entries.length = 0;
      else {
        const index = entries.findIndex((entry) => entry.articleId === action.articleId);
        const entry = {
          ...(entries[index] ?? { articleId: action.articleId, saved: false, read: false }),
          [action.kind]: action.value,
        };
        if (index >= 0) entries.splice(index, 1);
        if (entry.saved || entry.read) entries.push(entry);
      }
      const state: NewsReadingState = {
        schema: newsReadingStorageKey,
        entries: entries.sort((a, b) => a.articleId.localeCompare(b.articleId)),
      };
      if (entries.length > maxEntries) return { kind: 'capacity-conflict', state: current.state };
      const next = JSON.stringify(state);
      if (new TextEncoder().encode(next).length > maxBytes || !valid(state))
        return { kind: 'write-failed', state: current.state };
      if (target.getItem(newsReadingStorageKey) !== raw)
        return { kind: 'write-failed', state: loadNewsReadingState(target).state };
      if (next !== raw) target.setItem(newsReadingStorageKey, next);
      if (target.getItem(newsReadingStorageKey) !== next)
        return { kind: 'write-failed', state: loadNewsReadingState(target).state };
      return { kind: 'ready', state };
    });
    if (result.kind === 'ready' && typeof window !== 'undefined')
      window.dispatchEvent(new Event(newsReadingChangedEvent));
    return result;
  } catch {
    return { kind: 'write-failed', state: loadNewsReadingState(storage).state };
  }
}
