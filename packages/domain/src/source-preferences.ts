import {
  isLocalSourcePreferencesV1,
  isSourcePreferenceCatalog,
  isSourcePreferenceId,
  sourcePreferencesContractVersion,
  sourcePreferencesSchema,
  type LocalSourcePreferencesV1,
  type SourcePreferenceCatalog,
  type SourcePreferenceChoice,
} from '@wrn/content-contracts';

export type { LocalSourcePreferencesV1, SourcePreferenceCatalog, SourcePreferenceChoice };
export type SourcePreferenceAction = 'follow' | 'hide' | 'neutral';

function freezeState(choices: readonly SourcePreferenceChoice[]): LocalSourcePreferencesV1 {
  return Object.freeze({
    contractVersion: sourcePreferencesContractVersion,
    schema: sourcePreferencesSchema,
    choices: Object.freeze(choices.map((choice) => Object.freeze({ ...choice }))),
  });
}

export function emptySourcePreferences(): LocalSourcePreferencesV1 {
  return freezeState([]);
}

export function getSourcePreference(
  state: LocalSourcePreferencesV1,
  catalog: SourcePreferenceCatalog,
  id: string,
): SourcePreferenceAction {
  if (
    !isLocalSourcePreferencesV1(state) ||
    !isSourcePreferenceCatalog(catalog) ||
    !isSourcePreferenceId(catalog, id)
  ) {
    return 'neutral';
  }
  return (
    state.choices.find((choice) => choice.catalog === catalog && choice.sourceId === id)?.action ??
    'neutral'
  );
}

/** Replaces one exact catalog-scoped choice. Neutral removes only that exact choice. */
export function setSourcePreference(
  state: LocalSourcePreferencesV1,
  catalog: SourcePreferenceCatalog,
  id: string,
  action: SourcePreferenceAction,
): LocalSourcePreferencesV1 | null {
  if (
    !isLocalSourcePreferencesV1(state) ||
    !isSourcePreferenceCatalog(catalog) ||
    !isSourcePreferenceId(catalog, id) ||
    !['follow', 'hide', 'neutral'].includes(action)
  ) {
    return null;
  }
  const index = state.choices.findIndex(
    (choice) => choice.catalog === catalog && choice.sourceId === id,
  );
  const next = [...state.choices];
  if (action === 'neutral') {
    if (index >= 0) next.splice(index, 1);
  } else if (index >= 0) {
    next[index] = { catalog, sourceId: id, action };
  } else {
    next.push({ catalog, sourceId: id, action });
  }
  const result = freezeState(next);
  return isLocalSourcePreferencesV1(result) ? result : null;
}

/**
 * Keeps normal order except that visible followed items lead the list. A hide
 * for any source ID wins, including an article with multiple directory endpoints.
 */
export function projectSourcePreferences<T>(
  items: readonly T[],
  state: LocalSourcePreferencesV1,
  catalog: SourcePreferenceCatalog,
  sourceIds: (item: T) => readonly string[],
  options: { readonly includeHidden?: boolean } = {},
): readonly T[] {
  if (!isLocalSourcePreferencesV1(state) || !isSourcePreferenceCatalog(catalog))
    return Object.freeze([...items]);
  const preferences = new Map(
    state.choices
      .filter((choice) => choice.catalog === catalog)
      .map((choice) => [choice.sourceId, choice.action]),
  );
  const followed: T[] = [];
  const ordinary: T[] = [];
  for (const item of items) {
    const ids = sourceIds(item);
    const validIds = Array.isArray(ids)
      ? ids.filter((id): id is string => isSourcePreferenceId(catalog, id))
      : [];
    const hidden = validIds.some((id) => preferences.get(id) === 'hide');
    if (hidden && !options.includeHidden) continue;
    const isFollowed = !hidden && validIds.some((id) => preferences.get(id) === 'follow');
    (isFollowed ? followed : ordinary).push(item);
  }
  return Object.freeze([...followed, ...ordinary]);
}
