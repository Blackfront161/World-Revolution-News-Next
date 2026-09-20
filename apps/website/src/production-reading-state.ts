import { createProductionReadingStateStore as createStore } from '../../../packages/browser-content/src/production-reading-state';

export const productionReadingStateStorageKey = 'wrn.website-production-reading-state.v2';
export function createProductionReadingStateStore(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  return createStore(productionReadingStateStorageKey, storage);
}
