import { useState } from "react";
import type { Album } from "./api";
import { Icon } from "./App";

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
  const visible = allowed.filter(a => query ? albumTrail(albums,a.id).map(p => p.name).join(" / ").toLowerCase().includes(query.toLowerCase()) : a.parentId === folder);
  return <div className="album-picker">
    <input aria-label="Find a collection" placeholder="Find a collection…" value={query} onChange={e => setQuery(e.target.value)} />
    <nav aria-label="Collection picker path" className="album-picker-path"><button type="button" onClick={() => { setFolder(0); setQuery(""); }}>Collections</button>{albumTrail(albums,folder).map(a => <button type="button" key={a.id} onClick={() => { setFolder(a.id); setQuery(""); }}> / {a.name}</button>)}</nav>
    {allowRoot && <button type="button" className="m-button" aria-pressed={value === 0} onClick={() => onChange(0)}>Top level {value === 0 && "✓"}</button>}
    <div className="album-picker-list">{visible.map(a => <div key={a.id} className={value === a.id ? "chosen" : ""}>
      <button type="button" disabled={a.id===disabledId} aria-pressed={value === a.id} onClick={() => onChange(a.id)}><Icon name="folder" /><span>{a.name}<small>{query ? albumTrail(albums,a.id).map(p => p.name).join(" / ") : `${a.count} items · ${a.albumCount} subfolders`}</small></span>{value === a.id && "✓"}</button>
      {!!a.albumCount && <button type="button" aria-label={`Browse ${a.name}`} onClick={() => { setFolder(a.id); setQuery(""); }}>→</button>}
    </div>)}</div>
    {!visible.length && <p className="album-muted">{query ? "No matching collections." : "No subfolders here."}</p>}
    {value !== null && <p className="album-muted">Destination: {value === 0 ? "Collections" : albumTrail(albums,value).map(a => a.name).join(" / ")}</p>}
  </div>;
}
