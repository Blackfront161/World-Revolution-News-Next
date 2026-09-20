import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const evidenceRevision = process.env.WRN_EVIDENCE_REVISION;
const evidenceRoot = path.resolve(process.env.WRN_EVIDENCE_ROOT ?? 'docs/evidence/WRN-G3-002/new');
const evidenceDate = process.env.WRN_EVIDENCE_DATE ?? '2026-08-23';
const mobileManifestRevision = 'wrn-g3-016-mobile-home-manifest-v1';
const websiteManifestRevision = 'wrn-g3-007-local-publication-source-v1-d8ff4f1';
const websiteArticleIds = ['wrn-test-art-cedar', 'wrn-test-art-ember', 'wrn-test-art-fern'];
const mobileArticleIds = [
  'wrn-test-art-cedar',
  'wrn-test-art-ember',
  'wrn-test-art-fern',
  'wrn-test-art-g3-016-a',
  'wrn-test-art-g3-016-b',
  'wrn-test-art-g3-016-c',
  'wrn-test-art-g3-016-d',
  'wrn-test-art-g3-016-e',
  'wrn-test-art-g3-016-f',
];
const mobileHomeRoles = [
  'lead',
  'main',
  'main',
  'main',
  'main',
  'main',
  'sport-feature',
  'sport-secondary',
  'sport-secondary',
];
const articleIds = websiteArticleIds;

async function captureEvidence(page: Page, name: string) {
  if (!evidenceRevision) return;
  await mkdir(evidenceRoot, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceRoot, `${evidenceRevision}_${name}_${evidenceDate}.png`),
    fullPage: true,
  });
}

async function expectPinnedReadyFeed(page: Page) {
  const website = page.url().includes(':43174/');
  const expectedManifestRevision = website ? websiteManifestRevision : mobileManifestRevision;
  const expectedArticleIds = website ? websiteArticleIds : mobileArticleIds;
  await expect(page.getByTestId('manifest-revision')).toContainText(expectedManifestRevision);
  const cards = page.locator('article[data-article-id]');
  await expect(cards).toHaveCount(expectedArticleIds.length);
  const renderedArticleIds = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-article-id')),
  );
  expect(renderedArticleIds).toEqual(expectedArticleIds);
  if (website) {
    await expect(page.getByText(/Original URL:/)).toHaveCount(expectedArticleIds.length);
    return;
  }
  expect(
    await cards.evaluateAll((elements) => elements.map((element) => element.dataset.homeRole)),
  ).toEqual(mobileHomeRoles);
  await expect(page.locator('.home-lead')).toHaveCount(1);
  await expect(page.locator('.home-main-grid > article')).toHaveCount(5);
  await expect(page.locator('.home-sport .home-card--sport-feature')).toHaveCount(1);
  await expect(page.locator('.home-sport .home-card--sport-secondary')).toHaveCount(2);
  await expect(page.getByText(/Original URL:/)).toHaveCount(0);
}

async function expectNoHorizontalOverflow(page: Page) {
  const measurement = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('*')]
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        const htmlElement = element as HTMLElement;
        return {
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          left: bounds.left,
          right: bounds.right,
          clientWidth: htmlElement.clientWidth,
          scrollWidth: htmlElement.scrollWidth,
          text: element.textContent?.trim().slice(0, 80),
        };
      })
      .filter(
        ({ clientWidth, left, right, scrollWidth }) =>
          left < -1 || right > viewportWidth + 1 || scrollWidth - clientWidth > 1,
      )
      .slice(0, 10);

    return {
      overflow: document.documentElement.scrollWidth - viewportWidth,
      activeElement: document.activeElement
        ? {
            className: (document.activeElement as HTMLElement).className,
            tagName: document.activeElement.tagName,
            bounds: document.activeElement.getBoundingClientRect().toJSON(),
            boxShadow: window.getComputedStyle(document.activeElement).boxShadow,
          }
        : null,
      body: {
        clientWidth: document.body.clientWidth,
        scrollWidth: document.body.scrollWidth,
      },
      offenders,
    };
  });
  expect(
    measurement.overflow,
    `horizontal overflow details: ${JSON.stringify(measurement)}`,
  ).toBeLessThanOrEqual(1);
}

async function expectTouchTargets(page: Page) {
  const controls = page.locator('button:visible, a:visible');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    const label = (await control.innerText()).trim().replaceAll(/\s+/g, ' ');
    const bounds = await control.boundingBox();
    expect(bounds, `interactive element ${index} (${label}) has bounds`).not.toBeNull();
    expect(
      bounds?.width,
      `interactive element ${index} (${label}) is at least 44 px wide`,
    ).toBeGreaterThanOrEqual(44);
    expect(
      bounds?.height,
      `interactive element ${index} (${label}) is at least 44 px high`,
    ).toBeGreaterThanOrEqual(44);
  }
}

async function expectSeparateCompleteNavigationControls(page: Page, selector: string) {
  const controls = page.locator(`${selector} a:visible, ${selector} button:visible`);
  const measurements = await controls.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      const htmlElement = element as HTMLElement;
      return {
        text: element.textContent?.trim(),
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        clientWidth: htmlElement.clientWidth,
        scrollWidth: htmlElement.scrollWidth,
      };
    }),
  );

  for (const control of measurements) {
    expect(control.scrollWidth, `${control.text} fits within its own target`).toBeLessThanOrEqual(
      control.clientWidth + 1,
    );
  }
  for (let index = 0; index < measurements.length; index += 1) {
    for (let comparison = index + 1; comparison < measurements.length; comparison += 1) {
      const first = measurements[index];
      const second = measurements[comparison];
      const overlaps =
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top;
      expect(overlaps, `${first.text} and ${second.text} do not overlap`).toBe(false);
    }
  }
}

async function expectVisiblePageHeadingWithoutOverflow(page: Page) {
  await expectNoHorizontalOverflow(page);
  const measurement = await page.locator('#website-page-title').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const htmlElement = element as HTMLElement;
    return {
      clientWidth: htmlElement.clientWidth,
      right: bounds.right,
      scrollWidth: htmlElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(measurement.right).toBeLessThanOrEqual(measurement.viewportWidth + 1);
  expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth + 1);
}

async function expectCompleteWebsiteBrandHeader(page: Page, maximumHeight: number) {
  const measurement = await page.evaluate(() => {
    const brand = document.querySelector<HTMLElement>('.site-brand');
    const brandCopy = document.querySelector<HTMLElement>('.site-brand-copy');
    const theme = document.querySelector<HTMLElement>('.theme-selector select');
    const header = document.querySelector<HTMLElement>('.site-header');
    if (brand === null || brandCopy === null || theme === null || header === null)
      throw new Error('Website-Markenheader fehlt.');
    const brandBounds = brand.getBoundingClientRect();
    const themeBounds = theme.getBoundingClientRect();
    return {
      brand: {
        clientWidth: brand.clientWidth,
        scrollWidth: brand.scrollWidth,
        text: brand.textContent?.trim().replaceAll(/\s+/g, ' '),
      },
      brandCopy: {
        clientWidth: brandCopy.clientWidth,
        scrollWidth: brandCopy.scrollWidth,
        text: brandCopy.textContent?.trim().replaceAll(/\s+/g, ' '),
      },
      overlapsTheme:
        brandBounds.left < themeBounds.right &&
        brandBounds.right > themeBounds.left &&
        brandBounds.top < themeBounds.bottom &&
        brandBounds.bottom > themeBounds.top,
      headerHeight: header.getBoundingClientRect().height,
    };
  });

  expect(measurement.brand.scrollWidth).toBeLessThanOrEqual(measurement.brand.clientWidth + 1);
  expect(measurement.brandCopy.scrollWidth).toBeLessThanOrEqual(
    measurement.brandCopy.clientWidth + 1,
  );
  expect(measurement.brand.text).toContain('Solinaridao');
  expect(measurement.brand.text).toContain('World Revolution News');
  expect(measurement.brandCopy.text).toContain('Solinaridao');
  expect(measurement.brandCopy.text).toContain('World Revolution News');
  expect(measurement.overlapsTheme).toBe(false);
  expect(measurement.headerHeight).toBeLessThanOrEqual(maximumHeight);
}

