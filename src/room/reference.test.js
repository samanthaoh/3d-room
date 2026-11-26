import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReferenceImage, MAX_REFERENCE_LENGTH } from './reference.js';
import { createRoom, saveSpace, readSpaces } from './model.js';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMuoAAAAASUVORK5CYII=';

test('reference validation accepts local image data and rejects URLs, PDF, and oversized content', () => {
  assert.equal(isReferenceImage(png), true);
  assert.equal(isReferenceImage(null), true);
  for (const value of ['https://example.com/image.png', 'data:application/pdf;base64,AAAA', 'data:image/svg+xml;base64,AAAA', {}, 'data:image/png;base64,' + 'A'.repeat(MAX_REFERENCE_LENGTH)]) assert.equal(isReferenceImage(value), false);
});
test('saved room references survive reload and can be replaced or removed', () => {
  let data;
  const storage = { getItem: () => data, setItem: (_, value) => { data = value; } };
  const room = { ...createRoom(), source: 'plan.png', referenceImage: png };
  saveSpace(storage, room);
  assert.equal(readSpaces(storage)[0].referenceImage, png);
  saveSpace(storage, { ...room, referenceImage: null, source: 'plan.pdf' });
  assert.equal(readSpaces(storage)[0].referenceImage, null);
  assert.equal(readSpaces(storage)[0].source, 'plan.pdf');
  assert.equal(readSpaces(storage).length, 1);
});
