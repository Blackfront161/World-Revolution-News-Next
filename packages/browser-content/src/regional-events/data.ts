import { validateProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import input from './events.json?raw';

// Generated from the reviewed input; rebuilds must not refresh its source dates.
export const regionalInputSha256 =
  '12f7b72c4e258319d004b4a82496abbbe6c234d2f242edcb71bf8a65ff4d7ff2';
export function loadCurrentRegionalEvents() {
  return validateProductionRegionalEventsV1(input, regionalInputSha256);
}
