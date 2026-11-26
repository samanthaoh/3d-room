import { test, expect } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';

const canvas = page => page.locator('.room-3d canvas');
const tool = (page, name) => page.getByRole('group', { name: 'Room interaction tool' }).getByRole('button', { name });
async function savedRoom(page) {
  await page.getByRole('button', { name: 'Save space', exact: true }).click();
  return page.evaluate(() => JSON.parse(localStorage.getItem('3d-room.spaces'))[0]);
}
async function addCouch(page) {
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await expect(page.getByRole('heading', { name: 'In your room · 1' })).toBeVisible();
}
async function centerPoint(page) {
  await canvas(page).scrollIntoViewIfNeeded();
  const rect = await canvas(page).boundingBox();
  const camera = new PerspectiveCamera(45, rect.width / rect.height, 0.1, 300);
  const distance = 5 * Math.max(1.5, 1 / camera.aspect);
  camera.position.set(distance, distance * 0.8, distance);
  camera.lookAt(0, 0.9, 0);
  camera.updateMatrixWorld();
  const point = new Vector3(0, 0.5, 0).project(camera);
  return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 };
}
async function drag(page, start, dx, dy, button = 'left') {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down({ button });
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
  await page.mouse.up({ button });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/#furnish');
  await expect(canvas(page)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('3D orbit, pan, wheel, zoom buttons and reset change the view without changing furniture', async ({ page }, testInfo) => {
  await addCouch(page);
  const original = (await savedRoom(page)).furniture;
  await tool(page, 'Camera').click();
  const point = await centerPoint(page);
  const initial = await canvas(page).screenshot();
  await drag(page, point, 75, 15);
  expect((await canvas(page).screenshot()).equals(initial)).toBe(false);
  await page.getByRole('button', { name: 'Reset view' }).click();
  expect(await imageDifference(page, initial, await canvas(page).screenshot())).toBeLessThan(0.01);
  await drag(page, point, 50, 20, 'right');
  expect((await canvas(page).screenshot()).equals(initial)).toBe(false);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -200);
  await expect.poll(async () => (await canvas(page).screenshot()).equals(initial)).toBe(false);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  expect((await canvas(page).screenshot()).equals(initial)).toBe(false);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(await imageDifference(page, initial, await canvas(page).screenshot())).toBeLessThan(0.01);
  expect((await savedRoom(page)).furniture).toEqual(original);
  await page.screenshot({ path: testInfo.outputPath('room-controls.png'), fullPage: true });
});

test('3D furniture dragging changes position and rotation, with Shift snapping', async ({ page }) => {
  await addCouch(page);
  const before = (await savedRoom(page)).furniture[0];
  await drag(page, await centerPoint(page), 65, 15);
  const moved = (await savedRoom(page)).furniture[0];
  expect(Math.abs(moved.x - before.x) + Math.abs(moved.y - before.y)).toBeGreaterThan(1);
  // Return the piece to the center using the accessible position controls.
  await page.getByRole('slider', { name: /Horizontal/ }).fill(String(before.x));
  await page.getByRole('slider', { name: /Vertical/ }).fill(String(before.y));
  const centered = (await savedRoom(page)).furniture[0];
  await tool(page, 'Rotate').click();
  await page.keyboard.down('Shift');
  await drag(page, await centerPoint(page), 74, 0);
  await page.keyboard.up('Shift');
  const rotated = (await savedRoom(page)).furniture[0];
  expect(rotated.rotation).toBe(30);
  expect(rotated.x).toBe(centered.x);
  expect(rotated.y).toBe(centered.y);
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select Couch', exact: true })).toHaveCSS('transform', /matrix/);
  await expect(page.getByRole('slider', { name: /Rotation/ })).toHaveValue('30');
});

test('placement, independent selection, rotation, deletion and undo persist across reload', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Delete object', exact: true })).toBeDisabled();
  await addCouch(page);
  await page.getByRole('button', { name: 'Add couch to room' }).click();
  await page.getByRole('slider', { name: /Horizontal/ }).fill('65');
  await page.getByRole('button', { name: 'Rotate selected object right 45 degrees' }).click();
  let room = await savedRoom(page);
  expect(room.furniture).toHaveLength(2);
  expect(room.furniture[0].rotation).toBe(0);
  expect(room.furniture[1]).toMatchObject({ x: 65, rotation: 45 });
  await page.getByRole('button', { name: 'Delete object', exact: true }).first().click();
  expect((await savedRoom(page)).furniture).toEqual([room.furniture[0]]);
  await page.getByRole('button', { name: 'Undo delete' }).click();
  expect((await savedRoom(page)).furniture).toEqual(room.furniture);
  await page.reload();
  await page.getByRole('link', { name: 'My spaces', exact: true }).click();
  await page.getByRole('button', { name: 'Open My living room' }).click();
  await expect(page.getByRole('heading', { name: 'In your room · 2' })).toBeVisible();
  await page.locator('.placed-items button').nth(1).click();
  await expect(page.getByRole('slider', { name: /Rotation/ })).toHaveValue('45');
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue('65');
});

