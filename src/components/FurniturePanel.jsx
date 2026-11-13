import { canPlaceFurniture, placeFurniture } from '../room/placement.js';
import { useState } from 'react';
import { furnitureCatalog, getFurniture } from '../room/furniture.js';
import { normalizeRotation } from '../room/schema.js';

export default function FurniturePanel({ room, update, selectedId, select }) {
  const [type, setType] = useState('sofa');
  const [message, setMessage] = useState('');
  const asset = getFurniture(type);
  const selected = room.furniture.find(item => item.id === selectedId);
  const fits = canPlaceFurniture(room, type);
  function add() {
    if (!fits) return;
    const item = placeFurniture(room, type);
    update({ furniture: [...room.furniture, item] });
    select(item.id);
    setMessage(`${asset.name} added. Use the position controls to arrange it.`);
  }
  function change(patch) {
    update({ furniture: room.furniture.map(item => item.id === selectedId ? { ...item, ...patch } : item) });
  }
  return <>
    <h3>Choose furniture</h3>
    <div className="catalog">{furnitureCatalog.map(item => <button className="secondary" key={item.type} aria-pressed={type === item.type} onClick={() => { setType(item.type); setMessage(''); }}><span aria-hidden="true">{item.symbol}</span><strong>{item.name}</strong><small>{item.width} × {item.depth} m</small></button>)}</div>
    <button disabled={!fits} onClick={add}>+ Add {asset.name.toLowerCase()} to room</button>
    {!fits && <p className="notice">This piece is too large for the room. Choose a smaller piece or adjust the room dimensions.</p>}
    <p className="placement-status" role="status">{message || 'New pieces start in the center. Move them apart using the controls below.'}</p>
    <h3>In your room · {room.furniture.length}</h3>
    {room.furniture.length === 0 ? <p>Choose a piece above to get started.</p> : <div className="placed-items">{room.furniture.map((item, index) => <button className="secondary" key={item.id} aria-pressed={selectedId === item.id} onClick={() => select(item.id)}>{getFurniture(item.type)?.name} {index + 1}<span>{selectedId === item.id ? 'Selected' : 'Select'}</span></button>)}</div>}
    {selected && <fieldset className="selected-controls"><legend>{getFurniture(selected.type).name} · Selected</legend>
      <label>Horizontal · {Math.round(selected.x)}%<input type="range" min="0" max="100" step="0.1" value={selected.x} onChange={event => change({ x: Number(event.target.value) })}/></label>
      <label>Vertical · {Math.round(selected.y)}%<input type="range" min="0" max="100" step="0.1" value={selected.y} onChange={event => change({ y: Number(event.target.value) })}/></label>
      <div className="actions"><button className="text-button" onClick={() => change({ rotation: normalizeRotation(selected.rotation + 45) })}>Rotate ↻ {selected.rotation}°</button><button className="text-button" onClick={() => { update({ furniture: room.furniture.filter(item => item.id !== selectedId) }); select(null); setMessage('Furniture removed.'); }}>Remove</button></div>
      <p className="notice">Pieces can overlap or extend beyond walls. Check your arrangement in both views.</p>
    </fieldset>}
  </>;
}
