import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as api from "./api";
import { library, downloader } from "../wailsjs/go/models";
import { Icon } from "./App";

const bytes = (n = 0) => n >= 1073741824 ? `${(n / 1073741824).toFixed(1)} GB` : `${Math.round(n / 1048576)} MB`;
function SettingRow({ icon, title, detail, children }: { icon: string; title: string; detail: string; children?: ReactNode }) {
  return <div className="setting-row"><span className="setting-icon"><Icon name={icon} /></span><div className="setting-copy"><strong>{title}</strong><p>{detail}</p></div><div className="setting-control">{children}</div></div>;
}

export function LibrarySettings({ onTools, initialSection = "general", onSectionChange }: { onTools: () => void; initialSection?: string; onSectionChange?: (section: string) => void }) {
  const [root, setRoot] = useState("");
  const [stats, setStats] = useState<library.Stats | null>(null);
  const [connections, setConnections] = useState<{ x: boolean; pornhub: boolean } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [changed, setChanged] = useState(false);
  const [tab, setTab] = useState(initialSection);
  useEffect(() => { setTab(initialSection); }, [initialSection]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.all([api.MediaRootPath(), api.Stats(), api.CookieStatus()]).then(([r, s, c]) => { if (live) { setRoot(r); setStats(s); setConnections(c); } }).catch(e => { if (live) setError(String(e)); });
    return () => { live = false; };
  }, [version]);
  useEffect(() => {
    const optimize = api.EventsOn("optimize", (s: { finished?: boolean; done: number; total: number; fixed: number; failed: number }) => {
      setNotice(s.finished ? `Streaming scan complete. ${s.fixed} fixed${s.failed ? `, ${s.failed} skipped` : ""}.` : `Optimizing videos · ${s.done} of ${s.total}`);
      if (s.finished) setBusy(current => current === "optimize" ? "" : current);
    });
    const avatar = api.EventsOn("avatar", (s: { finished?: boolean; done: number; total: number; added: number }) => {
      setNotice(s.finished ? `${s.added} profile pictures updated.` : `Fetching profile pictures · ${s.done} of ${s.total}`);
      if (s.finished) setBusy(current => current === "avatars" ? "" : current);
    });
    return () => { optimize(); avatar(); };
  }, []);
  const run = async (name: string, action: () => Promise<void>, background = false) => {
    setBusy(name); setError(""); setNotice("");
    try { await action(); if (!background) setBusy(""); }
    catch (e) { setError(String(e)); setBusy(""); }
  };
  const connect = () => run("connections", async () => { setConnections(await api.ConnectCookies()); setNotice("Connection settings updated."); });
  return <div className="utility-page settings-page">
    <nav className="settings-navigation" aria-label="Settings sections">{[["general", "Library", "folder"], ["connections", "Connections", "connections"], ["maintenance", "Maintenance", "gear"], ["advanced", "Advanced", "grid"]].map(([id, label, icon]) => <button key={id} aria-pressed={tab === id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); onSectionChange?.(id); }}><Icon name={icon} />{label}</button>)}</nav>
    <div className="settings-detail"><header className="settings-section-heading"><h2>{({ general: "Your library", connections: "Connections", maintenance: "Maintenance", advanced: "Advanced" } as Record<string, string>)[tab]}</h2><p>{({ general: "Storage and library information, in one place.", connections: "Manage access to the services you save from.", maintenance: "Keep your catalogue backed up and your media ready to play.", advanced: "Additional tools for managing your library." } as Record<string, string>)[tab]}</p></header>
    {error && <div className="manager-alert" role="alert">{error}<button onClick={() => { setError(""); setVersion(v => v + 1); }}>Retry loading</button></div>}
    {notice && <div className="manager-notice" role="status">{notice}</div>}
    {tab === "general" && <>
      <section className="settings-group"><h2>Library & storage</h2><div className="settings-card"><SettingRow icon="folder" title="Library location" detail="Your media and catalogue are stored here.">{api.isDesktopApp && <button className="m-button" disabled={!!busy} onClick={() => run("location", async () => { const next = await api.ChooseMediaRoot(); if (next && next !== root) { setRoot(next); setChanged(true); } })}>Change folder…</button>}</SettingRow><div className="setting-path"><code>{root || "Loading library location…"}</code></div>{changed && <div className="setting-inline-notice">Restart ClipKit to use this location.<button className="m-button" onClick={() => api.RestartApp()}>Restart now</button></div>}<div className="storage-summary"><div><strong>{stats ? bytes(stats.totalBytes) : "—"}</strong><span>Library storage</span></div><div><strong>{stats?.videoCount.toLocaleString() ?? "—"}</strong><span>Videos</span></div><div><strong>{stats?.modelCount.toLocaleString() ?? "—"}</strong><span>People</span></div></div>{!!stats?.sites?.length && <div className="storage-breakdown"><div className="storage-track">{stats.sites.map((s, i) => <span key={s.site} style={{ width: `${stats.totalBytes ? s.bytes / stats.totalBytes * 100 : 0}%`, background: ["#0a84ff", "#5e5ce6", "#64d2ff", "#bf5af2"][i % 4] }} />)}</div><div className="storage-legend">{stats.sites.map((s, i) => <span key={s.site}><i style={{ background: ["#0a84ff", "#5e5ce6", "#64d2ff", "#bf5af2"][i % 4] }} />{s.site} <b>{bytes(s.bytes)}</b></span>)}</div></div>}</div></section>

    </>}
    {tab === "advanced" && <>
      <section className="settings-group"><h2>Additional tools</h2><div className="settings-card"><SettingRow icon="grid" title="More library tools" detail="Open subscriptions and additional library preferences."><button className="m-button" onClick={onTools}>Open tools <span>↗</span></button></SettingRow></div></section>
    </>}
    {tab === "connections" && <section className="settings-group"><h2>Connected services</h2><p className="settings-description">Import a cookies.txt file exported while signed in to access protected posts. Connection files are saved in your vault.</p><button className="m-button connection-import" disabled={!!busy} onClick={connect}><Icon name="plus" />{busy === "connections" ? "Importing…" : "Import connection file…"}</button><div className="settings-card">{([["x", "X / Twitter"], ["pornhub", "Pornhub"]] as const).map(([id, label]) => <SettingRow key={id} icon="connections" title={label} detail={connections ? connections[id] ? "Connected to your library" : "No account connected" : "Checking connection…"}><span className={`connection-state ${connections?.[id] ? "connected" : ""}`}>{connections ? connections[id] ? "Connected" : "Not connected" : "Checking"}</span></SettingRow>)}</div></section>}
    {tab === "maintenance" && <>
      <section className="settings-group"><h2>Backup & recovery</h2><div className="settings-card"><SettingRow icon="download" title="Back up catalogue" detail="Save collections, people, tags, favorites, and playback positions. Media files are not copied."><button className="m-button" disabled={!!busy} onClick={() => run("backup", async () => { const result = await api.BackupCatalogue(); setNotice(`Backup saved to ${result.path}`); })}>{busy === "backup" ? "Backing up…" : "Back up now"}</button></SettingRow><SettingRow icon="folder" title="Rebuild library" detail="Rescan media and saved metadata to restore catalogue entries."><button className="m-button" disabled={!!busy} onClick={() => run("rebuild", async () => { const result = await api.RebuildLibrary(); setNotice(`Library rebuilt. ${result.count} files catalogued.`); setVersion(v => v + 1); })}>{busy === "rebuild" ? "Rebuilding…" : "Rebuild…"}</button></SettingRow></div></section>
      <section className="settings-group"><h2>Media maintenance</h2><div className="settings-card"><SettingRow icon="film" title="Optimize streaming" detail="Move video indexes for faster playback on phones, without changing quality."><button className="m-button" disabled={!!busy} onClick={() => run("optimize", async () => { await api.OptimizeStreaming(); }, true)}>{busy === "optimize" ? "Optimizing…" : "Scan & optimize"}</button></SettingRow><SettingRow icon="people" title="Update profile pictures" detail="Fetch Pornhub profile pictures for people without a custom avatar."><button className="m-button" disabled={!!busy} onClick={() => run("avatars", async () => { await api.FetchAllAvatars(); }, true)}>{busy === "avatars" ? "Fetching…" : "Fetch pictures"}</button></SettingRow></div></section>
    </>}
    <footer className="utility-footnote"><Icon name="lock" />Your library stays in your vault.</footer></div>
  </div>;
}

