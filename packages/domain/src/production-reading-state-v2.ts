/** Production-only reading state. It deliberately never accepts fixture IDs. */
export const productionReadingStateSchemaV2 = 'wrn.production-reading-state.v2' as const;
export const productionReadingStateRevisionV2 = 'wrn-production-reading-state-v2' as const;
export const productionReadingStateMaxEntriesV2 = 200 as const;
export const productionReadingStateMaxBytesV2 = 32 * 1024;
const idPattern = /^wrn-art-[a-f0-9]{32}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export interface ProductionReadingProgressV2 {
  readonly fraction: number;
  readonly updatedAt: string;
}
export interface ProductionReadingStateEntryV2 {
  readonly articleId: `wrn-art-${string}`;
  readonly savedAt?: string | undefined;
  readonly readAt?: string | undefined;
  readonly progress?: ProductionReadingProgressV2 | undefined;
}
export interface ProductionReadingStateV2 {
  readonly contractVersion: '2.0.0';
  readonly schema: typeof productionReadingStateSchemaV2;
  readonly revision: typeof productionReadingStateRevisionV2;
  readonly entries: readonly ProductionReadingStateEntryV2[];
}

export type ProductionReadingStateCapacityProbeV2 =
  | Readonly<{ kind: 'save'; articleId: unknown; savedAt: unknown }>
  | Readonly<{ kind: 'read'; articleId: unknown; readAt: unknown }>
  | Readonly<{
      kind: 'progress';
      articleId: unknown;
      fraction: unknown;
      updatedAt: unknown;
    }>;

/**
 * Reconciliation must retain the complete union. A caller can surface this
 * deterministic conflict and keep both persisted replicas for a later choice.
 */
export class ProductionReadingStateCapacityConflictError extends Error {
  readonly code = 'wrn.production-reading-state.capacity-conflict' as const;

  constructor() {
    super('Production reading state reconciliation exceeds its capacity.');
    this.name = 'ProductionReadingStateCapacityConflictError';
  }
}

function validId(value: unknown): value is `wrn-art-${string}` {
  return typeof value === 'string' && idPattern.test(value);
}
function validTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    timestampPattern.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function plain(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  );
}
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function validEntry(value: unknown): value is ProductionReadingStateEntryV2 {
  if (
    !plain(value) ||
    !validId(value.articleId) ||
    !Object.keys(value).every((key) => ['articleId', 'savedAt', 'readAt', 'progress'].includes(key))
  )
    return false;
  if (value.savedAt !== undefined && !validTimestamp(value.savedAt)) return false;
  if (value.readAt !== undefined && !validTimestamp(value.readAt)) return false;
  if (
    value.progress !== undefined &&
    (!plain(value.progress) ||
      !exact(value.progress, ['fraction', 'updatedAt']) ||
      typeof value.progress.fraction !== 'number' ||
      !Number.isFinite(value.progress.fraction) ||
      value.progress.fraction < 0.01 ||
      value.progress.fraction > 1 ||
      !validTimestamp(value.progress.updatedAt))
  )
    return false;
  return value.savedAt !== undefined || value.readAt !== undefined || value.progress !== undefined;
}
export function isProductionReadingStateV2(value: unknown): value is ProductionReadingStateV2 {
  if (
    !plain(value) ||
    !exact(value, ['contractVersion', 'schema', 'revision', 'entries']) ||
    value.contractVersion !== '2.0.0' ||
    value.schema !== productionReadingStateSchemaV2 ||
    value.revision !== productionReadingStateRevisionV2 ||
    !Array.isArray(value.entries)
  )
    return false;
  const entries = value.entries;
  return (
    entries.length <= productionReadingStateMaxEntriesV2 &&
    entries.every(validEntry) &&
    entries.every(
      (entry, index) => index === 0 || entries[index - 1]!.articleId < entry.articleId,
    ) &&
    new TextEncoder().encode(JSON.stringify(value)).byteLength <= productionReadingStateMaxBytesV2
  );
}
export function createEmptyProductionReadingStateV2(): ProductionReadingStateV2 {
  return Object.freeze({
    contractVersion: '2.0.0',
    schema: productionReadingStateSchemaV2,
    revision: productionReadingStateRevisionV2,
    entries: Object.freeze([]),
  });
}
function freezeState(entries: readonly ProductionReadingStateEntryV2[]): ProductionReadingStateV2 {
  return Object.freeze({
    contractVersion: '2.0.0',
    schema: productionReadingStateSchemaV2,
    revision: productionReadingStateRevisionV2,
    entries: Object.freeze(
      [...entries]
        .sort((left, right) => left.articleId.localeCompare(right.articleId))
        .map((entry) =>
          Object.freeze({
            ...entry,
            ...(entry.progress ? { progress: Object.freeze({ ...entry.progress }) } : {}),
          }),
        ),
    ),
  });
}
function latest(left: string | undefined, right: string | undefined): string | undefined {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return left >= right ? left : right;
}
interface ProductionReadingStateUpdateResultV2 {
  readonly state: ProductionReadingStateV2;
  readonly capacityExceeded: boolean;
}

