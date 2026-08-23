import { foundationContractVersion, type ShellStateContract } from '@wrn/api-contracts';
import type { ShellState } from '@wrn/domain';

/**
 * Deterministische, rein lokale Foundation-Fixtures. Sie enthalten bewusst
 * keine News-, Account-, Provider- oder sonstige Produktdaten.
 */
export const shellStateFixtures: Readonly<Record<ShellState, ShellStateContract>> = Object.freeze({
  ready: Object.freeze({ contractVersion: foundationContractVersion, state: 'ready' }),
  loading: Object.freeze({ contractVersion: foundationContractVersion, state: 'loading' }),
  error: Object.freeze({ contractVersion: foundationContractVersion, state: 'error' }),
  offline: Object.freeze({ contractVersion: foundationContractVersion, state: 'offline' }),
});

/**
 * Liefert fuer Tests eine neue, veraenderbare Kopie einer bekannten Fixture.
 */
export function createShellStateFixture(state: ShellState): ShellStateContract {
  const fixture = shellStateFixtures[state];
  return {
    contractVersion: fixture.contractVersion,
    state: fixture.state,
  };
}
