import { useState } from 'react';
import RoomPreview from '../components/RoomPreview';

function savedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Saved project' : `Saved ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function Library({ spaces, start, open }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const projects = spaces.filter(room => (room.name || 'Untitled space').toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === 'name'
    ? (a.name || 'Untitled space').localeCompare(b.name || 'Untitled space')
    : (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));

  return <section className="library-page" aria-labelledby="library-title">
    <div className="library-heading">
      <div><span className="eyebrow">YOUR PERSONAL DESIGN STUDIO</span><h1 id="library-title">Your saved spaces<span>.</span></h1><p>Ideas worth coming back to. Pick a room and make it a little more you.</p></div>
      <button onClick={start}>+ Create a space</button>
    </div>
    <div className="library-storage"><span aria-hidden="true">⌂</span><div><strong>A home for your ideas</strong><p>Your projects are saved in this browser, ready whenever inspiration returns.</p></div><span className="local-badge">Saved locally</span></div>
    <div className="library-toolbar">
      <h2>All spaces <span>{spaces.length}</span></h2>
      <div className="library-filters">
        <label className="library-search"><span className="sr-only">Search saved spaces</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Find a space…" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <label className="library-sort"><span className="sr-only">Sort saved spaces</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently saved</option><option value="name">Name: A–Z</option></select></label>
      </div>
    </div>
    {spaces.length === 0 ? <div className="library-empty">
      <div className="empty-room-icon" aria-hidden="true">⌂</div><span className="eyebrow">A BLANK CANVAS, A FRESH START</span><h2>Make space for your first idea.</h2><p>Start with a floor plan or a sample room.<br/>Save your design and it will be waiting right here.</p><button onClick={start}>Create your first space ↗</button>
      <div className="empty-journey"><span>01 &nbsp; Plan your room</span><span>02 &nbsp; Make it yours</span><span>03 &nbsp; Save for later</span></div>
    </div> : projects.length === 0 ? <div className="library-no-results" role="status"><h2>No spaces found.</h2><p>Try a different room name to find your project.</p><button className="secondary" onClick={() => setQuery('')}>Clear search</button></div> : <div className="library-grid">
      {projects.map(room => <article className="project-card" key={room.id}>
        <div className="project-preview"><RoomPreview room={room}/><span className="project-badge">Room project</span></div>
        <div className="project-details"><h2>{room.name || 'Untitled space'}</h2><p>{room.width} × {room.depth} m <span>·</span> {room.furniture.length} {room.furniture.length === 1 ? 'piece' : 'pieces'}</p><div className="project-card-footer"><small>{savedDate(room.updatedAt)}</small><button className="text-button" onClick={() => open(room)} aria-label={`Open ${room.name || 'Untitled space'}`}>Open space ↗</button></div></div>
      </article>)}
      {!query.trim() && <button className="new-space-card" onClick={start}><span aria-hidden="true">+</span><strong>A new possibility</strong><small>Create another space</small></button>}
    </div>}
    {spaces.length > 0 && <p className="library-count" role="status">Showing {projects.length} of {spaces.length} saved {spaces.length === 1 ? 'space' : 'spaces'}</p>}
  </section>;
}
