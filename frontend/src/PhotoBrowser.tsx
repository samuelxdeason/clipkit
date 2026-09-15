import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";
import DetailDialog from "./DetailDialog";

export default function PhotoBrowser({ person = "", query, onQuery, searchRef, media, version, onChanged, importOpen, onImportClose }: {
  person?: string; query: string; onQuery: (q: string) => void; searchRef: RefObject<HTMLInputElement>;
  media: (path: string) => string; version: number; onChanged: () => void; importOpen: boolean; onImportClose: () => void;
}) {
  const [photos, setPhotos] = useState<library.Photo[]>([]);
  const [album, setAlbum] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("newest");
  const [layout, setLayout] = useState(() => localStorage.clipkitPhotoLayout === "list" ? "list" : "grid");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [url, setUrl] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [activeID, setActiveID] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const filters = useRef<HTMLDetailsElement>(null);
  const section = useRef<HTMLElement>(null);
  useEffect(() => { section.current?.closest(".manager-main")?.scrollTo({top: 0}); }, [page]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (filters.current && !filters.current.contains(e.target as Node)) filters.current.open = false; };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    let live = true; setLoading(true); setError("");
    (async () => {
      let result: library.Photo[] = [];
      if (person) result = await api.PhotosByModel(person) || [];
      else for (let offset = 0; ; offset += 120) { const batch = await api.AllPhotos(120, offset) || []; if (!live) return; result.push(...batch); if (batch.length < 120) break; }
      if (live) { setPhotos(result); setAlbum(a => result.some(p => p.album === a) ? a : ""); }
    })().catch(e => { if (live) setError(String(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [person, version, retry]);
  const albums = useMemo(() => [...new Set(photos.map(p => p.album).filter(Boolean))].sort(), [photos]);
  const filtered = useMemo(() => photos.filter(p => (!album || p.album === album) && (view !== "recent" || Date.now() - Date.parse(p.added.replace(" ", "T")) < 30 * 86400000) && query.trim().toLowerCase().split(/\s+/).every(term => [p.filename,p.album,p.model].join(" ").toLowerCase().includes(term))).sort((a,b) => sort === "name" ? a.filename.localeCompare(b.filename) : sort === "oldest" ? a.added.localeCompare(b.added) : b.added.localeCompare(a.added)), [photos, album, view, query, sort]);
  useEffect(() => { setActiveID(null); setPage(0); }, [album, view, query, sort, person]);
  useEffect(() => { setPage(p => Math.min(p,Math.max(0,Math.ceil(filtered.length / 60) - 1))); }, [filtered.length]);
  const index = filtered.findIndex(p => p.id === activeID);
  const active = filtered[index];
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight" && index < filtered.length - 1) { e.preventDefault(); setActiveID(filtered[index + 1].id); } if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); setActiveID(filtered[index - 1].id); } };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [active, index, filtered]);
  const run = async (action: () => Promise<unknown>, message: string) => { setBusy(true); setError(""); try { await action(); onImportClose(); setNotice(message); onChanged(); } catch(e) { setError(String(e)); } finally { setBusy(false); } };
  const closeFilters = () => { if (filters.current) { filters.current.open = false; filters.current.querySelector("summary")?.focus(); } };
  const rows = filtered.slice(page * 60,(page + 1) * 60);
  const date = (s: string) => s && !Number.isNaN(Date.parse(s.replace(" ","T"))) ? new Date(s.replace(" ","T")).toLocaleDateString() : "—";
  return <section ref={section} className="photo-library">
    {!person && <nav className="utility-tabs video-library-tabs" aria-label="Photo views">{[["all","All photos"],["recent","Recently added"]].map(([id,label]) => <button key={id} className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</nav>}
    <section className="video-browser-controls photo-browser-controls" aria-label="Photo library controls">
      <div className="video-search-controls"><div className="video-search-line"><div className="manager-search"><Icon name="search" /><input ref={searchRef} aria-label="Search photos" placeholder="Search photos, people, or albums…" value={query} onChange={e => onQuery(e.target.value)} /><kbd>Ctrl K</kbd>{query && <button aria-label="Clear photo search" onClick={() => onQuery("")}><Icon name="x" /></button>}</div><details ref={filters} className="video-filter-popover" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); closeFilters(); } }}><summary><Icon name="menu" />Filters{album && <span>1</span>}</summary><div className="video-filter-menu"><div className="video-filter-menu-heading"><strong>Filter photos</strong><button className="clear-filters" disabled={!album} onClick={() => setAlbum("")}>Reset</button></div><label className="video-filter-field"><span>Album</span><select aria-label="Photo album" value={album} onChange={e => setAlbum(e.target.value)}><option value="">All albums</option>{albums.map(a => <option key={a}>{a}</option>)}</select></label><div className="video-filter-menu-footer"><span>Changes apply instantly</span><button className="m-button" onClick={closeFilters}>Done</button></div></div></details></div>{album && <div className="video-filter-chips"><button onClick={() => setAlbum("")} aria-label="Remove album filter">Album: {album}<Icon name="x" /></button></div>}</div>
      <div className="person-content-toolbar photo-actions"><span>{view === "recent" ? "Added in the last 30 days" : person ? "Photos for this person" : "Browse your photo library"}</span><div className="toolbar-right"><select aria-label="Sort photos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><div className="view-switch">{["list","grid"].map(mode => <button key={mode} aria-label={mode + " photo view"} aria-pressed={layout === mode} className={layout === mode ? "chosen" : ""} onClick={() => { setLayout(mode); localStorage.clipkitPhotoLayout = mode; }}><Icon name={mode === "list" ? "menu" : "grid"} /></button>)}</div></div></div>
      <div className="video-result-scope"><span>{filtered.length.toLocaleString()} photo{filtered.length === 1 ? "" : "s"}{query ? " matching your search" : ""}</span></div>
    </section>
    {error && !importOpen && <div className="manager-alert" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
    {notice && <div className="manager-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="x" /></button></div>}
    {loading ? <div className="manager-empty"><Icon name="photo" /><h2>Opening your photos…</h2></div> : rows.length ? layout === "grid" ? <div className="manager-grid photo-library-grid">{rows.map(p => <button key={p.id} onClick={() => setActiveID(p.id)} className="photo-tile" aria-label={"Open " + p.filename}><span className="photo-tile-frame"><img src={media(p.filepath)} alt="" loading="lazy" /></span><strong title={p.filename}>{p.filename}</strong><small>{p.album || p.model || "Photo"}</small></button>)}</div> : <div className="table-scroll"><table className="file-table photo-file-table"><thead><tr><th>Name</th><th>Album</th><th>Person</th><th>Date added</th></tr></thead><tbody>{rows.map(p => <tr key={p.id} tabIndex={0} onClick={() => setActiveID(p.id)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setActiveID(p.id); } }}><td><button className="file-name" onClick={e => { e.stopPropagation(); setActiveID(p.id); }}><span className="file-thumb"><img src={media(p.filepath)} alt="" loading="lazy" /></span><strong>{p.filename}</strong></button></td><td>{p.album || "—"}</td><td>{p.model || "—"}</td><td>{date(p.added)}</td></tr>)}</tbody></table></div> : <div className="manager-empty"><Icon name="photo" /><h2>{photos.length ? "No matching photos" : "A home for your photos"}</h2><p>{photos.length ? "Try another search, album, or view." : "Use Add photos to import from your device or a gallery link."}</p></div>}
    <footer className="manager-footer"><span>{filtered.length ? `${page * 60 + 1}–${Math.min((page + 1) * 60,filtered.length)} of ${filtered.length} photos` : "0 photos"}</span><span className="footer-hint">Open a photo to view it</span><div><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button><button disabled={(page + 1) * 60 >= filtered.length} onClick={() => setPage(p => p + 1)}>Next →</button></div></footer>
    {importOpen && <DetailDialog onClose={() => !busy && onImportClose()} label="Add photos" className="photo-import-dialog"><header><h2>Add photos</h2><button disabled={busy} onClick={onImportClose} aria-label="Close import"><Icon name="x" /></button></header><p>Import from your device or save a gallery from a link.</p><button className="m-button" disabled={busy} onClick={() => run(() => api.ImportPhotosDialog(person), "Photos submitted for import")}><Icon name="folder" />{busy ? "Importing…" : "Choose local photos"}</button><form onSubmit={e => { e.preventDefault(); run(() => api.ImportPhotosFromURL(url, person, albumName), "Gallery import started"); }}><label>Gallery URL<input type="url" required placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} /></label><label>Album name<input placeholder="Optional" value={albumName} onChange={e => setAlbumName(e.target.value)} /></label>{error && <p className="modal-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="m-button" disabled={busy} onClick={onImportClose}>Cancel</button><button className="m-button primary" disabled={busy || !url.trim()}>Import gallery</button></div></form></DetailDialog>}
    {active && <DetailDialog onClose={() => setActiveID(null)} label={active.filename} className="photo-viewer"><header><strong>{active.filename}</strong><button onClick={() => setActiveID(null)} aria-label="Close photo"><Icon name="x" /></button></header><img src={media(active.filepath)} alt={active.filename} /><footer><button className="m-button" disabled={index === 0} onClick={() => setActiveID(filtered[index - 1].id)}>← Previous</button><span>{index + 1} / {filtered.length} · {active.album || "Photos"}</span><button className="m-button" disabled={index === filtered.length - 1} onClick={() => setActiveID(filtered[index + 1].id)}>Next →</button></footer></DetailDialog>}
  </section>;
}