test('canceled 3D drag restores the transform and camera mode preserves selection', async ({ page }) => {
  await addCouch(page);
  const original = (await savedRoom(page)).furniture;

  const point = await centerPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 60, point.y + 20, { steps: 5 });
  // The application stops propagation on down, so the mouse's standard pointer ID is used.
  await canvas(page).dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
  expect((await savedRoom(page)).furniture).toEqual(original);
  await tool(page, 'Camera').click();
  const rect = await canvas(page).boundingBox();
  await page.mouse.click(rect.x + 20, rect.y + 20);
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toBeVisible();
});

// Allow tiny rasterization differences after a camera round trip.
async function imageDifference(page, first, second) {
  return page.evaluate(async sources => {
    const images = await Promise.all(sources.map(async source => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    }));
    let different = 0;
    for (let i = 0; i < images[0].length; i += 4) {
      if ([0, 1, 2].some(channel => Math.abs(images[0][i + channel] - images[1][i + channel]) > 10)) different++;
    }
    return different / (images[0].length / 4);
  }, [first, second].map(buffer => 'data:image/png;base64,' + buffer.toString('base64')));
}

test('all furniture types render and repeated edits keep the 3D view available', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/Too many active WebGL contexts/i.test(message.text())) errors.push(message.text());
  });
  for (const name of ['Bed', 'Couch', 'Table', 'Chair', 'Dresser', 'Bookshelf', 'Potted plant']) {
    await page.locator('#furniture-catalog').getByRole('button', { name: new RegExp('^' + name) }).click();
    await page.getByRole('button', { name: `+ Add ${name.toLowerCase()} to room`, exact: true }).click();
  }
  expect((await savedRoom(page)).furniture).toHaveLength(7);
  for (let i = 0; i < 20; i++) {
    await page.getByRole('button', { name: 'Rotate selected object right 45 degrees' }).click();
  }
  await expect(canvas(page)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const image = await canvas(page).screenshot();
  expect(image.length).toBeGreaterThan(5000);
  expect(errors).toEqual([]);
});

test('2D drag ignores a second pointer and restores the item if capture is lost', async ({ page }) => {
  await addCouch(page);
  const original = (await savedRoom(page)).furniture;
  await page.getByRole('button', { name: '2D', exact: true }).click();
  const item = page.getByRole('button', { name: 'Select Couch', exact: true });
  await item.scrollIntoViewIfNeeded();
  const rect = await item.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 30, rect.y + rect.height / 2 + 20, { steps: 5 });
  const moved = await page.getByRole('slider', { name: /Horizontal/ }).inputValue();
  await item.dispatchEvent('pointermove', { pointerId: 99, clientX: 0, clientY: 0 });
  await expect(page.getByRole('slider', { name: /Horizontal/ })).toHaveValue(moved);
  await item.evaluate(element => element.releasePointerCapture(1));
  await page.mouse.move(rect.x, rect.y);
  await page.mouse.up();
  expect((await savedRoom(page)).furniture).toEqual(original);
});
