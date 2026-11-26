import { getFurniture } from './furniture.js';

// Ignore numerical noise and edge contact; all coordinates are in metres.
const EPSILON = 1e-7;

export function furnitureFootprint(room, item) {
  const asset = getFurniture(item.type);
  const angle = item.rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = room.width * item.x / 100 + asset.width / 2;
  const cy = room.depth * item.y / 100 + asset.depth / 2;
  return [
    [-asset.width / 2, -asset.depth / 2],
    [asset.width / 2, -asset.depth / 2],
    [asset.width / 2, asset.depth / 2],
    [-asset.width / 2, asset.depth / 2],
  ].map(([x, y]) => ({ x: cx + x * cos - y * sin, y: cy + x * sin + y * cos }));
}

// Separating-axis test for rotated rectangular footprints, including containment.
function overlaps(first, second) {
  for (const polygon of [first, second]) {
    for (let i = 0; i < 2; i++) {
      const dx = polygon[i + 1].x - polygon[i].x;
      const dy = polygon[i + 1].y - polygon[i].y;
      const length = Math.hypot(dx, dy);
      const axis = { x: -dy / length, y: dx / length };
      const project = points => points.map(point => point.x * axis.x + point.y * axis.y);
      const a = project(first);
      const b = project(second);
      if (Math.min(Math.max(...a), Math.max(...b)) - Math.max(Math.min(...a), Math.min(...b)) <= EPSILON) return false;
    }
  }
  return true;
}

export function checkFurnitureFit(room) {
  const footprints = room.furniture.map(item => furnitureFootprint(room, item));
  const warnings = [];
  room.furniture.forEach((item, index) => {
    if (footprints[index].some(point => point.x < -EPSILON || point.y < -EPSILON || point.x > room.width + EPSILON || point.y > room.depth + EPSILON)) {
      warnings.push({ type: 'boundary', itemIds: [item.id] });
    }
    if (getFurniture(item.type).height > room.height + EPSILON) {
      warnings.push({ type: 'height', itemIds: [item.id] });
    }
    for (let other = index + 1; other < room.furniture.length; other++) {
      if (overlaps(footprints[index], footprints[other])) {
        warnings.push({ type: 'overlap', itemIds: [item.id, room.furniture[other].id] });
      }
    }
  });
  return warnings;
}
