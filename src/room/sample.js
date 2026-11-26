import sampleRoom from '../assets/sample-room.json' with { type: 'json' };

// Each opening is an independent draft; the reference fixture stays reproducible.
export function createSampleRoom() {
  return {
    ...sampleRoom,
    id: crypto.randomUUID(),
    furniture: sampleRoom.furniture.map(item => ({ ...item, id: crypto.randomUUID() })),
  };
}
