import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom } from './model.js';
import { furnitureCatalog } from './furniture.js';
import { furnitureTransform, isRoom } from './schema.js';
import { canPlaceFurniture, placeFurniture } from './placement.js';

test('each catalog piece starts centered, has a unique instance ID, and matches the shared schema', () => {
  const room = createRoom();
  for (const { type } of furnitureCatalog) {
    const item = placeFurniture(room, type);
    const transform = furnitureTransform(room, item);
    assert.ok(Math.abs(transform.x) < 1e-10);
    assert.ok(Math.abs(transform.z) < 1e-10);
    assert.equal(item.rotation, 0);
    assert.notEqual(item.id, placeFurniture(room, type).id);
    assert.ok(isRoom({ ...room, furniture: [item] }));
  }
  assert.deepEqual(room.furniture, []);
});

test('placement rejects unknown and oversized pieces including height', () => {
  const room = { ...createRoom(), width: 1, depth: 1, height: 1 };
  assert.equal(canPlaceFurniture(room, 'chair'), true);
  for (const type of ['bed', 'bookshelf', 'unknown']) {
    assert.equal(canPlaceFurniture(room, type), false);
    assert.throws(() => placeFurniture(room, type));
  }
});
