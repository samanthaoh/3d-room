import { test, expect } from '@playwright/test';

const canvas = page => page.locator('.room-3d canvas');

test('renaming and saving do not replace the active 3D canvas', async ({ page }) => {
  await page.goto('/#furnish');
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await canvas(page).evaluate(element => { window.originalRoomCanvas = element; });
  await page.getByLabel('Space name').fill('Renamed room');
  expect(await canvas(page).evaluate(element => element === window.originalRoomCanvas)).toBe(true);
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  expect(await canvas(page).evaluate(element => element === window.originalRoomCanvas)).toBe(true);
});

test('WebGL context loss shows recovery guidance and restoration makes controls usable again', async ({ page }) => {
  await page.goto('/#furnish');
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await canvas(page).evaluate(element => {
    window.contextRecovery = element.getContext('webgl2').getExtension('WEBGL_lose_context');
    window.contextRecovery.loseContext();
  });
  await expect(page.getByRole('alert')).toContainText('3D view was interrupted');
  await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCount(0);
  await page.evaluate(() => window.contextRecovery.restoreContext());
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces'))[0].furniture.length)).toBe(1);
});

test('unavailable WebGL still permits arranging and saving through 2D', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto('/#furnish');
  await expect(page.getByRole('alert')).toContainText('3D is unavailable');
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await page.getByRole('slider', { name: /Horizontal/ }).fill('45');
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  await expect(page).toHaveURL(/#library$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces'))[0].furniture[0].x)).toBe(45);
});
