import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const firstId = 'wrn-art-a772ab86c915a036c6177f1bfe958d4d';
const endpoint = 'https://translation.example/v1/translations';
const profiles = [
  { name: 'mobile', origin: 'http://127.0.0.1:43181', reader: `/#article/${firstId}` },
  { name: 'website', origin: 'http://127.0.0.1:43182', reader: `/?article=${firstId}#home` },
] as const;
const hash = (text: string) => createHash('sha256').update(text).digest('hex');

for (const profile of profiles) {
  test(`${profile.name}: bounded timeout and safety revocation discard pending translations`, async ({
    page,
  }) => {
    let called = 0;
    const releases: (() => void)[] = [];
    await page.route('https://**/*', async (route) => {
      if (route.request().url() !== endpoint) return route.abort();
      called++;
      await new Promise<void>((resolve) => releases.push(resolve));
      await route
        .fulfill({ status: 503, contentType: 'application/json', body: '{}' })
        .catch(() => undefined);
    });
    await page.clock.install();
    await page.addInitScript(
      (app) => localStorage.setItem(`wrn.${app}-ui-language.v1`, 'de'),
      profile.name,
    );
    await page.goto(profile.origin + profile.reader);
    const paragraph = page.locator('.production-translatable-paragraph').first();
    await paragraph.locator('[data-translation-action]').click();
    await expect.poll(() => called).toBe(1);
    await page.clock.fastForward(15_001);
    await expect(paragraph.getByText('Die Übersetzung hat zu lange gedauert.')).toBeVisible();
    await expect(paragraph.locator(':scope > p')).toBeVisible();
    expect(called).toBe(1);
    releases[0]!();
    await paragraph.locator('[data-translation-action]').click();
    await expect.poll(() => called).toBe(2);
    await page.evaluate(async (id) => {
      const modulePath = '/src/production-content-offline-store.ts';
      const { openProductionContentOfflineStore } = await import(modulePath);
      const db = await openProductionContentOfflineStore();
      try {
        const { control } = await db.snapshot();
        const prepared = await db.prepareRecheck('translation-test-revocation', control);
        const secured = await db.commitSafety(
          'translation-test-revocation',
          {
            revision: control.safety.revision + 1,
            revokedIds: [...control.safety.revokedIds, id].sort(),
          },
          Date.now(),
          prepared,
        );
        await db.finishRecheck(
          'translation-test-revocation',
          'safety-verified-payload-failed',
          Date.now(),
          secured,
        );
      } finally {
        db.close();
      }
      dispatchEvent(new Event('focus'));
    }, firstId);
    await expect(page.getByTestId('production-reader')).toHaveCount(0);
    releases[1]!();
    await expect(page.locator('[data-translation-result]')).toHaveCount(0);
  });
  for (const theme of ['violet', 'dark']) {
    test(`${profile.name} ${theme}: explicit translation, original, retry, keyboard, Axe and reflow`, async ({
      page,
    }, info) => {
      const escapes: string[] = [];
      const errors: string[] = [];
      const requests: Record<string, unknown>[] = [];
      let fail = false;
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (new URL(request.url()).origin === profile.origin) return route.continue();
        if (request.url() !== endpoint) {
          escapes.push(request.url());
          return route.abort();
        }
        const body = request.postDataJSON() as Record<string, string>;
        requests.push(body);
        expect(Object.keys(body).sort()).toEqual([
          'contractVersion',
          'mode',
          'sourceLanguage',
          'targetLanguage',
          'text',
        ]);
        expect(request.headers()).not.toHaveProperty('cookie');
        expect(request.headers()).not.toHaveProperty('referer');
        if (fail)
          return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        const text = 'Testübersetzung: Der Originalabsatz bleibt sichtbar.';
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            contractVersion: '1.0.0',
            mode: 'paragraph',
            sourceLanguage: body.sourceLanguage,
            targetLanguage: body.targetLanguage,
            requestTextSha256: hash(body.text!),
            translation: { text, textSha256: hash(text) },
            adapter: { id: 'browser-test', version: '1', provider: 'browser-test-provider' },
            cache: {
              namespace: 'translation:v2',
              status: 'hit',
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          }),
        });
      });
      await page.addInitScript(
        ({ app, theme }) => {
          localStorage.setItem(`wrn.${app}-ui-language.v1`, 'de');
          history.replaceState(
            null,
            '',
            `${location.pathname}${location.search}${location.search ? '&' : '?'}theme=${theme}${location.hash}`,
          );
        },
        { app: profile.name, theme },
      );
      await page.setViewportSize({ width: 320, height: 844 });
      await page.goto(profile.origin + profile.reader);
      const reader = page.getByTestId('production-reader');
      await expect(reader).toBeVisible();
      const paragraph = reader.locator('.production-translatable-paragraph').first();
      const original = paragraph.locator(':scope > p');
      await expect(original).toHaveAttribute('lang', 'en');
      const text = await original.textContent();
      expect(requests).toHaveLength(0);
      const action = paragraph.locator('[data-translation-action]');
      await expect(action).toBeEnabled();
      await action.focus();
      await page.keyboard.press('Enter');
      await expect(paragraph.locator('[data-translation-result]')).toBeVisible();
      await expect(original).toHaveText(text!);
      await expect(paragraph.locator('[data-translation-result]')).toHaveAttribute(
        'data-cache-status',
        'hit',
      );
      expect(requests).toHaveLength(1);
      expect(requests[0]!.text).toBe(text);
      const box = await action.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-320-success.png`),
        fullPage: true,
      });
      await paragraph.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-320-paragraph.png`),
      });
      fail = true;
      await action.click();
      await expect(paragraph.getByText('Die Übersetzung ist fehlgeschlagen.')).toBeVisible();
      await expect(original).toHaveText(text!);
      fail = false;
      await action.click();
      await expect(paragraph.locator('[data-translation-result]')).toBeVisible();
      await page.getByTestId('ui-language-selector').selectOption('ru');
      await expect(reader.locator('[data-translation-result]')).toHaveCount(0);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      const skip = page.locator('.skip-link').first();
      expect(await skip.evaluate((element) => element !== document.activeElement)).toBe(true);
      expect(
        await skip.evaluate((element) => element.getBoundingClientRect().bottom),
      ).toBeLessThanOrEqual(0);
      await skip.focus();
      expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
      await page.keyboard.press('Enter');
      await expect(page.locator('main').first()).toBeFocused();
      await expect(reader.locator('[data-translation-action]').first()).toBeEnabled();
      await reader.locator('[data-translation-action]').first().focus();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-390-ru200.png`),
        fullPage: true,
      });
      // A paragraph taller than the viewport makes Chrome's beyond-viewport capture
      // include fixed offscreen elements. Record the actual visible keyboard viewport.
      await page.screenshot({
        path: info.outputPath(`${profile.name}-${theme}-390-ru200-viewport.png`),
      });
      const skipState = await skip.evaluate((element) => ({
        focused: element === document.activeElement,
        top: element.getBoundingClientRect().top,
        bottom: element.getBoundingClientRect().bottom,
        transform: getComputedStyle(element).transform,
      }));
      expect(skipState.bottom, JSON.stringify(skipState)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
      expect(escapes).toEqual([]);
    });
  }
  test(`${profile.name}: offline and late response after navigation retain only originals`, async ({
    page,
    context,
  }) => {
    let finish!: () => void;
    let called = 0;
    await page.route('https://**/*', async (route) => {
      if (route.request().url() !== endpoint) return route.abort();
      called++;
      const body = route.request().postDataJSON();
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      const text = 'Late translation must be absent';
      await route
        .fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            contractVersion: '1.0.0',
            mode: 'paragraph',
            sourceLanguage: body.sourceLanguage,
            targetLanguage: body.targetLanguage,
            requestTextSha256: hash(body.text),
            translation: { text, textSha256: hash(text) },
            adapter: { id: 'browser-test', version: '1', provider: 'browser-test-provider' },
            cache: {
              namespace: 'translation:v2',
              status: 'miss',
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          }),
        })
        .catch(() => undefined);
    });
    await page.addInitScript(
      (app) => localStorage.setItem(`wrn.${app}-ui-language.v1`, 'de'),
      profile.name,
    );
    await page.goto(profile.origin + profile.reader);
    const paragraph = page.locator('.production-translatable-paragraph').first();
    await paragraph.locator('[data-translation-action]').click();
    await expect.poll(() => called).toBe(1);
    await context.setOffline(true);
    await expect(paragraph.locator(':scope > p')).toBeVisible();
    await expect(paragraph.locator('[data-translation-action]')).toBeDisabled();
    finish();
    await expect(page.locator('[data-translation-result]')).toHaveCount(0);
    await context.setOffline(false);
    await paragraph.locator('[data-translation-action]').click();
    await expect.poll(() => called).toBe(2);
    await page.evaluate(() => {
      history.pushState(null, '', '/#home');
      dispatchEvent(new PopStateEvent('popstate'));
      dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await expect(page.getByTestId('production-reader')).toHaveCount(0);
    finish();
    await expect(page.locator('[data-translation-result]')).toHaveCount(0);
  });
}
