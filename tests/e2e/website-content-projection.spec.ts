import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { getProjectionCopy } from '../../apps/website/src/features/projection/projection-copy';
import directory from '../../apps/website/src/features/projection/data/content-directory-v1.json' with { type: 'json' };
import pointer from '../../apps/website/src/features/projection/data/pointer.json' with { type: 'json' };
import revocations from '../../apps/website/public/wrn-source-pass-revocations/current.json' with { type: 'json' };
import { createHash } from 'node:crypto';
const evidence = path.resolve('work/website-app-parity-20261001/browser');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('wrn.website.support-welcome.v1', 'dismissed'),
  );
  await page.route('https://**/*', (route) => route.abort());
});

test('original red-black app icon survives an offline reopen while the header mark stays bound', async ({
  page,
  context,
}) => {
  await page.goto('/?lang=en#home');
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(icon).toMatch(/^\/assets\/wrn-app-icon-[A-Za-z0-9_-]+\.png$/);
  expect(await page.getByTestId('code26-brand-mark').getAttribute('src')).toContain(
    'solinaridao-header-mark-filled',
  );
  const online = await page.request.get(icon!);
  expect(online.status()).toBe(200);
  expect(online.headers()['content-type']).toBe('image/png');
  expect((await online.body()).length).toBe(8845);
  expect(
    createHash('sha256')
      .update(await online.body())
      .digest('hex'),
  ).toBe('78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f');
  await page.goto('/?lang=en#more');
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active)$/,
    { timeout: 30000 },
  );
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto('/?lang=en#home');
  expect(await reopened.locator('link[rel="icon"]').getAttribute('href')).toBe(icon);
  const offline = await reopened.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href;
    const image = new Image();
    image.src = href;
    await image.decode();
    const response = await fetch(href);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return {
      controlled: !!navigator.serviceWorker.controller,
      width: image.naturalWidth,
      height: image.naturalHeight,
      mime: response.headers.get('content-type'),
      bytes: bytes.byteLength,
      sha256: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''),
    };
  });
  expect(offline).toEqual({
    controlled: true,
    width: 72,
    height: 72,
    mime: 'image/png',
    bytes: 8845,
    sha256: '78b3dbd6c6de3876c6a15012dd0ea683136ace682382f50036d68d2250d2314f',
  });
  expect(await reopened.getByTestId('code26-brand-mark').getAttribute('src')).toContain(
    'solinaridao-header-mark-filled',
  );
});
test('bound production coverage, original links, all nine languages and accessibility', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']) {
    await page.goto(`/?lang=${language}#home`);
    await page.locator('.website-coverage-disclosure > summary').click();
    await expect(page.locator('.website-coverage')).toContainText('483/500');
    await expect(page.locator('.website-coverage')).toContainText(
      getProjectionCopy(language).warning,
    );
    await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
    expect(await page.title()).toContain('World Revolution News');
    expect(
      await page.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  }
  if (info.project.name === 'website-reflow-200pct')
    await page.addStyleTag({ content: 'html { font-size:200% !important; }' });
  expect(await page.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth + 1)).toBe(
    true,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include('.website-coverage')
        .include('.production-home__current')
        .analyze()
    ).violations,
  ).toEqual([]);
  const first = page.locator('[data-home-directory-article] a').first();
  await first.focus();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(first).toHaveAttribute('referrerpolicy', 'no-referrer');
  await page.goto('/?lang=de#home');
  await expect(page.locator('.website-coverage')).toContainText('483/500');
  if (['website-390x844', 'website-1440x900'].includes(info.project.name)) {
    await mkdir(evidence, { recursive: true });
    await page.screenshot({
      path: path.join(evidence, `${info.project.name}.png`),
      fullPage: true,
    });
  }
});
test('small, landscape and wide website sizes keep coverage and current links reachable', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'website-390x844');
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [412, 915],
    [600, 960],
    [844, 390],
    [1280, 800],
    [1024, 800],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/?lang=de#home');
    await expect(page.locator('.website-coverage')).toContainText('483/500');
    expect(
      await page.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  }
});
test('news and sources deep links show metadata restrictions and unknown source statuses', async ({
  page,
}) => {
  await page.goto('/?lang=de#discover/news');
  await expect(page.locator('.website-coverage')).toContainText('483/500');
  await expect(page.locator('.website-content-list>li')).toHaveCount(30);
  await page.goto('/?lang=de#discover/sources');
  await expect(page.getByText('Ungeprüfte Quelle · nur Originallink').first()).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).include('.website-coverage').analyze()).violations,
  ).toEqual([]);
});
test('explicit shell save restores broad current metadata links after an offline restart', async ({
  page,
  context,
}) => {
  await page.goto('/?lang=en#home');
  await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
  const ids = await page
    .locator('[data-home-directory-article]')
    .evaluateAll((entries) =>
      entries.map((entry) => entry.getAttribute('data-home-directory-article')),
    );
  await page.goto('/#more');
  await page.getByRole('button', { name: 'Save website shell', exact: true }).click();
  await expect(page.locator('.website-shell-panel')).toHaveAttribute(
    'data-shell-status',
    /^(saved|active)$/,
  );
  await expect
    .poll(() =>
      page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state),
    )
    .toBe('activated');
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto('/?lang=en#home');
  await expect(reopened.locator('[data-home-directory-article]')).toHaveCount(5);
  expect(
    await reopened
      .locator('[data-home-directory-article]')
      .evaluateAll((entries) =>
        entries.map((entry) => entry.getAttribute('data-home-directory-article')),
      ),
  ).toEqual(ids);
  await expect(reopened.locator('.website-coverage')).toContainText('483/500');
  expect(await reopened.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
});

