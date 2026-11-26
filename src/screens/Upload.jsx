import { useEffect, useRef, useState } from 'react';
import { prepareReferenceImage } from '../room/reference.js';
import ReferenceImage from '../components/ReferenceImage';
import { validateUpload } from '../room/model';
export default function Upload({ room, update, navigate }) {
  const [mode, setMode] = useState('plan'); const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
  function removeAttachment() {
    request.current += 1;
    setProcessing(false);
    setError('');
    update({ referenceImage: null, source: 'Demo layout' });
  }
  async function choose(files) {
    if (!files?.length) return;
    const file = files[0];
    const current = ++request.current;
    const message = files.length > 1 ? 'Choose one floor plan at a time.' : validateUpload(file);
    setError(message);
    setProcessing(false);
    if (message) return;
    if (file.type === 'application/pdf') {
      update({ source: file.name, referenceImage: null });
      return;
    }
    setProcessing(true);
    try {
      const referenceImage = await prepareReferenceImage(file);
      if (current === request.current) update({ source: file.name, referenceImage });
    } catch (error) {
      if (current === request.current) setError(error.message || 'Could not read the image. Try another file.');
    } finally {
      if (current === request.current) setProcessing(false);
    }
  }
  return <><div className="page-heading"><span className="eyebrow">LET’S START WITH THE BASICS</span><h1>Add your space.</h1><p>Every great room begins with a plan.</p></div><div className="upload-layout"><section className="panel"><div className="tabs"><button className={mode === 'plan' ? 'active' : ''} onClick={() => setMode('plan')}>Floor plan</button><button className={mode === 'scan' ? 'active' : ''} onClick={() => setMode('scan')}>Phone scan</button></div>{mode === 'plan' ? <><label className="dropzone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files); }}><span className="upload-icon">↥</span><strong>Drop your floor plan here</strong><span>or click to browse files</span><small id="upload-help">JPG, PNG, or PDF · up to 10 MB · one file</small><input type="file" aria-label="Choose a floor plan" aria-describedby="upload-help upload-feedback" aria-invalid={Boolean(error)} accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={event => { choose(event.target.files); event.target.value = ''; }}/></label><p className="file-name" role="status">{room.source !== 'Demo layout' ? `Attached: ${room.source}` : 'No floor plan attached yet.'}</p><div id="upload-feedback">{error && <p role="alert" className="error">{error}</p>}</div>{processing && <p role="status">Preparing your image reference…</p>}<ReferenceImage key={room.referenceImage} room={room} onRemove={removeAttachment}/>{room.source !== 'Demo layout' && !room.referenceImage && <button className="secondary" onClick={removeAttachment}>Remove attachment</button>}<p className="notice">{room.referenceImage ? 'Your image stays visible as a reference in the editor and is included when you save this space. The layout starts as an editable sample.' : room.source !== 'Demo layout' ? 'This attachment has no image preview. For PDF plans, export a page as JPG or PNG and upload it to see a reference in the editor.' : 'Upload a JPG or PNG to use as a visual reference, or continue with a sample room.'} Automatic reconstruction is not connected.</p><button disabled={processing} onClick={() => navigate('walls')}>Continue to check walls →</button></> : <div className="scan-state"><span className="upload-icon">⌗</span><h2>A new way to capture your room.</h2><p>Phone scanning is planned for a future release. Explore the journey using an editable sample room.</p><button onClick={() => navigate('walls')}>Explore sample room →</button></div>}</section><aside className="upload-aside"><span className="eyebrow">A GOOD START</span><h2>A clear plan.<br/>A clearer picture.</h2><p>Choose a floor plan with visible walls, doorways, and dimensions.</p><ul><li>Use a clear, straight-on image</li><li>Include the full room outline</li><li>Check measurements in the next step</li></ul><small>Your work can be saved in this browser.</small></aside></div></>;
}
