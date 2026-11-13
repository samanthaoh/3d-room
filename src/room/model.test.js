import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, validDimension, validateUpload, readSpaces, saveSpace } from './model.js';
const storage = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };
test('dimensions reject empty, out-of-range, and non-finite measurements', () => {
  for (const value of ['', 0, -2, 31, Infinity, 'abc']) assert.equal(validDimension(value), false);
  for (const value of [1, 4.5, 30]) assert.equal(validDimension(value), true);
});
test('uploads accept floor plans and reject unsupported or oversized files', () => {
  for (const type of ['image/jpeg', 'image/png', 'application/pdf']) assert.equal(validateUpload({ type, size: 100 }), '');
  assert.ok(validateUpload({ type: 'image/gif', size: 100 }));
  assert.ok(validateUpload({ type: 'image/png', size: 11 * 1024 * 1024 }));
  assert.ok(validateUpload(null));
});
test('saving and reopening retains dimensions, styling, and furniture without duplicate spaces', () => {
  const store = storage(); const room = createRoom();
  room.furniture.push({ id: 'chair', type: 'sofa', x: 20, y: 30, rotation: 90 });
  saveSpace(store, room); saveSpace(store, { ...room, width: 7, wallColor: '#abcdef' });
  const saved = readSpaces(store); assert.equal(saved.length, 1); assert.equal(saved[0].width, 7); assert.equal(saved[0].wallColor, '#abcdef'); assert.deepEqual(saved[0].furniture, room.furniture);
});
test('invalid saved data does not break the library', () => {
  const store = storage(); store.setItem('3d-room.spaces', '{bad'); assert.deepEqual(readSpaces(store), []);
  store.setItem('3d-room.spaces', '[null, {"id":"bad"}]'); assert.deepEqual(readSpaces(store), []);
});
