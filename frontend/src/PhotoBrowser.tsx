import { SortMenu } from "./UIControls";
import { FilterMenu } from "./UIControls";
import ViewerHeader from "./ViewerHeader";
import { Button, ActionGroup, ThumbnailSizeControl, useThumbnailSize, MediaBrowseBar } from "./UIControls";
import { LibraryToolbar, LoadState, PageHeader } from "./WorkspaceUI";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";
import DetailDialog from "./DetailDialog";
import MediaOrganizeDialog from "./MediaOrganizeDialog";
import MediaTile from "./MediaTile";
import type { MediaDrag } from "./collectionDrag";

export default function PhotoBrowser({ person = "", query, onQuery, searchRef, media, version, onChanged, importOpen, onImportClose }: {
  person?: string; query: string; onQuery: (q: string) => void; searchRef: RefObject<HTMLInputElement>;
  media: (path: string) => string; version: number; onChanged: () => void; importOpen: boolean; onImportClose: () => void;
}) {
  const [photos, setPhotos] = useState<library.Photo[]>([]);
  const [album, setAlbum] = useState("");
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("newest");
  const [thumbnailSize, setThumbnailSize] = useThumbnailSize("photos");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [url, setUrl] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [activeID, setActiveID] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [organize, setOrganize] = useState<"assign" | "album" | null>(null);
  const selectionAnchor = useRef<string | null>(null);
  const filters = useRef<HTMLDetailsElement>(null);
  const section = useRef<HTMLElement>(null);
  useEffect(() => { section.current?.closest(".manager-main")?.scrollTo({top: 0}); }, [page]);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (filters.current && !filters.current.contains(e.target as Node)) filters.current.open = false; };
    document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    let live = true; setLoading(true); setLoadError("");
    (async () => {
      let result: library.Photo[] = [];
      if (person) result = await api.PhotosByModel(person) || [];
      else for (let offset = 0; ; offset += 120) { const batch = await api.AllPhotos(120, offset) || []; if (!live) return; result.push(...batch); if (batch.length < 120) break; }
      if (live) { setPhotos(result); setAlbum(a => result.some(p => p.album === a) ? a : ""); }
    })().catch(e => { if (live) setLoadError(String(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [person, version, retry]);
  const albums = useMemo(() => [...new Set(photos.map(p => p.album).filter(Boolean))].sort(), [photos]);
  const filtered = useMemo(() => photos.filter(p => (!album || p.album === album) && (view !== "recent" || Date.now() - Date.parse(p.added.replace(" ", "T")) < 30 * 86400000) && query.trim().toLowerCase().split(/\s+/).every(term => [p.filename,p.album,p.model].join(" ").toLowerCase().includes(term))).sort((a,b) => sort === "name" ? a.filename.localeCompare(b.filename) : sort === "oldest" ? a.added.localeCompare(b.added) : b.added.localeCompare(a.added)), [photos, album, view, query, sort]);
  useEffect(() => { setSelected(current => new Set([...current].filter(id => filtered.some(p => p.id === id)))); }, [filtered]);
  useEffect(() => { if (!selectMode) {  setSelected(new Set()); selectionAnchor.current = null; } }, [selectMode]);
  const toggle = (id: string, shift = false) => {
    if (busy) return;
    setSelectMode(true);
    const from = filtered.findIndex(p => p.id === selectionAnchor.current), to = filtered.findIndex(p => p.id === id);
    selectionAnchor.current = id;
    setSelected(current => { const next = new Set(current); if (shift && from >= 0 && to >= 0) filtered.slice(Math.min(from,to),Math.max(from,to)+1).forEach(p => next.add(p.id)); else next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const trashSelected = async () => {
    if (busy || !selected.size) return;
    const ids = [...selected];
    setBusy(true); setError("");
    try {
      await api.TrashMedia([], ids);
      setPhotos(current => current.filter(p => !ids.includes(p.id)));
      setActiveID(null); setSelected(new Set()); setSelectMode(false);
      setNotice(`${ids.length} photo${ids.length === 1 ? "" : "s"} moved to your vault’s Recycle bin folder.`);
      onChanged();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  };
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
  const dragPhoto = (id:string):MediaDrag => ({kind:"media",sourceId:0,videos:[],photos:selected.has(id)?filtered.filter(p=>selected.has(p.id)).map(p=>p.id):[id]});
  const date = (s: string) => s && !Number.isNaN(Date.parse(s.replace(" ","T"))) ? new Date(s.replace(" ","T")).toLocaleDateString() : "—";
  return <section ref={section} className="photo-library">
    {!person && <PageHeader title="Your photo library" description="Explore your photos, revisit a collection, and keep every moment easy to find." />}
    {!person && <nav className="utility-tabs video-library-tabs" aria-label="Photo views">{[["all","All photos"],["recent","Recently added"]].map(([id,label]) => <button key={id} className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</nav>}
    <LibraryToolbar className="video-browser-controls photo-browser-controls" label="Photo library controls">
      <div className="video-search-controls"><div className="video-search-line"><div className="manager-search"><Icon name="search" /><input ref={searchRef} aria-label="Search photos" placeholder="Search photos, people, or collections…" value={query} onChange={e => onQuery(e.target.value)} /><kbd>Ctrl K</kbd>{query && <button aria-label="Clear photo search" onClick={() => onQuery("")}><Icon name="x" /></button>}</div><details ref={filters} className="video-filter-popover" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); closeFilters(); } }}><summary><Icon name="menu" />Filters{album && <span>1</span>}</summary><div className="video-filter-menu"><div className="video-filter-menu-heading"><strong>Filter photos</strong><button className="clear-filters" disabled={!album} onClick={() => setAlbum("")}>Reset</button></div><label className="video-filter-field"><span>Collection</span><FilterMenu aria-label="Photo collection" value={album} onValueChange={value => setAlbum(value)}><option value="">All collections</option>{albums.map(a => <option key={a}>{a}</option>)}</FilterMenu></label><div className="video-filter-menu-footer"><span>Changes apply instantly</span><Button variant="neutral" onClick={closeFilters}>Done</Button></div></div></details></div>{album && <div className="video-filter-chips"><button onClick={() => setAlbum("")} aria-label="Remove collection filter">Collection: {album}<Icon name="x" /></button></div>}</div>
   <div className="video-result-scope"><span>{loading ? "Loading photos…" : loadError ? "Photos unavailable" : `${filtered.length.toLocaleString()} photo${filtered.length === 1 ? "" : "s"}`}{query ? " matching your search" : ""}</span></div>
    </LibraryToolbar>
    <MediaBrowseBar actions={<ActionGroup className="photo-selection-controls">
      <Button variant={selectMode ? "primary" : "neutral"} disabled={busy || loading || !filtered.length} aria-pressed={selectMode} aria-label={selectMode ? "Done managing photos" : "Manage photos"} onClick={() => { setSelectMode(mode => !mode); setSelected(new Set()); }}>{selectMode ? "Done" : "Manage"}</Button>
      {selectMode && <Button variant="neutral" disabled={busy} onClick={() => setSelected(new Set(selected.size === filtered.length ? [] : filtered.map(p => p.id)))}>{selected.size === filtered.length ? "Deselect all" : "Select all matching"}</Button>}
    </ActionGroup>}>{<ActionGroup className="toolbar-right"><SortMenu label="Sort photos" value={sort} onChange={setSort} options={[{"value":"newest","label":"Newest first"},{"value":"oldest","label":"Oldest first"},{"value":"name","label":"Name A–Z"}]}/>{<ThumbnailSizeControl value={thumbnailSize} onChange={setThumbnailSize} kind="photos" />}</ActionGroup>}</MediaBrowseBar>
    {!!selected.size && <div className="bulk-bar" role="toolbar" aria-label="Bulk photo actions">
      <strong aria-live="polite">{selected.size} selected</strong>
      <button disabled={busy} onClick={() => setOrganize("assign")}><Icon name="people" />Assign person</button>
      <button disabled={busy} onClick={() => setOrganize("album")}><Icon name="folder" />Add to collection</button>
      <button disabled={busy || !selected.size} onClick={trashSelected}>{busy ? "Moving…" : "Move to trash"}</button>
      <button disabled={busy} aria-label="Clear photo selection" onClick={() => setSelected(new Set())}><Icon name="x" /></button>
    </div>}
    {error && !importOpen && <div className="manager-alert" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
    {notice && <div className="manager-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="x" /></button></div>}
    {loading ? <LoadState title="Opening your photos…" busy /> : loadError ? <LoadState title="Couldn’t load your photos" message={loadError} onRetry={() => setRetry(n => n + 1)} /> : rows.length ? <div className="manager-grid photo-library-grid browse-media-grid" data-thumbnail-size={thumbnailSize} data-managing={selectMode}>{rows.map(p => <MediaTile dragData={dragPhoto(p.id)} key={p.id} title={p.filename} subtitle={p.model || p.album || "Photo"} thumbnail={media(p.filepath)} kind="photo" selected={selected.has(p.id)} selectionMode={selectMode} onSelect={shift => toggle(p.id,shift)} onOpen={() => setActiveID(p.id)} />)}</div> : <div className="manager-empty"><Icon name="photo" /><h2>{photos.length ? "No matching photos" : "A home for your photos"}</h2><p>{photos.length ? "Try another search, collection, or view." : "Use Add photos to import from your device or a gallery link."}</p></div>}
    {!loading && !loadError && <footer className="manager-footer"><span>{filtered.length ? `${page * 60 + 1}–${Math.min((page + 1) * 60,filtered.length)} of ${filtered.length} photos` : "0 photos"}</span><span className="footer-hint">Open a photo to view it</span><div><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button><button disabled={(page + 1) * 60 >= filtered.length} onClick={() => setPage(p => p + 1)}>Next →</button></div></footer>}
    {organize && <MediaOrganizeDialog kind={organize} photos={[...selected]} onClose={() => setOrganize(null)} onDone={() => { setOrganize(null); setSelected(new Set()); setSelectMode(false); setNotice("Photos updated."); onChanged(); }} />}
    {importOpen && <DetailDialog onClose={() => !busy && onImportClose()} label="Add photos" className="photo-import-dialog"><header><h2>Add photos</h2><button disabled={busy} onClick={onImportClose} aria-label="Close import"><Icon name="x" /></button></header><p>Import from your device or save a gallery from a link.</p><Button variant="neutral" disabled={busy} onClick={() => run(() => api.ImportPhotosDialog(person), "Photos submitted for import")}><Icon name="folder" />{busy ? "Importing…" : "Choose local photos"}</Button><form onSubmit={e => { e.preventDefault(); run(() => api.ImportPhotosFromURL(url, person, albumName), "Gallery import started"); }}><label>Gallery URL<input type="url" required placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} /></label><label>Collection name<input placeholder="Optional" value={albumName} onChange={e => setAlbumName(e.target.value)} /></label>{error && <p className="modal-error" role="alert">{error}</p>}<ActionGroup className="dialog-actions"><Button type="button" variant="neutral" disabled={busy} onClick={onImportClose}>Cancel</Button><Button type="submit" variant="primary" disabled={busy || !url.trim()}>Import gallery</Button></ActionGroup></form></DetailDialog>}
    {active && <DetailDialog onClose={() => setActiveID(null)} label={active.filename} className="photo-viewer"><ViewerHeader title={active.filename} closeLabel="Close photo" onClose={() => setActiveID(null)} /><img src={media(active.filepath)} alt={active.filename} /><footer><Button variant="neutral" disabled={index === 0} onClick={() => setActiveID(filtered[index - 1].id)}>← Previous</Button><span>{index + 1} / {filtered.length} · {active.album || "Photos"}</span><Button variant="neutral" disabled={index === filtered.length - 1} onClick={() => setActiveID(filtered[index + 1].id)}>Next →</Button></footer></DetailDialog>}
  </section>;
}
