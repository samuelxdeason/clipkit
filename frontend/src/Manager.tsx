import PersonAvatar from "./PersonAvatar";
import OrganizePicker from "./OrganizePicker";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { library, downloader } from "../wailsjs/go/models";
import LegacyApp, { Icon } from "./App";
import "./manager.css";
import VideoPlayer from "./VideoPlayer";
import VideoCard from "./VideoCard";
import { PhotoLibrary, PersonAccounts } from "./PhotoLibrary";
import { PersonHeader, SmartView, addedGroup } from "./LibraryViews";
import type { OrganizeMode } from "./LibraryViews";
import { LibrarySettings, LibraryDownloads } from "./LibraryUtilities";

type Video = library.Video;
type View = "photos" | "profile" | "all" | "recent" | "unorganized" | "favorites" | "people" | "tags" | "collections" | "downloads" | "settings";
const key = (v: Video) => JSON.stringify([v.site, v.id]);
const duration = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const size = (n = 0) => n ? n >= 1073741824 ? `${(n / 1073741824).toFixed(1)} GB` : `${Math.round(n / 1048576)} MB` : "—";
const date = (s: string) => s ? new Date(s.replace(" ", "T")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const split = (s: string) => [...new Set(s.split(",").map(x => x.trim()).filter(Boolean))];
const titles: Record<View, string> = { photos: "Photos", profile: "Person", all: "All videos", recent: "Recently added", unorganized: "Needs organizing", favorites: "Favorites", people: "People", tags: "Tags", collections: "Collections", downloads: "Downloads", settings: "Settings" };

export default function Manager() {
  const [legacyTools, setLegacyTools] = useState(false);
  const [settingsSection, setSettingsSection] = useState("general");
  const [view, setView] = useState<View>("all");
  const [profile, setProfile] = useState<library.Model | null>(null);
  const [organizeMode, setOrganizeMode] = useState<OrganizeMode>("all");
  const [recentDays, setRecentDays] = useState(30);
  const [profileTab, setProfileTab] = useState("all");
  const [videos, setVideos] = useState<Video[]>([]);
  const [collections, setCollections] = useState<library.Collection[]>([]);
  const [people, setPeople] = useState<library.Model[]>([]);
  const [queue, setQueue] = useState<downloader.Job[]>([]);
  const [collection, setCollection] = useState<library.Collection | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [person, setPerson] = useState("");
  const [tag, setTag] = useState("");
  const [length, setLength] = useState("");
  const [quality, setQuality] = useState("");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState(true);
  const [layout, setLayout] = useState(() => localStorage.troveLayout === "list" ? "list" : "grid");
  const [selectionMode, setSelectionMode] = useState(false);
  useEffect(() => { setSelectionMode(false); }, [layout, view, collection?.id, profile?.name, profileTab]);
  const selectionAnchor = useRef<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [base, setBase] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<"collection" | "person" | "tag" | "assign" | "add" | "import" | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [editTarget, setEditTarget] = useState<Video | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [playbackQueue, setPlaybackQueue] = useState<Video[]>([]);
  const [watchDetails, setWatchDetails] = useState(false);
  const loadedScope = useRef<string | null>(null);
  const [nav, setNav] = useState(false);
  const [gate, setGate] = useState<library.Collection | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [view, collection?.id, page]);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    api.MediaBase().then(setBase).catch(e => setError(String(e)));
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setFilters(true); requestAnimationFrame(() => searchRef.current?.focus()); }
      if (e.key === "Escape") { if (document.querySelector(".manager-modal")) { setModal(null); setGate(null); } }
    };
    window.addEventListener("keydown", handle);
    const off = api.EventsOn("queue", (jobs: downloader.Job[]) => { setQueue(jobs || []); reload(); });
    const offAvatar = api.EventsOn("avatar", () => reload());
    const offImport = api.EventsOn("import", (s: { finished?: boolean; done?: number; total?: number }) => { setNotice(s.finished ? "Import complete" : `Importing ${s.done || 0} of ${s.total || 0} files…`); if (s.finished) reload(); });
    const offProgress = api.EventsOn("progress", (job: downloader.Job) => setQueue(jobs => jobs.map(j => j.id === job.id ? job : j)));
    return () => { window.removeEventListener("keydown", handle); off(); offAvatar(); offImport(); offProgress(); };
  }, [reload]);
  useEffect(() => {
    if (!modal && !gate) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".manager-modal");
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') || []);
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    if (!dialog?.contains(document.activeElement)) focusable()[0]?.focus();
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); previous?.focus(); };
  }, [modal, gate]);
  useEffect(() => {
    let cancelled = false;
    const scope = String(collection?.id || "library");
    if (loadedScope.current !== scope) { setLoading(true); setError(""); }
    (async () => {
      const [cs, ps, jobs] = await Promise.all([api.Collections(), api.Models(), api.Queue()]);
      let rows: Video[] = [];
      if (collection) rows = await api.VideosByCollection(collection.id) || [];
      else {
        // Fetch every page, so filtering and search cover the entire accessible catalogue.
        for (let offset = 0; ; offset += 500) {
          const batch = await api.AllVideos(500, offset, "newest", "", false) || [];
          if (cancelled) return;
          rows.push(...batch);
          if (batch.length < 500) break;
        }
      }
      if (!cancelled) { loadedScope.current = scope; setCollections(cs || []); setPeople(ps || []); setQueue(jobs || []); setVideos(rows); }
    })().catch(e => { if (!cancelled) setError(String(e)); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version, collection?.id]);
  const tags = useMemo(() => [...new Set(videos.flatMap(v => v.labels || []))].sort(), [videos]);
  const sources = useMemo(() => [...new Set(videos.map(v => v.site))].sort(), [videos]);
  const filtered = useMemo(() => {
    const terms = (q.toLowerCase().match(/"[^"]+"|\S+/g) || []).map(t => t.replace(/^"|"$/g, ""));
    return videos.filter(v => {
      const haystack = [v.title, v.filename, v.filepath, v.site, v.uploader, ...(v.people || []), ...people.filter(p => v.people?.includes(p.name)).map(p => p.nickname), ...(v.labels || []), ...(v.tags || [])].join(" ").toLowerCase();
      return (view !== "profile" || !!profile && (v.people || []).includes(profile.name)) && (view !== "profile" || profileTab !== "favorites" || v.favorite) && terms.every(t => haystack.includes(t)) && (!source || v.site === source) && (!person || (v.people || []).includes(person)) && (!tag || (v.labels || []).includes(tag))
        && (!length || (length === "short" ? (v.duration || 0) < 300 : length === "medium" ? (v.duration || 0) >= 300 && (v.duration || 0) < 1200 : (v.duration || 0) >= 1200))
        && (!quality || (v.height || 0) >= Number(quality))
        && (view !== "favorites" || v.favorite) && (view !== "unorganized" || (organizeMode === "people" ? !v.people?.length : organizeMode === "tags" ? !v.labels?.length : !(v.labels?.length && v.people?.length)))
        && (view !== "recent" || Date.now() - new Date(v.added.replace(" ", "T")).getTime() < recentDays * 86400000);
    }).sort((a, b) => sort === "title" ? (a.title || a.filename).localeCompare(b.title || b.filename) : sort === "largest" ? (b.filesize || 0) - (a.filesize || 0) : sort === "longest" ? (b.duration || 0) - (a.duration || 0) : sort === "oldest" ? a.added.localeCompare(b.added) : b.added.localeCompare(a.added));
  }, [videos, people, q, source, person, tag, length, quality, sort, view, profile, profileTab, organizeMode, recentDays]);
  useEffect(() => { setPage(0); selectionAnchor.current = null; setSelected(new Set()); }, [q, source, person, tag, length, quality, sort, view, collection?.id, profile?.name, profileTab, organizeMode, recentDays]);
  useEffect(() => { setPage(p => Math.min(p, Math.max(0, Math.ceil(filtered.length / 50) - 1))); }, [filtered.length]);
  useEffect(() => { const visible = new Set(filtered.map(key)); setSelected(old => { const next = new Set([...old].filter(id => visible.has(id))); return next.size === old.size ? old : next; }); }, [filtered]);
  const rows = filtered.slice(page * 50, (page + 1) * 50);
  const picked = videos.filter(v => selected.has(key(v)));
  const play = (v: Video, details = false) => { setPlaybackQueue(filtered); setWatchDetails(details); setPlaying(v); };
  const currentVideo = playing ? videos.find(v => key(v) === key(playing)) || playing : null;
  const playingIndex = playing ? playbackQueue.findIndex(v => key(v) === key(playing)) : -1;
  const media = (path: string) => `${base}/media?p=${encodeURIComponent(path)}`;
  const go = (next: View) => { setNotice(""); setError(""); setSettingsSection("general"); setView(next); setProfile(null); setProfileTab("all"); setOrganizeMode("all"); setLayout(next === "recent" || next === "unorganized" ? "list" : next === "favorites" || next === "profile" ? "grid" : localStorage.troveLayout === "list" ? "list" : "grid"); setSort("newest"); setFilters(next === "all"); setCollection(null); setQ(""); setSource(""); setPerson(""); setTag(""); setLength(""); setQuality(""); setNav(false); };
  const openCollection = (c: library.Collection) => { if (c.locked) { setGate(c); return; } go("all"); setCollection(c); };
  const openModal = (m: typeof modal, target?: Video) => { setEditTarget(target || null); setValue(""); setModal(m); if (m === "tag") api.AllLabels().then(t => setSuggestedTags(t || [])).catch(e => setError(String(e))); };
  const toggle = (v: Video, shift = false) => { const anchor = selectionAnchor.current; selectionAnchor.current = key(v); setSelected(old => { const n = new Set(old); const from = filtered.findIndex(v => key(v) === anchor), to = filtered.findIndex(x => key(x) === key(v)); if (shift && from >= 0 && to >= 0) filtered.slice(Math.min(from, to), Math.max(from, to) + 1).forEach(v => n.add(key(v))); else n.has(key(v)) ? n.delete(key(v)) : n.add(key(v)); return n; }); };
  const execute = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true); setError("");
    try { await action(); setNotice(message); setModal(null); reload(); }
    catch (e) { setError(String(e)); reload(); }
    finally { setBusy(false); }
  };
  const submit = () => execute(async () => {
    if (modal === "collection") await api.CreateCollection(value.trim(), false);
    if (modal === "person") await api.CreatePerson(value.trim());
    if (modal === "import") await api.Enqueue(value.trim());
    const targets = editTarget ? [videos.find(v => key(v) === key(editTarget)) || editTarget] : picked;
    // Sequential writes let partial failures be retried safely (all operations are idempotent).
    let completed = 0;
    for (const v of targets) {
      setNotice(`Updating ${completed + 1} of ${targets.length} videos…`);
      try {
      if (modal === "tag") await api.SetLabels(v.site, v.id, [...new Set([...(v.labels || []), ...split(value)])]);
      if (modal === "assign") await api.SetModels(v.site, v.id, [...new Set([...(v.models || []), value])]);
      if (modal === "add") await api.AddToCollection(Number(value), v.site, v.id);
      completed++;
      } catch (e) { throw new Error(`${completed} of ${targets.length} videos updated. Retry to finish the remaining updates. ${String(e)}`); }
    }
  }, modal === "import" ? "Download added to queue" : "Changes saved");
  const videoLibrary = !collection && ["all", "recent", "favorites", "unorganized"].includes(view);
  const fileView = !["photos", "people", "tags", "collections", "downloads", "settings"].includes(view) && !(view === "profile" && ["photos", "accounts"].includes(profileTab));
  const crumbs: { label: string; onClick?: () => void }[] = collection
    ? [{ label: "Collections", onClick: () => go("collections") }, { label: collection.name }]
    : view === "profile" && profile
      ? [{ label: "People", onClick: () => go("people") }, { label: people.find(p => p.name === profile.name)?.nickname || profile.nickname || profile.name, onClick: () => { setProfileTab("all"); setQ(""); } }, { label: ({ all: "Videos", favorites: "Favorites", photos: "Photos", accounts: "Accounts" } as Record<string, string>)[profileTab] || "Videos" }]
      : videoLibrary
        ? [{ label: "Videos", onClick: () => go("all") }, { label: titles[view] }]
        : view === "settings" ? [{ label: "Settings", onClick: () => setSettingsSection("general") }, { label: ({ general: "Library", connections: "Connections", maintenance: "Maintenance", advanced: "Advanced" } as Record<string, string>)[settingsSection] || "Library" }] : [{ label: titles[view] }];
  if (legacyTools) return <><LegacyApp /><button className="return-manager" onClick={() => { setLegacyTools(false); reload(); }}>← Back to file manager</button></>;
  return <div className="manager">
    <aside className={`manager-sidebar ${nav ? "is-open" : ""}`}>
      <button className="manager-brand" onClick={() => go("all")}><span className="brand-symbol"><Icon name="folder" /></span>trove<span className="workspace-label">PERSONAL</span></button>
      <div className="workspace-switch"><span className="workspace-avatar"><Icon name="folder" /></span><span>My workspace<small>Personal media library</small></span><Icon name="lock" /></div>
      <div className="nav-label">LIBRARY</div>
      <button className={`manager-nav ${videoLibrary ? "active" : ""}`} aria-current={videoLibrary ? "page" : undefined} onClick={() => go("all")}><Icon name="film" />Videos</button>
      <button className={`manager-nav ${view === "photos" ? "active" : ""}`} aria-current={view === "photos" ? "page" : undefined} onClick={() => go("photos")}><Icon name="photo" />Photos</button>
      <div className="nav-label">ORGANIZE</div>
      {([["collections", "folder"], ["people", "people"], ["tags", "tag"]] as [View, string][]).map(([id, icon]) => <button key={id} className={`manager-nav ${(view === id || id === "people" && view === "profile") ? "active" : ""}`} onClick={() => go(id)}><Icon name={icon} />{titles[id]}</button>)}
      <div className="nav-label">COLLECTIONS<button aria-label="New collection" onClick={() => openModal("collection")}><Icon name="plus" /></button></div>
      <div className="collection-nav">{collections.filter(c => !c.hidden).map(c => <button className={`manager-nav ${collection?.id === c.id ? "active" : ""}`} key={c.id} onClick={() => openCollection(c)}><Icon name={c.locked ? "lock" : "folder"} /> <span className="truncate">{c.name}</span><span className="nav-count">{c.count}</span></button>)}{!collections.length && <p className="nav-empty">A place for every project.<button onClick={() => openModal("collection")}>Create a collection</button></p>}</div>
      <div className="sidebar-bottom"><button className={`manager-nav ${view === "downloads" ? "active" : ""}`} onClick={() => go("downloads")}><Icon name="download" />Downloads<span className="nav-count">{queue.filter(j => j.status === "queued" || j.status === "downloading").length || ""}</span></button><button className={`manager-nav ${view === "settings" ? "active" : ""}`} onClick={() => go("settings")}><Icon name="gear" />Settings</button><div className="library-status"><span />Your library, in one place<small>{size(videos.reduce((n, v) => n + (v.filesize || 0), 0))} in this view</small></div></div>
    </aside>
    <div className="manager-workspace">
      <header className="manager-topbar"><button className="mobile-nav" aria-label="Toggle navigation" onClick={() => setNav(!nav)}><Icon name="menu" /></button><nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{crumbs.map((crumb, index) => <li key={index}>{index > 0 && <svg className="breadcrumb-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg>}{index === crumbs.length - 1 ? <strong aria-current="page" title={crumb.label}>{crumb.label}</strong> : <button onClick={crumb.onClick} title={crumb.label}>{crumb.label}</button>}</li>)}</ol></nav><span className="top-avatar" title="Personal library"><Icon name="lock" /></span></header>
      <main ref={mainRef} className={`manager-main view-${view}`}>
        {view === "profile" && profile ? <PersonHeader key={profile.name} person={people.find(p => p.name === profile.name) || profile} videos={videos.filter(v => v.people?.includes(profile.name))} media={media} onBack={() => go("people")} onChanged={reload} /> : <div className="manager-heading"><div><div className="eyebrow">Your library</div><h1>{collection?.name || (videoLibrary ? "Videos" : titles[view])}</h1><p>{videoLibrary ? "Watch, find, and organize your video library." : view === "settings" ? "Make yourself at home." : view === "downloads" ? "Bring everything into your library." : collection ? "A focused space for related videos." : view === "unorganized" ? "Find videos missing tags or people and give them a place." : view === "recent" ? `Everything added in the last ${recentDays} days.` : "Everything you save. Right where it belongs."}</p></div>{view !== "settings" && view !== "downloads" && view !== "photos" && <div className="heading-actions"><button className="m-button" onClick={() => openModal("collection")}><Icon name="plus" />New collection</button><button className="m-button primary" onClick={() => openModal("import")}><Icon name="plus" />Add videos</button></div>}</div>}
        {videoLibrary && <nav className="utility-tabs video-library-tabs" aria-label="Video library views">{(["all", "recent", "favorites", "unorganized"] as View[]).map(id => <button key={id} className={view === id ? "active" : ""} aria-pressed={view === id} onClick={() => { if (view !== id) go(id); }}>{titles[id]}</button>)}</nav>}
        {error && <div className="manager-alert" role="alert">{error}<button onClick={reload}>Retry</button></div>}
        {notice && <div className="manager-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><Icon name="x" /></button></div>}
        {view === "profile" && <nav className="utility-tabs profile-tabs" aria-label="Person library">{[["all", "Videos"], ["favorites", "Favorites"], ["photos", "Photos"], ["accounts", "Accounts"]].map(([id, label]) => <button key={id} className={profileTab === id ? "active" : ""} aria-pressed={profileTab === id} onClick={() => { setProfileTab(id); setQ(""); }}>{label}</button>)}</nav>}
        {!fileView && !["settings", "downloads"].includes(view) && <div className="content-search-row"><div className="manager-search"><Icon name="search" /><input ref={searchRef} aria-label="Search this view" placeholder={view === "photos" || profileTab === "photos" ? "Search photos, albums, or filenames…" : profileTab === "accounts" && view === "profile" ? "Search this person’s accounts…" : view === "people" ? "Search people…" : "Search this view…"} value={q} onChange={e => setQ(e.target.value)} /><kbd>Ctrl K</kbd>{q && <button aria-label="Clear search" onClick={() => setQ("")}><Icon name="x" /></button>}</div></div>}
        {fileView ? <>
          <SmartView view={view} videos={videos} mode={organizeMode} onMode={setOrganizeMode} days={recentDays} onDays={setRecentDays} />

          <div className="manager-toolbar"><div className="view-tab"><Icon name="film" />{q ? "Search results" : "Videos"}<span>{filtered.length}</span></div><div className="toolbar-right"><button className={`m-button ${selectionMode ? "pressed" : ""}`} aria-pressed={selectionMode} aria-label="Select videos" onClick={() => setSelectionMode(mode => !mode)}>{selectionMode ? "Done selecting" : "Select"}</button><button className={`m-button ${filters ? "pressed" : ""}`} aria-expanded={filters} onClick={() => setFilters(!filters)}><Icon name="menu" />Filters{[source, person, tag, length, quality].filter(Boolean).length > 0 && ` (${[source, person, tag, length, quality].filter(Boolean).length})`}</button><select aria-label="Sort videos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Name A–Z</option><option value="largest">Largest first</option><option value="longest">Longest first</option></select><div className="view-switch">{["list", "grid"].map(l => <button key={l} aria-label={`${l} view`} aria-pressed={layout === l} className={layout === l ? "chosen" : ""} onClick={() => { setLayout(l); localStorage.troveLayout = l; }}><Icon name={l === "list" ? "menu" : "grid"} /></button>)}</div></div></div>
          {filters && <div className="manager-filters library-search-filters"><div className="manager-search"><Icon name="search" /><input ref={searchRef} aria-label="Search this view" placeholder={view === "photos" || profileTab === "photos" ? "Search photos, albums, or filenames…" : profileTab === "accounts" && view === "profile" ? "Search this person’s accounts…" : view === "people" ? "Search people…" : "Search this view…"} value={q} onChange={e => setQ(e.target.value)} /><kbd>Ctrl K</kbd>{q && <button aria-label="Clear search" onClick={() => setQ("")}><Icon name="x" /></button>}</div><select aria-label="Filter by person" value={person} onChange={e => setPerson(e.target.value)}><option value="">All people</option>{people.map(p => <option key={p.name} value={p.name}>{p.nickname || p.name}</option>)}</select><select aria-label="Filter by tag" value={tag} onChange={e => setTag(e.target.value)}><option value="">All tags</option>{tags.map(t => <option key={t}>{t}</option>)}</select><select aria-label="Filter by source" value={source} onChange={e => setSource(e.target.value)}><option value="">All sources</option>{sources.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Filter by duration" value={length} onChange={e => setLength(e.target.value)}><option value="">Any duration</option><option value="short">Under 5 minutes</option><option value="medium">5–20 minutes</option><option value="long">20+ minutes</option></select><select aria-label="Filter by resolution" value={quality} onChange={e => setQuality(e.target.value)}><option value="">Any resolution</option><option value="720">720p and above</option><option value="1080">1080p and above</option><option value="2160">4K and above</option></select>{(source || person || tag || length || quality || q) && <button className="clear-filters" onClick={() => { setSource(""); setPerson(""); setTag(""); setLength(""); setQuality(""); setQ(""); }}>Clear all</button>}</div>}
          {picked.length > 0 && <div className="bulk-bar" role="toolbar" aria-label="Bulk video actions"><strong>{picked.length} selected</strong><button onClick={() => openModal("add")}><Icon name="folder" />Add to collection</button><button onClick={() => openModal("tag")}><Icon name="tag" />Add tags</button><button onClick={() => openModal("assign")}><Icon name="people" />Assign person</button>{collection && !collection.locked && <button onClick={() => execute(async () => { for (const v of picked) await api.RemoveFromCollection(collection.id, v.site, v.id); setSelected(new Set()); }, "Removed from collection")}>Remove from collection</button>}<button aria-label="Clear selection" onClick={() => setSelected(new Set())}><Icon name="x" /></button></div>}
          {layout === "grid" && selectionMode && <p className="row-selection-hint">Click thumbnails or titles to select · Shift-click for a range · Double-click to watch</p>}
          {layout === "list" && <p className="row-selection-hint" id="row-selection-help">{selectionMode ? "Click rows to select · Shift-click for a range · Double-click to watch" : "Click a row to watch · Use the circle or Select mode to choose videos"}</p>}
          <div className="file-area"><div className="file-content">{loading ? <div className="manager-empty"><span className="empty-icon"><Icon name="folder" /></span><h2>Opening your library…</h2><p>Loading the catalogue for search and filtering.</p></div> : filtered.length ? layout === "list" ? <div className="table-scroll"><table className="file-table"><thead><tr><th className="check-cell"><span className="sr-only">Selection</span></th><th><button onClick={() => setSort("title")}>Name {sort === "title" ? "↑" : ""}</button></th><th>People</th><th>Tags</th><th><button onClick={() => setSort("longest")}>Duration</button></th><th><button onClick={() => setSort("largest")}>Size</button></th><th><button onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}>Date added ↓</button></th></tr></thead><tbody>{rows.map((v, index) => <Fragment key={key(v)}>{view === "recent" && (sort === "newest" || sort === "oldest") && (!index || addedGroup(v.added) !== addedGroup(rows[index - 1].added)) && <tr className="date-group"><td colSpan={7}>{addedGroup(v.added)}</td></tr>}<tr className={`selectable-row ${selected.has(key(v)) ? "selected-row" : ""}`} aria-selected={selected.has(key(v))} aria-describedby="row-selection-help" tabIndex={0} onClick={e => { if ((e.target as HTMLElement).closest("button, input, a, select")) return; if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) toggle(v, e.shiftKey); else play(v); }} onDoubleClick={e => { if (!(e.target as HTMLElement).closest("button, input, a, select")) play(v); }} onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === " ") { e.preventDefault(); if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) toggle(v, e.shiftKey); else play(v); } else if (e.key === "Enter") { e.preventDefault(); play(v); } }}><td className="check-cell"><button className="row-select" aria-label={`Select ${v.title || v.filename}`} aria-pressed={selected.has(key(v))} onClick={e => toggle(v, e.shiftKey)}>{selected.has(key(v)) && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>}</button></td><td><div className="file-name"><span className="file-thumb">{v.thumbnail ? <img src={media(v.thumbnail)} alt="" loading="lazy" /> : <Icon name="film" />}</span><span><strong>{v.title || v.filename || "Untitled video"}</strong><small>{v.ext?.toUpperCase() || "VIDEO"}<span>·</span>{v.site}{!!v.height && <><span>·</span>{v.height}p</>}</small></span></div></td><td><span className="person-cell">{(v.people || []).slice(0, 2).map(name => people.find(p => p.name === name)?.nickname || name).join(", ") || <span className="missing">{view === "unorganized" ? <button onClick={() => { setSelected(new Set([key(v)])); openModal("assign"); }}>+ Assign person</button> : "Unassigned"}</span>}</span></td><td><div className="tag-list">{v.labels?.length ? <>{v.labels.slice(0, 2).map(t => <button key={t} className="tag-pill" onClick={() => setTag(t)}>{t}</button>)}{v.labels.length > 2 && <span className="missing">+{v.labels.length - 2}</span>}</> : <button className="missing add-tag" onClick={() => { setSelected(new Set([key(v)])); openModal("tag"); }}>+ Add tags</button>}</div></td><td className="numeric">{duration(v.duration)}</td><td className="numeric">{size(v.filesize)}</td><td className="numeric">{date(v.added)}</td></tr></Fragment>)}</tbody></table></div> : <div className="manager-grid">{rows.map(v => <VideoCard key={key(v)} video={v} selected={selected.has(key(v))} selectionMode={selectionMode} thumbnail={v.thumbnail ? media(v.thumbnail) : ""} onSelect={shift => toggle(v, shift)} onPlay={() => play(v)} onTag={setTag} />)}</div> : <div className="manager-empty"><span className="empty-icon"><Icon name={videos.length ? "search" : "folder"} /></span><h2>{videos.length ? view === "unorganized" && !q && !source && !person && !tag && !length && !quality ? "All caught up" : view === "favorites" ? "No favorites here yet" : view === "profile" ? "No videos in this view" : view === "recent" ? "No additions in this period" : "No matching videos" : view === "profile" ? "No videos for this person yet" : collection ? "This collection is empty" : "A home for your videos"}</h2><p>{videos.length ? view === "unorganized" ? "There are no videos missing this information. Try another category or adjust your filters." : view === "favorites" ? "Add a video to favorites from its details panel, or adjust your filters." : view === "profile" ? "Videos assigned to this person appear here. Try adjusting the filters or add them to a video from its details panel." : "Try a different search, period, or filter." : collection ? "Select videos in your library and use Add to collection to organize them here." : "Add your first videos, then make them easy to find with collections, people, and tags."}</p>{!videos.length && <button className="m-button primary" onClick={() => collection ? go("all") : openModal("import")}><Icon name={collection ? "folder" : "plus"} />{collection ? "Go to library" : "Add videos"}</button>}</div>}</div>
          </div>
          <footer className="manager-footer"><span>{filtered.length ? `${page * 50 + 1}–${Math.min((page + 1) * 50, filtered.length)} of ${filtered.length} videos` : "0 videos"}{selected.size > 0 && ` · ${selected.size} selected`}</span><span className="footer-hint">Open a video to watch and organize</span><div><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button><button disabled={(page + 1) * 50 >= filtered.length} onClick={() => setPage(p => p + 1)}>Next →</button></div></footer>
        </> : view === "photos" || view === "profile" && profileTab === "photos" ? <PhotoLibrary key={profile?.name || "all"} person={view === "profile" ? profile?.name : undefined} query={q} media={media} version={version} onChanged={reload} /> : view === "profile" && profileTab === "accounts" && profile ? <PersonAccounts person={profile.name} query={q} onChanged={reload} /> : view === "downloads" ? <LibraryDownloads queue={queue} onChanged={reload} onSettings={() => { go("settings"); setSettingsSection("connections"); }} /> : view === "settings" ? <LibrarySettings onSectionChange={setSettingsSection} initialSection={settingsSection} onTools={() => setLegacyTools(true)} /> : <><div className="directory-heading"><span>{view === "collections" ? collections.length : view === "people" ? people.length : tags.length} {view}</span>{view !== "tags" && <button className="m-button" onClick={() => openModal(view === "people" ? "person" : "collection")}><Icon name="plus" />New {view === "people" ? "person" : "collection"}</button>}</div><div className="directory-grid">{view === "collections" ? collections.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).map(c => <button key={c.id} className="directory-card" onClick={() => openCollection(c)}><Icon name={c.locked ? "lock" : "folder"} /><strong>{c.name}</strong><small>{c.count} videos{c.hidden ? " · Hidden" : ""}</small></button>) : view === "people" ? people.filter(p => [p.name, p.nickname].join(" ").toLowerCase().includes(q.toLowerCase())).map(p => <button key={p.name} className="directory-card person-directory-card" onClick={() => { go("profile"); setProfile(p); }}><PersonAvatar name={p.nickname || p.name} src={p.thumbnail ? media(p.thumbnail) : undefined} /><strong>{p.nickname || p.name}</strong><small>{p.count} video{p.count === 1 ? "" : "s"}</small></button>) : tags.filter(t => t.toLowerCase().includes(q.toLowerCase())).map(t => <button key={t} className="directory-card" onClick={() => { go("all"); setTag(t); }}><Icon name="tag" /><strong>{t}</strong><small>{videos.filter(v => v.labels?.includes(t)).length} videos</small></button>)}</div>{!(view === "collections" ? collections.length : view === "people" ? people.length : tags.length) && <div className="manager-empty"><Icon name={view === "people" ? "people" : view === "tags" ? "tag" : "folder"} /><h2>No {view} yet</h2><p>{view === "tags" ? "Select videos in your library and choose Add tags to get started." : `Create your first ${view === "people" ? "person" : "collection"} to start organizing.`}</p></div>}</>}
      </main>
    </div>
    {currentVideo && <VideoPlayer key={key(currentVideo)} video={currentVideo} src={media(currentVideo.filepath)} poster={currentVideo.thumbnail ? media(currentVideo.thumbnail) : undefined} onClose={() => { setPlaying(null); reload(); }} onPosition={position => setVideos(rows => rows.map(v => key(v) === key(currentVideo) ? { ...v, position } : v))} onPrevious={playingIndex > 0 ? () => setPlaying(playbackQueue[playingIndex - 1]) : undefined} onNext={playingIndex >= 0 && playingIndex < playbackQueue.length - 1 ? () => setPlaying(playbackQueue[playingIndex + 1]) : undefined} detailsOpen={watchDetails} onToggleDetails={() => setWatchDetails(v => !v)} details={<Inspector key={key(currentVideo)} video={currentVideo} media={media} busy={busy} collections={collections} version={version} onClose={() => setWatchDetails(false)} onSave={execute} onAction={m => { setSelected(new Set()); if (document.fullscreenElement) document.exitFullscreen().then(() => openModal(m, currentVideo)).catch(e => setError(String(e))); else openModal(m, currentVideo); }} />} />}
    {gate && <div className="manager-modal-backdrop"><section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="gate-title"><span className="empty-icon"><Icon name="lock" /></span><h2 id="gate-title">{gate.name} is locked</h2><p>This collection is kept private. Open it for this session?</p><div className="heading-actions"><button className="m-button" onClick={() => setGate(null)}>Cancel</button><button className="m-button primary" onClick={() => { const c = gate; setGate(null); go("all"); setCollection(c); }}>Open collection</button></div></section></div>}
    {modal && <div className="manager-modal-backdrop" onClick={() => !busy && setModal(null)}><section className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}><button className="modal-close" aria-label="Close dialog" disabled={busy} onClick={() => setModal(null)}><Icon name="x" /></button><span className="empty-icon"><Icon name={modal === "tag" ? "tag" : modal === "assign" || modal === "person" ? "people" : modal === "import" ? "download" : "folder"} /></span><h2 id="modal-title">{({ collection: "New collection", person: "New person", tag: "Add tags", assign: "Assign a person", add: "Add to collection", import: "Add videos" })[modal]}</h2><p>{modal === "import" ? "Save a video from a link or import files from your computer." : modal === "tag" ? "Separate tags with commas. Existing tags will be kept." : modal === "assign" ? "Choose the person who appears in these videos." : modal === "add" ? `Organize ${editTarget ? 1 : picked.length} selected videos.` : "Give it a name that’s easy to find later."}</p><form onSubmit={e => { e.preventDefault(); submit(); }}>{modal === "tag" || modal === "assign" || modal === "add" ? <OrganizePicker key={modal} kind={modal} value={value} onChange={setValue} choices={modal === "tag" ? [...new Set([...tags, ...suggestedTags])].map(t => ({ value: t, label: t })) : modal === "assign" ? people.map(p => ({ value: p.name, label: p.nickname || p.name, detail: p.nickname && p.nickname !== p.name ? p.name : undefined })) : collections.filter(c => !c.locked).map(c => ({ value: String(c.id), label: c.name, detail: `${c.count || 0} videos` }))} /> : <input autoFocus required aria-label={modal === "import" ? "Video URL" : "Name"} type={modal === "import" ? "url" : "text"} placeholder={modal === "import" ? "https://…" : "Enter a name"} value={value} onChange={e => setValue(e.target.value)} />}<button className="m-button primary" disabled={busy || (modal === "tag" ? !split(value).length : !value.trim())}>{busy ? notice.startsWith("Updating") ? notice : "Saving…" : modal === "import" ? "Save from link" : "Save"}</button></form>{modal === "import" && <button className="m-button import-local" disabled={busy} onClick={() => execute(() => api.ImportFilesDialog(""), "Files submitted for import")}><Icon name="folder" />Choose local files</button>}{modal === "assign" && !people.length && <button className="clear-filters" onClick={() => openModal("person")}>Create a person first</button>}{modal === "add" && !collections.some(c => !c.locked) && <button className="clear-filters" onClick={() => openModal("collection")}>Create a collection first</button>}{error && <p role="alert" className="modal-error">{error}</p>}</section></div>}
  </div>;
}

