import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getMobileKnowledgeCopy, uiLanguageIds } from '../../packages/ui-language/src';
import { getWebsiteSupportCopy } from '../../packages/ui-language/src/support-copy';

function websiteOnly(testInfo: TestInfo) {
  test.skip(!testInfo.project.name.startsWith('website-'));
}

async function expectFeatureControls(page: Page) {
  const controls = page.locator(
    '.website-knowledge-view button:visible, .website-knowledge-view a:visible, .website-knowledge-view input:visible, .website-knowledge-view select:visible, .website-support-view button:visible, .website-support-view a:visible, .website-support-view input:visible, .website-support-view select:visible',
  );
  for (let index = 0; index < (await controls.count()); index += 1) {
    const box = await controls.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
}

async function expectNoOverflow(page: Page) {
  const measurement = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: [...document.querySelectorAll('*')]
      .map((element) => ({
        element: `${element.tagName}.${element.className}`,
        right: element.getBoundingClientRect().right,
        text: element.textContent?.trim().slice(0, 60),
      }))
      .filter((item) => item.right > document.documentElement.clientWidth + 1)
      .slice(0, 5),
  }));
  expect(measurement.overflow, JSON.stringify(measurement.offenders)).toBeLessThanOrEqual(1);
}

test('website knowledge provides the pinned catalogue, filters and all UI headings locally', async ({
  page,
}, testInfo) => {
  websiteOnly(testInfo);
  const requests: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) requests.push(request.url());
  });
  await page.goto('/?theme=violet#knowledge');
  const copy = getMobileKnowledgeCopy('en');
  await expect(page.getByRole('heading', { name: copy.title, exact: true })).toBeFocused();
  await expect(page.getByText('30 of 609', { exact: true })).toBeVisible();
  await page.getByLabel(copy.search, { exact: true }).fill('A chi non si dissocia');
  await expect(page.getByText('1 of 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: copy.reset, exact: true }).click();
  await page.getByRole('button', { name: copy.lexicon, exact: true }).click();
  await page
    .locator('.website-lexicon-layout > article')
    .getByRole('button', { name: 'Mutual aid', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Mutual aid', exact: true })).toBeVisible();
  for (const language of uiLanguageIds) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(
      page.getByRole('heading', { name: getMobileKnowledgeCopy(language).title, exact: true }),
    ).toBeVisible();
  }
  for (const link of await page.locator('.website-knowledge-view a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  }
  await expectFeatureControls(page);
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(requests).toEqual([]);
});

test('website help and solidarity keep sources local and discard drafts only after confirmation', async ({
  page,
}, testInfo) => {
  websiteOnly(testInfo);
  const requests: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) requests.push(request.url());
  });
  await page.goto('/?theme=dark#help');
  await expect(page.getByRole('heading', { name: 'Help directory', exact: true })).toBeFocused();
  await expect(page.getByText('11 results', { exact: true })).toBeVisible();
  await page.getByLabel('Search', { exact: true }).fill('Rote Hilfe');
  await expect(page.locator('.website-support-panel > ul > li')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Official contact', exact: true })).toHaveAttribute(
    'href',
    'https://rote-hilfe.de/ortsgruppen',
  );
  await page.goto('/?theme=dark#solidarity');
  await expect(
    page.getByRole('heading', { name: 'Solidarity directory', exact: true }),
  ).toBeFocused();
  await expect(page.getByText(/Historical directory snapshot/)).toBeVisible();
  await page.getByLabel('Search', { exact: true }).fill('Mumia');
  await expect(page.locator('.website-support-panel > ul > li')).toHaveCount(1);
  await page.getByLabel('Greeting', { exact: true }).fill('Dear friend');
  await page
    .getByLabel(getWebsiteSupportCopy('en').body, { exact: true })
    .fill('A local draft only.');
  await expect(page.getByRole('button', { name: 'Download draft', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Discard draft' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Continue editing', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Greeting', exact: true })).toHaveValue(
    'Dear friend',
  );
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click();
  await dialog.getByRole('button', { name: 'Discard and continue', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Greeting', exact: true })).toHaveValue('');
  for (const language of uiLanguageIds) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(
      page.getByRole('heading', {
        name: getWebsiteSupportCopy(language).solidarityTitle,
        exact: true,
      }),
    ).toBeVisible();
  }
  for (const link of await page.locator('.website-support-view a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  }
  await expectFeatureControls(page);
  await expectNoOverflow(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(requests).toEqual([]);
});

test('website support localizes every feature control and guards dirty history, hash, and keyboard dialog flow', async ({
  page,
}, testInfo) => {
  websiteOnly(testInfo);
  await page.goto('/?theme=dark#solidarity');
  await expect(
    page.getByRole('heading', { name: 'Solidarity directory', exact: true }),
  ).toBeVisible();
  for (const language of uiLanguageIds) {
    const copy = getWebsiteSupportCopy(language);
    await page.getByTestId('ui-language-selector').selectOption(language);
    await expect(
      page.getByRole('heading', { name: copy.solidarityTitle, exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel(copy.greeting, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: copy.reset, exact: true })).toBeVisible();
    await expect(page.getByText(copy.historicalSnapshot, { exact: true })).toBeVisible();
  }
  await page.getByTestId('ui-language-selector').selectOption('en');
  await page.getByRole('button', { name: 'More', exact: true }).first().click();
  await page.getByRole('link', { name: 'Help', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Help directory', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More', exact: true }).first().click();
  await page.getByRole('link', { name: 'Solidarity', exact: true }).last().click();
  await expect(
    page.getByRole('heading', { name: 'Solidarity directory', exact: true }),
  ).toBeVisible();
  const greeting = page.getByLabel('Greeting', { exact: true });
  await greeting.fill('draft must remain local');
  const discardTrigger = page.getByRole('button', { name: 'Discard draft', exact: true });
  await discardTrigger.click();
  const dialog = page.getByRole('dialog', { name: 'Discard draft', exact: true });
  await expect(dialog.getByRole('button', { name: 'Continue editing', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Discard and continue', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Continue editing', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(discardTrigger).toBeFocused();
  await page.evaluate(() => window.history.back());
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#solidarity$/);
  await page.evaluate(() => {
    window.location.hash = '#home';
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#solidarity$/);
  await expect(page.locator('.website-letter-workshop textarea').first()).toHaveValue(
    'draft must remain local',
  );
  await page.getByRole('link', { name: 'Home', exact: true }).first().click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Discard and continue', exact: true }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(
    page.getByRole('heading', { name: 'News, clearly readable and traceable.', exact: true }),
  ).toBeVisible();
  await page.goto('/?theme=violet#knowledge');
  await page.getByTestId('ui-language-selector').selectOption('ru');
  await expect(
    page.getByRole('heading', { name: getWebsiteSupportCopy('ru').libraryResults, exact: true }),
  ).toBeVisible();
});

test('website blocks a direct contact that expires after the directory was rendered', async ({
  page,
}, testInfo) => {
  websiteOnly(testInfo);
  await page.goto('/?theme=dark#help');
  const contact = page.locator('a[href="https://rote-hilfe.de/ortsgruppen"]');
  await expect(contact).toHaveAttribute('href', 'https://rote-hilfe.de/ortsgruppen');
  await page.evaluate(() => {
    const RealDate = Date;
    class ExpiredDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        super(...(args.length ? args : ['2026-11-13T12:00:00.000Z']));
      }
      static now() {
        return new RealDate('2026-11-13T12:00:00.000Z').getTime();
      }
    }
    Object.defineProperty(window, 'Date', { configurable: true, value: ExpiredDate });
  });
  await contact.click();
  await expect(page).toHaveURL(/#help$/);
  await expect(
    page.getByText('Direct contact is unavailable because its review has expired.', {
      exact: true,
    }),
  ).toBeVisible();
});

for (const item of [
  { route: 'knowledge', width: 320, language: 'ru', theme: 'violet' },
  { route: 'help', width: 390, language: 'ru', theme: 'dark', reflow: true },
  { route: 'solidarity', width: 1440, language: 'de', theme: 'light' },
]) {
  test(`website content visual ${item.route}-${item.width}-${item.theme}`, async ({
    page,
  }, testInfo) => {
    websiteOnly(testInfo);
    test.skip(testInfo.project.name !== 'website-390x844');
    await page.setViewportSize({ width: item.width, height: 900 });
    await page.goto(`/?theme=${item.theme}#${item.route}`);
    if (item.reflow)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    await page.getByTestId('ui-language-selector').selectOption(item.language);
    await expect(page.locator('#website-page-title')).toBeVisible();
    await expectNoOverflow(page);
    await expectFeatureControls(page);
    await page.screenshot({
      path: testInfo.outputPath(
        `website-${item.route}-${item.width}-${item.language}-${item.theme}.png`,
      ),
      fullPage: true,
    });
  });
}
