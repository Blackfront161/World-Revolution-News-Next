import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// An explicitly installed, ignored local test runtime; never installs or calls a real provider.
const runtimePath = process.argv[2];
if (!runtimePath) throw new Error('Pass the absolute path to the isolated miniflare entry module.');
const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(runtimePath).href);
const bundlePath = path.join(root, 'work/cf-runtime/bundle/worker.mjs');
await build({
  configFile: false,
  resolve: {
    alias: {
      '@wrn/api-contracts/translation-v1': path.join(
        root,
        'packages/api-contracts/src/translation-v1.ts',
      ),
    },
  },
  build: {
    lib: {
      entry: path.join(root, 'services/translation/src/worker.ts'),
      formats: ['es'],
      fileName: () => 'worker.mjs',
    },
    outDir: path.dirname(bundlePath),
    emptyOutDir: false,
    minify: false,
    rollupOptions: { external: ['cloudflare:workers'] },
  },
});
const policy = {
  requestsPerMinute: 100,
  requestsPerDay: 100,
  utf16PerMinute: 600000,
  utf16PerDay: 600000,
};
let calls = 0;
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    script: await readFile(bundlePath, 'utf8'),
    compatibilityDate: '2026-09-11',
    host: '127.0.0.1',
    kvNamespaces: ['TRANSLATION_KV'],
    durableObjects: {
      TRANSLATION_QUOTAS: { className: 'TranslationQuotaCoordinator', useSQLite: true },
    },
    bindings: {
      TRANSLATION_V2_ENABLED: 'true',
      TRANSLATION_ALLOWED_ORIGINS: '["https://app.example"]',
      TRANSLATION_MODEL: 'gemini-3.1-flash-lite',
      GEMINI_API_KEY: 'local-test-not-a-secret',
      TRANSLATION_CACHE_TTL_SECONDS: '60',
      TRANSLATION_SUPPORTED_SOURCE_LANGUAGES: '["en"]',
      TRANSLATION_QUOTA_POLICY: JSON.stringify({
        read: policy,
        provider: { ...policy, requestsPerMinute: 2, requestsPerDay: 2 },
        write: policy,
      }),
    },
    outboundService: async (request) => {
      assert.equal(new URL(request.url).hostname, 'generativelanguage.googleapis.com');
      calls++;
      await new Promise((r) => setTimeout(r, 75));
      return new Response(
        JSON.stringify({
          candidates: [
            { finishReason: 'STOP', content: { parts: [{ text: 'Lokale Übersetzung.' }] } },
          ],
        }),
      );
    },
  }),
);
const request = (text) =>
  mf.dispatchFetch('https://worker.example/v1/translations', {
    method: 'POST',
    headers: { origin: 'https://app.example', 'content-type': 'application/json' },
    body: JSON.stringify({
      contractVersion: '1.0.0',
      mode: 'paragraph',
      sourceLanguage: 'en',
      targetLanguage: 'de',
      text,
    }),
  });
try {
  const parallel = await Promise.all(Array.from({ length: 8 }, () => request('Shared paragraph.')));
  const statuses = parallel.map((r) => r.status);
  assert.deepEqual(statuses, Array(8).fill(200));
  assert.equal(calls, 1, 'identical parallel misses must share one provider call');
  assert.equal((await request('Shared paragraph.')).status, 200);
  assert.equal(calls, 1, 'KV hit avoids provider');
  assert.equal((await request('Second paragraph.')).status, 200);
  assert.equal(calls, 2);
  const denied = await request('Third paragraph.');
  assert.equal(denied.status, 429);
  assert.equal(calls, 2, 'quota blocks before provider');
  const kv = await mf.getKVNamespace('TRANSLATION_KV');
  const keys = await kv.list();
  assert.equal(keys.keys.length, 2);
  assert(keys.keys.every((k) => /^translation:v2:[a-f0-9]{64}$/.test(k.name)));
  const result = {
    runtime: 'Miniflare 5.20260918.0-alpha / workerd',
    parallelRequests: 8,
    providerCalls: calls,
    cacheEntries: keys.keys.length,
    quotaDeniedStatus: denied.status,
    realProviderRequests: 0,
    pass: true,
  };
  console.log(JSON.stringify(result));
  await writeFile(
    path.join(root, 'work/cf-runtime/result.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
} finally {
  await mf.dispose();
}
