import { getFurniture } from './furniture.js';
import { createFurnitureItem } from './schema.js';

export function canPlaceFurniture(room, type) {
  const asset = getFurniture(type);
  return Boolean(asset && asset.width <= room.width && asset.depth <= room.depth && asset.height <= room.height);
}

export function placeFurniture(room, type) {
  if (!canPlaceFurniture(room, type)) throw new Error('Furniture does not fit in this room.');
  const asset = getFurniture(type);
  return {
    ...createFurnitureItem(type),
    x: (room.width - asset.width) / room.width * 50,
    y: (room.depth - asset.depth) / room.depth * 50,
  };
}
