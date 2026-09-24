import { rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const retryableCodes = new Set(['EBUSY', 'ENOTEMPTY', 'EPERM']);

export async function atomicRename(source, target) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(source, target);
      return;
    } catch (error) {
      if (
        attempt >= 7 ||
        typeof error !== 'object' ||
        error === null ||
        !retryableCodes.has(error.code)
      ) {
        throw error;
      }
      await delay(25 * (attempt + 1));
    }
  }
}
