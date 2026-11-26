import { test, expect } from '@playwright/test';

test('home demo animates, pauses, and supports manual scene selection without changing the draft', async ({ page }, testInfo) => {
  await page.clock.install();
  await page.goto('/');
  const demo = page.getByRole('region', { name: 'Animated room feature demo' });
  await expect(demo).toHaveAttribute('data-step', '0');
  await page.clock.fastForward(3600);
  await expect(demo).toHaveAttribute('data-step', '1');
  await page.getByRole('button', { name: 'Pause room demo' }).click();
  await page.clock.fastForward(8000);
  await expect(demo).toHaveAttribute('data-step', '1');
  await demo.getByRole('button', { name: 'Arrange', exact: true }).click();
  await expect(demo).toHaveAttribute('data-step', '2');
  await demo.getByRole('button', { name: 'Style', exact: true }).click();
  await expect(demo).toHaveAttribute('data-step', '3');
  await page.screenshot({ path: testInfo.outputPath('home-moving-demo.png'), fullPage: true });
  await page.getByRole('button', { name: 'Play room demo' }).click();
  await page.clock.fastForward(3600);
  await expect(demo).toHaveAttribute('data-step', '0');
  await page.locator('main').getByRole('button', { name: /Create a space/ }).click();
  await page.getByRole('button', { name: 'Continue to check walls' }).click();
  await page.getByRole('button', { name: 'Continue to furnish' }).click();
  await expect(page.getByRole('heading', { name: 'In your room · 0' })).toBeVisible();
});

test('reduced motion starts paused and the mobile demo stays within the viewport', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const demo = page.getByRole('region', { name: 'Animated room feature demo' });
  await expect(page.getByRole('button', { name: 'Play room demo' })).toBeVisible();
  await demo.getByRole('button', { name: 'Arrange', exact: true }).click();
  await expect(demo).toHaveAttribute('data-step', '2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await demo.screenshot({ path: testInfo.outputPath('home-demo-mobile.png') });
});
