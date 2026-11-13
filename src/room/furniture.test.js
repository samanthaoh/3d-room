import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { furnitureCatalog } from './furniture.js';
import { createFurnitureModel } from '../assets/furniture.js';
import { createRoom, saveSpace, readSpaces } from './model.js';

test('all seven models rest on the floor and match their catalog dimensions', () => {
  assert.equal(furnitureCatalog.length, 7);
  for (const asset of furnitureCatalog) {
    const model = createFurnitureModel(asset.type);
    const bounds = new Box3().setFromObject(model);
    assert.ok(Math.abs(bounds.min.y) < 0.0001, asset.type);
    for (const [axis, dimension] of [['x', 'width'], ['y', 'height'], ['z', 'depth']]) {
      assert.ok(Math.abs(bounds.max[axis] - bounds.min[axis] - asset[dimension]) < 0.0001, `${asset.type} ${dimension}`);
    }
    assert.notEqual(model, createFurnitureModel(asset.type));
  }
});

test('every catalog item survives save and reopen with its position and rotation', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const room = createRoom();
  room.furniture = furnitureCatalog.map(({ type }, i) => ({ id: String(i), type, x: 20, y: 35, rotation: 90 }));
  saveSpace(storage, room);
  assert.deepEqual(readSpaces(storage)[0].furniture, room.furniture);
});