function updateResult(
  state: ProductionReadingStateV2,
  articleId: unknown,
  change: (
    current: ProductionReadingStateEntryV2 | undefined,
  ) => ProductionReadingStateEntryV2 | null,
): ProductionReadingStateUpdateResultV2 {
  if (!isProductionReadingStateV2(state) || !validId(articleId))
    return { state, capacityExceeded: false };
  const entries = new Map(state.entries.map((entry) => [entry.articleId, entry]));
  if (!entries.has(articleId) && entries.size >= productionReadingStateMaxEntriesV2)
    return { state, capacityExceeded: true };
  const next = change(entries.get(articleId));
  if (next === null) entries.delete(articleId);
  else entries.set(articleId, next);
  const candidate = freezeState([...entries.values()]);
  return isProductionReadingStateV2(candidate)
    ? { state: candidate, capacityExceeded: false }
    : { state, capacityExceeded: true };
}

function update(
  state: ProductionReadingStateV2,
  articleId: unknown,
  change: (
    current: ProductionReadingStateEntryV2 | undefined,
  ) => ProductionReadingStateEntryV2 | null,
): ProductionReadingStateV2 {
  return updateResult(state, articleId, change).state;
}

function saveUpdate(
  state: ProductionReadingStateV2,
  articleId: unknown,
  savedAt: unknown,
): ProductionReadingStateUpdateResultV2 {
  if (!validTimestamp(savedAt)) return { state, capacityExceeded: false };
  return updateResult(state, articleId, (current) => ({
    articleId: articleId as `wrn-art-${string}`,
    ...(latest(current?.savedAt, savedAt) ? { savedAt: latest(current?.savedAt, savedAt) } : {}),
    ...(current?.readAt ? { readAt: current.readAt } : {}),
    ...(current?.progress ? { progress: current.progress } : {}),
  }));
}

function readUpdate(
  state: ProductionReadingStateV2,
  articleId: unknown,
  readAt: unknown,
): ProductionReadingStateUpdateResultV2 {
  if (!validTimestamp(readAt)) return { state, capacityExceeded: false };
  return updateResult(state, articleId, (current) => ({
    articleId: articleId as `wrn-art-${string}`,
    ...(current?.savedAt ? { savedAt: current.savedAt } : {}),
    ...(latest(current?.readAt, readAt) ? { readAt: latest(current?.readAt, readAt) } : {}),
    ...(current?.progress ? { progress: current.progress } : {}),
  }));
}

function progressUpdate(
  state: ProductionReadingStateV2,
  articleId: unknown,
  fraction: unknown,
  updatedAt: unknown,
): ProductionReadingStateUpdateResultV2 {
  if (typeof fraction !== 'number' || !Number.isFinite(fraction) || !validTimestamp(updatedAt))
    return { state, capacityExceeded: false };
  const normalized = Math.max(0, Math.min(1, fraction));
  if (normalized < 0.01) return { state, capacityExceeded: false };
  return updateResult(state, articleId, (current) => {
    const progress =
      !current?.progress ||
      current.progress.fraction < normalized ||
      (current.progress.fraction === normalized && current.progress.updatedAt < updatedAt)
        ? { fraction: normalized, updatedAt }
        : current.progress;
    return {
      articleId: articleId as `wrn-art-${string}`,
      ...(current?.savedAt ? { savedAt: current.savedAt } : {}),
      ...(current?.readAt || normalized >= 0.9
        ? { readAt: latest(current?.readAt, updatedAt)! }
        : {}),
      progress,
    };
  });
}
export function saveProductionReadingArticleV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
  savedAt: unknown,
): ProductionReadingStateV2 {
  return saveUpdate(state, articleId, savedAt).state;
}
export function markProductionArticleReadV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
  readAt: unknown,
): ProductionReadingStateV2 {
  return readUpdate(state, articleId, readAt).state;
}
export function updateProductionReadingProgressV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
  fraction: unknown,
  updatedAt: unknown,
): ProductionReadingStateV2 {
  return progressUpdate(state, articleId, fraction, updatedAt).state;
}

