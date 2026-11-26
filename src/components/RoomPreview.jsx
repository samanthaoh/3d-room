import { useRef } from 'react';
import { moveFurniture, rotateFurniture } from '../room/manipulation.js';
import { getFurniture } from '../room/furniture.js';
export default function RoomPreview({ room, flat = false, selectedId, onSelect, tool = 'move', onTransform }) {
  const drag = useRef(null);
  function begin(event, item) {
    if (!flat || !onTransform || tool === 'camera' || event.button !== 0 || drag.current) return;
    event.preventDefault();
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    drag.current = { item, x: event.clientX, y: event.clientY, rect, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect?.(item.id);
  }
  function move(event) {
    const start = drag.current;
    if (!start || event.pointerId !== start.pointerId) return;
    const patch = tool === 'rotate' ? rotateFurniture(start.item, event.clientX - start.x, event.shiftKey) : moveFurniture(start.item, (event.clientX - start.x) / start.rect.width * 100, (event.clientY - start.y) / start.rect.height * 100);
    onTransform(start.item.id, patch);
  }
  function end(event, cancel = false) {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    if (cancel && drag.current) onTransform(drag.current.item.id, { x: drag.current.item.x, y: drag.current.item.y, rotation: drag.current.item.rotation });
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div className={`room-stage ${flat ? 'flat' : ''}`} aria-label={`${room.width} by ${room.depth} metre room preview`} role={onSelect ? "group" : "img"}>
    <div className="room-scene" style={{ '--wall': room.wallColor, '--floor': room.floorColor, aspectRatio: `${room.width} / ${room.depth}` }}>
      <div className="wall wall-back"/><div className="wall wall-side"/><div className="room-floor"/>
      <div className="window"><i/><i/></div>
      {room.furniture.map((item) => { const asset = getFurniture(item.type); return asset ? <div key={item.id} className={`furniture ${item.type} ${selectedId === item.id ? 'is-selected' : ''}`} onPointerDown={event => begin(event, item)} onPointerMove={move} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onLostPointerCapture={event => end(event, true)} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`Select ${asset.name}`} aria-pressed={onSelect ? selectedId === item.id : undefined} onClick={() => onSelect?.(item.id)} onKeyDown={event => { if (onSelect && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect(item.id); } }} style={{ width: `${asset.width / room.width * 100}%`, height: `${asset.depth / room.depth * 100}%`, backgroundColor: asset.color, left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg)` }}><span>{asset.symbol}</span><small>{asset.name}</small></div> : null; })}
      <span className="dimension dimension-width">{room.width} m</span><span className="dimension dimension-depth">{room.depth} m</span>
    </div><span className="preview-caption">{flat ? '2D · Layout preview' : 'Illustrative room preview'}</span>
  </div>;
}
