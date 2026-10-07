import { validateProductionRegionalEventsV1 } from '@wrn/content-contracts/production-regional-events-v1';
import input from './events.json?raw';

// Generated from the reviewed input; rebuilds must not refresh its source dates.
export const regionalInputSha256 =
  '571eb5866536482dc6f5c046b8d82824bc85adedaf127316ac4b79b771d40236';
export function loadCurrentRegionalEvents() {
  return validateProductionRegionalEventsV1(input, regionalInputSha256);
}