test('later source withdrawal removes both homepage lists and remains removed after reload', async ({
  page,
}) => {
  let incoming = revocations;
  await page.route('https://solinaridao.com/wrn-source-pass-revocations/current.json', (route) =>
    route.fulfill({ json: incoming }),
  );
  await page.goto('/?lang=de#home');
  await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
  const id = await page
    .locator('[data-home-directory-article]')
    .first()
    .getAttribute('data-home-directory-article');
  const article = directory.articles.find((a) => a.id === id)!;
  const origin = new URL(article.url).origin;
  const source = directory.sources.find(
    (s) =>
      new URL(s.url).origin === origin &&
      [s.name, ...s.observations.map((o) => o.name)].includes(article.sourceName),
  )!;
  expect(source).toBeTruthy();
  incoming = { ...revocations, revision: revocations.revision + 1, endpointIds: [source.id] };
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(
    page.locator(`[data-projection-article="${id}"],[data-home-directory-article="${id}"]`),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.website-coverage')).toContainText('483/500');
  await expect(
    page.locator(`[data-projection-article="${id}"],[data-home-directory-article="${id}"]`),
  ).toHaveCount(0);
  await expect(page.locator('[data-projection-transfer]')).not.toHaveAttribute(
    'data-projection-transfer',
    'bound-live',
  );
});

test('a new valid live hash cannot admit an unreviewed title; its article withdrawal still applies', async ({
  page,
}) => {
  const remote = structuredClone(directory);
  const article = remote.articles
    .filter((a) => !a.historical)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0]!;
  const id = article.id;
  article.title = 'Unreviewed live title';
  article.observations.at(-1)!.title = article.title;
  remote.withdrawals.articleIds = [id];
  const bytes = JSON.stringify(remote) + '\n';
  const digest = createHash('sha256').update(bytes).digest('hex');
  const manifest = {
    ...pointer,
    sequence: pointer.sequence + 1,
    artifactSha256: digest,
    artifactPath: `snapshots/directory-${pointer.sequence + 1}-${digest}.json`,
  };
  await page.route('https://solinaridao.com/wrn-content-directory/current.json', (route) =>
    route.fulfill({ json: manifest }),
  );
  await page.route('https://solinaridao.com/wrn-content-directory/snapshots/**', (route) =>
    route.fulfill({ body: bytes, contentType: 'application/json' }),
  );
  await page.goto('/?lang=de#home');
  await expect(page.locator('.website-coverage')).toContainText('483/500');
  await expect(page.getByText('Unreviewed live title', { exact: true })).toHaveCount(0);
  await expect(
    page.locator(`[data-projection-article="${id}"],[data-home-directory-article="${id}"]`),
  ).toHaveCount(0);
  await expect(page.locator('[data-projection-transfer]')).toHaveAttribute(
    'data-projection-transfer',
    'refresh-unconfirmed',
  );
});
