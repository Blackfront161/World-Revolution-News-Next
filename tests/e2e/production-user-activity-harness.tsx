/** Test-only storage probes. Imported only by an isolated Playwright profile. */
import { openProductionUserActivityStore } from '../../packages/browser-content/src/production-user-activity/store';
import {
  emptyActivityState,
  nextActivityState,
  recordActivityVisit,
  type ActivityState,
} from '../../packages/browser-content/src/production-user-activity/state';

const name = 'wrn.mobile-production-user-activity.v1';
const id = 'wrn-art-0123456789abcdef0123456789abcdef';
const raw = (version = 1, upgrade?: (database: IDBDatabase) => void) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => upgrade?.(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const erase = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('test handle leaked'));
  });
const transact = (database: IDBDatabase, action: (store: IDBObjectStore) => void) =>
  new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('activity', 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    action(transaction.objectStore('activity'));
  });
const code = (error: unknown) => (error instanceof Error ? error.message : String(error));
export async function exerciseActivityStorage() {
  const a = await openProductionUserActivityStore('mobile');
  const b = await openProductionUserActivityStore('mobile');
  const website = await openProductionUserActivityStore('website');
  const first = recordActivityVisit({ ...emptyActivityState(), enabled: true }, [
    { id, admittedContentSha256: 'a'.repeat(64), selected: true, readOrSaved: true },
  ]);
  const other = nextActivityState(emptyActivityState(), { enabled: true });
  const race = await Promise.allSettled([a.save(first, 0), b.save(other, 0)]);
  const winner = await a.snapshot();
  const abort = new AbortController();
  abort.abort();
  const aborted = await a
    .clear(winner.generation, abort.signal)
    .then(() => 'incorrect write', code);
  const afterAbort = await b.snapshot();
  const isolated = await website.snapshot();
  a.close();
  b.close();
  website.close();
  const reopened = await openProductionUserActivityStore('mobile');
  const beforeClear = await reopened.snapshot();
  await reopened.clear(beforeClear.generation);
  const stale = await reopened.save(first, 0).then(() => 'incorrect write', code);
  reopened.close();
  const final = await openProductionUserActivityStore('mobile');
  const cleared = await final.snapshot();
  final.close();
  return {
    race: race.map((result) => result.status),
    winner,
    aborted,
    afterAbort,
    isolated,
    beforeClear,
    stale,
    cleared,
  };
}
export async function exerciseProtectedActivityStorage() {
  const handle = await openProductionUserActivityStore('mobile');
  handle.close();
  let database = await raw();
  await transact(database, (store) => store.put({ future: 'preserve extra row' }, 'future'));
  database.close();
  const extra = await openProductionUserActivityStore('mobile');
  const extraFailure = await extra.clear(0).then(() => 'incorrect write', code);
  extra.close();
  database = await raw();
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const request = database.transaction('activity').objectStore('activity').getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  await erase();
  database = await raw(2, (db) => db.createObjectStore('activity'));
  const futureRow = { ...emptyActivityState(), version: 2 };
  await transact(database, (store) => store.put(futureRow, 'state'));
  database.close();
  const futureFailure = await openProductionUserActivityStore('mobile').then((store) => {
    store.close();
    return 'incorrect open';
  }, code);
  database = await raw(2);
  const futurePreserved = await new Promise<unknown>((resolve, reject) => {
    const request = database.transaction('activity').objectStore('activity').get('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  await erase();
  database = await raw(1, (db) => db.createObjectStore('activity', { keyPath: 'id' }));
  database.close();
  const schemaFailure = await openProductionUserActivityStore('mobile').then((store) => {
    store.close();
    return 'incorrect open';
  }, code);
  await erase();
  const corrupt = await openProductionUserActivityStore('mobile');
  corrupt.close();
  database = await raw();
  await transact(database, (store) =>
    store.put({ ...emptyActivityState(), availableIds: ['bad'] } as ActivityState, 'state'),
  );
  database.close();
  const corrupted = await openProductionUserActivityStore('mobile');
  const corruptFailure = await corrupted.snapshot().then(() => 'incorrect read', code);
  corrupted.close();
  return { extraFailure, keys, futureFailure, futurePreserved, schemaFailure, corruptFailure };
}
