import { test, expect } from '@playwright/test';

const records = page => page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces')));
async function arrange(page, x, y, rotation) {
  await page.getByRole('slider', { name: /Horizontal/ }).fill(String(x));
  await page.getByRole('slider', { name: /Vertical/ }).fill(String(y));
  await page.getByRole('slider', { name: /Rotation/ }).fill(String(rotation));
}
async function open(page, name) {
  await page.getByRole('link', { name: 'My spaces', exact: true }).click();
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
}

test('two saved layouts retain exact transforms, dimensions and colors after reload and independent updates', async ({ page }) => {
  await page.goto('/#walls');
  await page.getByLabel('Space name').fill('Studio');
  await page.getByLabel('Width (m)', { exact: true }).fill('6.25');
  await page.getByLabel('Length (m)', { exact: true }).fill('4.5');
  await page.getByLabel('Wall height (m)', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Apply dimensions' }).click();
  await page.getByRole('link', { name: /Furnish/ }).click();
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await arrange(page, 12.3, 24.6, 135);
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await arrange(page, 61.2, 70.4, 315);
  await page.getByRole('link', { name: /Style/ }).click();
  await page.getByLabel('Wall color').fill('#abcdef');
  await page.getByLabel('Floor color').fill('#123456');
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  const first = (await records(page))[0];
  expect(first).toMatchObject({ name: 'Studio', width: 6.25, depth: 4.5, height: 3, wallColor: '#abcdef', floorColor: '#123456' });
  expect(first.furniture.map(({ x, y, rotation }) => ({ x, y, rotation }))).toEqual([
    { x: 12.3, y: 24.6, rotation: 135 }, { x: 61.2, y: 70.4, rotation: 315 },
  ]);
  await page.locator('header').getByRole('button', { name: /Create a space/ }).click();
  await page.getByRole('link', { name: /Furnish/ }).click();
  await page.getByLabel('Space name').fill('Lounge');
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await arrange(page, 40, 50, 90);
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  const second = (await records(page))[0];
  await page.reload();
  await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Open Studio', exact: true }).click();
  for (const [index, expected] of first.furniture.entries()) {
    await page.locator('.placed-items button').nth(index).click();
    await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue(String(expected.x));
    await expect(page.getByRole('slider', { name: /Vertical/ })).toHaveValue(String(expected.y));
    await expect(page.getByRole('slider', { name: /Rotation/ })).toHaveValue(String(expected.rotation));
  }
  await page.getByRole('button', { name: '2D', exact: true }).click();
  const piece = page.getByRole('button', { name: 'Select Couch', exact: true }).nth(1);
  expect(await piece.evaluate(el => ({ left: el.style.left, top: el.style.top, transform: el.style.transform }))).toEqual({ left: '61.2%', top: '70.4%', transform: 'rotate(315deg)' });
  await arrange(page, 55.5, 66.6, 225);
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  const updated = await records(page);
  expect(updated).toHaveLength(2);
  expect(updated.find(room => room.id === second.id)).toEqual(second);
  expect(updated.find(room => room.id === first.id).furniture[1]).toMatchObject({ x: 55.5, y: 66.6, rotation: 225 });
  await page.reload();
  await page.getByRole('button', { name: 'Open Studio', exact: true }).click();
  await page.locator('.placed-items button').nth(1).click();
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue('55.5');
  await arrange(page, 1, 2, 3); // Unsaved edits must not change the saved snapshot.
  await open(page, 'Studio');
  await page.locator('.placed-items button').nth(1).click();
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue('55.5');
  await expect(page.getByRole('slider', { name: /Vertical/ })).toHaveValue('66.6');
  await expect(page.getByRole('slider', { name: /Rotation/ })).toHaveValue('225');
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  expect((await records(page)).find(room => room.id === first.id)).toMatchObject({ width: 6.25, depth: 4.5, height: 3, wallColor: '#abcdef', floorColor: '#123456' });
  await open(page, 'Lounge');
  await page.locator('.placed-items button').click();
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue('40');
});

test('failed save keeps the editor draft and previous saved layout, then allows retry', async ({ page }) => {
  await page.goto('/#furnish');
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await arrange(page, 20, 30, 45);
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  const original = await records(page);
  await arrange(page, 60, 70, 180);
  await page.evaluate(() => {
    window.restoreStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  await expect(page).toHaveURL(/#furnish$/);
  await expect(page.getByRole('status').filter({ hasText: 'Could not save.' })).toBeVisible();
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue('60');
  expect(await records(page)).toEqual(original);
  await page.evaluate(() => { Storage.prototype.setItem = window.restoreStorage; });
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  await expect(page).toHaveURL(/#library$/);
  expect((await records(page))[0].furniture[0]).toMatchObject({ x: 60, y: 70, rotation: 180 });
});

test('unreadable saved data shows an error instead of an empty library and is not overwritten', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('3d-room.spaces', '{broken'));
  await page.goto('/#library');
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Could not read your saved spaces');
  await expect(page.getByRole('heading', { name: 'Make space for your first idea.' })).toHaveCount(0);
  await page.locator('header').getByRole('button', { name: /Create a space/ }).click();
  await page.getByRole('link', { name: /Furnish/ }).click();
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  await expect(page).toHaveURL(/#furnish$/);
  expect(await page.evaluate(() => localStorage.getItem('3d-room.spaces'))).toBe('{broken');
});

test('opening a removed record reports the problem and stays in the library', async ({ page }) => {
  await page.goto('/#furnish');
  await page.getByRole('button', { name: 'Save & return to library' }).click();
  await expect(page).toHaveURL(/#library$/);
  await expect(page.getByRole('button', { name: 'Open My living room' })).toBeVisible();
  await page.evaluate(() => localStorage.removeItem('3d-room.spaces'));
  await page.getByRole('button', { name: 'Open My living room' }).click();
  await expect(page).toHaveURL(/#library$/);
  await expect(page.getByRole('alert')).toContainText('Could not open this saved space');
});
