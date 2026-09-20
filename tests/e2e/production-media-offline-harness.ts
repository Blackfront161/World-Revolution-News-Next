// Authored browser-only harness. It imports only the thin client wrappers.
export const productionMediaOfflineHarnessVersion = 'wrn-production-media-offline-harness.v1';
export const productionMediaOfflineDatabaseNames = Object.freeze({
  mobile: 'wrn.mobile-production-media-offline.v1',
  website: 'wrn.website-production-media-offline.v1',
});

export const loadProductionMediaOfflineContract = () =>
  import('@wrn/content-contracts/production-media-offline-v1');

const request = <T>(value: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
const complete = (value: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    value.oncomplete = () => resolve();
    value.onerror = () => reject(value.error);
    value.onabort = () => reject(value.error);
  });

export async function deleteProductionMediaOfflineDatabase(databaseName: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const pending = indexedDB.deleteDatabase(databaseName);
    pending.onsuccess = () => resolve();
    pending.onerror = () => reject(pending.error);
    pending.onblocked = () => reject(new Error('delete-blocked'));
  });
}

export async function seedProductionMediaOfflineDatabase(
  databaseName: string,
  seed: {
    version?: number;
    controlRows: readonly { key: IDBValidKey; value: unknown }[];
    bundleRows: readonly unknown[];
    extraStore?: boolean;
    bundleIndex?: boolean;
    controlIndex?: boolean;
    omitBundlesStore?: boolean;
    omitControlStore?: boolean;
  },
): Promise<void> {
  await deleteProductionMediaOfflineDatabase(databaseName);
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const pending = indexedDB.open(databaseName, seed.version ?? 1);
    pending.onupgradeneeded = () => {
      const bundles = seed.omitBundlesStore
        ? null
        : pending.result.createObjectStore('mediaBundles', { keyPath: 'key' });
      const control = seed.omitControlStore
        ? null
        : pending.result.createObjectStore('mediaControl');
      if (seed.bundleIndex) bundles?.createIndex('unexpected', 'checkedAt');
      if (seed.controlIndex) control?.createIndex('unexpected', 'format');
      if (seed.extraStore) pending.result.createObjectStore('unexpected');
      for (const row of seed.bundleRows) bundles?.put(row);
      for (const row of seed.controlRows) control?.put(row.value, row.key);
    };
    pending.onsuccess = () => resolve(pending.result);
    pending.onerror = () => reject(pending.error);
  });
  database.close();
}

export async function replaceProductionMediaOfflineRows(
  databaseName: string,
  controlRows: readonly { key: IDBValidKey; value: unknown }[],
  bundleRows: readonly unknown[],
): Promise<void> {
  const database = await request(indexedDB.open(databaseName));
  const transaction = database.transaction(['mediaBundles', 'mediaControl'], 'readwrite');
  const done = complete(transaction);
  transaction.objectStore('mediaBundles').clear();
  transaction.objectStore('mediaControl').clear();
  for (const row of bundleRows) transaction.objectStore('mediaBundles').put(row);
  for (const row of controlRows) transaction.objectStore('mediaControl').put(row.value, row.key);
  await done;
  database.close();
}

export async function readProductionMediaOfflineRaw(databaseName: string) {
  const database = await request(indexedDB.open(databaseName));
  const stores = [...database.objectStoreNames].sort();
  const transaction = database.transaction(stores, 'readonly');
  const done = complete(transaction);
  const rows = await Promise.all(
    stores.map(async (name) => {
      const store = transaction.objectStore(name);
      const [keys, values] = await Promise.all([
        request(store.getAllKeys()),
        request(store.getAll()),
      ]);
      return {
        name,
        keyPath: store.keyPath,
        autoIncrement: store.autoIncrement,
        indexes: [...store.indexNames].sort(),
        keys,
        values,
      };
    }),
  );
  await done;
  const version = database.version;
  database.close();
  return { version, stores: rows };
}

