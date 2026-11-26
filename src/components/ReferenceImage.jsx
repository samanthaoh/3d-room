import { useState } from 'react';

export default function ReferenceImage({ room, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const [failed, setFailed] = useState(false);
  if (!room.referenceImage) return null;
  return <section className="reference-panel" aria-label="Uploaded floor plan reference">
    <div className="reference-heading"><div><span className="eyebrow">YOUR FLOOR PLAN</span><p>{room.source}</p></div><button className="secondary" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'} reference</button></div>
    {expanded && <>{failed ? <p role="alert">The saved reference cannot be displayed. Replace it on the Upload step.</p> : <a href={room.referenceImage} download="floor-plan-reference" title="Download a copy of the floor plan reference"><img src={room.referenceImage} alt={`Uploaded floor plan: ${room.source}`} onError={() => setFailed(true)}/></a>}<div className="reference-footer"><small>Visual reference · measurements are not extracted automatically</small>{onRemove && <button className="text-button" onClick={onRemove}>Remove image</button>}</div></>}
  </section>;
}
