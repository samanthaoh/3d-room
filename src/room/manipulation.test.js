import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveFurniture, rotateFurniture } from './manipulation.js';
import { createRoom, saveSpace, readSpaces } from './model.js';
import { createFurnitureItem, furnitureTransform } from './schema.js';

test('movement preserves the grab offset and clamps to the shared coordinate range', () => {
  const item = { x: 25, y: 30, rotation: 45 };
  assert.deepEqual(moveFurniture(item, 10, -5), { x: 35, y: 25 });
  assert.deepEqual(moveFurniture(item, -100, 100), { x: 0, y: 100 });
  assert.deepEqual(item, { x: 25, y: 30, rotation: 45 });
});
test('rotation supports both directions, wrapping, and 15-degree snapping', () => {
  assert.equal(rotateFurniture({ rotation: 350 }, 40).rotation, 10);
  assert.equal(rotateFurniture({ rotation: 10 }, -40).rotation, 350);
  assert.equal(rotateFurniture({ rotation: 0 }, 47, true).rotation, 30);
  assert.equal(rotateFurniture({ rotation: 0 }, -47, true).rotation, 330);
});
test('a moved and rotated item retains its transform after saving and reopening', () => {
  const room = createRoom();
  const item = createFurnitureItem('chair');
  room.furniture = [{ ...item, ...moveFurniture(item, 10, 15), ...rotateFurniture(item, 180) }];
  let saved;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  saveSpace(storage, room);
  const reopened = readSpaces(storage)[0];
  assert.deepEqual(furnitureTransform(reopened, reopened.furniture[0]), furnitureTransform(room, room.furniture[0]));
});