test('pinned ready feed is local, responsive and accessible', async ({ page }, testInfo) => {
  const externalRequests: string[] = [];
  const consoleErrors: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;

  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/?state=ready&theme=light');
  await expectPinnedReadyFeed(page);

  if (testInfo.project.name.includes('reflow-200pct')) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
  }

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await expectTouchTargets(page);

  if (
    ['mobile-390x844', 'mobile-reflow-200pct', 'website-390x844', 'website-1440x900'].includes(
      testInfo.project.name,
    )
  ) {
    await captureEvidence(page, `${testInfo.project.name}_light-ready`);
  }

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).not.toHaveJSProperty('tagName', 'BODY');
  await expectNoHorizontalOverflow(page);

  const gridColumns = await page
    .locator('.article-grid, .feed-list, .home-main-grid')
    .evaluate((element) => {
      const template = window.getComputedStyle(element).gridTemplateColumns;
      return template === 'none' ? 1 : template.split(' ').length;
    });
  const expectedColumns = testInfo.project.name.startsWith('mobile-')
    ? 1
    : testInfo.project.name === 'website-800x1280'
      ? 2
      : testInfo.project.name === 'website-1440x900'
        ? 3
        : 1;
  expect(gridColumns).toBe(expectedColumns);

  await page.getByLabel('Color theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  if (
    [
      'mobile-390x844',
      'mobile-600x960',
      'website-390x844',
      'website-800x1280',
      'website-1440x900',
    ].includes(testInfo.project.name)
  ) {
    await captureEvidence(page, `${testInfo.project.name}_dark-ready`);
  }

  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('theme preferences are local, accessible, reactive and fail closed', async ({
  context,
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const externalRequests: string[] = [];
  const consoleErrors: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/?state=ready&theme=dark');
  const selector = page.getByLabel('Color theme');
  await expect(selector).toBeVisible();
  await expect(selector.locator('option')).toHaveCount(8);
  await selector.focus();
  await expect(selector).toBeFocused();
  const selectorBox = await selector.boundingBox();
  expect(selectorBox?.width).toBeGreaterThanOrEqual(44);
  expect(selectorBox?.height).toBeGreaterThanOrEqual(44);

  for (const preference of [
    'violet',
    'dark',
    'oled',
    'soft',
    'pink',
    'light',
    'contrast',
  ] as const) {
    await selector.selectOption(preference);
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', preference);
    await expect(page.locator('html')).toHaveAttribute('data-theme', preference);
    await captureEvidence(page, `${testInfo.project.name}_${preference}-theme`);
  }

  await selector.selectOption('pink');

  const pinkBrand = await page.evaluate(() => {
    const mark = document.querySelector<HTMLElement>(
      '.mobile-brand-mark img, .site-brand-mark img',
    );
    const header = document.querySelector<HTMLElement>('.mobile-header, .site-header');
    if (mark === null || header === null) throw new Error('Theme-reaktive Marke fehlt.');
    const root = getComputedStyle(document.documentElement);
    return {
      primary: root.getPropertyValue('--wrn-brand-wordmark-primary').trim(),
      secondary: root.getPropertyValue('--wrn-brand-wordmark-secondary').trim(),
      filter: getComputedStyle(mark).filter,
      headerShadow: getComputedStyle(header).boxShadow,
    };
  });
  expect(pinkBrand.primary).toBe('#ff4fa3');
  expect(pinkBrand.secondary).toBe('#9b82ff');
  expect(pinkBrand.filter).not.toBe('none');
  expect(pinkBrand.headerShadow).not.toBe('none');

  await selector.selectOption('contrast');
  await page.goto('/?state=ready');
  await expect(selector).toHaveValue('contrast');
  expect(await page.evaluate(() => Object.entries(window.localStorage))).toEqual([
    ['wrn.theme-preference.v1', 'contrast'],
  ]);

  await page.emulateMedia({ colorScheme: 'light' });
  await selector.selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await captureEvidence(page, `${testInfo.project.name}_system-dark-theme`);

  await page.evaluate(() =>
    window.localStorage.setItem('wrn.theme-preference.v1', 'unknown-theme'),
  );
  await page.goto('/?state=ready');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  expect(await page.evaluate(() => window.localStorage.length)).toBe(0);
  expect(await context.cookies()).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await expectNoHorizontalOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('preview states fail closed without a remote service', async ({ context, page }, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));

  const states = [
    { query: 'loading', role: 'status' as const, name: /Loading/i },
    { query: 'empty', role: 'status' as const, name: /Empty/i },
    { query: 'error', role: 'alert' as const, name: /Error/i },
    { query: 'optional-absent', role: 'status' as const, name: /No media/i },
  ];

  for (const state of states) {
    await page.goto(`/?state=${state.query}&theme=dark`);
    await expect(page.getByRole('heading', { name: state.name })).toBeVisible();
    await expect(page.getByRole(state.role)).toBeVisible();
    await captureEvidence(page, `${testInfo.project.name}_dark-${state.query}`);
    // Preserve the preview assertion, then finish restore before the next document.
    await page.getByRole('button', { name: 'Ready', exact: true }).click();
    await expectPinnedReadyFeed(page);
  }

  await page.goto('/?state=ready&theme=dark');
  await expectPinnedReadyFeed(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Offline', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toBeVisible();
  await captureEvidence(page, `${testInfo.project.name}_dark-offline`);
  await context.setOffline(false);

  await page.goto('/?state=invalid-state');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Error/i })).toBeVisible();
});

test('brand headers keep a text fallback when their local mark cannot load', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));

  await page.route('**/*solinaridao-header-mark-filled*', (route) => route.abort());
  await page.goto('/?state=ready&theme=dark');

  if (testInfo.project.name.startsWith('mobile-')) {
    await expect(page.getByText('Solinaridao', { exact: true })).toBeVisible();
    await expect(page.getByTestId('mobile-brand-mark')).toHaveText('S');
    await captureEvidence(page, `${testInfo.project.name}_dark-brand-fallback`);
  } else {
    await expect(
      page.getByRole('link', { name: /Solinaridao.*World Revolution News/i }),
    ).toBeVisible();
    await expect(page.locator('.site-brand-mark')).toHaveText('S');
    await captureEvidence(page, `${testInfo.project.name}_dark-brand-fallback`);
  }
});

test('brand headers use a chrome surface instead of the editorial background', async ({
  page,
}, testInfo) => {
  await page.goto('/?state=ready&theme=dark');

  const isMobile = testInfo.project.name.startsWith('mobile-');
  const selector = isMobile ? '.mobile-header' : '.site-header';
  const measurement = await page.locator(selector).evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });
  expect(measurement.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(measurement.backgroundImage).toBe('none');

  if (isMobile) {
    const mark = await page.getByTestId('mobile-brand-mark').evaluate((element) => {
      const image = element.querySelector('img');
      const bounds = element.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        imageObjectFit: image === null ? null : window.getComputedStyle(image).objectFit,
      };
    });
    expect(mark.width).toBeGreaterThanOrEqual(94);
    expect(mark.width).toBeLessThanOrEqual(118.1);
    expect(mark.height).toBeLessThan(mark.width);
    expect(mark.imageObjectFit).toBe('contain');
  }
});

