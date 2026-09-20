import { parseShellState, type ShellState } from '@wrn/domain';

/**
 * Version des ausschliesslich lokalen Foundation-Vertrags. Eine HTTP- oder
 * Providerbindung ist damit weder definiert noch impliziert.
 */
export const foundationContractVersion = '0.1.0' as const;

export interface ShellStateContract {
  readonly contractVersion: typeof foundationContractVersion;
  readonly state: ShellState;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Runtime-Guard fuer den lokalen Shell-State-Vertrag. Der Guard akzeptiert nur
 * die exakte Contractversion und keinen fremden, implizit konvertierten Wert.
 */
export function isShellStateContract(value: unknown): value is ShellStateContract {
  if (
    !isPlainRecord(value) ||
    !Object.hasOwn(value, 'contractVersion') ||
    !Object.hasOwn(value, 'state') ||
    Object.keys(value).length !== 2 ||
    value.contractVersion !== foundationContractVersion
  ) {
    return false;
  }

  return parseShellState(value.state) !== null;
}

/**
 * Parst den lokalen Foundation-Vertrag fail-closed und ohne I/O.
 */
export function parseShellStateContract(value: unknown): ShellStateContract | undefined {
  if (!isShellStateContract(value)) {
    return undefined;
  }

  return {
    contractVersion: foundationContractVersion,
    state: value.state,
  };
}
