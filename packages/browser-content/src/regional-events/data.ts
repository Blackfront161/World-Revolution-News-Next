import { validateProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import input from './events.json?raw';

// Generated from the reviewed input; rebuilds must not refresh its source dates.
export const regionalInputSha256 =
  'ecf594f9d8269ed4503f517954993fd2e760191313e5e755bab92ed994af1014';
export function loadCurrentRegionalEvents() {
  return validateProductionRegionalEventsV1(input, regionalInputSha256);
}
