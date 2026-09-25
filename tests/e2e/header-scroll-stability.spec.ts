import { expect, test } from '@playwright/test';

for (const client of ['mobile', 'website'] as const) {
  test(`${client} header keeps its height after a small scroll`, async ({ page }, info) => {
    const mobile = client === 'mobile';
    const coveredProjects = mobile
      ? ['mobile-390x844']
      : ['website-390x844', 'website-800x1280', 'website-1440x900'];
    test.skip(!coveredProjects.includes(info.project.name), 'Focused Chrome widths per client.');
    await page.goto('/?state=ready&theme=violet#home');
    await expect(page.locator(mobile ? '#mobile-main' : '#website-main')).toBeVisible();
    if (!mobile && (await page.locator('.website-support-welcome[open]').isVisible())) {
      await page.keyboard.press('Escape');
    }
    await expect
      .poll(() =>
        page.evaluate((isMobile) => {
          const scroller = isMobile
            ? document.querySelector('#mobile-main')
            : document.scrollingElement;
          return scroller!.scrollHeight - scroller!.clientHeight;
        }, mobile),
      )
      .toBeGreaterThan(40);
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
    // The old live website animated a sticky header for 180 ms. Check after
    // that interval so a delayed height change cannot evade this regression.
    await page.waitForTimeout(250);
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
