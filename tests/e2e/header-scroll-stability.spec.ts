import { expect, test } from '@playwright/test';

for (const client of ['mobile', 'website'] as const) {
  test(`${client} header keeps its height after a small scroll`, async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-390x844', 'One focused Chrome viewport per client.');
    const mobile = client === 'mobile';
    await page.goto(`http://127.0.0.1:${mobile ? 43177 : 43178}/?theme=violet#home`);
    if (!mobile) {
      await expect(page.locator('.website-support-welcome[open]')).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await expect(page.locator('.production-home .production-card').first()).toBeVisible();
    const selector = mobile ? '.mobile-header' : '.site-header';
    const before = await page.locator(selector).evaluate((header) => {
      const rect = header.getBoundingClientRect();
      return { top: rect.top, height: rect.height, position: getComputedStyle(header).position };
    });
    await page.evaluate((isMobile) => {
      if (isMobile) document.querySelector('#mobile-main')!.scrollTop = 40;
      else window.scrollTo(0, 40);
    }, mobile);
    await expect
      .poll(() =>
        page.evaluate(
          (isMobile) =>
            isMobile ? document.querySelector('#mobile-main')!.scrollTop : window.scrollY,
          mobile,
        ),
      )
      .toBeGreaterThan(20);
    const after = await page.locator(selector).evaluate((header) => {
      const rect = header.getBoundingClientRect();
      return { top: rect.top, height: rect.height, position: getComputedStyle(header).position };
    });
    expect(after.height).toBeCloseTo(before.height, 0);
    expect(after.position).toBe('static');
    if (mobile) expect(after.top).toBeCloseTo(before.top, 0);
    else expect(after.top).toBeLessThan(before.top - 20);
  });
}
