import {
  clearProductionReadingStateV2,
  createEmptyProductionReadingStateV2,
  didProductionReadingStateUpdateExceedCapacityV2,
  isProductionReadingStateV2,
  markProductionArticleReadV2,
  markProductionArticleUnreadV2,
  ProductionReadingStateCapacityConflictError,
  reconcileProductionReadingStateV2,
  removeProductionReadingEntryV2,
  resetProductionReadingProgressV2,
  saveProductionReadingArticleV2,
  unsaveProductionReadingArticleV2,
  updateProductionReadingProgressV2,
  type ProductionReadingStateV2,
} from '@wrn/domain';

export type ProductionReadingStateResult =
  | Readonly<{ kind: 'ready'; state: ProductionReadingStateV2 }>
  | Readonly<{ kind: 'read-only'; state: ProductionReadingStateV2 }>
  | Readonly<{ kind: 'write-failed'; state: ProductionReadingStateV2 }>
  | Readonly<{
      kind: 'capacity-conflict';
      state: ProductionReadingStateV2;
      left: ProductionReadingStateV2;
      right: ProductionReadingStateV2;
    }>;
export type ProductionReadingStateChange =
  | Readonly<{ kind: 'save'; articleId: string; time: string }>
  | Readonly<{ kind: 'unsave'; articleId: string }>
  | Readonly<{ kind: 'remove'; articleId: string }>
  | Readonly<{ kind: 'read'; articleId: string; time: string }>
  | Readonly<{ kind: 'unread'; articleId: string }>
  | Readonly<{ kind: 'progress'; articleId: string; fraction: number; time: string }>
  | Readonly<{ kind: 'reset-progress'; articleId: string }>
  | Readonly<{ kind: 'clear'; target: 'saved' | 'read' | 'all' }>;

function ready(state: ProductionReadingStateV2): ProductionReadingStateResult {
  return Object.freeze({ kind: 'ready', state });
}

function readonly(): ProductionReadingStateResult {
  return Object.freeze({ kind: 'read-only', state: createEmptyProductionReadingStateV2() });
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStored(
  storage: Pick<Storage, 'getItem'>,
  productionReadingStateStorageKey: string,
): ProductionReadingStateResult {
  try {
    const raw = storage.getItem(productionReadingStateStorageKey);
    if (raw === null) return ready(createEmptyProductionReadingStateV2());
    const parsed = JSON.parse(raw) as unknown;
    return isProductionReadingStateV2(parsed)
      ? ready(reconcileProductionReadingStateV2(parsed, createEmptyProductionReadingStateV2()))
      : readonly();
  } catch {
    return readonly();
  }
}

export function createProductionReadingStateStore(
  productionReadingStateStorageKey: string,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const resolvedStorage = storage ?? defaultStorage();
  const load = (): ProductionReadingStateResult =>
    resolvedStorage === null
      ? readonly()
      : readStored(resolvedStorage, productionReadingStateStorageKey);
  const change = (action: ProductionReadingStateChange): ProductionReadingStateResult => {
    if (resolvedStorage === null) return readonly();
    const current = readStored(resolvedStorage, productionReadingStateStorageKey);
    if (current.kind !== 'ready') return current;
    const state = current.state;
    const next =
      action.kind === 'save'
        ? saveProductionReadingArticleV2(state, action.articleId, action.time)
        : action.kind === 'unsave'
          ? unsaveProductionReadingArticleV2(state, action.articleId)
          : action.kind === 'remove'
            ? removeProductionReadingEntryV2(state, action.articleId)
            : action.kind === 'read'
              ? markProductionArticleReadV2(state, action.articleId, action.time)
              : action.kind === 'unread'
                ? markProductionArticleUnreadV2(state, action.articleId)
                : action.kind === 'progress'
                  ? updateProductionReadingProgressV2(
                      state,
                      action.articleId,
                      action.fraction,
                      action.time,
                    )
                  : action.kind === 'reset-progress'
                    ? resetProductionReadingProgressV2(state, action.articleId)
                    : clearProductionReadingStateV2(state, action.target);
    const capacityExceeded =
      next === state &&
      (action.kind === 'save'
        ? didProductionReadingStateUpdateExceedCapacityV2(state, {
            kind: 'save',
            articleId: action.articleId,
            savedAt: action.time,
          })
        : action.kind === 'read'
          ? didProductionReadingStateUpdateExceedCapacityV2(state, {
              kind: 'read',
              articleId: action.articleId,
              readAt: action.time,
            })
          : action.kind === 'progress'
            ? didProductionReadingStateUpdateExceedCapacityV2(state, {
                kind: 'progress',
                articleId: action.articleId,
                fraction: action.fraction,
                updatedAt: action.time,
              })
            : false);
    if (next === state)
      return capacityExceeded
        ? Object.freeze({ kind: 'capacity-conflict', state, left: state, right: state })
        : ready(state);
    try {
      resolvedStorage.setItem(productionReadingStateStorageKey, JSON.stringify(next));
      return ready(next);
    } catch {
      return Object.freeze({ kind: 'write-failed', state });
    }
  };
  const reconcile = (
    left: ProductionReadingStateV2,
    right: ProductionReadingStateV2,
  ): ProductionReadingStateResult => {
    try {
      return ready(reconcileProductionReadingStateV2(left, right));
    } catch (error) {
      if (error instanceof ProductionReadingStateCapacityConflictError)
        return Object.freeze({ kind: 'capacity-conflict', state: left, left, right });
      throw error;
    }
  };
  return Object.freeze({ load, change, reconcile });
}
