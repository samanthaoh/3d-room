import { normalizeRotation } from './schema.js';
const clamp = value => Math.max(0, Math.min(100, value));
export function moveFurniture(item, dx, dy) {
  return { x: clamp(item.x + dx), y: clamp(item.y + dy) };
}
export function rotateFurniture(item, horizontalPixels, snap = false) {
  const degrees = item.rotation + horizontalPixels * 0.5;
  return { rotation: normalizeRotation(snap ? Math.round(degrees / 15) * 15 : degrees) };
}