export function didProductionReadingStateUpdateExceedCapacityV2(
  state: ProductionReadingStateV2,
  probe: ProductionReadingStateCapacityProbeV2,
): boolean {
  return probe.kind === 'save'
    ? saveUpdate(state, probe.articleId, probe.savedAt).capacityExceeded
    : probe.kind === 'read'
      ? readUpdate(state, probe.articleId, probe.readAt).capacityExceeded
      : progressUpdate(state, probe.articleId, probe.fraction, probe.updatedAt).capacityExceeded;
}

export function unsaveProductionReadingArticleV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
): ProductionReadingStateV2 {
  return update(state, articleId, (current) => {
    if (current === undefined) return null;
    return current.readAt === undefined && current.progress === undefined
      ? null
      : {
          articleId: current.articleId,
          ...(current.readAt ? { readAt: current.readAt } : {}),
          ...(current.progress ? { progress: current.progress } : {}),
        };
  });
}

export function removeProductionReadingEntryV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
): ProductionReadingStateV2 {
  if (!isProductionReadingStateV2(state) || !validId(articleId)) return state;
  if (!state.entries.some((entry) => entry.articleId === articleId)) return state;
  return freezeState(state.entries.filter((entry) => entry.articleId !== articleId));
}

export function markProductionArticleUnreadV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
): ProductionReadingStateV2 {
  return update(state, articleId, (current) => {
    if (current === undefined) return null;
    return current.savedAt === undefined && current.progress === undefined
      ? null
      : {
          articleId: current.articleId,
          ...(current.savedAt ? { savedAt: current.savedAt } : {}),
          ...(current.progress ? { progress: current.progress } : {}),
        };
  });
}

export function resetProductionReadingProgressV2(
  state: ProductionReadingStateV2,
  articleId: unknown,
): ProductionReadingStateV2 {
  return update(state, articleId, (current) => {
    if (current === undefined) return null;
    return current.savedAt === undefined && current.readAt === undefined
      ? null
      : {
          articleId: current.articleId,
          ...(current.savedAt ? { savedAt: current.savedAt } : {}),
          ...(current.readAt ? { readAt: current.readAt } : {}),
        };
  });
}

export function clearProductionReadingStateV2(
  state: ProductionReadingStateV2,
  target: 'saved' | 'read' | 'all',
): ProductionReadingStateV2 {
  if (!isProductionReadingStateV2(state)) return state;
  if (target === 'all') return createEmptyProductionReadingStateV2();
  return freezeState(
    state.entries.flatMap((entry) => {
      const next =
        target === 'saved'
          ? {
              articleId: entry.articleId,
              ...(entry.readAt ? { readAt: entry.readAt } : {}),
              ...(entry.progress ? { progress: entry.progress } : {}),
            }
          : {
              articleId: entry.articleId,
              ...(entry.savedAt ? { savedAt: entry.savedAt } : {}),
              ...(entry.progress ? { progress: entry.progress } : {}),
            };
      return Object.keys(next).length === 1 ? [] : [next];
    }),
  );
}
export function reconcileProductionReadingStateV2(
  left: ProductionReadingStateV2,
  right: ProductionReadingStateV2,
): ProductionReadingStateV2 {
  if (!isProductionReadingStateV2(left) || !isProductionReadingStateV2(right)) return left;
  const merged = new Map(left.entries.map((entry) => [entry.articleId, entry]));
  for (const incoming of right.entries) {
    const current = merged.get(incoming.articleId);
    if (current === undefined) {
      merged.set(incoming.articleId, incoming);
      continue;
    }
    const progress =
      current.progress === undefined
        ? incoming.progress
        : incoming.progress === undefined
          ? current.progress
          : current.progress.fraction > incoming.progress.fraction ||
              (current.progress.fraction === incoming.progress.fraction &&
                current.progress.updatedAt >= incoming.progress.updatedAt)
            ? current.progress
            : incoming.progress;
    merged.set(incoming.articleId, {
      articleId: incoming.articleId,
      ...(latest(current.savedAt, incoming.savedAt)
        ? { savedAt: latest(current.savedAt, incoming.savedAt) }
        : {}),
      ...(latest(current.readAt, incoming.readAt)
        ? { readAt: latest(current.readAt, incoming.readAt) }
        : {}),
      ...(progress ? { progress } : {}),
    });
  }
  const candidate = freezeState([...merged.values()]);
  if (!isProductionReadingStateV2(candidate))
    throw new ProductionReadingStateCapacityConflictError();
  return candidate;
}
