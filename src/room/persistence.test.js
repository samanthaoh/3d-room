import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, saveSpace, loadSpace, readSpaces, SPACES_STORAGE_KEY } from './model.js';
const store = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };

test('saved project restores all dimensions and furniture, independently of unsaved edits', () => {
  const storage = store();
  const room = { ...createRoom(), name: 'Bedroom', width: 4.25, depth: 6, height: 3, wallColor: '#abcdef', furniture: [{ id: 'bed-1', type: 'bed', x: 12.5, y: 35.25, rotation: 135 }] };
  const saved = saveSpace(storage, room)[0];
  room.furniture[0].x = 90;
  const reopened = loadSpace(storage, saved.id);
  assert.deepEqual(reopened, saved);
  reopened.furniture[0].rotation = 270;
  assert.equal(loadSpace(storage, saved.id).furniture[0].rotation, 135);
  saveSpace(storage, reopened);
  assert.equal(readSpaces(storage).length, 1);
  assert.equal(loadSpace(storage, saved.id).furniture[0].rotation, 270);
});

test('saving one room preserves other rooms and reopening reads the latest saved version', () => {
  const storage = store();
  const first = createRoom(); const second = createRoom();
  saveSpace(storage, first); saveSpace(storage, second);
  saveSpace(storage, { ...first, width: 8 });
  assert.equal(readSpaces(storage).length, 2);
  assert.equal(loadSpace(storage, first.id).width, 8);
  assert.equal(loadSpace(storage, second.id).width, second.width);
  assert.throws(() => loadSpace(storage, 'missing'));
});

test('failed or unreadable storage does not overwrite existing saved data', () => {
  const storage = store();
  storage.setItem(SPACES_STORAGE_KEY, '{broken');
  assert.throws(() => saveSpace(storage, createRoom()));
  assert.equal(storage.getItem(SPACES_STORAGE_KEY), '{broken');
  assert.throws(() => loadSpace(storage, 'any'));
  const denied = { getItem: () => { throw new Error('Denied'); }, setItem: () => assert.fail('must not write') };
  assert.deepEqual(readSpaces(denied), []);
  assert.throws(() => saveSpace(denied, createRoom()));
  const full = { getItem: () => '[]', setItem: () => { throw new Error('Quota exceeded'); } };
  assert.throws(() => saveSpace(full, createRoom()));
});

test('saving retains unsupported records for future recovery', () => {
  const storage = store();
  const future = { id: 'future', schemaVersion: 99 };
  storage.setItem(SPACES_STORAGE_KEY, JSON.stringify([future]));
  saveSpace(storage, createRoom());
  assert.deepEqual(JSON.parse(storage.getItem(SPACES_STORAGE_KEY))[1], future);
});

test('strict library reads distinguish unreadable storage from an empty library', () => {
  const storage = store();
  assert.deepEqual(readSpaces(storage, { strict: true }), []);
  for (const raw of ['{broken', '{}', 'null']) {
    storage.setItem(SPACES_STORAGE_KEY, raw);
    assert.throws(() => readSpaces(storage, { strict: true }));
    assert.deepEqual(readSpaces(storage), []);
    assert.equal(storage.getItem(SPACES_STORAGE_KEY), raw);
  }
});
