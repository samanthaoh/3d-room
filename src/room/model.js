import { ROOM_SCHEMA_VERSION, DEFAULT_WALL_HEIGHT, normalizeRoom } from './schema.js';
export const steps = ['Upload', 'Check walls', 'Furnish', 'Style', 'Share'];
export const routes = ['upload', 'walls', 'furnish', 'style', 'share'];
export const createRoom = () => ({ schemaVersion: ROOM_SCHEMA_VERSION, height: DEFAULT_WALL_HEIGHT, id: crypto.randomUUID(), name: 'My living room', width: 5, depth: 4, wallColor: '#e5e9dc', floorColor: '#d4b48c', furniture: [], source: 'Demo layout' });
export function validateUpload(file) {
  if (!file) return 'Choose a floor plan first.';
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) return 'Choose a JPG, PNG, or PDF floor plan.';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'This file is empty or unreadable. Choose another floor plan.';
  if (file.size > 10 * 1024 * 1024) return 'Your file must be 10 MB or smaller.';
  return '';
}
export function validDimension(value) { return Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 30; }
export const SPACES_STORAGE_KEY = '3d-room.spaces';

function readStoredRecords(storage) {
  const raw = storage.getItem(SPACES_STORAGE_KEY);
  if (raw === null || raw === undefined) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error('Saved spaces could not be read.');
  return records;
}

export function readSpaces(storage, { strict = false } = {}) {
  try { return readStoredRecords(storage).map(normalizeRoom).filter(Boolean); } catch (error) {
    if (strict) throw error;
    return [];
  }
}

export function loadSpace(storage, id) {
  const room = readStoredRecords(storage).map(normalizeRoom).find(room => room?.id === id);
  if (!room) throw new Error('This saved space is no longer available.');
  return room;
}

export function saveSpace(storage, room) {
  const validated = normalizeRoom(room);
  if (!validated) throw new Error('Room data does not match schema version 1.');
  const saved = { ...validated, updatedAt: new Date().toISOString() };
  // Read strictly before writing: a broken/unreadable library must not be erased.
  // Retain unsupported records so saving a valid room does not discard them.
  const records = [saved, ...readStoredRecords(storage).filter(item => item?.id !== room.id)];
  storage.setItem(SPACES_STORAGE_KEY, JSON.stringify(records));
  return records.map(normalizeRoom).filter(Boolean);
}