test('mobile brand header remains uncut and within its shell across required viewports', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');

  for (const viewport of [
    { width: 320, height: 568, theme: 'dark', reflow: false },
    { width: 360, height: 800, theme: 'dark', reflow: false },
    { width: 390, height: 844, theme: 'dark', reflow: false },
    { width: 390, height: 844, theme: 'light', reflow: false },
    { width: 412, height: 915, theme: 'dark', reflow: false },
    { width: 600, height: 960, theme: 'dark', reflow: false },
    { width: 844, height: 390, theme: 'dark', reflow: false },
    { width: 390, height: 844, theme: 'dark', reflow: true },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/?state=ready&theme=${viewport.theme}`);
    if (viewport.reflow) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    }

    const layout = await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>('.mobile-header');
      const brand = document.querySelector<HTMLElement>('.mobile-brand');
      const mark = document.querySelector<HTMLElement>('.mobile-brand-mark');
      const image = mark?.querySelector('img');
      const main = document.querySelector<HTMLElement>('#mobile-main');
      if (header === null || brand === null || mark === null || main === null)
        throw new Error('Mobiler Markenheader fehlt.');
      return {
        header: header.getBoundingClientRect().toJSON(),
        brand: {
          clientWidth: brand.clientWidth,
          scrollWidth: brand.scrollWidth,
        },
        mark: {
          ...mark.getBoundingClientRect().toJSON(),
          imageObjectFit: image === null ? null : window.getComputedStyle(image).objectFit,
        },
        main: main.getBoundingClientRect().toJSON(),
        headerBackgroundImage: window.getComputedStyle(header).backgroundImage,
      };
    });

    expect(layout.headerBackgroundImage).toBe('none');
    expect(layout.brand.scrollWidth).toBeLessThanOrEqual(layout.brand.clientWidth + 1);
    expect(layout.mark.width).toBeGreaterThanOrEqual(94);
    expect(layout.mark.width).toBeLessThanOrEqual(118.1);
    expect(layout.mark.height).toBeLessThan(layout.mark.width);
    expect(layout.mark.imageObjectFit).toBe('contain');
    expect(layout.main.top).toBeGreaterThanOrEqual(layout.header.bottom - 1);
    await expectNoHorizontalOverflow(page);
  }
});

test('approved project and donation links retain their privacy and leaving-app notice', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'));

  await page.goto('/?state=ready&theme=light');

  const projectLink = page.getByRole('link', { name: 'More about the project' });
  const donationLink = page.getByRole('link', { name: 'Support' });
  await expect(projectLink).toHaveAttribute('href', 'https://solinaridao.com/');
  await expect(donationLink).toHaveAttribute(
    'href',
    'https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS',
  );

  for (const link of [projectLink, donationLink]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  }
  await expect(page.getByText(/Voluntary support/i)).toBeVisible();
  await expect(
    page.getByText(/Activating this leaves the app and opens an external payment page/i),
  ).toBeVisible();
  await expect(page.getByText(/PayPal/i)).not.toBeVisible();
});

test('website header is compact while retaining its tablet and desktop wordmark', async ({
  page,
}, testInfo) => {
  test.skip(
    !['website-390x844', 'website-800x1280', 'website-1440x900'].includes(testInfo.project.name),
  );

  await page.goto('/?state=ready&theme=light');
  const header = page.locator('.site-header');
  const headerHeight = await header.evaluate((element) => element.getBoundingClientRect().height);
  const maximumHeight =
    testInfo.project.name === 'website-390x844'
      ? 140
      : testInfo.project.name === 'website-800x1280'
        ? 152
        : 76;
  expect(headerHeight).toBeLessThanOrEqual(maximumHeight);

  if (testInfo.project.name !== 'website-390x844') {
    await expect(page.locator('.site-brand-wordmark')).toBeVisible();
  }
});

test('mobile and website retain their separately bound release revisions and ID expectations', async ({
  browser,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');

  const websitePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto('/?state=ready');
    await websitePage.goto('http://127.0.0.1:43174/?state=ready');
    await expectPinnedReadyFeed(page);
    await expectPinnedReadyFeed(websitePage);

    const mobileIds = await page
      .locator('article[data-article-id]')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-article-id')));
    const websiteIds = await websitePage
      .locator('article[data-article-id]')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-article-id')));
    expect(mobileIds).toEqual(mobileArticleIds);
    expect(websiteIds).toEqual(websiteArticleIds);

    const mobileManifest = await page.evaluate(async () =>
      fetch('/wrn-local-release/v1/manifest.json').then((response) => response.json()),
    );
    const websiteManifest = await websitePage.evaluate(async () =>
      fetch('/wrn-local-release/v1/manifest.json').then((response) => response.json()),
    );
    expect(mobileManifest.revision).toBe(mobileManifestRevision);
    expect(mobileManifest.articleSets.archiveIds).toHaveLength(9);
    expect(mobileManifest.homePresentation).toMatchObject({
      leadId: 'wrn-test-art-cedar',
      mainIds: expect.any(Array),
      sport: { featureId: 'wrn-test-art-g3-016-d' },
    });
    expect(websiteManifest.revision).toBe(websiteManifestRevision);
    expect(websiteManifest.articleSets.archiveIds).toEqual(websiteArticleIds);
  } finally {
    await websitePage.close();
  }
});

test('all nine interface languages are local, persistent, and leave local content unchanged', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');

  const websitePage = await context.newPage();
  await websitePage.setViewportSize({ width: 390, height: 844 });
  const languages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const;
  const externalRequests: string[] = [];
  const clients = [
    {
      page,
      key: 'wrn.mobile-ui-language.v1',
      url: '/?state=ready&theme=dark',
      name: 'mobile',
    },
    {
      page: websitePage,
      key: 'wrn.website-ui-language.v1',
      url: 'http://127.0.0.1:43174/?state=ready&theme=light',
      name: 'website',
    },
  ] as const;

  try {
    for (const client of clients) {
      const baseOrigin = new URL(client.url, 'http://127.0.0.1:43173').origin;
      client.page.on('request', (request) => {
        if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
      });
      await client.page.goto(client.url);
      await expectPinnedReadyFeed(client.page);
      const selector = client.page.getByTestId('ui-language-selector');
      await expect(selector.locator('option')).toHaveCount(9);
      await expect(selector).toHaveValue('en');
      expect(await client.page.evaluate(() => Object.entries(window.localStorage))).toEqual([]);

      const baseline = await client.page.evaluate(() => ({
        articleIds: [...document.querySelectorAll('article[data-article-id]')].map((article) =>
          article.getAttribute('data-article-id'),
        ),
        articleTitles: [
          ...document.querySelectorAll('article[data-article-id] h2, article[data-article-id] h3'),
        ].map((heading) => heading.textContent),
        originalLanguages: [...document.querySelectorAll('article[data-article-id] dd')].map(
          (value) => value.textContent,
        ),
      }));

      for (const language of languages) {
        await selector.focus();
        await expect(selector).toBeFocused();
        await selector.selectOption(language);
        await expect(selector).toHaveValue(language);
        await expect(client.page.locator('html')).toHaveAttribute('lang', language);
        await expect(client.page.locator('html')).toHaveAttribute('dir', 'ltr');
        await expect(selector).toBeFocused();
        const bounds = await selector.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        expect(
          await client.page.evaluate((key) => window.localStorage.getItem(key), client.key),
        ).toBe(language);
        await captureEvidence(client.page, `${client.name}_${language}-ui-language`);
      }

      await client.page.reload();
      await expect(client.page.getByTestId('ui-language-selector')).toHaveValue('tr');
      await expect(client.page.locator('article[data-article-id]')).toHaveCount(
        client.name === 'mobile' ? mobileArticleIds.length : websiteArticleIds.length,
      );
      expect(
        await client.page.evaluate((key) => window.localStorage.getItem(key), client.key),
      ).toBe('tr');
      expect(
        await client.page.evaluate(() => ({
          articleIds: [...document.querySelectorAll('article[data-article-id]')].map((article) =>
            article.getAttribute('data-article-id'),
          ),
          articleTitles: [
            ...document.querySelectorAll(
              'article[data-article-id] h2, article[data-article-id] h3',
            ),
          ].map((heading) => heading.textContent),
          originalLanguages: [...document.querySelectorAll('article[data-article-id] dd')].map(
            (value) => value.textContent,
          ),
        })),
      ).toEqual(baseline);

      await client.page.evaluate(
        (key) => window.localStorage.setItem(key, 'unsupported-v2'),
        client.key,
      );
      await client.page.reload();
      await expect(client.page.getByTestId('ui-language-selector')).toHaveValue('en');
      expect(
        await client.page.evaluate((key) => window.localStorage.getItem(key), client.key),
      ).toBe('unsupported-v2');
      expect((await new AxeBuilder({ page: client.page }).analyze()).violations).toEqual([]);
      await expectNoHorizontalOverflow(client.page);
      expect(
        await client.page.evaluate(async () => ({
          cacheKeys: await window.caches.keys(),
          indexedDbs: await window.indexedDB.databases().then(async (databases) =>
            Promise.all(
              databases.map(async (database) => {
                const request = window.indexedDB.open(database.name!);
                const db = await new Promise<IDBDatabase>((resolve, reject) => {
                  request.onsuccess = () => resolve(request.result);
                  request.onerror = () => reject(request.error);
                });
                const stores = [...db.objectStoreNames].sort();
                db.close();
                return { name: database.name, stores };
              }),
            ),
          ),
          serviceWorkerRegistrations: await navigator.serviceWorker.getRegistrations(),
        })),
      ).toEqual({
        cacheKeys: [],
        indexedDbs: [
          {
            name:
              client.name === 'mobile'
                ? 'wrn.mobile-content-offline'
                : 'wrn.website-content-offline',
            stores: ['bundles', 'control'],
          },
        ],
        serviceWorkerRegistrations: [],
      });
    }

    expect(await context.cookies()).toEqual([]);
    expect(externalRequests).toEqual([]);
  } finally {
    await websitePage.close();
  }
});

test('mobile language selector shows complete native names at normal size', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');
  test.setTimeout(180_000);
  const errors: string[] = [];
  const externalRequests: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
  });
  const now = Date.parse('2026-09-01T12:00:00.000Z');
  await page.addInitScript((value) => {
    Date.now = () => value;
  }, now);
  await page.goto('/?state=ready&theme=dark');
  expect(await page.evaluate(() => Date.now())).toBe(now);
  await expectPinnedReadyFeed(page);
  const selector = page.getByTestId('ui-language-selector');
  const labels = [
    ['en', 'English (EN)'],
    ['de', 'Deutsch (DE)'],
    ['es', 'Español (ES)'],
    ['fr', 'Français (FR)'],
    ['it', 'Italiano (IT)'],
    ['pt', 'Português (PT)'],
    ['ru', 'Русский (RU)'],
    ['el', 'Ελληνικά (EL)'],
    ['tr', 'Türkçe (TR)'],
  ] as const;
  const variants = [
    { width: 390, height: 844, theme: 'dark' },
    { width: 320, height: 568, theme: 'dark' },
    { width: 360, height: 800, theme: 'dark' },
    { width: 412, height: 915, theme: 'dark' },
    { width: 600, height: 960, theme: 'dark' },
    { width: 800, height: 1280, theme: 'dark' },
    { width: 844, height: 390, theme: 'dark' },
    { width: 390, height: 844, theme: 'light' },
    { width: 390, height: 844, theme: 'pink' },
    { width: 390, height: 844, theme: 'contrast' },
  ];
  for (const variant of variants) {
    await page.setViewportSize({ width: variant.width, height: variant.height });
    await page.getByTestId('theme-selector').selectOption(variant.theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
    for (const [language, label] of labels) {
      await selector.focus();
      await selector.selectOption(language);
      await expect(selector).toBeFocused();
      await expect(selector).toHaveAccessibleName(/\S/);
      await expect(selector.locator('option')).toHaveText(labels.map(([, text]) => text));
      const measurement = await selector.evaluate((element) => {
        const select = element as HTMLSelectElement;
        const style = getComputedStyle(select);
        const optionLabel = select.selectedOptions[0]?.textContent?.trim() ?? '';
        const context = document.createElement('canvas').getContext('2d');
        if (context === null) throw new Error('Canvas text measurement unavailable.');
        context.font = style.font;
        return {
          width: select.getBoundingClientRect().width,
          height: select.getBoundingClientRect().height,
          fontSize: Number.parseFloat(style.fontSize),
          optionLabel,
          optionLabelWidth: context.measureText(optionLabel).width,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
        };
      });
      // Capture before the fit assertion so the old clipped label has a matching image.
      await captureEvidence(
        page,
        `header-language-${variant.width}x${variant.height}-${variant.theme}-${language}`,
      );
      expect(measurement.optionLabel).toBe(label);
      expect(measurement.fontSize).toBe(16);
      expect(measurement.width).toBeGreaterThanOrEqual(44);
      expect(measurement.height).toBeGreaterThanOrEqual(44);
      expect(measurement.outlineStyle).not.toBe('none');
      expect(measurement.outlineWidth).toBeGreaterThan(0);
      expect(
        measurement.width - measurement.fontSize * 3,
        `${variant.width}px ${variant.theme} ${label}: closed native label must fit`,
      ).toBeGreaterThanOrEqual(measurement.optionLabelWidth);
      await expectNoHorizontalOverflow(page);
    }
    await selector.press('Home');
    await expect(selector).toHaveValue('en');
    await selector.press('End');
    await expect(selector).toHaveValue('tr');
    await selector.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(selector).toBeFocused();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  expect(await page.evaluate(() => Date.now())).toBe(now);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('language selectors keep app-specific option labels at 200 percent reflow', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-reflow-200pct', 'website-reflow-200pct'].includes(testInfo.project.name));

  await page.goto('/?state=ready&theme=dark');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  const selector = page.getByTestId('ui-language-selector');
  const header = page.locator(
    testInfo.project.name.startsWith('mobile-') ? '.mobile-header' : '.site-header',
  );
  const reflowLayout = testInfo.project.name.startsWith('mobile-')
    ? selector.locator('..')
    : header;
  await expect(reflowLayout).toHaveAttribute('data-wide-language-layout', 'true');
  for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']) {
    await selector.focus();
    await selector.selectOption(language);
    await expect(selector).toBeFocused();
    const measurement = await selector.evaluate((element) => {
      const select = element as HTMLSelectElement;
      const style = window.getComputedStyle(select);
      const optionLabel = select.selectedOptions[0]?.textContent?.trim() ?? '';
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context === null) throw new Error('Canvas text measurement unavailable.');
      context.font = style.font;
      return {
        width: select.getBoundingClientRect().width,
        height: select.getBoundingClientRect().height,
        fontSize: Number.parseFloat(style.fontSize),
        optionLabel,
        optionLabelWidth: context.measureText(optionLabel).width,
        options: [...select.options].map((option) => option.textContent?.trim()),
      };
    });

    const expectedOptionLabel = testInfo.project.name.startsWith('mobile-')
      ? expect.stringContaining(`(${language.toUpperCase()})`)
      : language.toUpperCase();
    expect(measurement.optionLabel).toEqual(expectedOptionLabel);
    expect(measurement.options).toHaveLength(9);
    expect(measurement.width).toBeGreaterThanOrEqual(44);
    expect(measurement.height).toBeGreaterThanOrEqual(44);
    // Three em reserve the native arrow and the existing inline padding; the
    // closed select must fit its app-specific option label without clipping.
    expect(measurement.width - measurement.fontSize * 3).toBeGreaterThanOrEqual(
      measurement.optionLabelWidth,
    );
    await captureEvidence(page, `${testInfo.project.name}_reflow-200_${language}`);
  }

  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('language selectors activate their complete reflow layout after normal mount', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-reflow-200pct', 'website-reflow-200pct'].includes(testInfo.project.name));

  await page.goto('/?state=ready&theme=dark');
  const selector = page.getByTestId('ui-language-selector');
  const reflowLayout = testInfo.project.name.startsWith('mobile-')
    ? page.locator('.mobile-shell')
    : page.locator('.site-header');

  await expect(selector).toBeVisible();
  await expect(reflowLayout).not.toHaveAttribute('data-wide-language-layout', 'true');

  for (let attempt = 0; attempt < 12; attempt += 1) {
    for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']) {
      await selector.focus();
      await selector.selectOption(language);
      await expect(selector).toBeFocused();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await expect(reflowLayout).toHaveAttribute('data-wide-language-layout', 'true');

      const measurement = await selector.evaluate((element) => {
        const select = element as HTMLSelectElement;
        const style = window.getComputedStyle(select);
        const optionLabel = select.selectedOptions[0]?.textContent?.trim() ?? '';
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Canvas text measurement unavailable.');
        context.font = style.font;
        return {
          width: select.getBoundingClientRect().width,
          fontSize: Number.parseFloat(style.fontSize),
          optionLabel,
          optionLabelWidth: context.measureText(optionLabel).width,
        };
      });
      const expectedOptionLabel = testInfo.project.name.startsWith('mobile-')
        ? expect.stringContaining(`(${language.toUpperCase()})`)
        : language.toUpperCase();
      expect(measurement.optionLabel).toEqual(expectedOptionLabel);
      expect(measurement.width - measurement.fontSize * 3).toBeGreaterThanOrEqual(
        measurement.optionLabelWidth,
      );

      await page.evaluate(() => {
        document.documentElement.style.fontSize = '100%';
      });
      await expect(reflowLayout).not.toHaveAttribute('data-wide-language-layout', 'true');
    }
  }

  await page.setViewportSize({ width: 412, height: 915 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    window.dispatchEvent(new Event('resize'));
  });
  await expect(reflowLayout).toHaveAttribute('data-wide-language-layout', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(reflowLayout).toHaveAttribute('data-wide-language-layout', 'true');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '100%';
  });
  await expect(reflowLayout).not.toHaveAttribute('data-wide-language-layout', 'true');

  await page.reload();
  await expect(selector).toBeVisible();
  await expect(reflowLayout).not.toHaveAttribute('data-wide-language-layout', 'true');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(reflowLayout).toHaveAttribute('data-wide-language-layout', 'true');
});

test('mobile wide language reflow keeps home, discover, reader and dialog in one reachable flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-reflow-200pct');

  await page.goto('/?state=ready&theme=dark#home');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(page.locator('.mobile-shell')).toHaveAttribute('data-wide-language-layout', 'true');
  await expect(page.getByRole('heading', { name: 'News', exact: true })).toBeVisible();

  const navigation = page.getByRole('navigation', { name: 'Mobile main navigation' });
  await navigation.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();

  const readerEntry = page.getByRole('button', { name: 'Read article' }).first();
  await readerEntry.click();
  const readerHeading = page.getByRole('heading', {
    name: 'Lokale Testmeldung zur gemeinsamen Leseliste',
  });
  await expect(readerHeading).toBeFocused();

  const sourceAction = page.getByRole('button', { name: 'Open original source' });
  await sourceAction.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await captureEvidence(page, `${testInfo.project.name}_reader-dialog-reflow-200`);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(sourceAction).toBeFocused();

  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('local navigation keeps stable targets, history, focus and honest migration states', async ({
  page,
}, testInfo) => {
  test.skip(
    !['mobile-390x844', 'website-390x844', 'website-1440x900'].includes(testInfo.project.name),
  );

  const isMobile = testInfo.project.name.startsWith('mobile-');
  const navigationName = isMobile ? 'Mobile main navigation' : 'Website main navigation';
  const expectedLabels = isMobile
    ? ['Home', 'For me', 'Discover', 'Media', 'Saved']
    : testInfo.project.name === 'website-1440x900'
      ? ['Home', 'Discover', 'Media', 'Events', 'Knowledge', 'Solidarity', 'Saved']
      : ['Home', 'Discover', 'Media', 'Saved'];
  await page.goto('/?state=ready#home');

  const navigation = page.getByRole('navigation', { name: navigationName }).first();
  await expect(navigation.getByRole('link')).toHaveText(expectedLabels);
  await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await navigation.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeFocused();
  await expect(page.getByRole('searchbox', { name: 'Search news' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    `${isMobile ? mobileArticleIds.length : websiteArticleIds.length} results`,
  );
  await expectNoHorizontalOverflow(page);

  await navigation.getByRole('link', { name: 'Media', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeVisible();

  await page.goto('/?state=ready#unknown-wrn-target');
  await expect(page.getByRole('link', { name: 'Home', exact: true }).first()).toHaveAttribute(
    'aria-current',
    'page',
  );
  if (isMobile) {
    await expect(page.getByRole('heading', { name: 'Current', exact: true })).toBeVisible();
  } else {
    await expect(
      page.getByRole('heading', { name: 'News, clearly readable and traceable.' }),
    ).toBeVisible();
  }
});

test('website more menu has explicit state and remains local', async ({ page }, testInfo) => {
  test.skip(!['website-390x844', 'website-1440x900'].includes(testInfo.project.name));

  await page.goto('/?state=ready#home');
  const moreButton = page.getByRole('button', { name: 'More', exact: true }).first();
  await expect(moreButton).toHaveAttribute('aria-expanded', 'false');
  await moreButton.click();
  await expect(moreButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Help', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeFocused();
  await page.goBack();
  await expect(moreButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#website-more-menu')).toBeHidden();
  await page.goForward();
  await expect(moreButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#website-more-menu')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('every visible navigation target has an active state and an honest local destination', async ({
  page,
}, testInfo) => {
  test.skip(
    !['mobile-390x844', 'website-390x844', 'website-1440x900'].includes(testInfo.project.name),
  );

  const isMobile = testInfo.project.name.startsWith('mobile-');
  const navigation = page
    .getByRole('navigation', {
      name: isMobile ? 'Mobile main navigation' : 'Website main navigation',
    })
    .first();
  const labels = isMobile
    ? ['Home', 'For me', 'Discover', 'Media', 'Saved']
    : testInfo.project.name === 'website-1440x900'
      ? ['Home', 'Discover', 'Media', 'Events', 'Knowledge', 'Solidarity', 'Saved', 'More']
      : ['Home', 'Discover', 'Media', 'Saved', 'More'];

  await page.goto('/?state=ready#home');
  for (const label of labels) {
    const control =
      label === 'More'
        ? page.getByRole('button', { name: 'More', exact: true }).first()
        : navigation.getByRole('link', { name: label, exact: true });
    await control.click();
    await expect(control).toHaveAttribute('aria-current', 'page');

    if (label === 'Home') {
      await expectPinnedReadyFeed(page);
    } else if (label === 'Discover') {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.getByRole('searchbox', { name: 'Search news' })).toBeVisible();
    } else if (label === 'Saved') {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.getByText('No articles saved for later yet.')).toBeVisible();
    } else if (label === 'More') {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.locator('.content-offline-panel')).toBeVisible();
      await expect(page.getByText('Not migrated yet', { exact: true })).toBeHidden();
    } else if (isMobile && label === 'For me') {
      await expect(page.getByRole('heading', { name: 'For me', exact: true })).toBeVisible();
      await expect(page.locator('.personalization-view')).toBeVisible();
      await expect(page.getByText('Not migrated yet', { exact: true })).toBeHidden();
    } else {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.getByText('Not migrated yet', { exact: true })).toBeVisible();
    }
  }
  await expectNoHorizontalOverflow(page);
});

test('saved reading state is local, payload-free and uses a client-specific key', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const readingKey = isMobile
    ? 'wrn.mobile-local-reading-state.v1'
    : 'wrn.website-local-reading-state.v1';
  await page.goto('/?state=ready#home');
  // Reading-state setup starts only after the normal content restore completes.
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.getByRole('button', { name: 'Save for later' }).first().click();
  const stored = await page.evaluate((key) => window.localStorage.getItem(key), readingKey);
  expect(stored).toContain('wrn-test-art-cedar');
  expect(stored).not.toContain('Lokale Testmeldung');
  expect(stored).not.toContain('fixture.invalid');
  const otherKey = isMobile
    ? 'wrn.website-local-reading-state.v1'
    : 'wrn.mobile-local-reading-state.v1';
  await expect(
    page.evaluate((key) => window.localStorage.getItem(key), otherKey),
  ).resolves.toBeNull();
  const navigation = page
    .getByRole('navigation', {
      name: isMobile ? 'Mobile main navigation' : 'Website main navigation',
    })
    .first();
  await navigation.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Read later', exact: true })).toBeVisible();
});

test('website rejected Web Locks fallback keeps stale tabs from restoring deleted data', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  const readingKey = 'wrn.website-local-reading-state.v1';
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: () => Promise.reject(new Error('lock manager denied')),
      },
    });
  });
  const secondTab = await context.newPage();
  try {
    await page.goto('/?state=ready#home');
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await page
      .locator('article[data-article-id="wrn-test-art-cedar"]')
      .getByRole('button', { name: 'Save for later' })
      .click();

    await secondTab.goto('/?state=ready#home');
    await expect(secondTab.getByTestId('manifest-revision')).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Website main navigation' })
      .first()
      .getByRole('link', { name: 'Saved', exact: true })
      .click();
    await page.getByRole('button', { name: 'Remove all saved articles' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete now' }).click();
    await expect(page.getByText('No articles saved for later yet.')).toBeVisible();

    await secondTab
      .locator('article[data-article-id="wrn-test-art-ember"]')
      .getByRole('button', { name: 'Save for later' })
      .click();
    await secondTab.reload();
    await expect(secondTab.getByTestId('manifest-revision')).toBeVisible();

    const articleIds = await secondTab.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return [];
      const value = JSON.parse(raw) as { entries?: Array<{ articleId?: unknown }> };
      return value.entries?.map((entry) => entry.articleId) ?? [];
    }, readingKey);
    expect(articleIds).toContain('wrn-test-art-ember');
    expect(articleIds).not.toContain('wrn-test-art-cedar');
  } finally {
    await secondTab.close();
  }
});

test('website stale V1 tab cannot overwrite a later unknown reading document', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  const readingKey = 'wrn.website-local-reading-state.v1';
  const futureRaw = '{\n  "contractVersion": "2.0.0",\n  "v2OnlyId": "future-cedar"\n}';
  const staleTab = await context.newPage();
  try {
    await page.goto('/?state=ready#home');
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await page
      .locator('article[data-article-id="wrn-test-art-cedar"]')
      .getByRole('button', { name: 'Save for later' })
      .click();

    await staleTab.goto('/?state=ready#home');
    await expect(staleTab.getByTestId('manifest-revision')).toBeVisible();
    await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
      key: readingKey,
      value: futureRaw,
    });

    const staleSave = staleTab
      .locator('article[data-article-id="wrn-test-art-ember"]')
      .getByRole('button', { name: 'Save for later' });
    await staleSave.click();
    await expect(staleSave).toBeDisabled();
    await staleTab
      .getByRole('navigation', { name: 'Website main navigation' })
      .first()
      .getByRole('link', { name: 'Saved', exact: true })
      .click();
    await expect(staleTab.getByText(/Local reading data remains unchanged/i)).toBeVisible();
    await expect(
      staleTab.evaluate((key) => window.localStorage.getItem(key), readingKey),
    ).resolves.toBe(futureRaw);
  } finally {
    await staleTab.close();
  }
});

test('website inherited hash routes fail closed on load and after mount', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  for (const hash of ['#__proto__', '#/constructor', '#toString', '#ordinary-unknown']) {
    await page.goto(`/?state=loading${hash}`);
    await expect(
      page.getByRole('heading', { name: 'News, clearly readable and traceable.' }),
    ).toBeVisible();
  }

  await page.evaluate(() => {
    window.location.hash = '__proto__';
  });
  await expect(
    page.getByRole('heading', { name: 'News, clearly readable and traceable.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Website main navigation' }).first(),
  ).toBeVisible();
});

test('unknown future or malformed local reading data stays byte-identical and read-only', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const readingKey = isMobile
    ? 'wrn.mobile-local-reading-state.v1'
    : 'wrn.website-local-reading-state.v1';
  const progressLabel = isMobile ? 'Save 50% reading progress' : 'Save 50% reading progress';
  const navigation = page
    .getByRole('navigation', {
      name: isMobile ? 'Mobile main navigation' : 'Website main navigation',
    })
    .first();

  for (const raw of [
    '{\n  "contractVersion": "2.0.0",\n  "v2OnlyId": "future-cedar"\n}',
    '{this is not valid JSON',
  ]) {
    await page.goto('/?state=ready#home');
    // Test reading storage only after the normal content restore is complete.
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), {
      key: readingKey,
      value: raw,
    });
    await page.reload();
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save for later' }).first()).toBeDisabled();
    await page.getByRole('button', { name: 'Read article' }).first().click();
    await expect(page.getByRole('button', { name: 'Save for later' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Mark as read' })).toBeDisabled();
    await expect(page.getByRole('button', { name: progressLabel })).toBeDisabled();
    await expect(
      page.evaluate((key) => window.localStorage.getItem(key), readingKey),
    ).resolves.toBe(raw);

    await page.getByRole('button', { name: 'Back' }).click();
    await navigation.getByRole('link', { name: 'Saved', exact: true }).click();
    await expect(
      page.getByText(/Local reading data remains unchanged.*editing is disabled/i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete all reading data' })).toBeDisabled();
    await page.reload();
    await expect(
      page.evaluate((key) => window.localStorage.getItem(key), readingKey),
    ).resolves.toBe(raw);
    // Saved has no manifest badge; finish restore via the existing local Home link.
    await navigation.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.getByTestId('manifest-revision')).toBeVisible();
  }
});

test('reading-data confirmation closes with Escape or Cancel without mutation and restores focus', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const readingKey = isMobile
    ? 'wrn.mobile-local-reading-state.v1'
    : 'wrn.website-local-reading-state.v1';
  const navigation = page
    .getByRole('navigation', {
      name: isMobile ? 'Mobile main navigation' : 'Website main navigation',
    })
    .first();

  await page.goto('/?state=ready#home');
  // Reading-state setup starts only after the normal content restore completes.
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.getByRole('button', { name: 'Save for later' }).first().click();
  await navigation.getByRole('link', { name: 'Saved', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Delete all reading data' });

  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(
    page.evaluate((key) => window.localStorage.getItem(key), readingKey),
  ).resolves.toContain('wrn-test-art-cedar');

  await trigger.click();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(
    page.evaluate((key) => window.localStorage.getItem(key), readingKey),
  ).resolves.toContain('wrn-test-art-cedar');

  await trigger.click();
  await dialog.getByRole('button', { name: 'Delete now' }).click();
  await expect(page.getByText('No articles saved for later yet.')).toBeVisible();
});

test('a saved validated feed article remains reader-bound across progress and reload', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const readingKey = isMobile
    ? 'wrn.mobile-local-reading-state.v1'
    : 'wrn.website-local-reading-state.v1';
  const navigation = page
    .getByRole('navigation', {
      name: isMobile ? 'Mobile main navigation' : 'Website main navigation',
    })
    .first();

  await page.goto('/?state=ready#home');
  // Reading-state setup starts only after the normal content restore completes.
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('manifest-revision')).toBeVisible();
  await page.getByRole('button', { name: 'Save for later' }).first().click();
  await navigation.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Read article', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeFocused();
  await page
    .getByRole('button', {
      name: isMobile ? 'Save 50% reading progress' : 'Save 50% reading progress',
    })
    .click();
  await expect(page.getByRole('button', { name: 'Reset progress (50%)' })).toBeVisible();
  await expect(
    page.evaluate((key) => window.localStorage.getItem(key), readingKey),
  ).resolves.toContain('"fraction":0.5');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reset progress (50%)' })).toBeVisible();
});

test('discover search and facets remain local, resettable and absent from URL and storage', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const expectedResultCount = testInfo.project.name.startsWith('mobile-')
    ? mobileArticleIds.length
    : websiteArticleIds.length;
  const externalRequests: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });
  await page.goto('/?state=ready#discover');
  const search = page.getByRole('searchbox', { name: 'Search news' });
  await search.fill('responsive');
  await page.getByLabel('Format').selectOption('analysis');
  await expect(page.getByRole('status')).toContainText('1 result');
  await expect(page.locator('article[data-article-id]')).toHaveCount(1);
  await expect(page.locator('article[data-article-id]')).toHaveAttribute(
    'data-article-id',
    'wrn-test-art-ember',
  );
  await page.getByRole('button', { name: 'Reset all filters' }).first().click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('status')).toContainText(`${expectedResultCount} results`);
  await expect(search).toBeFocused();
  const currentUrl = new URL(page.url());
  expect(currentUrl.search).toBe('?state=ready');
  expect(currentUrl.hash).toBe('#discover');
  expect(currentUrl.search).not.toContain('responsive');
  expect(currentUrl.search).not.toContain('analysis');
  await expect(page.evaluate(() => window.localStorage.length)).resolves.toBe(0);
  await expect(page.evaluate(() => window.sessionStorage.length)).resolves.toBe(0);
  expect(externalRequests).toEqual([]);
});

test('website compact navigation keeps intrinsic label widths at 800 pixels', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-800x1280');

  await page.goto('/?state=ready&theme=light#discover');
  await expectSeparateCompleteNavigationControls(page, '.site-nav-compact');
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  await expectVisiblePageHeadingWithoutOverflow(page);
});

test('website reflow keeps all primary and secondary targets within the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-reflow-200pct');

  await page.goto('/?state=ready&theme=dark#home');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  // The full native language value owns its reflow row; header controls stay
  // complete and non-overlapping instead of clipping that value.
  await expectCompleteWebsiteBrandHeader(page, 480);
  await expectNoHorizontalOverflow(page);

  const primaryNavigation = page.getByRole('navigation', { name: 'Website main navigation' });
  await expectSeparateCompleteNavigationControls(page, '.site-nav-compact');
  for (const label of ['Home', 'Discover', 'Media', 'Saved']) {
    await primaryNavigation.getByRole('link', { name: label, exact: true }).click();
    await expectVisiblePageHeadingWithoutOverflow(page);
  }

  const moreButton = page.getByRole('button', { name: 'More', exact: true });
  await moreButton.click();
  await expectVisiblePageHeadingWithoutOverflow(page);
  await expectSeparateCompleteNavigationControls(page, '.site-nav-compact');
  await expectSeparateCompleteNavigationControls(page, '.site-more-menu');
  for (const [index, label] of ['Knowledge', 'Events', 'Solidarity', 'Help'].entries()) {
    if (index > 0) {
      await page.getByRole('button', { name: 'More', exact: true }).click();
      await expectSeparateCompleteNavigationControls(page, '.site-more-menu');
    }
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    await expectVisiblePageHeadingWithoutOverflow(page);
    await expectSeparateCompleteNavigationControls(page, '.site-nav-compact');
  }
});

test('website normal 390-pixel brand header remains complete and compact', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');

  await page.goto('/?state=ready&theme=light#home');
  await expectCompleteWebsiteBrandHeader(page, 140);
  await expectNoHorizontalOverflow(page);
});

test('mobile primary navigation is anchored below its scrollable content without covering it', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844');

  for (const viewport of [
    { width: 320, height: 568, reflow: false },
    { width: 390, height: 844, reflow: false },
    { width: 844, height: 390, reflow: false },
    { width: 390, height: 844, reflow: true },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/?state=ready&theme=light#saved');
    if (viewport.reflow) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await page.locator('#mobile-page-title').evaluate((element) => {
        element.focus();
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }
    const navigation = page.getByRole('navigation', { name: 'Mobile main navigation' });
    await expect(navigation).toBeVisible();
    const layout = await page.evaluate(() => {
      const navigationElement = document.querySelector<HTMLElement>('.mobile-primary-nav');
      const mainElement = document.querySelector<HTMLElement>('#mobile-main');
      if (navigationElement === null || mainElement === null)
        throw new Error('Mobile app shell fehlt.');
      return {
        navigation: navigationElement.getBoundingClientRect().toJSON(),
        main: {
          ...mainElement.getBoundingClientRect().toJSON(),
          clientWidth: mainElement.clientWidth,
          scrollWidth: mainElement.scrollWidth,
        },
        heading: document
          .querySelector<HTMLElement>('#mobile-page-title')
          ?.getBoundingClientRect()
          .toJSON(),
      };
    });
    if (viewport.reflow) {
      await expect(page.locator('.mobile-shell')).toHaveAttribute(
        'data-wide-language-layout',
        'true',
      );
      expect(layout.navigation.top, JSON.stringify(layout)).toBeGreaterThanOrEqual(
        layout.main.bottom - 1,
      );
      await navigation.scrollIntoViewIfNeeded();
      const navigationBounds = await navigation.boundingBox();
      expect(navigationBounds?.y).toBeGreaterThanOrEqual(-1);
      expect((navigationBounds?.y ?? 0) + (navigationBounds?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height + 1,
      );
    } else {
      expect(layout.navigation.bottom).toBeGreaterThanOrEqual(viewport.height - 1);
      expect(layout.navigation.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(layout.main.bottom, JSON.stringify(layout)).toBeLessThanOrEqual(
        layout.navigation.top + 1,
      );
    }
    expect(layout.main.scrollWidth).toBeLessThanOrEqual(layout.main.clientWidth + 1);
    expect(layout.heading?.top).toBeGreaterThanOrEqual(layout.main.top - 1);
    expect(layout.heading?.bottom).toBeLessThanOrEqual(layout.main.bottom + 1);
    expect(layout.heading?.right).toBeLessThanOrEqual(viewport.width + 1);
    await expectSeparateCompleteNavigationControls(page, '.mobile-primary-nav');
    await expectNoHorizontalOverflow(page);
    if (viewport.reflow) {
      const firstNavigationTarget = navigation.getByRole('link').first();
      await firstNavigationTarget.focus();
      await expect(firstNavigationTarget).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).not.toHaveJSProperty('tagName', 'BODY');
      await expectTouchTargets(page);
    }
    await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible();
  }
});

test('local reader routes, confirmation and deterministic return stay client-only', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const externalRequests: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });

  await page.goto('/?state=ready#discover');
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  const entry = page.getByRole('button', { name: 'Read article' }).first();
  await entry.click();
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeFocused();
  if (isMobile) {
    await expect(page).toHaveURL(/#article\/wrn-test-art-cedar$/u);
  } else {
    await expect(page).toHaveURL(/article=wrn-test-art-cedar/u);
  }
  await page.goBack();
  await expect(entry).toBeFocused();
  await page.goForward();
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
  await expect(entry).toBeFocused();
  await entry.click();
  await page.reload();
  await expect(page.getByText('Lesen in kleinen Schritten')).toBeVisible();
  await page.getByRole('button', { name: 'Open original source' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Lokale Testquelle');
  await expect(dialog).toContainText('fixture.invalid');
  const externalLink = dialog.getByRole('link', { name: 'Open external source now' });
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(externalLink).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(externalLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(externalLink).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open original source' })).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);
  expect(externalRequests).toEqual([]);
});

test('mobile reader uses one reachable page flow for a long article at 200 percent reflow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-reflow-200pct');

  await page.goto('/?state=ready#article/wrn-test-art-cedar');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  const readerHeading = page.getByRole('heading', {
    name: 'Lokale Testmeldung zur gemeinsamen Leseliste',
  });
  const sourceAction = page.getByRole('button', { name: 'Open original source' });
  await expect(readerHeading).toBeVisible();
  await expect(sourceAction).toBeVisible();

  const beforeScroll = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.mobile-shell--reader');
    const main = document.querySelector<HTMLElement>('#mobile-main');
    const reader = document.querySelector<HTMLElement>('.mobile-reader');
    if (shell === null || main === null || reader === null)
      throw new Error('Die mobile Leseransicht hat keinen Reflow-Seitenfluss aktiviert.');
    return {
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      mainClientHeight: main.clientHeight,
      mainScrollHeight: main.scrollHeight,
      readerHeight: reader.getBoundingClientRect().height,
      mainOverflowY: window.getComputedStyle(main).overflowY,
    };
  });
  expect(beforeScroll.documentScrollHeight).toBeGreaterThan(beforeScroll.viewportHeight);
  expect(beforeScroll.mainClientHeight).toBeGreaterThanOrEqual(beforeScroll.readerHeight);
  expect(beforeScroll.mainScrollHeight).toBeLessThanOrEqual(beforeScroll.mainClientHeight + 1);
  expect(beforeScroll.mainOverflowY).toBe('visible');

  for (const element of [readerHeading, sourceAction]) {
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  }
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);
  await expect(page.getByRole('navigation', { name: 'Mobile main navigation' })).toBeVisible();
});

test('direct unknown reader routes fail closed without a teaser fallback', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  await page.goto(
    isMobile
      ? '/?state=ready#article/unknown-local-id'
      : '/?state=ready&article=unknown-local-id#home',
  );
  await expect(page.getByRole('heading', { name: 'Article not found' })).toBeVisible();
  await expect(page.getByText('The requested local article was not found.')).toBeVisible();
  await expect(page.getByText('Diese vollstaendige lokale Testnotiz')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('website build serves only the three direct local landing routes with same-ID metadata', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  const externalRequests: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });

  for (const articleId of articleIds) {
    const response = await page.goto(`/articles/${articleId}/`);
    expect(response?.status()).toBe(200);
    const canonical = `https://solinaridao.com/articles/${articleId}/`;
    await expect(page.locator('article[data-article-id]')).toHaveAttribute(
      'data-article-id',
      articleId,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({
      '@type': 'NewsArticle',
      url: canonical,
      mainEntityOfPage: canonical,
    });
    await expect(page.getByRole('link', { name: 'Interaktiv lesen' })).toHaveAttribute(
      'href',
      `/?article=${articleId}`,
    );
    await expect(page.getByRole('link', { name: 'Originalquelle (extern)' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    await expectNoHorizontalOverflow(page);
  }
  const localState = await page.evaluate(async () => ({
    localStorageEntries: window.localStorage.length,
    sessionStorageEntries: window.sessionStorage.length,
    serviceWorkerRegistrations: await navigator.serviceWorker.getRegistrations(),
  }));
  expect(localState.localStorageEntries).toBe(0);
  expect(localState.sessionStorageEntries).toBe(0);
  expect(localState.serviceWorkerRegistrations).toHaveLength(0);
  expect(externalRequests).toEqual([]);
});

test('static landing links into the same reader ID and browser back restores the direct page', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  const articleId = 'wrn-test-art-cedar';
  await page.goto(`/articles/${articleId}/`);
  const entry = page.getByRole('link', { name: 'Interaktiv lesen' });
  await entry.click();
  await expect(page).toHaveURL(new RegExp(`\\?article=${articleId}`));
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/articles/${articleId}/$`));
  await expect(page.locator('article[data-article-id]')).toHaveAttribute(
    'data-article-id',
    articleId,
  );
  await expect(entry).toBeFocused();
});

test('unknown static landing is an honest 404 without article content', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'website-390x844');
  const response = await page.goto('/articles/unknown-local-id/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('article[data-article-id]')).toHaveCount(0);
  await expect(page.getByText('Lokale Testmeldung zur gemeinsamen Leseliste')).toHaveCount(0);
});

test('static landing retains a readable dark alternative at reflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'website-reflow-200pct');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/articles/wrn-test-art-cedar/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeVisible();
  await expect(page.getByText('Fortsetzung ohne Abkuerzung')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);
});

test('release-bound local archive never exposes unavailable payloads', async ({
  page,
}, testInfo) => {
  test.skip(!['mobile-390x844', 'website-390x844'].includes(testInfo.project.name));
  const isMobile = testInfo.project.name.startsWith('mobile-');
  const externalRequests: string[] = [];
  const baseOrigin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== baseOrigin) externalRequests.push(request.url());
  });

  if (isMobile) {
    await page.goto('/?state=ready#more');
    await page.getByRole('button', { name: 'News archive' }).click();
  } else {
    await page.goto('/?state=ready#more');
    await page.getByRole('button', { name: 'News archive' }).click();
  }
  await expect(page.getByRole('heading', { name: 'News archive' })).toBeVisible();
  await expect(page.locator('article[data-archive-id]')).toHaveCount(
    isMobile ? mobileArticleIds.length : websiteArticleIds.length,
  );
  const cedarEntry = page.locator('article[data-archive-id="wrn-test-art-cedar"]');
  await cedarEntry.getByRole('button', { name: 'Read article' }).click();
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByRole('status')).toContainText('Canonical local share target prepared.');
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page);

  await page.goto(
    isMobile
      ? '/?state=ready#archive/wrn-test-art-cedar'
      : '/?state=ready&archive=wrn-test-art-cedar#more',
  );
  await expect(
    page.getByRole('heading', { name: 'Lokale Testmeldung zur gemeinsamen Leseliste' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/wrn-test-art-cedar/u);

  await page.goto(
    isMobile
      ? '/?state=ready#archive/wrn-test-art-g3-012-revoked'
      : '/?state=ready&archive=wrn-test-art-g3-012-revoked#more',
  );
  await expect(page.getByRole('heading', { name: 'Message unavailable' })).toBeVisible();
  await expect(page.getByText('Lokale Testmeldung zur gemeinsamen Leseliste')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Share' })).toHaveCount(0);
  await expect(page.evaluate(() => window.localStorage.length)).resolves.toBe(0);
  await expect(page.evaluate(() => window.sessionStorage.length)).resolves.toBe(0);
  expect(externalRequests).toEqual([]);
});
