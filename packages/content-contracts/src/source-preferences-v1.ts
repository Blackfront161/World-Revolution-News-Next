export const sourcePreferencesContractVersion = '1.0.0' as const;
export const sourcePreferencesSchema = 'wrn.local-source-preferences.v1' as const;
export const sourcePreferencesMaxBytes = 64 * 1024;
export const sourcePreferencesMaxChoices = 256;

export const sourcePreferenceCatalogs = ['production', 'directory'] as const;
export type SourcePreferenceCatalog = (typeof sourcePreferenceCatalogs)[number];

export const sourcePreferenceChoiceActions = ['follow', 'hide'] as const;
export type SourcePreferenceChoiceAction = (typeof sourcePreferenceChoiceActions)[number];

export interface SourcePreferenceChoice {
  readonly catalog: SourcePreferenceCatalog;
  readonly sourceId: string;
  readonly action: SourcePreferenceChoiceAction;
}

export interface LocalSourcePreferencesV1 {
  readonly contractVersion: typeof sourcePreferencesContractVersion;
  readonly schema: typeof sourcePreferencesSchema;
  readonly choices: readonly SourcePreferenceChoice[];
}

const directorySourceId = /^source-[a-f0-9]{64}$/;

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0)!;
    return (codePoint >= 0 && codePoint <= 31) || (codePoint >= 127 && codePoint <= 159);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

export function isSourcePreferenceCatalog(value: unknown): value is SourcePreferenceCatalog {
  return (
    typeof value === 'string' && sourcePreferenceCatalogs.includes(value as SourcePreferenceCatalog)
  );
}

export function isSourcePreferenceId(
  catalog: SourcePreferenceCatalog,
  value: unknown,
): value is string {
  if (typeof value !== 'string' || value !== value.trim() || hasControlCharacter(value))
    return false;
  if (catalog === 'production') {
    return (
      new TextEncoder().encode(value).byteLength >= 1 &&
      new TextEncoder().encode(value).byteLength <= 160
    );
  }
  return directorySourceId.test(value);
}

export function isSourcePreferenceChoice(value: unknown): value is SourcePreferenceChoice {
  if (!isRecord(value) || !hasOnlyKeys(value, ['catalog', 'sourceId', 'action'])) return false;
  return (
    isSourcePreferenceCatalog(value.catalog) &&
    isSourcePreferenceId(value.catalog, value.sourceId) &&
    typeof value.action === 'string' &&
    sourcePreferenceChoiceActions.includes(value.action as SourcePreferenceChoiceAction)
  );
}

/** Validates an opaque, local-only V1 document without requiring catalog membership. */
export function isLocalSourcePreferencesV1(value: unknown): value is LocalSourcePreferencesV1 {
  if (!isRecord(value) || !hasOnlyKeys(value, ['contractVersion', 'schema', 'choices']))
    return false;
  if (
    value.contractVersion !== sourcePreferencesContractVersion ||
    value.schema !== sourcePreferencesSchema ||
    !Array.isArray(value.choices) ||
    value.choices.length > sourcePreferencesMaxChoices
  ) {
    return false;
  }
  const choices = value.choices as unknown[];
  const identities = new Set<string>();
  for (const choice of choices) {
    if (!isSourcePreferenceChoice(choice)) return false;
    const identity = `${choice.catalog}\u0000${choice.sourceId}`;
    if (identities.has(identity)) return false;
    identities.add(identity);
  }
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength <= sourcePreferencesMaxBytes;
  } catch {
    return false;
  }
}
