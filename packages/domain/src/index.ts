/**
 * Minimal, plattformneutrale Zustandsbasis fuer die lokalen G3-Shells.
 * Diese Werte beschreiben keinen Content- oder Netzwerkvertrag.
 */
export const shellStates = ['ready', 'loading', 'error', 'offline'] as const;

export type ShellState = (typeof shellStates)[number];

/**
 * Prueft einen bereits vorliegenden Wert ohne Umwandlung oder Seiteneffekt.
 */
export function isShellState(value: unknown): value is ShellState {
  return typeof value === 'string' && shellStates.includes(value as ShellState);
}

/**
 * Liest einen Shell-Zustand fail-closed. Ungueltige oder fremde Werte ergeben
 * `null`; sie werden nie stillschweigend normalisiert oder vervollstaendigt.
 */
export function parseShellState(candidate: unknown): ShellState | null {
  return isShellState(candidate) ? candidate : null;
}

/**
 * Kennzeichnet Zustande, in denen eine Shell ohne neue Produktdaten weiter
 * bedienbar bleibt und ein erneuter Versuch sinnvoll sein kann.
 */
export function isRecoverableShellState(state: ShellState): boolean {
  return state === 'error' || state === 'offline';
}

/**
 * Kennzeichnet, ob die Shell ihren neutralen Startzustand verlassen hat.
 */
export function hasResolvedShellState(state: ShellState): boolean {
  return state !== 'loading';
}
