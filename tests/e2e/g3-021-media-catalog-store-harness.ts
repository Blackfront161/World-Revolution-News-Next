/** Isolated P2 browser-IDB harness. It deliberately imports no UI module. */
export async function g3021MediaCatalogStoreHarness() {
  const mod = await import('/src/mobile-media-catalog-store.ts');
  return Object.freeze({
    database: mod.mobileMediaCatalogDatabaseName,
    stores: ['mediaBundles', 'mediaControl', 'mediaSafety'],
    operations: ['snapshot', 'saveCandidate', 'activate', 'rollback'],
  });
}
