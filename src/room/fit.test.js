import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFurnitureFit, furnitureFootprint } from './fit.js';
const item = (id, x = 0, y = 0, rotation = 0, type = 'chair') => ({ id, type, x, y, rotation });
const room = furniture => ({ width: 5, depth: 5, height: 2.7, furniture });

test('empty layouts, separate pieces, and exact wall or furniture contact do not warn', () => {
  for (const furniture of [[], [item('a')], [item('a'), item('b', 10)], [item('a', 90, 90)], [item('a', 0, 0), item('b', 80, 80)]]) {
    assert.deepEqual(checkFurnitureFit(room(furniture)), []);
  }
});

test('rotated corners detect wall crossings on every side', () => {
  for (const [x, y] of [[0, 40], [90, 40], [40, 0], [40, 90]]) {
    assert.deepEqual(checkFurnitureFit(room([item('a', x, y, 45)])), [{ type: 'boundary', itemIds: ['a'] }]);
  }
  assert.deepEqual(checkFurnitureFit(room([item('a', 90, 90, 360)])), []);
});

test('overlap finds containment and reports each pair exactly once', () => {
  assert.deepEqual(checkFurnitureFit(room([item('a', 20, 20), item('b', 20, 20), item('c', 20, 20)])), [
    { type: 'overlap', itemIds: ['a', 'b'] }, { type: 'overlap', itemIds: ['a', 'c'] }, { type: 'overlap', itemIds: ['b', 'c'] },
  ]);
  assert.deepEqual(checkFurnitureFit(room([item('bed', 10, 10, 0, 'bed'), item('chair', 15, 15)])), [{ type: 'overlap', itemIds: ['bed', 'chair'] }]);
});

test('rotated footprints avoid false overlap from axis-aligned bounding boxes', () => {
  assert.deepEqual(checkFurnitureFit(room([item('a', 20, 20, 45), item('b', 32, 32, 45)])), []);
  assert.deepEqual(checkFurnitureFit(room([item('a', 20, 20, 45), item('b', 24, 24, 45)])), [{ type: 'overlap', itemIds: ['a', 'b'] }]);
});

test('rotation uses the same center and clockwise direction as the room model', () => {
  const points = furnitureFootprint(room([]), item('a', 20, 20, 90, 'sofa'));
  assert.ok(Math.abs(points[0].x - 2.45) < 1e-9);
  assert.ok(Math.abs(points[0].y - 0.45) < 1e-9);
});

test('resizing checks existing furniture including ceiling height without changing placements', () => {
  const layout = room([item('a', 60, 60, 0, 'bookshelf')]);
  assert.deepEqual(checkFurnitureFit(layout), []);
  const smaller = { ...layout, width: 1, depth: 1, height: 1 };
  const snapshot = JSON.stringify(smaller);
  assert.deepEqual(checkFurnitureFit(smaller), [{ type: 'boundary', itemIds: ['a'] }, { type: 'height', itemIds: ['a'] }]);
  assert.equal(JSON.stringify(smaller), snapshot);
});
