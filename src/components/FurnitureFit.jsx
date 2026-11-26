import { useMemo } from 'react';
import { checkFurnitureFit } from '../room/fit.js';
import { getFurniture } from '../room/furniture.js';

export default function FurnitureFit({ room }) {
  const warnings = useMemo(() => checkFurnitureFit(room), [room.width, room.depth, room.height, room.furniture]);
  if (!room.furniture.length) return null;
  const labels = new Map(room.furniture.map((item, index) => [item.id, `${getFurniture(item.type).name} ${index + 1}`]));
  return <section className={`fit-feedback ${warnings.length ? 'has-warnings' : ''}`} aria-label="Furniture fit checks" aria-live="polite" aria-atomic="true">
    <h2>{warnings.length ? 'Check furniture fit' : 'Furniture fits within the room'}</h2>
    {warnings.length ? <ul>{warnings.map(warning => <li key={`${warning.type}-${warning.itemIds.join('-')}`}>
      {warning.type === 'overlap' ? `${labels.get(warning.itemIds[0])} overlaps ${labels.get(warning.itemIds[1])}.` : `${labels.get(warning.itemIds[0])} ${warning.type === 'height' ? 'is taller than the room.' : 'extends beyond the room boundary.'}`}
    </li>)}</ul> : <p>No boundary or overlap issues found.</p>}
    <small>Approximate checks use rotated rectangular footprints, including for rounded pieces. Warnings do not block editing or saving. Allow extra space for walking and opening doors.</small>
  </section>;
}
