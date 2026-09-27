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
    // The old live site toggles a shrinking sticky header at 36px. Cross that
    // boundary in both directions and wait beyond its 180ms transition.
    for (const scrollTop of [34, 38, 40, 34, 0]) {
      await page.evaluate(
        ({ isMobile, top }) => {
          if (isMobile) document.querySelector('#mobile-main')!.scrollTop = top;
          else window.scrollTo(0, top);
        },
        { isMobile: mobile, top: scrollTop },
      );
      await expect
        .poll(() =>
          page.evaluate(
            (isMobile) =>
              isMobile ? document.querySelector('#mobile-main')!.scrollTop : window.scrollY,
            mobile,
          ),
        )
        .toBeGreaterThanOrEqual(scrollTop);
      await page.waitForTimeout(250);
      const after = await page.locator(selector).evaluate((header) => {
        const rect = header.getBoundingClientRect();
        return { top: rect.top, height: rect.height, position: getComputedStyle(header).position };
      });
      expect(after.height).toBeCloseTo(before.height, 0);
      expect(after.position).toBe('static');
      if (mobile) expect(after.top).toBeCloseTo(before.top, 0);
      else expect(after.top).toBeCloseTo(before.top - scrollTop, 0);
    }
  });
}
