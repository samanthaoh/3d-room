import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, readSpaces, saveSpace } from './model.js';
import { createFurnitureItem, normalizeRoom, isRoom, furnitureTransform, normalizeRotation } from './schema.js';

test('legacy rooms gain version and height without moving furniture or mutating input', () => {
  const legacy = createRoom();
  delete legacy.schemaVersion;
  delete legacy.height;
  legacy.furniture = [{ id: 'sofa-1', type: 'sofa', x: 20, y: 25, rotation: 90 }];
  const migrated = normalizeRoom(legacy);
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.height, 2.7);
  assert.deepEqual(migrated.furniture, legacy.furniture);
  assert.equal(legacy.schemaVersion, undefined);
  assert.equal(legacy.height, undefined);
});

test('schema rejects invalid dimensions, item types, coordinates, duplicate IDs, and unknown versions', () => {
  const room = createRoom();
  const item = createFurnitureItem('bed');
  assert.equal(isRoom(room), true);
  for (const patch of [{ width: '5' }, { height: NaN }, { floorColor: 'red' }, { schemaVersion: 2 }, { updatedAt: 'yesterday' }]) {
    assert.equal(normalizeRoom({ ...room, ...patch }), null);
  }
  for (const patch of [{ type: 'unknown' }, { x: Infinity }, { y: -1 }, { rotation: 360 }, { rotation: '90' }]) {
    assert.equal(isRoom({ ...room, furniture: [{ ...item, ...patch }] }), false);
  }
  assert.equal(isRoom({ ...room, furniture: [item, { ...item }] }), false);
  assert.throws(() => createFurnitureItem('unknown'));
});

test('shared transform maps floor anchors to model centers and clockwise rotation to negative yaw', () => {
  const room = createRoom();
  const transform = furnitureTransform(room, { type: 'sofa', x: 20, y: 25, rotation: 90 });
  assert.equal(transform.x, -0.5);
  assert.equal(transform.y, 0);
  assert.equal(transform.z, -0.55);
  assert.equal(transform.rotationY, -Math.PI / 2);
  assert.equal(normalizeRotation(-45), 315);
  assert.equal(normalizeRotation(405), 45);
});

test('invalid saves leave stored projects unchanged and reads retain valid neighbors', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const room = createRoom();
  saveSpace(storage, room);
  const before = storage.getItem('3d-room.spaces');
  assert.throws(() => saveSpace(storage, { ...room, furniture: [null] }));
  assert.equal(storage.getItem('3d-room.spaces'), before);
  storage.setItem('3d-room.spaces', JSON.stringify([room, { ...room, schemaVersion: 999 }]));
  assert.equal(readSpaces(storage).length, 1);
});
