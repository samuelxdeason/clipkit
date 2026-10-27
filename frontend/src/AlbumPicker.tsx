import { Chevron } from "./UIControls";
import { useState } from "react";
import type { Album } from "./api";
import { Icon } from "./Icons";

export function albumTrail(albums: Album[], id: number): Album[] {
  const result: Album[] = [], seen = new Set<number>();
  let current = albums.find(a => a.id === id);
  while (current && !seen.has(current.id)) {
    result.unshift(current); seen.add(current.id);
    current = albums.find(a => a.id === current!.parentId);
  }
  return result;
}

export default function AlbumPicker({ albums, value, onChange, exclude = 0, disabledId = 0, allowRoot = false }: {
  albums: Album[]; value: number | null; onChange: (id: number) => void; exclude?: number; disabledId?: number; allowRoot?: boolean;
}) {
  const [folder, setFolder] = useState(0);
  const [query, setQuery] = useState("");
  const allowed = albums.filter(a => !a.locked && !a.inheritedLocked && !albumTrail(albums, a.id).some(p => p.id === exclude));
  const visible = allowed.filter(a => query ? albumTrail(albums,a.id).map(p => p.name).join(" / ").toLowerCase().includes(query.toLowerCase()) : a.parentId === folder).sort((a,b)=>a.name.localeCompare(b.name));
  const destination = value === 0 ? "Collections (top level)" : albumTrail(albums,value ?? 0).map(a=>a.name).join(" / ");
  return <div className="album-picker">
    <div className="destination-search"><Icon name="search"/><input aria-label="Find a collection" placeholder="Find a collection or folder…" value={query} onChange={e => setQuery(e.target.value)} />{query&&<button type="button" aria-label="Clear destination search" onClick={()=>setQuery("")}>×</button>}</div><p className="destination-hint">Choose a destination. Use the arrow to browse folders inside it.</p>
    <nav aria-label="Collection picker path" className="album-picker-path"><button type="button" onClick={() => { setFolder(0); setQuery(""); }}>Collections</button>{albumTrail(albums,folder).map(a => <button type="button" key={a.id} onClick={() => { setFolder(a.id); setQuery(""); }}> / {a.name}</button>)}</nav>
    {allowRoot && <button type="button" className="m-button" aria-pressed={value === 0} onClick={() => onChange(0)}>Top level {value === 0 && "✓"}</button>}
    <div className="album-picker-list">{visible.map(a => <div key={a.id} className={value === a.id ? "chosen" : ""}>
      <button type="button" disabled={a.id===disabledId} aria-pressed={value === a.id} onClick={() => onChange(a.id)}><Icon name="folder" /><span><strong>{a.name}</strong><small>{query ? albumTrail(albums,a.id).map(p => p.name).join(" / ") : a.id===disabledId ? "Current folder" : `${a.count} items · ${a.albumCount} folders`}</small></span><span className="destination-choice" aria-hidden="true">{value === a.id ? "✓" : ""}</span></button>
      {!!a.albumCount && <button type="button" aria-label={`Browse ${a.name}`} onClick={() => { setFolder(a.id); setQuery(""); }}><Chevron/></button>}
    </div>)}</div>
    {!visible.length && <p className="album-muted">{query ? "No matching collections." : "No subfolders here."}</p>}
    <div className="destination-summary" role="status"><span>Destination</span><strong>{value === null ? "Choose a collection or folder" : destination}</strong></div>
  </div>;
}
