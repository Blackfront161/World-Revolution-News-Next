/** Device-only hints; this state never grants content or media authority. */
export type ActivityArticle = Readonly<{
  id: string;
  admittedContentSha256: string | null;
  selected: boolean;
  readOrSaved: boolean;
}>;
export type ActivityState = Readonly<{
  version: 1;
  generation: number;
  enabled: boolean;
  visited: boolean;
  availableIds: readonly string[];
  fingerprints: Readonly<Record<string, string>>;
  notifications: Readonly<{
    enabled: boolean;
    quietStart: number;
    quietEnd: number;
    notifiedIds: readonly string[];
  }>;
}>;
export type ActivityFailure =
  | 'unavailable'
  | 'protected'
  | 'conflict'
  | 'capacity'
  | 'invalid'
  | 'timeout'
  | 'aborted'
  | 'quota-or-write-failure';
export class ProductionUserActivityError extends Error {
  constructor(readonly code: ActivityFailure) {
    super(`User activity: ${code}`);
  }
}
const cap = 200;
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^wrn-art-[a-f0-9]{32}$/.test(value);
const hash = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value) as object | null) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const validIds = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length <= cap &&
  value.every((item, i) => id(item) && (i === 0 || value[i - 1] < item));
export function isActivityState(value: unknown): value is ActivityState {
  if (
    !exact(value, [
      'version',
      'generation',
      'enabled',
      'visited',
      'availableIds',
      'fingerprints',
      'notifications',
    ]) ||
    value.version !== 1 ||
    !Number.isSafeInteger(value.generation) ||
    (value.generation as number) < 0 ||
    typeof value.enabled !== 'boolean' ||
    typeof value.visited !== 'boolean' ||
    !validIds(value.availableIds) ||
    !exact(value.notifications, ['enabled', 'quietStart', 'quietEnd', 'notifiedIds'])
  )
    return false;
  const marks = value.fingerprints;
  if (
    typeof marks !== 'object' ||
    marks === null ||
    Array.isArray(marks) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(marks) as object | null) ||
    Object.keys(marks).length > cap ||
    !Object.entries(marks).every(([key, digest]) => id(key) && hash(digest))
  )
    return false;
  const settings = value.notifications;
  if (
    typeof settings.enabled !== 'boolean' ||
    ![settings.quietStart, settings.quietEnd].every(
      (n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 1440,
    ) ||
    !validIds(settings.notifiedIds)
  )
    return false;
  if (
    !value.enabled &&
    (value.visited ||
      value.availableIds.length > 0 ||
      Object.keys(marks).length > 0 ||
      settings.enabled ||
      settings.notifiedIds.length > 0)
  )
    return false;
  if (new Set([...value.availableIds, ...Object.keys(marks), ...settings.notifiedIds]).size > cap)
    return false;
  return new TextEncoder().encode(JSON.stringify(value)).byteLength <= 65_536;
}
export function freezeActivityState(value: ActivityState): ActivityState {
  if (!isActivityState(value)) throw new ProductionUserActivityError('invalid');
  return Object.freeze({
    ...value,
    availableIds: Object.freeze([...value.availableIds]),
    fingerprints: Object.freeze({ ...value.fingerprints }),
    notifications: Object.freeze({
      ...value.notifications,
      notifiedIds: Object.freeze([...value.notifications.notifiedIds]),
    }),
  });
}
export function emptyActivityState(generation = 0): ActivityState {
  return freezeActivityState({
    version: 1,
    generation,
    enabled: false,
    visited: false,
    availableIds: [],
    fingerprints: {},
    notifications: { enabled: false, quietStart: 1320, quietEnd: 480, notifiedIds: [] },
  });
}
export function nextActivityState(
  state: ActivityState,
  patch: Partial<Omit<ActivityState, 'version' | 'generation'>>,
): ActivityState {
  if (!isActivityState(state) || state.generation >= Number.MAX_SAFE_INTEGER)
    throw new ProductionUserActivityError('conflict');
  const next = { ...state, ...patch, generation: state.generation + 1 };
  if (!isActivityState(next)) throw new ProductionUserActivityError('capacity');
  return freezeActivityState(next);
}
function checkedArticles(articles: readonly ActivityArticle[]): void {
  if (
    articles.length > cap ||
    new Set(articles.map((article) => article.id)).size !== articles.length ||
    articles.some(
      (article) =>
        !id(article.id) ||
        (article.admittedContentSha256 !== null && !hash(article.admittedContentSha256)) ||
        typeof article.selected !== 'boolean' ||
        typeof article.readOrSaved !== 'boolean',
    )
  )
    throw new ProductionUserActivityError('invalid');
}
/** Merely selecting a different filter never changes the availability baseline. */
export function projectActivity(
  state: ActivityState,
  articles: readonly ActivityArticle[],
  priorIds: readonly string[] | null = state.visited ? state.availableIds : null,
) {
  checkedArticles(articles);
  const previous = new Set(priorIds ?? []);
  return Object.freeze({
    firstVisit: priorIds === null,
    newIds: Object.freeze(
      state.enabled && priorIds !== null
        ? articles
            .filter((article) => article.selected && !previous.has(article.id))
            .map((article) => article.id)
        : [],
    ),
    changedIds: Object.freeze(
      state.enabled
        ? articles
            .filter(
              (article) =>
                article.readOrSaved &&
                article.admittedContentSha256 !== null &&
                state.fingerprints[article.id] !== undefined &&
                state.fingerprints[article.id] !== article.admittedContentSha256,
            )
            .map((article) => article.id)
        : [],
    ),
  });
}
export function recordActivityVisit(
  state: ActivityState,
  articles: readonly ActivityArticle[],
): ActivityState {
  checkedArticles(articles);
  if (!state.enabled) return state;
  const fingerprints = { ...state.fingerprints };
  for (const article of articles)
    if (
      article.readOrSaved &&
      article.admittedContentSha256 !== null &&
      fingerprints[article.id] === undefined
    )
      fingerprints[article.id] = article.admittedContentSha256;
  return nextActivityState(state, {
    visited: true,
    availableIds: articles.map((article) => article.id).sort(),
    fingerprints,
  });
}
/** Called only for the exact current, user-acknowledged article version. */
export function acknowledgeActivity(state: ActivityState, article: ActivityArticle): ActivityState {
  checkedArticles([article]);
  if (
    !state.enabled ||
    !article.readOrSaved ||
    article.admittedContentSha256 === null ||
    state.fingerprints[article.id] === article.admittedContentSha256
  )
    return state;
  return nextActivityState(state, {
    fingerprints: { ...state.fingerprints, [article.id]: article.admittedContentSha256 },
  });
}
export function isActivityQuietTime(settings: ActivityState['notifications'], date: Date): boolean {
  if (!Number.isFinite(date.getTime())) return true;
  const minute = date.getHours() * 60 + date.getMinutes();
  return (
    settings.quietStart === settings.quietEnd ||
    (settings.quietStart < settings.quietEnd
      ? minute >= settings.quietStart && minute < settings.quietEnd
      : minute >= settings.quietStart || minute < settings.quietEnd)
  );
}
