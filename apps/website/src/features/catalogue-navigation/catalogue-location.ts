import { isUiLanguage, type UiLanguage } from '@wrn/ui-language';

export const catalogueKinds = [
  'library',
  'lexicon',
  'radio',
  'podcasts',
  'videos',
  'events',
] as const;
export type WebsiteCatalogueKind = (typeof catalogueKinds)[number];
export type CatalogueLocation = Readonly<{
  kind: WebsiteCatalogueKind;
  item: string | null;
  invalidItem: boolean;
}>;
const hasControls = (value: string, spaces = false) =>
  [...value].some(
    (character) => character.charCodeAt(0) <= (spaces ? 32 : 31) || character.charCodeAt(0) === 127,
  );
const paths: Record<WebsiteCatalogueKind, string> = {
  library: 'knowledge/library',
  lexicon: 'knowledge/lexicon',
  radio: 'media/radio',
  podcasts: 'media/podcasts',
  videos: 'media/videos',
  events: 'events',
};
export function validCatalogueItem(kind: WebsiteCatalogueKind, id: unknown): id is string {
  if (typeof id !== 'string' || id.length > 160) return false;
  return kind === 'library' || kind === 'lexicon'
    ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)
    : id.length === 68 && /^app-[a-f0-9]{64}$/.test(id);
}
export function readCatalogueLocation(hash: string): CatalogueLocation | null {
  if (hash.length > 1024 || hasControls(hash, true)) return null;
  const [path, parameters = '', extra] = hash.replace(/^#\/?/, '').split('?');
  if (extra !== undefined) return null;
  const kind =
    catalogueKinds.find((value) => paths[value] === path || value === path) ??
    (path === 'knowledge' ? 'library' : path === 'media' ? 'radio' : null);
  if (kind === null) return null;
  const query = new URLSearchParams(parameters);
  const ids = query.getAll('item');
  const invalidItem = ids.length > 1 || (ids.length === 1 && !validCatalogueItem(kind, ids[0]));
  return { kind, item: invalidItem ? null : (ids[0] ?? null), invalidItem };
}
export function catalogueHref(
  kind: WebsiteCatalogueKind,
  language: UiLanguage,
  item?: string,
): string {
  if (
    !catalogueKinds.includes(kind) ||
    !isUiLanguage(language) ||
    (item !== undefined && !validCatalogueItem(kind, item))
  )
    throw new TypeError('catalogue-link-invalid');
  return `/?lang=${language}#${paths[kind]}${item === undefined ? '' : `?item=${encodeURIComponent(item)}`}`;
}

export type CatalogueView = Readonly<{
  query: string;
  language: string;
  source: string;
  format: string;
  country: string;
  category: string;
  shown: number;
}>;
export const emptyCatalogueView: CatalogueView = {
  query: '',
  language: '',
  source: '',
  format: '',
  country: '',
  category: '',
  shown: 30,
};
export type CatalogueReturn = Readonly<{
  kind: WebsiteCatalogueKind;
  view: CatalogueView;
  scrollY: number;
  focusItem: string | null;
  focusControl: CatalogueControl | null;
}>;
export const catalogueControls = [
  'query',
  'language',
  'source',
  'format',
  'country',
  'category',
] as const;
export type CatalogueControl = (typeof catalogueControls)[number];
export function readCatalogueReturn(
  state: unknown,
  kind: WebsiteCatalogueKind,
): CatalogueReturn | null {
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
  const value = (state as Record<string, unknown>).wrnCatalogueReturn;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>,
    view = row.view;
  if (
    Object.keys(row).length !== 5 ||
    row.kind !== kind ||
    typeof row.scrollY !== 'number' ||
    !Number.isFinite(row.scrollY) ||
    row.scrollY < 0 ||
    row.scrollY > 1e7 ||
    !(row.focusItem === null || validCatalogueItem(kind, row.focusItem)) ||
    !(
      row.focusControl === null || catalogueControls.includes(row.focusControl as CatalogueControl)
    ) ||
    typeof view !== 'object' ||
    view === null ||
    Array.isArray(view)
  )
    return null;
  const fields = view as Record<string, unknown>;
  if (
    Object.keys(fields).length !== Object.keys(emptyCatalogueView).length ||
    !Object.keys(emptyCatalogueView).every((key) => Object.hasOwn(fields, key))
  )
    return null;
  if (
    !['query', 'language', 'source', 'format', 'country', 'category'].every(
      (key) =>
        typeof fields[key] === 'string' && fields[key].length <= 500 && !hasControls(fields[key]),
    )
  )
    return null;
  if (
    !Number.isSafeInteger(fields.shown) ||
    Number(fields.shown) < 30 ||
    Number(fields.shown) > 3000
  )
    return null;
  return value as CatalogueReturn;
}
