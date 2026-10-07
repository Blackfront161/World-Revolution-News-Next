import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { websiteTupleFixture } from './website-tuple-test-fixture.mjs';
import { prepareWebsiteContentTuple } from './prepare-website-content-tuple.mjs';
const option = (name) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const base = option('--base') ?? 'http://127.0.0.1:43244',
  packet = option('--packet'),
  output = option('--output');
assert.match(base, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.ok(packet && output);
await mkdir(output);
const fsBase = '/@fs/' + resolve('.').replaceAll('\\', '/');
const imports = {
  refresh: fsBase + '/packages/browser-content/src/website-content-tuple-refresh.ts',
  store: fsBase + '/packages/browser-content/src/website-content-tuple-store.ts',
  policy: fsBase + '/apps/website/src/features/projection/projection-policy.ts',
};
const now = Date.parse('2026-09-30T16:00:00.000Z'),
  a = await prepareWebsiteContentTuple(websiteTupleFixture()),
  endpoint = a.tuple.directory.articles.find((v) => v.id === a.tuple.home.lead).endpointIds[0];
assert.ok(!websiteTupleFixture().baseline.sources.some((s) => s.id === endpoint));
const heldInput = websiteTupleFixture({
  mutate: (_r, _s, revoke) => revoke.endpointIds.push(endpoint),
});
heldInput.binding.commit = '2'.repeat(40);
heldInput.sequence = 102;
const b = await prepareWebsiteContentTuple(heldInput);
let served = b,
  offline = false;
const profile = resolve('work', 'wtb-' + randomUUID().slice(0, 8));
let context, uiBrowser;
const open = async () => {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
  });
  await context.route('**/wrn-website-content/**', (route) =>
    offline
      ? route.abort()
      : route.fulfill({
          contentType: 'application/json',
          body: route.request().url().endsWith('current.json') ? served.pointerBytes : served.bytes,
        }),
  );
  const page = await context.newPage();
  await page.goto(base + '/#more');
  return page;
};
const checks = [];
let page = await open();
try {
  const seeded = await page.evaluate(
    async ({ imports, pointer, bytes }) => {
      const store = await import(imports.store);
      await store.saveWebsiteTupleRestrictions({ articleIds: [], endpointIds: [] });
      await store.saveWebsiteTupleStore({ pointer, bytes: new Uint8Array(bytes) });
      localStorage.setItem('private-test-bookmarks', 'keep-local');
      const cache = await caches.open('foreign-cache-with-user-data');
      await cache.put('/foreign-proof', new Response('keep intact'));
      return (await store.readWebsiteTupleStore()).active.pointer.sequence;
    },
    { imports, pointer: a.pointer, bytes: [...a.bytes] },
  );
  assert.equal(seeded, a.pointer.sequence);
  checks.push('real-idb-seed');
  const failure = await page.evaluate(
    async ({ imports, now, target, endpoint, lead }) => {
      const store = await import(imports.store),
        refresh = await import(imports.refresh);
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, ...args) {
        if (this.name === 'release' && value?.active?.pointer?.sequence === target)
          throw new DOMException('test quota', 'QuotaExceededError');
        return Reflect.apply(original, this, [value, ...args]);
      };
      let result;
      try {
        result = await refresh.loadWebsiteContentTuple({
          minimumSequence: 100,
          allowedImageOrigins: ['https://images.example'],
          online: true,
          now,
        });
      } finally {
        IDBObjectStore.prototype.put = original;
      }
      const saved = await store.readWebsiteTupleStore(),
        policy = await import(imports.policy),
        doc = result.tuple.directory;
      const restricted = policy.applyWebsiteLinkPolicy(doc, {
        revokedEndpointIds: refresh.observedWebsiteTupleWithdrawals().endpointIds,
        revokedArticleIds: refresh.observedWebsiteTupleWithdrawals().articleIds,
      });
      return {
        returned: result.tuple.sequence,
        stored: saved.active.pointer.sequence,
        endpointStored: saved.restrictions.endpointIds.includes(endpoint),
        articleStored: saved.restrictions.articleIds.includes(lead),
        hidden: !restricted.articles.some((a) => a.id === lead),
      };
    },
    { imports, now, target: b.pointer.sequence, endpoint, lead: a.tuple.home.lead },
  );
  assert.deepEqual(failure, {
    returned: 101,
    stored: 101,
    endpointStored: true,
    articleStored: true,
    hidden: true,
  });
  checks.push('quota-failure-retains-release-and-persists-new-source-withdrawal');
  await context.close();
  offline = true;
  page = await open();
  const cold = await page.evaluate(
    async ({ imports, now, endpoint, lead }) => {
      const refresh = await import(imports.refresh),
        store = await import(imports.store),
        policy = await import(imports.policy);
      const result = await refresh.loadWebsiteContentTuple({
        minimumSequence: 100,
        allowedImageOrigins: ['https://images.example'],
        online: false,
        now,
      });
      const saved = await store.readWebsiteTupleStore();
      const filtered = policy.applyWebsiteLinkPolicy(result.tuple.directory, {
        revokedEndpointIds: refresh.observedWebsiteTupleWithdrawals().endpointIds,
        revokedArticleIds: refresh.observedWebsiteTupleWithdrawals().articleIds,
      });
      return {
        sequence: result.tuple.sequence,
        source: result.source,
        endpointStored: saved.restrictions.endpointIds.includes(endpoint),
        articleStored: saved.restrictions.articleIds.includes(lead),
        hidden: !filtered.articles.some((a) => a.id === lead),
        foreignCache: await (
          await caches.open('foreign-cache-with-user-data')
        )
          .match('/foreign-proof')
          .then((r) => r.text()),
        bookmarks: localStorage.getItem('private-test-bookmarks'),
      };
    },
    { imports, now, endpoint, lead: a.tuple.home.lead },
  );
  assert.deepEqual(cold, {
    sequence: 101,
    source: 'saved',
    endpointStored: true,
    articleStored: true,
    hidden: true,
    foreignCache: 'keep intact',
    bookmarks: 'keep-local',
  });
  checks.push('cold-process-restart-keeps-withdrawals-and-foreign-state');
  const ownership = await page.evaluate(
    async ({ imports, pointer, bytes }) => {
      const store = await import(imports.store),
        incoming = { pointer, bytes: new Uint8Array(bytes) };
      const receipt = await store.saveWebsiteTupleStore(incoming);
      const before = await store.readWebsiteTupleStore();
      const noop = await store.saveWebsiteTupleStore(incoming);
      await store.rollbackWebsiteTupleStore({
        sha256: pointer.artifactSha256,
        activationId: '00000000-0000-0000-0000-000000000000',
      });
      const wrong = await store.readWebsiteTupleStore();
      await store.rollbackWebsiteTupleStore(receipt);
      const restored = await store.readWebsiteTupleStore();
      return {
        noop,
        wrong: wrong.active.pointer.sequence,
        restored: restored.active.pointer.sequence,
        preserved: restored.restrictions.articleIds.length > 0,
        before: before.active.pointer.sequence,
      };
    },
    { imports, pointer: b.pointer, bytes: [...b.bytes] },
  );
  assert.deepEqual(ownership, {
    noop: null,
    wrong: 102,
    restored: 101,
    preserved: true,
    before: 102,
  });
  checks.push('actual-idb-noop-and-activation-owner-rollback');
  await context.close();
  const pointer = JSON.parse(await readFile(resolve(packet, 'current.json'))),
    bytes = await readFile(resolve(packet, pointer.artifactPath)),
    tuple = JSON.parse(bytes);
  uiBrowser = await chromium.launch({ channel: 'chrome', headless: true });
  context = await uiBrowser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/wrn-website-content/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: route.request().url().endsWith('current.json') ? JSON.stringify(pointer) : bytes,
    }),
  );
  const errors = [];
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/?lang=de#home');
  await page
    .locator(`[data-app-home-article="${tuple.home.lead}"]`)
    .first()
    .waitFor({ timeout: 30000 });
  const welcome = page.getByRole('button', { name: 'Weiterlesen', exact: true });
  if (await welcome.isVisible()) await welcome.click();
  const image = tuple.images.entries.find((e) =>
    [tuple.home.lead, ...tuple.home.top, ...tuple.home.more].includes(e.articleId),
  );
  assert.ok(image, 'A displayed Home article must have an original image reference');
  const imageSelector = `[data-app-article-image="${image.articleId}"] img`,
    img = page.locator(imageSelector).first();
  await img.waitFor();
  await img.scrollIntoViewIfNeeded();
  assert.equal(await img.getAttribute('src'), image.imageUrl);
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el?.complete && el.naturalWidth > 0;
    },
    imageSelector,
    { timeout: 30000 },
  );
  const decodedImage = {
    articleId: image.articleId,
    url: image.imageUrl,
    ...(await img.evaluate((el) => ({ complete: el.complete, naturalWidth: el.naturalWidth }))),
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, 'home-desktop.png') });
  checks.push('real-500-feed-ui-home-and-image-binding');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(output, 'home-mobile.png') });
  await page.goto(base + '/?lang=de#knowledge');
  await page
    .getByRole('heading', { name: /Wissen/ })
    .first()
    .waitFor();
  await page.screenshot({ path: resolve(output, 'knowledge-mobile.png') });
  assert.deepEqual(errors, []);
  checks.push('no-browser-runtime-errors');
  const result = {
    schema: 'wrn.website-tuple-browser-evidence.v1',
    status: 'PASS',
    checks,
    failure,
    cold,
    ownership,
    decodedImage,
    source: pointer.source,
    artifactSha256: pointer.artifactSha256,
    publicationPerformed: false,
  };
  await writeFile(resolve(output, 'browser.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await context?.close().catch(() => undefined);
  await uiBrowser?.close().catch(() => undefined);
}
