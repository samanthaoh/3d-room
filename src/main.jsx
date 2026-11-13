import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './screens/Home';
import Upload from './screens/Upload';
import Editor from './screens/Editor';
import Library from './screens/Library';
import { createRoom, readSpaces, saveSpace, routes, steps } from './room/model';
import './styles.css';
const pages = ['home', 'library', ...routes];
function getPage() { const value = location.hash.slice(1); return pages.includes(value) ? value : 'home'; }
function App() {
  const [page, setPage] = useState(getPage); const [room, setRoom] = useState(createRoom); const [spaces, setSpaces] = useState(() => readSpaces(localStorage)); const [notice, setNotice] = useState('');
  useEffect(() => { const change = () => { setPage(getPage()); setNotice(''); window.scrollTo(0, 0); }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  function navigate(next) { location.hash = next; }
  function start() { setRoom(createRoom()); setNotice(''); navigate('upload'); }
  function update(patch) { setRoom(previous => ({ ...previous, ...patch })); setNotice(''); }
  function save() { try { setSpaces(saveSpace(localStorage, room)); setNotice('Saved to this browser.'); } catch { setNotice('Could not save. Browser storage may be unavailable or full. Download your room on the Share step.'); } }
  return <><header><a className="brand" href="#home"><span className="brand-mark">⌂</span>3d-room<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><a href="#home" aria-current={page === 'home' ? 'page' : undefined}>Home</a><a href="#library" aria-current={page === 'library' ? 'page' : undefined}>My spaces</a></nav><button onClick={start} className="header-create">Create a space <span>+</span></button></header><main>{routes.includes(page) && <nav className="steps" aria-label="Room design steps">{routes.map((route, index) => <a key={route} href={`#${route}`} aria-current={route === page ? 'step' : undefined} className={route === page ? 'current' : routes.indexOf(page) > index ? 'complete' : ''}><span>{routes.indexOf(page) > index ? '✓' : index + 1}</span>{steps[index]}</a>)}</nav>}{page === 'home' && <Home room={room} start={start} navigate={navigate}/ >}{page === 'upload' && <Upload room={room} update={update} navigate={navigate}/ >}{['walls', 'furnish', 'style', 'share'].includes(page) && <Editor key={page} step={page} room={room} update={update} navigate={navigate} save={save} notice={notice}/ >}{page === 'library' && <Library spaces={spaces} start={start} open={saved => { setRoom(saved); navigate('walls'); }}/ >}</main><footer><a className="brand" href="#home">3d-room.</a><span>A little space for big ideas.</span><small>Made for the way you live.</small></footer></>;
}
createRoot(document.getElementById('root')).render(<App/>);