export async function makeProductionMediaOfflinePacket(
  sequence: number,
  revision: string,
  safetyRevision = 1,
  revoked = false,
  floor = safetyRevision,
  options: {
    variant?: string;
    generatedAt?: string;
    validUntil?: string;
    knownSafety?: import('@wrn/content-contracts/production-media-v1').ProductionMediaSafetyV1;
    provider?: Readonly<{ recipientOrigin: string; privacyNoticeUrl: string }>;
  } = {},
) {
  const [{ canonicalJson, sha256Utf8, utf8ByteLength }, { makeProductionMediaTestInput }, media] =
    await Promise.all([
      import('@wrn/content-contracts'),
      import('/src/production-media-test-fixture.ts'),
      import('@wrn/content-contracts/production-media-v1'),
    ]);
  const base = await makeProductionMediaTestInput();
  const docs = Object.fromEntries(
    media.productionMediaDocumentsV1.map((name) => [name, JSON.parse(base.documentsRaw[name])]),
  ) as Record<(typeof media.productionMediaDocumentsV1)[number], Record<string, unknown>>;
  for (const document of Object.values(docs)) document.releaseRevision = revision;
  if (options.variant) {
    const entries = docs.admission.entries as { owner: string }[];
    entries[0]!.owner = `WRN editorial ${options.variant}`;
  }
  if (options.provider) {
    const streams = docs.manifest.streams as Array<Record<string, unknown>>;
    const consents = docs.consent.entries as Array<Record<string, unknown>>;
    const stream = streams[0]!;
    stream.url = options.provider.recipientOrigin + '/episode-0.mp3';
    stream.origin = options.provider.recipientOrigin;
    const consent = consents[0]!;
    consent.recipientOrigin = options.provider.recipientOrigin;
    consent.privacyNoticeUrl = options.provider.privacyNoticeUrl;
    stream.streamRevision = await sha256Utf8(
      canonicalJson({
        sourceId: stream.sourceId,
        publisherEpisodeId: stream.publisherEpisodeId,
        url: stream.url,
        mime: stream.mime,
        declaredBytes: stream.declaredBytes,
        durationMs: stream.durationMs,
        rightsEvidenceSha256: stream.rightsEvidenceSha256,
      }),
    );
  }
  docs.revocation.revision = safetyRevision;
  docs.revocation.floor = floor;
  docs.revocation.entries = revoked
    ? [{ targetType: 'episode', targetId: 'episode-0', status: 'blocked' }]
    : [];
  const documentsRaw = Object.fromEntries(
    media.productionMediaDocumentsV1.map((name) => [name, canonicalJson(docs[name])]),
  ) as Record<(typeof media.productionMediaDocumentsV1)[number], string>;
  const descriptor = {
    schema: 'wrn.production-media-descriptor.v1',
    contractVersion: '1.0.0',
    releaseRevision: revision,
    sequence,
    generatedAt: options.generatedAt ?? '2026-09-11T11:00:00.000Z',
    validUntil: options.validUntil ?? '2026-09-12T12:00:00.000Z',
    revocationFloor: floor,
    documents: await Promise.all(
      media.productionMediaDocumentsV1.map(async (name) => ({
        name,
        path: `/content/media/v1/releases/${revision}/${name}.json`,
        bytes: utf8ByteLength(documentsRaw[name]),
        sha256: await sha256Utf8(documentsRaw[name]),
      })),
    ),
  };
  const descriptorRaw = canonicalJson(descriptor);
  const pointerRaw = canonicalJson({
    schema: 'wrn.production-media-current.v1',
    contractVersion: '1.0.0',
    releaseRevision: revision,
    sequence,
    descriptorPath: `/content/media/v1/releases/${revision}/descriptor.json`,
    descriptorBytes: utf8ByteLength(descriptorRaw),
    descriptorSha256: await sha256Utf8(descriptorRaw),
    revocationFloor: floor,
  });
  const safety = await media.validateProductionMediaSafetyV1({
    pointerRaw,
    descriptorRaw,
    documentsRaw,
    now: Date.parse('2026-09-11T12:00:00.000Z'),
    knownSafety: options.knownSafety ?? {
      revision: 0,
      floor: 0,
      revocationSha256: null,
      entries: [],
    },
  });
  if (!safety) throw new Error('Authored media packet did not pass A1 safety.');
  return { pointerRaw, descriptorRaw, documentsRaw, admittedSafety: safety, checkedAt: 1000 };
}

export async function stageProductionMediaOfflinePacket(
  store: import('../../packages/browser-content/src/production-media-offline-store').ProductionMediaOfflineStore,
  packet: Awaited<ReturnType<typeof makeProductionMediaOfflinePacket>>,
  operationId: string,
  now = Date.parse('2026-09-11T12:00:00.000Z'),
  options: {
    allowedOrigins?: ReadonlySet<string>;
    providerPolicy?: import('@wrn/content-contracts/production-media-v1').ProductionMediaProviderPolicyV1;
  } = {},
) {
  const origins = new Set(options.allowedOrigins ?? ['https://publisher.invalid']);
  let control = await store.prepareRecheck(operationId, (await store.snapshot()).control);
  control = await store.commitSafety(operationId, packet.admittedSafety, packet.checkedAt, control);
  control = await store.saveCandidate({ ...packet, operationId, expected: control });
  const key = control.candidateKey ?? control.activeKey ?? control.previousKey;
  if (!key) throw new Error('candidate-key-missing');
  control = await store.activateCandidate(
    key,
    now,
    origins,
    operationId,
    control,
    options.providerPolicy,
  );
  return store.finishRecheck(operationId, 'ready', packet.checkedAt, control);
}
