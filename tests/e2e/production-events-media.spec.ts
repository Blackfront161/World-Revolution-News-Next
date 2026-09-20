import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import type { ProductionEventsMediaDocumentV1 } from '../../packages/content-contracts/src/directory/production-events-media-v1';
import { getEventsMediaCopy } from '../../packages/ui-language/src/events-media';

const metadata = JSON.parse(
  await readFile(
    new URL(
      '../../apps/mobile/src/features/events-media/data/production-events-media-v1.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as ProductionEventsMediaDocumentV1;
const clients = [
  { name: 'mobile', origin: 'http://127.0.0.1:43177', heading: 3 },
  { name: 'website', origin: 'http://127.0.0.1:43178', heading: 2 },
];

for (const client of clients) {
  test(`${client.name} first available pagination click is retained`, async ({ page }) => {
    await page.goto(`${client.origin}/#events`);
    // No count assertion or settling delay before the first available button.
    await page.getByRole('button', { name: 'Show 30 more', exact: true }).click();
    await expect(page.locator('[data-events-media-id]')).toHaveCount(60);
  });

  test(`${client.name} real events count, pagination, search, place and inclusive UTC date filters`, async ({
    page,
  }, info) => {
    await page.goto(`${client.origin}/#events`);
    const directory = page.getByTestId('production-events-media');
    await expect(directory.getByTestId('events-media-count')).toHaveText('Showing 30 of 5610');
    await directory.getByRole('button', { name: 'Show 30 more', exact: true }).click();
    await expect(directory.locator('[data-events-media-id]')).toHaveCount(60);
    const sample = metadata.events[0];
    await directory.getByLabel('Search', { exact: true }).fill(sample.title);
    await expect(directory.locator(`[data-events-media-id="${sample.id}"]`)).toBeVisible();
    await expect(
      directory.getByRole('heading', { name: sample.title, exact: true }),
    ).toHaveAttribute('lang', sample.language);
    await expect(
      directory.getByRole('heading', { name: sample.title, exact: true }),
    ).toHaveJSProperty('tagName', `H${client.heading}`);
    await directory.getByRole('button', { name: 'Reset filters', exact: true }).click();
    await expect(directory.locator('[data-events-media-id]')).toHaveCount(30);
    await directory
      .getByRole('combobox', { name: 'Country', exact: true })
      .selectOption(sample.country!);
    await directory.getByRole('combobox', { name: 'City', exact: true }).selectOption(sample.city!);
    const date = sample.startAt.slice(0, 10);
    await directory.locator('input[type=date]').nth(0).fill(date);
    await directory.locator('input[type=date]').nth(1).fill(date);
    const matching = metadata.events.filter(
      (item) =>
        item.country === sample.country &&
        item.city === sample.city &&
        item.startAt.slice(0, 10) === date,
    );
    await expect(directory.getByTestId('events-media-count')).toHaveText(
      `Showing ${Math.min(30, matching.length)} of ${matching.length}`,
    );
    await expect(directory.locator(`[data-events-media-id="${sample.id}"] time`)).toHaveAttribute(
      'datetime',
      sample.startAt,
    );
    await expect(directory).toContainText('UTC');
    const another = metadata.events.find(
      (item) => item.country && item.country !== sample.country,
    )!;
    await directory
      .getByRole('combobox', { name: 'Country', exact: true })
      .selectOption(another.country!);
    await expect(directory.getByRole('combobox', { name: 'City', exact: true })).toHaveValue('');
    await directory.getByRole('button', { name: 'Reset filters', exact: true }).click();
    await directory
      .getByRole('combobox', { name: 'Content language', exact: true })
      .selectOption('und');
    await expect(directory.getByTestId('events-media-count')).toHaveText('Showing 30 of 219');
    expect(
      await directory
        .locator(`[data-events-media-id] h${client.heading}`)
        .evaluateAll((nodes) => nodes.every((node) => node.getAttribute('lang') === '')),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`${client.name}-events-unknown-language.png`) });
  });

  test(`${client.name} actual media source joins, deduplication, review flag and native consent focus`, async ({
    page,
  }, info) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(client.origin)) external.push(request.url());
    });
    await page.goto(`${client.origin}/#media`);
    const directory = page.getByTestId('production-events-media');
    const cards = directory.locator('[data-events-media-id]');
    await expect(cards).toHaveCount(13);
    await directory
      .getByRole('combobox', { name: 'Source', exact: true })
      .selectOption(metadata.videos[0].sourceId);
    await expect(cards).toHaveCount(
      metadata.videos.filter((item) => item.sourceId === metadata.videos[0].sourceId).length,
    );
    await directory.getByRole('button', { name: 'Podcast episodes', exact: true }).click();
    await expect(directory.getByRole('combobox', { name: 'Source', exact: true })).toHaveValue('');
    await expect(directory.getByTestId('events-media-count')).toHaveText('Showing 30 of 842');
    const sourceId = metadata.episodes[0].sourceId;
    await directory.getByRole('combobox', { name: 'Source', exact: true }).selectOption(sourceId);
    const episodes = metadata.episodes.filter((item) =>
      item.observations.some((observation) => observation.sourceId === sourceId),
    );
    await expect(directory.getByTestId('events-media-count')).toHaveText(
      `Showing ${Math.min(30, episodes.length)} of ${episodes.length}`,
    );
    await directory.getByRole('button', { name: 'Reset filters', exact: true }).click();
    const review = metadata.episodes.find((item) => item.languageReviewRequired)!;
    await directory.getByLabel('Search', { exact: true }).fill(review.title);
    const reviewed = directory.locator(`[data-events-media-id="${review.id}"]`);
    await expect(reviewed).toContainText('Language needs review');
    const trigger = reviewed.getByRole('button', { name: 'Open original', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Continue', exact: true })).toHaveAttribute(
      'href',
      review.originalUrl,
    );
    await expect(dialog.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(dialog.getByRole('link')).toHaveAttribute('referrerpolicy', 'no-referrer');
    for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    // Native showModal must prevent focus escaping to an otherwise focusable background control.
    await directory
      .getByLabel('Search', { exact: true })
      .evaluate((node) => (node as HTMLElement).focus());
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: info.outputPath(`${client.name}-media-consent.png`) });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(trigger).toBeFocused();
    await directory.getByRole('button', { name: 'Reset filters', exact: true }).click();
    await directory.getByRole('button', { name: 'Podcast sources', exact: true }).click();
    await expect(directory.getByTestId('events-media-count')).toHaveText('Showing 30 of 51');
    await directory.getByRole('button', { name: 'Show 30 more', exact: true }).click();
    await expect(cards).toHaveCount(51);
    expect(
      new Set(
        await cards.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-events-media-id')),
        ),
      ).size,
    ).toBe(51);
    expect(external).toEqual([]);
  });

  test(`${client.name} nine UI languages retain original metadata language and translated consent`, async ({
    page,
  }) => {
    await page.goto(`${client.origin}/#media`);
    const directory = page.getByTestId('production-events-media');
    await expect(directory.locator('[data-events-media-id]')).toHaveCount(13);
    for (const language of ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as const) {
      const copy = getEventsMediaCopy(language);
      await page.getByTestId('ui-language-selector').selectOption(language);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(directory.getByRole('heading', { name: copy.media, exact: true })).toBeVisible();
      const sample = metadata.videos[0];
      const card = directory.locator(`[data-events-media-id="${sample.id}"]`);
      await expect(card.getByRole('heading')).toHaveAttribute('lang', sample.language);
      await card.getByRole('button', { name: copy.openOriginal, exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText(copy.consentText);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: copy.cancel, exact: true })
        .click();
    }
  });

  for (const scenario of [
    { width: 320, language: 'de', theme: 'violet', scale: false },
    { width: 390, language: 'ru', theme: 'dark', scale: true },
    { width: 1440, language: 'en', theme: 'contrast', scale: false },
  ] as const) {
    test(`${client.name} directory reflow ${scenario.language}-${scenario.width}-${scenario.theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: scenario.width, height: 900 });
      for (const mode of ['events', 'media'] as const) {
        await page.goto(`${client.origin}/?theme=${scenario.theme}#${mode}`);
        const directory = page.getByTestId('production-events-media');
        await expect(directory.getByTestId('events-media-count')).toBeVisible();
        await page.getByTestId('ui-language-selector').selectOption(scenario.language);
        if (scenario.scale)
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '200%';
          });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        ).toBe(true);
        expect(
          await directory
            .locator('input,select,button:visible')
            .evaluateAll((nodes) =>
              nodes.every((node) => node.getBoundingClientRect().height >= 44),
            ),
        ).toBe(true);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(
            `${client.name}-${mode}-${scenario.language}-${scenario.width}-${scenario.theme}.png`,
          ),
        });
        const trigger = directory.locator('[data-events-media-id] button').first();
        await trigger.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        expect(
          await page.getByRole('dialog').evaluate((node) => {
            const color = getComputedStyle(node, '::backdrop').backgroundColor;
            const values = color.match(/[\d.]+/g)!.map(Number);
            return values.slice(0, 3).every((value) => value < 32) && (values[3] ?? 1) >= 0.5;
          }),
        ).toBe(true);
        expect(
          await page
            .getByRole('dialog')
            .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
        ).toBe(true);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(
            `${client.name}-${mode}-${scenario.language}-${scenario.width}-${scenario.theme}-dialog.png`,
          ),
        });
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
      }
    });
  }

  test(`${client.name} forced colors retain native filter and confirmation keyboard controls`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(`${client.origin}/#media`);
    const directory = page.getByTestId('production-events-media');
    await expect(directory.locator('[data-events-media-id]')).toHaveCount(13);
    const episodes = directory.getByRole('button', { name: 'Podcast episodes', exact: true });
    await episodes.focus();
    await page.keyboard.press('Enter');
    await expect(episodes).toHaveAttribute('aria-pressed', 'true');
    await expect(directory.getByTestId('events-media-count')).toHaveText('Showing 30 of 842');
    const source = directory.getByRole('combobox', { name: 'Source', exact: true });
    await source.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(source).not.toHaveValue('');
    const trigger = directory.locator('[data-events-media-id] button').first();
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`${client.name}-media-forced-colors.png`) });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
}

test('Website cold offline shell contains all four real metadata families without provider requests', async ({
  page,
  context,
}) => {
  const origin = 'http://127.0.0.1:43178';
  await page.goto(`${origin}/#more`);
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
  await reopened.goto(`${origin}/#events`);
  await expect(reopened.getByTestId('events-media-count')).toHaveText('Showing 30 of 5610');
  await reopened.goto(`${origin}/#media`);
  await expect(reopened.getByTestId('events-media-count')).toHaveText('Showing 13 of 13');
  const families = await reopened.evaluate(async () => {
    const names = new Set<string>();
    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys()) {
        const match =
          /\/assets\/(legacy-knowledge-v1|legacy-support-v1|content-directory-v1|production-events-media-v1)-/.exec(
            new URL(request.url).pathname,
          );
        if (match) names.add(match[1]);
      }
    return [...names].sort();
  });
  expect(families).toEqual([
    'content-directory-v1',
    'legacy-knowledge-v1',
    'legacy-support-v1',
    'production-events-media-v1',
  ]);
});
