import { copyFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { getUiCopy, uiLanguageIds } from '../../packages/ui-language/src';

const sizes = [
  [390, 844],
  [412, 915],
  [600, 960],
  [844, 390],
] as const;
const themes = ['dark', 'light', 'pink', 'contrast'] as const;

async function persistCapture(info: TestInfo, name: string, path: string) {
  await info.attach(name, { path, contentType: 'image/png' });
  const evidenceRoot = process.env.WRN_EVIDENCE_ROOT;
  if (evidenceRoot) {
    const target = resolve(evidenceRoot);
    await mkdir(target, { recursive: true });
    await copyFile(
      path,
      join(target, `${process.env.WRN_EVIDENCE_REVISION ?? 'local'}_${name}.png`),
    );
  }
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await persistCapture(info, name, path);
}

async function captureHomeSegment(
  page: Page,
  info: TestInfo,
  selector: '.home-main-stories' | '.home-sport',
  roleSelector: string,
  expectedCount: number,
  name: string,
) {
  const segment = page.locator(selector);
  await segment.scrollIntoViewIfNeeded();
  await expect(segment).toBeVisible();
  const cards = segment.locator(roleSelector);
  await expect(cards).toHaveCount(expectedCount);
  for (let index = 0; index < expectedCount; index += 1) {
    await expect(cards.nth(index)).toBeVisible();
  }
  const geometry = await segment.evaluate((element) => {
    const main = document.querySelector<HTMLElement>('.mobile-shell main');
    const navigation = document.querySelector<HTMLElement>('.mobile-primary-nav');
    const segmentBounds = element.getBoundingClientRect();
    const mainBounds = main?.getBoundingClientRect();
    const navigationBounds = navigation?.getBoundingClientRect();
    return {
      isScrollableInternally: element.scrollHeight > element.clientHeight + 1,
      reachesScrollableMain:
        !mainBounds ||
        (segmentBounds.bottom > mainBounds.top && segmentBounds.top < mainBounds.bottom),
      navigationCoversMain: Boolean(
        mainBounds && navigationBounds && navigationBounds.top < mainBounds.bottom - 1,
      ),
    };
  });
  expect(geometry.isScrollableInternally).toBe(false);
  expect(geometry.reachesScrollableMain).toBe(true);
  expect(geometry.navigationCoversMain).toBe(false);
  const path = info.outputPath(`${name}.png`);
  await segment.screenshot({ path });
  await persistCapture(info, name, path);
}

async function assertHome(page: Page) {
  await expect(page.getByTestId('manifest-revision')).toContainText(
    'wrn-g3-016-mobile-home-manifest-v1',
  );
  await expect(page.locator('article[data-home-role]')).toHaveCount(9);
  await expect(page.locator('[data-home-role="lead"]')).toHaveCount(1);
  await expect(page.locator('[data-home-role="main"]')).toHaveCount(5);
  await expect(page.locator('[data-home-role="sport-feature"]')).toHaveCount(1);
  await expect(page.locator('[data-home-role="sport-secondary"]')).toHaveCount(2);
}

async function assertGeometry(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const controls = [...document.querySelectorAll<HTMLElement>('button, a')].filter((control) => {
      const style = getComputedStyle(control);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    return {
      overflow: root.scrollWidth > root.clientWidth + 1,
      cardsOverflow: [...document.querySelectorAll<HTMLElement>('.home-card')].some(
        (card) => card.scrollWidth > card.clientWidth + 1,
      ),
      controls: controls.map((control) => {
        const bounds = control.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height, text: control.innerText };
      }),
    };
  });
  expect(result.overflow).toBe(false);
  expect(result.cardsOverflow).toBe(false);
  expect(result.controls.every((control) => control.width >= 44 && control.height >= 44)).toBe(
    true,
  );
}

test.beforeEach(async ({ browserName }, info) => {
  test.skip(browserName !== 'chromium' || info.project.name !== 'mobile-390x844');
});

test('G3-016 Home visual matrix keeps the nine bound roles responsive in four themes', async ({
  context,
  page,
}, info) => {
  test.setTimeout(180_000);
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:43173') external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?state=ready');
  await assertHome(page);

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const theme of themes) {
      await page.getByTestId('theme-selector').selectOption(theme);
      await assertGeometry(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `g3-016-home-${width}x${height}-${theme}`);
      await captureHomeSegment(
        page,
        info,
        '.home-main-stories',
        '[data-home-role="main"]',
        5,
        `g3-016-home-main-${width}x${height}-${theme}`,
      );
      await captureHomeSegment(
        page,
        info,
        '.home-sport',
        '[data-home-role^="sport-"]',
        3,
        `g3-016-home-sport-${width}x${height}-${theme}`,
      );
    }
  }

  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('G3-016 Home preserves all nine languages and 200 percent reflow', async ({
  context,
}, info) => {
  test.setTimeout(180_000);
  for (const language of uiLanguageIds) {
    const copy = getUiCopy(language);
    for (const phase of ['initial', 'after-mount'] as const) {
      const page = await context.newPage({ viewport: { width: 390, height: 844 } });
      await page.addInitScript(
        ({ language, phase }) => {
          localStorage.setItem('wrn.mobile-ui-language.v1', language);
          if (phase === 'initial') {
            const apply = () => {
              document.documentElement.style.fontSize = '32px';
            };
            const observer = new MutationObserver(() => {
              apply();
              observer.disconnect();
            });
            observer.observe(document, { childList: true });
            apply();
          }
        },
        { language, phase },
      );
      await page.goto('/?state=ready&theme=dark');
      await assertHome(page);
      if (phase === 'after-mount') {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '32px';
        });
      }
      await expect(page.locator('.mobile-shell')).toHaveAttribute(
        'data-wide-language-layout',
        'true',
      );
      await expect(page.getByRole('heading', { name: copy.sportAndFanculture })).toBeVisible();
      await assertGeometry(page);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await capture(page, info, `g3-016-home-390x844-${language}-${phase}-200pct`);
      await page.close();
    }
  }
});
