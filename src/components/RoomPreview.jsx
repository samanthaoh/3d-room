import { getFurniture } from '../room/furniture.js';
export default function RoomPreview({ room, flat = false }) {
  return <div className={`room-stage ${flat ? 'flat' : ''}`} aria-label={`${room.width} by ${room.depth} metre room preview`} role="img">
    <div className="room-scene" style={{ '--wall': room.wallColor, '--floor': room.floorColor, aspectRatio: `${room.width} / ${room.depth}` }}>
      <div className="wall wall-back"/><div className="wall wall-side"/><div className="room-floor"/>
      <div className="window"><i/><i/></div>
      {room.furniture.map((item) => { const asset = getFurniture(item.type); return asset ? <div key={item.id} className={`furniture ${item.type}`} style={{ width: `${asset.width / room.width * 100}%`, height: `${asset.depth / room.depth * 100}%`, backgroundColor: asset.color, left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotation}deg)` }}><span>{asset.symbol}</span><small>{asset.name}</small></div> : null; })}
      <span className="dimension dimension-width">{room.width} m</span><span className="dimension dimension-depth">{room.depth} m</span>
    </div><span className="preview-caption">{flat ? '2D · Layout preview' : 'Illustrative room preview'}</span>
  </div>;
}