function Inspector({ video: v, media, busy, collections, version, onClose, onSave, onAction, onPlay }: { video: Video; media: (p: string) => string; busy: boolean; collections: library.Collection[]; version: number; onClose: () => void; onSave: (a: () => Promise<unknown>, message: string) => Promise<void>; onAction: (m: "tag" | "assign" | "add") => void; onPlay?: () => void }) {
  const [title, setTitle] = useState(v.title || v.filename);
  const [memberships, setMemberships] = useState<number[]>([]);
  const [membershipError, setMembershipError] = useState("");
  useEffect(() => { let live = true; api.CollectionsForVideo(v.site, v.id).then(ids => { if (live) { setMemberships(ids || []); setMembershipError(""); } }).catch(e => { if (live) setMembershipError(String(e)); }); return () => { live = false; }; }, [v.site, v.id, version]);
  return <aside className="inspector"><div className="inspector-header"><strong>File details</strong><button aria-label="Close details" onClick={onClose}><Icon name="x" /></button></div><div className="inspector-preview">{v.thumbnail ? <img src={media(v.thumbnail)} alt="Video thumbnail" /> : <Icon name="film" />}</div>{onPlay && <button className="m-button primary preview-button" onClick={onPlay}><Icon name="play-fill" />Watch video</button>}<form onSubmit={e => { e.preventDefault(); onSave(() => api.SetTitle(v.site, v.id, title.trim()), "Title updated"); }}><label>Title<input aria-label="Video title" value={title} onChange={e => setTitle(e.target.value)} /></label>{title !== (v.title || v.filename) && <button className="m-button" disabled={busy || !title.trim()}>Save name</button>}</form><div className="inspector-section"><h3>People<button onClick={() => onAction("assign")} aria-label="Assign person"><Icon name="plus" /></button></h3>{v.people?.length ? v.people.map(p => <div className="detail-chip" key={p}><Icon name="people" />{p}{v.models?.includes(p) && <button disabled={busy} aria-label={`Remove person ${p}`} onClick={() => onSave(() => api.SetModels(v.site, v.id, v.models.filter(x => x !== p)), "Person removed")}><Icon name="x" /></button>}</div>) : <p>No people assigned</p>}</div><div className="inspector-section"><h3>Tags<button onClick={() => onAction("tag")} aria-label="Add tags"><Icon name="plus" /></button></h3><div className="tag-list">{v.labels?.length ? v.labels.map(t => <span className="tag-pill" key={t}>{t}<button disabled={busy} aria-label={`Remove tag ${t}`} onClick={() => onSave(() => api.SetLabels(v.site, v.id, v.labels.filter(x => x !== t)), "Tag removed")}>×</button></span>) : <p>No tags yet</p>}</div></div><div className="inspector-section"><h3>Collections<button onClick={() => onAction("add")} aria-label="Add to collection"><Icon name="plus" /></button></h3>{membershipError ? <p role="alert">Could not load collections.</p> : memberships.length ? collections.filter(c => memberships.includes(c.id)).map(c => <div className="detail-chip" key={c.id}><Icon name="folder" />{c.name}{!c.locked && <button disabled={busy} aria-label={`Remove from ${c.name}`} onClick={() => onSave(() => api.RemoveFromCollection(c.id, v.site, v.id), "Removed from collection")}><Icon name="x" /></button>}</div>) : <p>Not in a collection</p>}</div><div className="inspector-section"><h3>Information</h3><dl><dt>Source</dt><dd>{v.site}</dd><dt>Duration</dt><dd>{duration(v.duration)}</dd><dt>File size</dt><dd>{size(v.filesize)}</dd><dt>Resolution</dt><dd>{v.width && v.height ? `${v.width} × ${v.height}` : "—"}</dd><dt>Added</dt><dd>{date(v.added)}</dd></dl><p className="file-path">{v.filepath}</p></div><button className="m-button" disabled={busy} onClick={() => onSave(() => api.SetFavorite(v.site, v.id, !v.favorite), v.favorite ? "Removed from favorites" : "Added to favorites")}><Icon name="heart" />{v.favorite ? "Remove favorite" : "Add to favorites"}</button></aside>;
}















