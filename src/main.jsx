import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './screens/Home';
import Upload from './screens/Upload';
import Editor from './screens/Editor';
import Library from './screens/Library';
import { createRoom, readSpaces, saveSpace, loadSpace, SPACES_STORAGE_KEY, routes, steps } from './room/model';
import './styles.css';
import { createSampleRoom } from './room/sample.js';
const pages = ['home', 'library', ...routes];
function getPage() { const value = location.hash.slice(1); return pages.includes(value) ? value : 'home'; }
function browserSpaces() {
  try { return { spaces: readSpaces(window.localStorage, { strict: true }), error: '' }; } catch {
    return { spaces: [], error: 'Could not read your saved spaces. Browser storage may be unavailable or the saved data may be damaged. Existing data has not been changed.' };
  }
}
function App() {
  const [page, setPage] = useState(getPage); const [room, setRoom] = useState(createRoom); const [library, setLibrary] = useState(browserSpaces); const [notice, setNotice] = useState('');
  useEffect(() => { const change = () => { setPage(getPage()); setNotice(''); if (getPage() === 'library') setLibrary(browserSpaces()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  useEffect(() => {
    const refresh = event => { if (!event.key || event.key === SPACES_STORAGE_KEY) setLibrary(browserSpaces()); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  function openSpace(id) {
    try {
      const restored = loadSpace(window.localStorage, id);
      setRoom(restored);
      setNotice('');
      navigate('furnish');
    } catch {
      setLibrary(browserSpaces());
      setNotice('Could not open this saved space. It may have been removed or browser storage may be unavailable.');
    }
  }
  function navigate(next) { location.hash = next; }
  function start() { setRoom(createRoom()); setNotice(''); navigate('upload'); }
  function openSample() { setRoom(createSampleRoom()); setNotice(''); navigate('furnish'); }
  function update(patch) { setRoom(previous => ({ ...previous, ...patch })); setNotice(''); }
  function save() {
    try {
      const saved = saveSpace(window.localStorage, room);
      setLibrary({ spaces: saved, error: '' });
      setRoom(previous => ({ ...previous, updatedAt: saved[0].updatedAt }));
      setNotice(`“${room.name || 'Untitled space'}” saved. Reopen it from My spaces.`);
      return true;
    } catch {
      setNotice('Could not save. Browser storage may be full, unavailable, or unreadable. Your current edits are still here; download the room on the Share step.');
      return false;
    }
  }
  return <><header><a className="brand" href="#home"><span className="brand-mark">⌂</span>3d-room<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><a href="#home" aria-current={page === 'home' ? 'page' : undefined}>Home</a><a href="#library" aria-current={page === 'library' ? 'page' : undefined}>My spaces</a></nav><button onClick={start} className="header-create">Create a space <span>+</span></button></header><main>{routes.includes(page) && <nav className="steps" aria-label="Room design steps">{routes.map((route, index) => <a key={route} href={`#${route}`} aria-current={route === page ? 'step' : undefined} className={route === page ? 'current' : routes.indexOf(page) > index ? 'complete' : ''}><span>{routes.indexOf(page) > index ? '✓' : index + 1}</span>{steps[index]}</a>)}</nav>}{page === 'home' && <Home room={room} start={start} openSample={openSample} navigate={navigate}/ >}{page === 'upload' && <Upload key={room.id} room={room} update={update} navigate={navigate}/ >}{['walls', 'furnish', 'style', 'share'].includes(page) && <Editor key={`${room.id}-${page}`} step={page} room={room} update={update} navigate={navigate} save={save} notice={notice}/ >}{page === 'library' && <Library spaces={library.spaces} storageError={library.error} start={start} notice={notice} open={saved => openSpace(saved.id)}/ >}</main><footer><a className="brand" href="#home">3d-room.</a><span>A little space for big ideas.</span><small>Made for the way you live.</small></footer></>;
}
createRoot(document.getElementById('root')).render(<App/>);
