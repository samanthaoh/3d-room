import { getFurniture } from '../room/furniture.js';
import { normalizeRotation } from '../room/schema.js';
import RoomDimensions from '../components/RoomDimensions';
import ReferenceImage from '../components/ReferenceImage';
import FurniturePanel from '../components/FurniturePanel';
import FurnitureFit from '../components/FurnitureFit';
import { useState } from 'react';
import RoomPreview from '../components/RoomPreview';
import Room3D from '../components/Room3D';
import { routes } from '../room/model';
export default function Editor({ step, room, update, navigate, save, notice }) {
  const [deleted, setDeleted] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [tool, setTool] = useState('move');
  function transformItem(id, patch) { update({ furniture: room.furniture.map(item => item.id === id ? { ...item, ...patch } : item) }); }
  const [flat, setFlat] = useState(step === 'walls');
  const [selectedId, setSelectedId] = useState(null);
  const selected = room.furniture.find(item => item.id === selectedId);
  function rotateSelected(degrees) {
    if (!selected) return;
    transformItem(selected.id, { rotation: normalizeRotation(selected.rotation + degrees) });
  }
  function deleteSelected() {
    if (!selected) return;
    setDeleted({ item: selected, index: room.furniture.indexOf(selected) });
    update({ furniture: room.furniture.filter(item => item.id !== selected.id) });
    setSelectedId(null);
    setActionMessage(`${getFurniture(selected.type).name} deleted.`);
  }
  function undoDelete() {
    if (!deleted) return;
    const furniture = [...room.furniture];
    furniture.splice(Math.min(deleted.index, furniture.length), 0, deleted.item);
    update({ furniture });
    setSelectedId(deleted.item.id);
    setDeleted(null);
    setActionMessage('Object restored.');
  }
  function focusCatalog() {
    const catalog = document.getElementById('furniture-catalog');
    catalog?.scrollIntoView({ behavior: 'auto', block: 'center' });
    catalog?.querySelector('button')?.focus({ preventScroll: true });
  }
  const titles = { walls: ['Check your walls.', 'A solid foundation for your ideas. Adjust the sample dimensions to match your space.'], furnish: ['Find the right fit.', 'Add a few pieces and make the layout your own.'], style: ['Make it feel like you.', 'Try a fresh palette and bring your space together.'], share: ['Your next chapter, visualized.', 'Save your room and take your ideas with you.'] };
  function download() { const url = URL.createObjectURL(new Blob([JSON.stringify(room, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'my-room.json'; a.click(); URL.revokeObjectURL(url); }
  return <><div className="editor-navigation"><button className="text-button" onClick={() => navigate('library')}>← Back to My spaces</button><span>Your changes are kept when you save.</span></div><div className="editor-heading"><div><h1>{titles[step][0]}</h1><p>{titles[step][1]}</p><small className="editor-save-state">{room.updatedAt ? `Last saved ${new Date(room.updatedAt).toLocaleString()} · Save space to keep further edits` : 'Not saved yet · Save space to keep this room'}</small></div><div className="editor-primary-actions"><button onClick={save}>Save space</button><button className="secondary" onClick={() => { if (save()) navigate('library'); }}>Save & return to library</button></div></div><p className="editor-feedback" role="status">{notice}</p><ReferenceImage room={room}/><FurnitureFit room={room}/><div className="workspace"><section className="canvas-panel">{step === 'furnish' && <div className="manipulation-toolbar" role="group" aria-label="Room interaction tool"><button className="add-object-shortcut" onClick={focusCatalog}>+ Add object</button>{['move', 'rotate', 'camera'].map(mode => <button key={mode} className="secondary" aria-pressed={tool === mode} onClick={() => setTool(mode)}>{mode === 'move' ? '↔ Move' : mode === 'rotate' ? '↻ Rotate' : '◎ Camera'}</button>)}<small>{tool === 'move' ? 'Drag a piece to move it' : tool === 'rotate' ? 'Drag a piece left/right · Shift snaps to 15°' : 'Drag to orbit · Scroll to zoom'}</small></div>}{step === 'furnish' && <div className="selection-toolbar"><div className="selection-summary"><span className="eyebrow">SELECTED OBJECT</span><strong>{selected ? `${getFurniture(selected.type).name} · ${Math.round(selected.rotation)}°` : 'Choose an object in your room'}</strong></div><div className="selection-actions"><button className="secondary" disabled={!selected} aria-label="Rotate selected object left 45 degrees" onClick={() => rotateSelected(-45)}>↶ Rotate left</button><button className="secondary" disabled={!selected} aria-label="Rotate selected object right 45 degrees" onClick={() => rotateSelected(45)}>↷ Rotate right</button><button className="danger-button" disabled={!selected} onClick={deleteSelected}>Delete object</button></div><div className="object-feedback"><span role="status">{actionMessage}</span>{deleted && <button className="text-button" onClick={undoDelete}>Undo delete</button>}</div></div>}<div className="canvas-toolbar"><span>{room.name}</span><div className="view-toggle"><button className={flat ? 'active' : ''} onClick={() => setFlat(true)}>2D</button><button className={!flat ? 'active' : ''} onClick={() => setFlat(false)}>3D</button></div></div>{flat ? <RoomPreview room={room} flat selectedId={selectedId} tool={tool} onTransform={step === 'furnish' ? transformItem : undefined} onSelect={step === 'furnish' ? setSelectedId : undefined}/> : <Room3D room={room} selectedId={selectedId} tool={tool} onTransform={step === 'furnish' ? transformItem : undefined} onSelect={step === 'furnish' ? setSelectedId : undefined}/>}<div className="canvas-foot"><span>↔ {room.width} × {room.depth} m · {room.height} m high</span><span>{(room.width * room.depth).toFixed(1)} m²</span></div></section><aside className="panel controls"><span className="eyebrow">{step === 'walls' ? 'ROOM DETAILS' : step === 'furnish' ? 'MAKE YOURSELF AT HOME' : step === 'style' ? 'THE FINISHING TOUCHES' : 'READY FOR WHAT’S NEXT'}</span><label>Space name<input maxLength={80} value={room.name} onChange={event => update({ name: event.target.value })}/></label>{step === 'walls' && <RoomDimensions room={room} update={update}/>}{step === 'furnish' && <FurniturePanel room={room} update={update} selectedId={selectedId} select={setSelectedId} onDelete={deleteSelected}/>}{step === 'style' && <><h3>Set the mood</h3><label>Wall color<input type="color" value={room.wallColor} onChange={event => update({ wallColor: event.target.value })}/></label><label>Floor color<input type="color" value={room.floorColor} onChange={event => update({ floorColor: event.target.value })}/></label><p className="notice">Explore wall and floor colors in 3D. Drag the room to see it from another angle.</p></>}{step === 'share' && <><h3>A plan worth keeping.</h3><p>{room.furniture.length} pieces · {(room.width * room.depth).toFixed(1)} m² of possibility.</p><button onClick={save}>Save to my spaces</button><button className="secondary" onClick={download}>Download room JSON ↓</button><p className="notice">Download includes room settings and furniture. Public links and image exports are not connected yet.</p></>}</aside></div><div className="step-footer"><button className="secondary" onClick={() => navigate(routes[routes.indexOf(step) - 1])}>← Back</button>{step !== 'share' ? <button onClick={() => navigate(routes[routes.indexOf(step) + 1])}>Continue to {step === 'walls' ? 'furnish' : step === 'furnish' ? 'style' : 'share'} →</button> : <button onClick={() => navigate('library')}>View saved spaces →</button>}</div></>;
}
