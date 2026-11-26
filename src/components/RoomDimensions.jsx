import { useState } from 'react';
import { parseDimensions, roomPresets } from '../room/dimensions.js';

export default function RoomDimensions({ room, update }) {
  const [draft, setDraft] = useState({ width: String(room.width), depth: String(room.depth), height: String(room.height) });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const dirty = ['width', 'depth', 'height'].some(key => Number(draft[key]) !== room[key] || draft[key].trim() === '');
  function apply(values) {
    const result = parseDimensions(values);
    setErrors(result.errors);
    if (!result.dimensions) { setMessage('Check the highlighted measurements. The room has not changed.'); return; }
    update(result.dimensions);
    setDraft(Object.fromEntries(Object.entries(result.dimensions).map(([key, value]) => [key, String(value)])));
    setMessage(`Room updated to ${result.dimensions.width} × ${result.dimensions.depth} metres.`);
  }
  return <>
    <h3>Start with a room size</h3>
    <div className="room-presets">{roomPresets.map(preset => <button type="button" className="secondary" key={preset.id} aria-pressed={!dirty && ['width', 'depth', 'height'].every(key => room[key] === preset[key])} onClick={() => apply(preset)}><strong>{preset.name}</strong><small>{preset.width} × {preset.depth} m</small></button>)}</div>
    <form className="dimension-form" noValidate onSubmit={event => { event.preventDefault(); apply(draft); }}>
      <h3>Or use your measurements</h3>
      <p className="dimension-hint" id="dimension-hint">Enter metres, from 1 to 30. Apply to update both views.</p>
      {[['width', 'Width'], ['depth', 'Length'], ['height', 'Wall height']].map(([key, label]) => <label key={key} htmlFor={`room-${key}`}>{label} (m)<input id={`room-${key}`} type="number" inputMode="decimal" min="1" max="30" step="any" value={draft[key]} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : 'dimension-hint'} onChange={event => { setDraft({ ...draft, [key]: event.target.value }); setErrors({ ...errors, [key]: undefined }); setMessage(''); }}/>{errors[key] && <span id={`error-${key}`} className="error">{errors[key]}</span>}</label>)}
      <button type="submit">Apply dimensions</button>
      {dirty && <small className="dimension-pending">Measurements have not been applied yet.</small>}
      <p role="status" className="dimension-message">{message}</p>
    </form>
    <div className="room-area"><span>Floor area</span><strong>{(room.width * room.depth).toFixed(2)} m²</strong></div>
    <p className="notice">Sizes are starting points, not measurements extracted from your upload. Furniture keeps its size and relative position; check the arrangement after resizing.</p>
  </>;
}
