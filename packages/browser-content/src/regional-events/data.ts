import { validateProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import input from './events.json?raw';

// Generated from the reviewed input; rebuilds must not refresh its source dates.
export const regionalInputSha256 =
  '4ccb0da681444a8970e16113c7160c840f4cc9d777aafaba82923478ad9672a3';
export function loadCurrentRegionalEvents() {
  return validateProductionRegionalEventsV1(input, regionalInputSha256);
}
