import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSampleRoom } from './sample.js';
import { isRoom } from './schema.js';
import { checkFurnitureFit } from './fit.js';
import { saveSpace, loadSpace } from './model.js';

test('demo room is valid, furnished and free of footprint or height warnings', () => {
  const room = createSampleRoom();
  assert.equal(isRoom(room), true);
  assert.equal(room.furniture.length, 8);
  assert.deepEqual(checkFurnitureFit(room), []);
  assert.equal(room.width * room.depth, 30);
});

test('opening the demo creates independent rooms and furniture without changing the fixture', () => {
  const first = createSampleRoom();
  const second = createSampleRoom();
  assert.notEqual(first.id, second.id);
  assert.equal(new Set([...first.furniture, ...second.furniture].map(item => item.id)).size, 16);
  first.furniture[0].x = 99;
  assert.notEqual(first.furniture[0].x, second.furniture[0].x);
  assert.equal(createSampleRoom().furniture[0].x, second.furniture[0].x);
});

test('the complete sample survives saving and reopening with exact transforms', () => {
  let data;
  const storage = { getItem: () => data, setItem: (_, value) => { data = value; } };
  const room = createSampleRoom();
  const saved = saveSpace(storage, room)[0];
  assert.deepEqual(loadSpace(storage, room.id), saved);
  assert.deepEqual(loadSpace(storage, room.id).furniture, room.furniture);
});
