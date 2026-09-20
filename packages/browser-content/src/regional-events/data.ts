import { validateProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import input from './events.json';

// Generated from the reviewed input; rebuilds must not refresh its source dates.
export const regionalInputSha256 =
  'fa62d54dfaf562f41b4a4a5f54e6338985e2d84d9e9dc92b0e21d894ff17174b';
export function loadCurrentRegionalEvents() {
  return validateProductionRegionalEventsV1(JSON.stringify(input), regionalInputSha256);
}
