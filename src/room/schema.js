import { getFurniture } from './furniture.js';

export const ROOM_SCHEMA_VERSION = 1;
export const DEFAULT_WALL_HEIGHT = 2.7;

/**
 * @typedef {Object} FurnitureItem
 * @property {string} id Unique instance ID within a room (not the catalog ID).
 * @property {string} type Catalog key, e.g. 'sofa'.
 * @property {number} x Unrotated footprint's left edge, percent of room width.
 * @property {number} y Unrotated footprint's top edge, percent of room depth.
 * @property {number} rotation Clockwise degrees around the footprint center, [0, 360).
 */
/**
 * @typedef {Object} Room
 * @property {1} schemaVersion
 * @property {string} id Stable project ID.
 * @property {string} name Display name, at most 80 characters; may be empty.
 * @property {number} width Metres, [1, 30].
 * @property {number} depth Metres, [1, 30].
 * @property {number} height Metres, [1, 30].
 * @property {string} wallColor Six-digit hex color.
 * @property {string} floorColor Six-digit hex color.
 * @property {string} source Filename or 'Demo layout'; no file contents.
 * @property {FurnitureItem[]} furniture
 * @property {string} [updatedAt] UTC ISO timestamp, set when saved.
 */
const inRange = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const identifier = value => typeof value === 'string' && value.trim().length > 0;
const color = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export const normalizeRotation = degrees => ((degrees % 360) + 360) % 360;

export function isRoom(room) {
  if (!room || room.schemaVersion !== ROOM_SCHEMA_VERSION || !identifier(room.id) || typeof room.name !== 'string' || room.name.length > 80) return false;
  if (![room.width, room.depth, room.height].every(value => inRange(value, 1, 30))) return false;
  if (!color(room.wallColor) || !color(room.floorColor) || typeof room.source !== 'string' || !Array.isArray(room.furniture)) return false;
  if (room.updatedAt !== undefined && (typeof room.updatedAt !== 'string' || !Number.isFinite(Date.parse(room.updatedAt)) || new Date(room.updatedAt).toISOString() !== room.updatedAt)) return false;
  const ids = new Set();
  return room.furniture.every(item => {
    if (!item || !identifier(item.id) || ids.has(item.id) || !getFurniture(item.type)) return false;
    ids.add(item.id);
    return inRange(item.x, 0, 100) && inRange(item.y, 0, 100) && inRange(item.rotation, 0, 360) && item.rotation < 360;
  });
}

// Legacy projects used the same coordinates but omitted version and wall height.
export function normalizeRoom(value) {
  if (!value || typeof value !== 'object') return null;
  const room = value.schemaVersion === undefined
    ? { ...value, schemaVersion: ROOM_SCHEMA_VERSION, height: value.height ?? DEFAULT_WALL_HEIGHT }
    : { ...value };
  if (!isRoom(room)) return null;
  return { ...room, furniture: room.furniture.map(item => ({ ...item })) };
}

export function createFurnitureItem(type) {
  if (!getFurniture(type)) throw new Error(`Unknown furniture type: ${type}`);
  return { id: crypto.randomUUID(), type, x: 25, y: 30, rotation: 0 };
}

/** Convert the shared floor-plan coordinates to a centered, Y-up 3D scene. */
export function furnitureTransform(room, item) {
  const asset = getFurniture(item.type);
  if (!asset) throw new Error(`Unknown furniture type: ${item.type}`);
  return {
    x: room.width * (item.x / 100 - 0.5) + asset.width / 2,
    y: 0,
    z: room.depth * (item.y / 100 - 0.5) + asset.depth / 2,
    rotationY: -item.rotation * Math.PI / 180,
  };
}
