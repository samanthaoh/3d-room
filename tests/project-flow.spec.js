import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function uploadPlan(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, 160, 100);
    context.strokeRect(10, 10, 140, 80);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Choose a floor plan').setInputFiles({ name: 'studio-plan.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
}
const reference = page => page.getByRole('img', { name: 'Uploaded floor plan: studio-plan.png', exact: true });
async function checkStep(page, route, label) {
  await expect(page).toHaveURL(new RegExp('#' + route + '$'));
  await expect(page.getByRole('navigation', { name: 'Room design steps' }).getByRole('link', { name: new RegExp(label) })).toHaveAttribute('aria-current', 'step');
  await expect(reference(page)).toBeVisible();
}

for (const width of [1440, 390]) {
  test(`complete project journey preserves the reference and arrangement at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.locator('main').getByRole('button', { name: /Create a space/ }).click();
    await expect(page).toHaveURL(/#upload$/);
    await uploadPlan(page);
    await checkStep(page, 'upload', 'Upload');
    const imageData = await reference(page).getAttribute('src');
    await page.getByRole('button', { name: 'Continue to check walls' }).click();
    await checkStep(page, 'walls', 'Check walls');
    await page.getByLabel('Space name').fill('My complete project');
    await page.getByLabel('Width (m)', { exact: true }).fill('6');
    await page.getByLabel('Length (m)', { exact: true }).fill('5');
    await page.getByRole('button', { name: 'Apply dimensions' }).click();
    await page.getByRole('button', { name: 'Continue to furnish' }).click();
    await checkStep(page, 'furnish', 'Furnish');
    await page.getByRole('button', { name: 'Add couch to room' }).click();
    await page.getByRole('slider', { name: /Horizontal/ }).fill('20');
    await page.getByRole('slider', { name: /Vertical/ }).fill('35');
    await page.getByRole('slider', { name: /Rotation/ }).fill('90');
    await page.locator('#furniture-catalog').getByRole('button', { name: /^Table/ }).click();
    await page.getByRole('button', { name: 'Add table to room' }).click();
    await page.getByRole('slider', { name: /Horizontal/ }).fill('65');
    await page.getByRole('slider', { name: /Vertical/ }).fill('60');
    await page.getByRole('slider', { name: /Rotation/ }).fill('30');
    await page.getByRole('button', { name: 'Continue to style' }).click();
    await checkStep(page, 'style', 'Style');
    await page.getByLabel('Wall color').fill('#ccddee');
    await page.getByLabel('Floor color').fill('#bbaacc');
    await page.goBack();
    await checkStep(page, 'furnish', 'Furnish');
    await expect(page.getByRole('heading', { name: 'In your room · 2' })).toBeVisible();
    await page.goForward();
    await checkStep(page, 'style', 'Style');
    await expect(page.getByLabel('Wall color')).toHaveValue('#ccddee');
    await page.getByRole('button', { name: 'Continue to share' }).click();
    await checkStep(page, 'share', 'Share');
    await page.getByRole('button', { name: 'Save to my spaces' }).click();
    await expect(page.getByRole('status')).toContainText('saved. Reopen it from My spaces.');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces'))[0]);
    expect(saved).toMatchObject({ name: 'My complete project', source: 'studio-plan.png', referenceImage: imageData, width: 6, depth: 5, wallColor: '#ccddee', floorColor: '#bbaacc' });
    expect(saved.furniture.map(({ type, x, y, rotation }) => ({ type, x, y, rotation }))).toEqual([
      { type: 'sofa', x: 20, y: 35, rotation: 90 }, { type: 'table', x: 65, y: 60, rotation: 30 },
    ]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download room JSON' }).click();
    const download = await downloadPromise;
    expect(JSON.parse(await readFile(await download.path(), 'utf8'))).toEqual(saved);
    await page.getByRole('button', { name: 'View saved spaces' }).click();
    await expect(page).toHaveURL(/#library$/);
    await page.reload();
    await expect(page.locator('.project-card')).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath('saved-project.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open My complete project' }).click();
    await checkStep(page, 'furnish', 'Furnish');
    await expect(reference(page)).toHaveAttribute('src', imageData);
    expect(await reference(page).evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    for (const [index, item] of saved.furniture.entries()) {
      await page.locator('.placed-items button').nth(index).click();
      await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue(String(item.x));
      await expect(page.getByRole('slider', { name: /Vertical/ })).toHaveValue(String(item.y));
      await expect(page.getByRole('slider', { name: /Rotation/ })).toHaveValue(String(item.rotation));
    }
    await page.locator('header').getByRole('button', { name: /Create a space/ }).click();
    await expect(page).toHaveURL(/#upload$/);
    await expect(reference(page)).toHaveCount(0);
    await expect(page.getByText('No floor plan attached yet.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to check walls' }).click();
    await expect(page.getByLabel('Space name')).toHaveValue('My living room');
    await expect(page.getByLabel('Width (m)', { exact: true })).toHaveValue('5');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces')))).toEqual([saved]);
  });
}

test('starting another project during image preparation cannot attach the previous project reference', async ({ page }) => {
  await page.goto('/#upload');
  await page.evaluate(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await new Promise(resolve => setTimeout(resolve, 600));
      return decode.call(this);
    };
  });
  await uploadPlan(page);
  await expect(page.getByRole('button', { name: 'Continue to check walls' })).toBeDisabled();
  await page.locator('header').getByRole('button', { name: /Create a space/ }).click();
  await expect(page.getByRole('button', { name: 'Continue to check walls' })).toBeEnabled();
  await page.waitForTimeout(800);
  await expect(reference(page)).toHaveCount(0);
  await expect(page.getByText('No floor plan attached yet.')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Preparing' })).toHaveCount(0);
});
