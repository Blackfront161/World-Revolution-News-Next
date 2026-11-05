export const sourcePassRevocationsSchema = 'wrn.source-pass-revocations.v1' as const;
export const sourcePassRevocationsMaxBytes = 64 * 1024;

export type SourcePassRevocationsV1 = Readonly<{
  schema: typeof sourcePassRevocationsSchema;
  contractVersion: '1.0.0';
  revision: number;
  observedAt: string;
  endpointIds: readonly string[];
}>;

const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const endpointId = (value: unknown): value is string =>
  typeof value === 'string' && /^source-[a-f0-9]{64}$/u.test(value);
const iso = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

export function isSourcePassRevocationsV1(value: unknown): value is SourcePassRevocationsV1 {
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > sourcePassRevocationsMaxBytes)
      return false;
  } catch {
    return false;
  }
  if (
    !exact(value, ['schema', 'contractVersion', 'revision', 'observedAt', 'endpointIds']) ||
    value.schema !== sourcePassRevocationsSchema ||
    value.contractVersion !== '1.0.0' ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 1 ||
    !iso(value.observedAt) ||
    !Array.isArray(value.endpointIds) ||
    !value.endpointIds.every(endpointId) ||
    new Set(value.endpointIds).size !== value.endpointIds.length
  )
    return false;
  return (value.endpointIds as string[]).every(
    (entry, index, all) => index === 0 || all[index - 1]! < entry,
  );
}

export function mergeSourcePassRevocationsV1(
  known: SourcePassRevocationsV1,
  incoming: SourcePassRevocationsV1,
): SourcePassRevocationsV1 | null {
  if (!isSourcePassRevocationsV1(known) || !isSourcePassRevocationsV1(incoming)) return null;
  if (incoming.revision < known.revision) return null;
  if (incoming.revision === known.revision)
    return JSON.stringify(incoming) === JSON.stringify(known) ? known : null;
  const next = new Set(incoming.endpointIds);
  if (!known.endpointIds.every((id) => next.has(id))) return null;
  return Object.freeze({
    ...incoming,
    endpointIds: Object.freeze([...incoming.endpointIds]),
  });
}
