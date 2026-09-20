import { expect } from '@playwright/test';
import { createServer } from 'vite';
import { coreHarness } from './website-shell-core-helper.mjs';

// Existing fixture factory, unchanged, evaluated by the installed Vite TS loader.
// It is test setup only: the actual browser uses the built website and HTTP JSON.
const fixtureLoader = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
  ssr: { noExternal: true },
});
let fixtures;
try {
  const source = await fixtureLoader.ssrLoadModule(
    '/packages/test-support/src/g3-014-offline-fixtures.ts',
  );
  fixtures = await source.createG3014OfflineFixtures();
} finally {
  await fixtureLoader.close();
}

const h = await coreHarness('safety');
h.record('unchanged-G3-014-C-fixture', {
  descriptor: fixtures.c.descriptor,
  revokedId: fixtures.cRevokedAId,
  revocations: fixtures.c.documents.archiveLifecycle.revocations,
});
try {
  await h.useBuilt();
  let revision = 'a';
  h.intercept(async ({ pathname, res }) => {
    if (!pathname.startsWith('/wrn-local-release/v1/')) return false;
    const fixture = fixtures[revision];
    const d = fixture.documents;
    const files = {
      'release-descriptor.json': fixture.descriptor,
      'manifest.json': d.manifest,
      'articles.json': d.payloads.articles,
      'supplemental-items.json': d.payloads['supplemental-items'],
      'discover-index.json': d.discoverIndex,
      'reader-details.json': d.readerDetails,
      'archive-lifecycle.json': d.archiveLifecycle,
      'website-publication.json': d.websitePublication,
    };
    const body = JSON.stringify(files[pathname.split('/').at(-1)]);
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(body);
    return true;
  });
  const context = await h.launch();
  const page = context.pages()[0];
  await page.goto(h.origin + '/#more');
  await page.getByRole('button', { name: 'Save content locally', exact: true }).click();
  await expect(page.getByText('Stored locally', { exact: true })).toBeVisible();
  await h.attach(page);
  await page.evaluate(() => window.shell.enable());
  revision = 'c';
  await page.getByRole('button', { name: 'Check for a newer revision', exact: true }).click();
  await expect(
    page.getByText('Checked candidate: ' + fixtures.c.descriptor.releaseRevision),
  ).toBeVisible();
  const route = '/?article=' + fixtures.cRevokedAId + '#home';
  await page.goto(h.origin + route);
  await expect(page.locator('article[aria-labelledby$="reader-title"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Article not found', exact: true })).toBeVisible();
  h.check(
    'ready shell does not bypass newer C revocation of still saved A article',
    (await page.locator('[data-reader-trigger="' + fixtures.cRevokedAId + '"]').count()) === 0,
    {
      revokedId: fixtures.cRevokedAId,
      heading: 'Article not found',
      state: await h.snapshot(page),
    },
  );
  const profile = context.testProfile;
  await context.close();
  await h.stopServer();
  const restarted = await h.launch(profile, true);
  const reopened = restarted.pages()[0];
  const response = await reopened.goto(h.origin + route.replace('#home', '#more'));
  await expect(
    reopened.getByText('Content access is protected until a safe source check can complete.', {
      exact: true,
    }),
  ).toBeVisible();
  h.check(
    'persisted revocation survives complete offline shell process restart',
    response.fromServiceWorker() &&
      response.headers()['x-wrn-shell-id'] === h.packages.built.manifest.shellId &&
      (await reopened.locator('article[aria-labelledby$="reader-title"]').count()) === 0,
    {
      message: await reopened.locator('.content-offline-panel').innerText(),
      state: await h.snapshot(reopened),
    },
  );
  await reopened.screenshot({ path: h.run + '/offline-revoked-reader.png' });
} catch (error) {
  h.report.errors.push({ message: error.message, stack: error.stack });
}
const report = await h.finish();
process.exitCode = report.errors.length ? 2 : report.assertions.some((x) => !x.passed) ? 1 : 0;
