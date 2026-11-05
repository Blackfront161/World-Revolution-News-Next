import { expect, type Page } from '@playwright/test';

export async function selectMobileThemeFromMore(page: Page, theme: string) {
  const previousHash = new URL(page.url()).hash;
  const more = page.getByTestId('header-more-trigger');
  await more.click();
  await page.getByTestId('theme-selector').selectOption(theme);
  await more.click();
  await expect.poll(() => new URL(page.url()).hash).toBe(previousHash);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}
