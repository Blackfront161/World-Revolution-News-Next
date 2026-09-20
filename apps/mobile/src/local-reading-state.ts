import { isLocalReadingStateV1, type LocalReadingStateV1 } from '@wrn/domain';
import { createEmptyLocalReadingState } from '@wrn/domain';

/** Dieser Key gehoert ausschliesslich zur mobilen Vorschau. */
export const mobileReadingStateStorageKey = 'wrn.mobile-local-reading-state.v1';

export type LocalReadingStateLoadResult =
  | { readonly kind: 'ready'; readonly state: LocalReadingStateV1 }
  | { readonly kind: 'read-only'; readonly state: LocalReadingStateV1 };

export function loadMobileReadingState(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): LocalReadingStateLoadResult {
  try {
    const raw = storage.getItem(mobileReadingStateStorageKey);
    if (raw === null) return { kind: 'ready', state: createEmptyLocalReadingState() };
    const parsed: unknown = JSON.parse(raw);
    return isLocalReadingStateV1(parsed)
      ? { kind: 'ready', state: parsed }
      : { kind: 'read-only', state: createEmptyLocalReadingState() };
  } catch {
    return { kind: 'read-only', state: createEmptyLocalReadingState() };
  }
}

/** localStorage#setItem ersetzt ein einzelnes V1-Dokument atomar oder wirft. */
export function persistMobileReadingState(
  state: LocalReadingStateV1,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
): boolean {
  try {
    storage.setItem(mobileReadingStateStorageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
