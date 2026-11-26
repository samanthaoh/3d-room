import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDimensions, roomPresets } from './dimensions.js';
import { createRoom, readSpaces, saveSpace } from './model.js';
import { isRoom, furnitureTransform } from './schema.js';

test('every room preset produces valid shared room data', () => {
  for (const preset of roomPresets) {
    const result = parseDimensions(preset);
    assert.deepEqual(result.errors, {});
    assert.ok(isRoom({ ...createRoom(), ...result.dimensions }));
  }
});
test('custom dimensions accept decimals and reject empty, nonfinite, and out-of-range entries atomically', () => {
  assert.deepEqual(parseDimensions({ width: '4.25', depth: '6.5', height: '2.7' }).dimensions, { width: 4.25, depth: 6.5, height: 2.7 });
  for (const value of ['', ' ', 'abc', 'Infinity', 0, -1, 30.01, null, true]) {
    const result = parseDimensions({ width: value, depth: 4, height: 2.7 });
    assert.equal(result.dimensions, null);
    assert.ok(result.errors.width);
  }
});
test('resizing persists dimensions while retaining furniture, finishes, and source', () => {
  const room = createRoom();
  room.furniture = [{ id: 'sofa-1', type: 'sofa', x: 20, y: 25, rotation: 90 }];
  const resized = { ...room, ...parseDimensions({ width: '7', depth: '5', height: '3' }).dimensions };
  let stored;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  saveSpace(storage, resized);
  const loaded = readSpaces(storage)[0];
  assert.equal(loaded.width, 7);
  assert.equal(loaded.depth, 5);
  assert.equal(loaded.height, 3);
  assert.deepEqual(loaded.furniture, room.furniture);
  assert.equal(loaded.wallColor, room.wallColor);
  assert.equal(loaded.source, room.source);
  assert.notEqual(furnitureTransform(loaded, loaded.furniture[0]).x, furnitureTransform(room, room.furniture[0]).x);
});
