import { ROOM_SCHEMA_VERSION, DEFAULT_WALL_HEIGHT, normalizeRoom } from './schema.js';
export const steps = ['Upload', 'Check walls', 'Furnish', 'Style', 'Share'];
export const routes = ['upload', 'walls', 'furnish', 'style', 'share'];
export const createRoom = () => ({ schemaVersion: ROOM_SCHEMA_VERSION, height: DEFAULT_WALL_HEIGHT, id: crypto.randomUUID(), name: 'My living room', width: 5, depth: 4, wallColor: '#e5e9dc', floorColor: '#d4b48c', furniture: [], source: 'Demo layout' });
export function validateUpload(file) {
  if (!file) return 'Choose a floor plan first.';
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) return 'Choose a JPG, PNG, or PDF floor plan.';
  if (file.size > 10 * 1024 * 1024) return 'Your file must be smaller than 10 MB.';
  return '';
}
export function validDimension(value) { return Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 30; }
export function readSpaces(storage) {
  try { const data = JSON.parse(storage.getItem('3d-room.spaces') || '[]'); return Array.isArray(data) ? data.map(normalizeRoom).filter(Boolean) : []; } catch { return []; }
}
export function saveSpace(storage, room) {
  const validated = normalizeRoom(room);
  if (!validated) throw new Error('Room data does not match schema version 1.');
  const saved = { ...validated, updatedAt: new Date().toISOString() };
  const spaces = [saved, ...readSpaces(storage).filter(item => item.id !== room.id)];
  storage.setItem('3d-room.spaces', JSON.stringify(spaces));
  return spaces;
}
