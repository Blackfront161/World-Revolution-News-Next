import { createOfflineIdbCore } from './content-offline-store-core';
import {
  isWebsiteTuplePointer,
  websiteTupleMaxBytes,
  type WebsiteContentTuplePointerV1,
} from '../../content-contracts/src/directory/website-content-tuple-v1';
export type StoredWebsiteTuple = Readonly<{
  pointer: WebsiteContentTuplePointerV1;
  bytes: Uint8Array;
}>;
export type WebsiteTupleRestrictions = { articleIds: string[]; endpointIds: string[] };
type State = {
  schema: 'wrn.website-content-tuple-cache.v1';
  active: StoredWebsiteTuple | null;
  previous: StoredWebsiteTuple | null;
  restrictions: WebsiteTupleRestrictions;
  activationId: string | null;
  previousActivationId: string | null;
};
export type WebsiteTupleActivation = Readonly<{ sha256: string; activationId: string }>;
const key = 'state',
  storeName = 'release';
const core = createOfflineIdbCore({
  databaseName: 'wrn.website-content-tuple.v1',
  databaseVersion: 1,
  error: (code) => Error('ws:' + code),
  upgrade: (db) => {
    db.createObjectStore(storeName);
  },
  expectedSchema: (db) =>
    db.objectStoreNames.length === 1 && db.objectStoreNames.contains(storeName),
});
const entry = (v: unknown): v is StoredWebsiteTuple =>
  !!v &&
  typeof v === 'object' &&
  Object.keys(v).sort().join(',') === 'bytes,pointer' &&
  isWebsiteTuplePointer((v as StoredWebsiteTuple).pointer) &&
  (v as StoredWebsiteTuple).bytes instanceof Uint8Array &&
  (v as StoredWebsiteTuple).bytes.byteLength <= websiteTupleMaxBytes;
const restrictions = (v: unknown): v is WebsiteTupleRestrictions =>
  !!v &&
  typeof v === 'object' &&
  Object.keys(v).sort().join(',') === 'articleIds,endpointIds' &&
  ['articleIds', 'endpointIds'].every((k) => {
    const ids = (v as Record<string, unknown>)[k];
    return (
      Array.isArray(ids) &&
      new Set(ids).size === ids.length &&
      ids.every(
        (id) =>
          typeof id === 'string' &&
          new RegExp(`^${k === 'articleIds' ? 'news' : 'source'}-[a-f0-9]{64}$`).test(id),
      )
    );
  }) &&
  JSON.stringify(v).length <= 65536;
const owner = (v: unknown) => v === null || (typeof v === 'string' && /^[a-f0-9-]{36}$/.test(v));
const state = (v: unknown): v is State =>
  !!v &&
  typeof v === 'object' &&
  Object.keys(v).sort().join(',') ===
    'activationId,active,previous,previousActivationId,restrictions,schema' &&
  (v as State).schema === 'wrn.website-content-tuple-cache.v1' &&
  ((v as State).active === null || entry((v as State).active)) &&
  ((v as State).previous === null || entry((v as State).previous)) &&
  owner((v as State).activationId) &&
  owner((v as State).previousActivationId) &&
  restrictions((v as State).restrictions);
export async function saveWebsiteTupleRestrictions(
  incoming: WebsiteTupleRestrictions,
  signal?: AbortSignal,
) {
  if (!restrictions(incoming)) throw Error('ws:restriction');
  const db = await core.open(signal);
  try {
    const tx = db.transaction(storeName, 'readwrite'),
      done = core.transaction(tx, signal),
      store = tx.objectStore(storeName),
      request = store.get(key);
    request.onsuccess = () => {
      const old = request.result;
      if (old !== undefined && !state(old)) {
        tx.abort();
        return;
      }
      const previous: State = old ?? {
        schema: 'wrn.website-content-tuple-cache.v1',
        active: null,
        previous: null,
        restrictions: { articleIds: [], endpointIds: [] },
        activationId: null,
        previousActivationId: null,
      };
      const merged = {
        articleIds: [
          ...new Set([...previous.restrictions.articleIds, ...incoming.articleIds]),
        ].sort(),
        endpointIds: [
          ...new Set([...previous.restrictions.endpointIds, ...incoming.endpointIds]),
        ].sort(),
      };
      if (!restrictions(merged)) {
        tx.abort();
        return;
      }
      store.put({ ...previous, restrictions: merged }, key);
    };
    await done;
  } finally {
    db.close();
  }
}
/** One atomic IDB record holds at most two metadata payloads; never image bytes. */
export async function readWebsiteTupleStore(signal?: AbortSignal): Promise<State | null> {
  const db = await core.open(signal);
  try {
    const tx = db.transaction(storeName, 'readonly'),
      done = core.transaction(tx, signal);
    const value = await core.request(tx.objectStore(storeName).get(key));
    await done;
    if (value === undefined) return null;
    if (!state(value)) throw Error('ws:corrupt');
    return value;
  } finally {
    db.close();
  }
}
export async function saveWebsiteTupleStore(
  incoming: StoredWebsiteTuple,
  signal?: AbortSignal,
): Promise<WebsiteTupleActivation | null> {
  if (!entry(incoming) || incoming.pointer.artifactBytes !== incoming.bytes.byteLength)
    throw Error('ws:input');
  const db = await core.open(signal);
  let conflict = false,
    changed = false;
  const activationId = crypto.randomUUID();
  try {
    const tx = db.transaction(storeName, 'readwrite'),
      done = core.transaction(tx, signal),
      store = tx.objectStore(storeName),
      request = store.get(key);
    request.onsuccess = () => {
      const old = request.result as unknown;
      if (old !== undefined && !state(old)) {
        conflict = true;
        tx.abort();
        return;
      }
      const previous = state(old) ? old : null;
      if (
        previous?.active &&
        (previous.active.pointer.sequence > incoming.pointer.sequence ||
          (previous.active.pointer.sequence === incoming.pointer.sequence &&
            previous.active.pointer.artifactSha256 !== incoming.pointer.artifactSha256))
      ) {
        conflict = true;
        tx.abort();
        return;
      }
      if (previous?.active?.pointer.artifactSha256 === incoming.pointer.artifactSha256) return;
      changed = true;
      store.put(
        {
          schema: 'wrn.website-content-tuple-cache.v1',
          active: incoming,
          previous: previous?.active ?? null,
          restrictions: previous?.restrictions ?? { articleIds: [], endpointIds: [] },
          activationId,
          previousActivationId: previous?.activationId ?? null,
        } satisfies State,
        key,
      );
    };
    try {
      await done;
    } catch (error) {
      if (conflict) throw Error('ws:conflict');
      throw error;
    }
    return changed ? { sha256: incoming.pointer.artifactSha256, activationId } : null;
  } finally {
    db.close();
  }
}
/** Restore only our failed activation; never overwrite a concurrently newer release. */
export async function rollbackWebsiteTupleStore(
  failed: WebsiteTupleActivation,
  signal?: AbortSignal,
) {
  const db = await core.open(signal);
  try {
    const tx = db.transaction(storeName, 'readwrite'),
      done = core.transaction(tx, signal),
      store = tx.objectStore(storeName),
      request = store.get(key);
    request.onsuccess = () => {
      const old = request.result;
      if (
        !state(old) ||
        old.active?.pointer.artifactSha256 !== failed.sha256 ||
        old.activationId !== failed.activationId
      )
        return;
      store.put(
        {
          ...old,
          active: old.previous,
          previous: null,
          activationId: old.previousActivationId,
          previousActivationId: null,
        },
        key,
      );
    };
    await done;
  } finally {
    db.close();
  }
}
