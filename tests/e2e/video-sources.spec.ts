import { expect, test } from '@playwright/test';

test('accepted video sources: nine languages, safe links, no provider requests, keyboard and themes', async ({
  page,
}, info) => {
  const externalRequests: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname))
      externalRequests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?theme=violet#media');
  const section = page.locator('.video-sources');
  await expect(section.locator('[data-video-source]')).toHaveCount(11);
  await expect(section.locator('iframe, img, video, audio')).toHaveCount(0);
  const languages = { de: 2, en: 2, es: 1, fr: 1, it: 1, pt: 1, ru: 1, el: 1, tr: 1 };
  for (const [language, count] of Object.entries(languages)) {
    await page.getByTestId('ui-language-selector').selectOption(language);
    const filter = section.locator(`button[lang="${language}"]`).last();
    await filter.click();
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('[data-video-source]')).toHaveCount(count);
    for (const card of await section.locator('[data-video-source]').all()) {
      await expect(
        card.getByRole('heading', { level: info.project.name.startsWith('mobile-') ? 3 : 2 }),
      ).toHaveAttribute('lang', language);
      const link = card.locator('a');
      await expect(link).toHaveAttribute('href', /^https:\/\//);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
    }
  }
  await page.getByTestId('ui-language-selector').selectOption('de');
  await section.getByRole('button', { name: 'Alle Sprachen', exact: true }).click();
  await expect(section.locator('[data-video-source]')).toHaveCount(11);
  await expect(section.getByRole('link', { name: /DerDaraUncut/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/@DerDaraUncut',
  );
  const de = section.getByRole('button', { name: 'Deutsch', exact: true });
  await de.focus();
  await page.keyboard.press('Space');
  await expect(de).toHaveAttribute('aria-pressed', 'true');
  for (const theme of ['violet', 'dark', 'light']) {
    await page.getByTestId('theme-selector').selectOption(theme);
    await section.scrollIntoViewIfNeeded();
    const colors = await de.evaluate((element) => ({
      fill: getComputedStyle(element).backgroundColor,
      border: getComputedStyle(element).borderTopColor,
    }));
    expect(colors.fill).toBe(colors.border);
    await page.screenshot({
      path: info.outputPath(`${info.project.name}-de-${theme}.png`),
      fullPage: true,
    });
    if (theme === 'violet') {
      await section.locator('[data-video-source]').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`${info.project.name}-de-violet-cards.png`) });
    }
  }
  await page.getByTestId('theme-selector').selectOption('violet');
  await page.getByTestId('ui-language-selector').selectOption('ru');
  for (const width of [320, 390, 800, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate((small) => {
      document.documentElement.style.fontSize = small ? '200%' : '';
    }, width === 390);
    const dimensions = await section.evaluate((element) => ({
      scroll: element.scrollWidth,
      width: element.clientWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    for (const control of await section.locator('button, a').all()) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({
      path: info.outputPath(`${info.project.name}-ru-${width}.png`),
      fullPage: true,
    });
  }
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('real mobile home exposes bounded source headlines and can open the full directory', async ({
  page,
}, info) => {
  test.skip(!info.project.name.startsWith('mobile-'));
  await page.goto('/?theme=violet#home');
  await page.getByTestId('ui-language-selector').selectOption('de');
  const section = page.getByRole('region', { name: 'Aus dem Nachrichtenarchiv' });
  await expect(section.locator('[data-home-directory-article]')).toHaveCount(5);
  await page.screenshot({ path: info.outputPath('home-real-headlines.png'), fullPage: true });
  await section.getByRole('button', { name: /Nachrichtenverzeichnis/ }).click();
  await expect(page).toHaveURL(/#discover\/news$/);
  await expect(
    page.getByRole('heading', { name: 'Nachrichtenverzeichnis', exact: true }),
  ).toBeVisible();
});