export function LibraryDownloads({ queue, onChanged, onSettings }: { queue: downloader.Job[]; onChanged: () => void; onSettings: () => void }) {
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const active = queue.filter(j => ["downloading", "queued"].includes(j.status));
  const completed = queue.filter(j => ["done", "duplicate"].includes(j.status));
  const failed = queue.filter(j => j.status === "error");
  const scopedRows = filter === "active" ? active : filter === "completed" ? completed : filter === "error" ? failed : queue;
  const rows = scopedRows.filter(j => `${j.title || ""} ${j.url}`.toLowerCase().includes(search.toLowerCase())).slice().sort((a, b) => (({ downloading: 0, queued: 1, error: 2 } as Record<string, number>)[a.status] ?? 3) - (({ downloading: 0, queued: 1, error: 2 } as Record<string, number>)[b.status] ?? 3));
  const run = async (name: string, action: () => Promise<unknown>, message: string) => {
    setBusy(name); setError(""); setNotice("");
    try { await action(); setNotice(message); onChanged(); }
    catch (e) { setError(String(e)); }
    finally { setBusy(""); }
  };
  return <div className="utility-page downloads-page">
    <div className="download-add-card"><div className="download-add-content"><h2>New download</h2><form onSubmit={e => { e.preventDefault(); const value = url.trim(); if (value) run("add", async () => { await api.Enqueue(value); setUrl(""); }, "Download added to the queue."); }}><input type="url" required aria-label="Video URL" placeholder="Paste a video link…" value={url} onChange={e => setUrl(e.target.value)} /><button className="m-button primary" disabled={!!busy || !url.trim()}><Icon name="plus" />{busy === "add" ? "Adding…" : "Add download"}</button></form><div className="download-import"><span>Already on your device?</span><button disabled={!!busy} onClick={() => run("files", () => api.ImportFilesDialog(""), "Files submitted for import.")}><Icon name="folder" />{busy === "files" ? "Importing…" : "Import files…"}</button>{api.isDesktopApp && <button disabled={!!busy} onClick={() => run("folder", () => api.ImportFolderDialog(), "Folder submitted for import.")}>{busy === "folder" ? "Importing…" : "Import folder…"}</button>}</div></div></div>
    {error && <div className="manager-alert" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><Icon name="x" /></button></div>}
    {notice && <div className="manager-notice" role="status">{notice}</div>}
    <div className="queue-section-title"><h2>Download queue</h2><span>{active.length ? `${active.length} in progress` : "No active downloads"}</span></div>
    <div className="download-queue-heading"><nav className="utility-tabs" aria-label="Download filters">{[["all", "All", queue.length], ["active", "Active", active.length], ["completed", "Completed", completed.length], ["error", "Failed", failed.length]].map(([id, name, count]) => <button key={id} className={filter === id ? "active" : ""} aria-pressed={filter === id} onClick={() => setFilter(String(id))}>{name}<span>{count}</span></button>)}</nav><button className="queue-clear" disabled={!!busy || !completed.length && !failed.length} onClick={() => run("clear", () => api.ClearFinished(), "Finished downloads cleared.")}>Clear finished</button></div>
    {queue.length > 0 && <div className="queue-search"><Icon name="search" /><input aria-label="Search downloads" placeholder="Search downloads…" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Clear download search" onClick={() => setSearch("")}><Icon name="x" /></button>}</div>}
    {rows.length ? <div className="download-list">{rows.map(j => <article className="download-row" key={j.id}><span className={`download-file-icon ${j.status}`}><Icon name={j.status === "done" ? "film" : "download"} /></span><div className="download-info"><div className="download-title-line"><h3>{j.title || j.url}</h3><span className={`download-status ${j.status}`}>{({ queued: "Queued", downloading: "Downloading", done: "Completed", duplicate: "Already saved", error: "Failed" } as Record<string, string>)[j.status] || j.status}</span></div><p className="download-url">{j.url}</p>{j.status === "downloading" && <><div className="download-progress" role="progressbar" aria-label={`Downloading ${j.title || j.url}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, j.percent || 0))}><span style={{ width: `${Math.max(0, Math.min(100, j.percent || 0))}%` }} /></div><div className="download-meta"><span>{Math.round(j.percent || 0)}% complete</span><span>{[j.speed, j.eta ? `${j.eta} remaining` : ""].filter(Boolean).join(" · ")}</span></div></>}{j.status === "done" && <p className="download-meta">{j.replace ? "Replaced with the new download" : `${j.count || 0} file${j.count === 1 ? "" : "s"} saved to your library`}</p>}{j.status === "queued" && <p className="download-meta">{j.replace ? "Waiting to replace the existing file" : "Waiting to start"}</p>}{j.status === "duplicate" && <p className="download-meta">This video is already in your library.</p>}{j.error && <details className="download-error"><summary>View error details</summary><p>{j.error}</p></details>}</div>{j.status === "error" && !j.replace && <button className="m-button download-retry" disabled={!!busy} onClick={() => run(j.id, () => api.Enqueue(j.url), "Download queued again.")}>{busy === j.id ? "Retrying…" : "Retry"}</button>}{j.status === "queued" && <button className="download-action" aria-label={`Remove ${j.title || j.url} from queue`} disabled={!!busy} onClick={() => run(j.id, () => api.RemoveJob(j.id), "Removed from the queue.")}><Icon name="x" /></button>}</article>)}</div> : <div className="manager-empty download-empty"><span className="empty-icon"><Icon name="download" /></span><h2>{search ? "No matching downloads" : queue.length ? "Nothing here right now" : "Your queue is clear"}</h2><p>{search ? "Try a different title or link." : queue.length ? "Downloads with this status will appear here." : "Add a video link or import files to start building your library."}</p></div>}
    <footer className="download-help"><Icon name="lock" /><span>Downloading protected posts?</span><button onClick={onSettings}>Manage connections <span>→</span></button></footer>
  </div>;
}

