import { test, expect } from '@playwright/test';

// Generate real PNG/JPEG bytes with the browser's encoder.
async function imageFile(page, type = 'image/png') {
  const bytes = await page.evaluate(type => {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 40;
    canvas.getContext('2d').fillRect(10, 10, 60, 20);
    return Array.from(atob(canvas.toDataURL(type).split(',')[1]), c => c.charCodeAt(0));
  }, type);
  return { name: type === 'image/png' ? 'plan.png' : 'plan.jpg', mimeType: type, buffer: Buffer.from(bytes) };
}

const picker = page => page.getByLabel('Choose a floor plan');
const preview = page => page.getByRole('img', { name: /Uploaded floor plan:/ });

test.beforeEach(async ({ page }) => { await page.goto('/#upload'); });

test('PNG and JPEG selection previews, continues to editor, and permits same-file reselection', async ({ page }) => {
  for (const type of ['image/png', 'image/jpeg']) {
    const file = await imageFile(page, type);
    await picker(page).setInputFiles(file);
    await expect(preview(page)).toBeVisible();
    await expect(preview(page)).toHaveAttribute('alt', `Uploaded floor plan: ${file.name}`);
    expect(await preview(page).evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.getByRole('button', { name: 'Remove image' }).click();
    await expect(preview(page)).toHaveCount(0);
    await picker(page).setInputFiles(file);
    await expect(preview(page)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Continue to check walls' }).click();
  await expect(page).toHaveURL(/#walls$/);
  await expect(preview(page)).toBeVisible();
});

test('unsupported, empty, oversized, and corrupt images preserve a previous valid preview', async ({ page }) => {
  await picker(page).setInputFiles(await imageFile(page));
  await expect(preview(page)).toBeVisible();
  for (const [file, message] of [
    [{ name: 'plan.txt', mimeType: 'text/plain', buffer: Buffer.from('text') }, /JPG, PNG, or PDF/],
    [{ name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }, /empty or unreadable/],
    [{ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) }, /10 MB or smaller/],
    [{ name: 'corrupt.png', mimeType: 'image/png', buffer: Buffer.from('not an image') }, /could not be read/],
  ]) {
    await picker(page).setInputFiles(file);
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(preview(page)).toHaveAttribute('alt', 'Uploaded floor plan: plan.png');
  }
  await picker(page).setInputFiles(await imageFile(page, 'image/jpeg'));
  await expect(preview(page)).toHaveAttribute('alt', 'Uploaded floor plan: plan.jpg');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('PDF replaces an image with explicit preview guidance and can be removed', async ({ page }) => {
  await picker(page).setInputFiles(await imageFile(page));
  await expect(preview(page)).toBeVisible();
  await picker(page).setInputFiles({ name: 'plan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await expect(preview(page)).toHaveCount(0);
  await expect(page.getByText('Attached: plan.pdf', { exact: true })).toBeVisible();
  await expect(page.getByText(/This attachment has no image preview/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove attachment' }).click();
  await expect(page.getByText('No floor plan attached yet.')).toBeVisible();
});

test('drop accepts one image and rejects multiple or unsupported files', async ({ page }) => {
  const file = await imageFile(page);
  async function drop(files) {
    const dataTransfer = await page.evaluateHandle(files => {
      const transfer = new DataTransfer();
      for (const file of files) transfer.items.add(new File([new Uint8Array(file.bytes)], file.name, { type: file.type }));
      return transfer;
    }, files);
    await page.locator('.dropzone').dispatchEvent('drop', { dataTransfer });
    await dataTransfer.dispose();
  }
  const png = { name: file.name, type: file.mimeType, bytes: [...file.buffer] };
  await drop([png]);
  await expect(preview(page)).toBeVisible();
  await drop([png, png]);
  await expect(page.getByRole('alert')).toHaveText('Choose one floor plan at a time.');
  await drop([{ name: 'plan.svg', type: 'image/svg+xml', bytes: [60, 62] }]);
  await expect(page.getByRole('alert')).toContainText('JPG, PNG, or PDF');
  await expect(preview(page)).toBeVisible();
});

test('a slower previous selection cannot overwrite a newer file', async ({ page }) => {
  await page.evaluate(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await new Promise(resolve => setTimeout(resolve, 500));
      return decode.call(this);
    };
  });
  await picker(page).setInputFiles(await imageFile(page));
  await expect(page.getByRole('button', { name: 'Continue to check walls' })).toBeDisabled();
  await picker(page).setInputFiles({ name: 'new.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.waitForTimeout(700);
  await expect(page.getByText('Attached: new.pdf', { exact: true })).toBeVisible();
  await expect(preview(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue to check walls' })).toBeEnabled();
});

test('mobile preview supports hide/show and keyboard file selection', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await picker(page).focus();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  const chooser = await chooserPromise;
  await chooser.setFiles(await imageFile(page));
  await expect(preview(page)).toBeVisible();
  await page.getByRole('button', { name: 'Hide reference' }).click();
  await expect(preview(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Show reference' }).click();
  await expect(preview(page)).toBeVisible();
  await picker(page).setInputFiles([]);
  await expect(preview(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('upload-mobile.png'), fullPage: true });
});
