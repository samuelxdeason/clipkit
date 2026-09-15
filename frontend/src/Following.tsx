import { isInLibrary, libraryIndex, sourceKeys } from "./followingIdentity";
import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { downloader, library } from "../wailsjs/go/models";
import { Icon } from "./App";

export default function Following({ onDownloads, queue, onQueued, version, videos, libraryReady }: { videos: library.Video[]; libraryReady: boolean; version: number; onDownloads: () => void; queue: downloader.Job[]; onQueued: () => void }) {
  const [lists, setLists] = useState<api.SyncSummary[]>([]);
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState("");
  const [items, setItems] = useState<downloader.RemoteItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const savedIndex = useMemo(() => libraryIndex(videos), [videos]);
  const queueKey = (value: string) => { try { const u = new URL(value); u.hash = ""; return u.toString(); } catch { return value; } };
  const queueIndex = useMemo(() => { const result = new Map<string, downloader.Job>(); for (const job of queue) if (job.status !== "removed") for (const key of sourceKeys({ url: job.url })) result.set(key, job); return result; }, [queue]);
  const jobFor = (url: string) => sourceKeys({ url }).map(key => queueIndex.get(key)).find(Boolean);
  const stateFor = (item: downloader.RemoteItem) => {
    if (item.owned || isInLibrary(item, savedIndex)) return "Downloaded";
    const job = jobFor(item.url);
    if (job?.status === "done" || job?.status === "duplicate") return "Downloaded";
    if (job?.status === "downloading") return "Downloading " + Math.round(job.percent || 0) + "%";
    if (job?.status === "queued" || pending.includes(item.url)) return "Queued";
    if (!libraryReady) return "Checking library";
    return job?.status === "error" ? "Failed · Retry" : "Available";
  };
  const canDownload = (item: downloader.RemoteItem) => ["Available", "Failed · Retry"].includes(stateFor(item));
  useEffect(() => { setPending(v => v.filter(url => !queue.some(j => queueKey(j.url) === queueKey(url)))); }, [queue]);
  const selectionKey = items.filter(canDownload).map(i => i.url).join("\n");
  useEffect(() => { const allowed = new Set(items.filter(canDownload).map(i => i.url)); setSelected(v => v.filter(url => allowed.has(url))); }, [selectionKey]);
  const request = useRef(0);
  useEffect(() => { let live = true; api.SyncedLists().then(v => { if (live) setLists(v || []); }).catch(e => { if (live) setError(String(e)); }); return () => { live = false; request.current++; }; }, []);
  const load = async (source: string, refresh = false) => {
    const id = ++request.current;
    setBusy(true); setError(""); setNotice(""); setCurrent(source); setItems([]); setSelected([]); setQuery(""); setStatusFilter("all");
    try { const result = await api.Enumerate(source, refresh); if (id !== request.current) return; setItems(result || []); const saved = await api.SyncedLists(); if (id === request.current) setLists(saved || []); }
    catch(e) { if (id === request.current) setError(String(e)); }
    finally { if (id === request.current) setBusy(false); }
  };
  useEffect(() => {
    if (!current || !items.length) return;
    let live = true;
    api.Enumerate(current).then(result => { if (live) setItems(result || []); }).catch(e => { if (live) setError(String(e)); });
    api.SyncedLists().then(result => { if (live) setLists(result || []); }).catch(e => { if (live) setError(String(e)); });
    return () => { live = false; };
  }, [version, current]);
  const download = async (urls: string[]) => {
    setBusy(true); setError(""); setNotice("");
    try { const allowed = new Set(items.filter(canDownload).map(i => i.url)); const requested = [...new Set(urls)].filter(url => allowed.has(url)); const result = await api.EnqueueMany(requested); setPending(v => [...new Set([...v, ...requested])]); onQueued(); setSelected([]); setNotice(result.added + " downloads added to the queue."); }
    catch(e) { setError(String(e)); } finally { setBusy(false); }
  };
  const unfollow = async (source: string) => {
    setBusy(true); setError("");
    try { await api.RemoveSync(source); setLists(await api.SyncedLists() || []); } catch(e) { setError(String(e)); } finally { setBusy(false); }
  };
  const fresh = items.filter(canDownload);
  const downloaded = items.filter(i => stateFor(i) === "Downloaded");
  const inProgress = items.filter(i => stateFor(i) === "Queued" || stateFor(i).startsWith("Downloading"));
  const visible = items.filter(i => (statusFilter === "all" || statusFilter === "available" && canDownload(i) || statusFilter === "downloaded" && stateFor(i) === "Downloaded" || statusFilter === "progress" && inProgress.includes(i)) && [i.title, i.url].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <section className="following-page">
    <div className="following-queue-link"><span>{queue.filter(j => j.status === "queued" || j.status === "downloading").length} active downloads</span><button className="m-button" onClick={onDownloads}><Icon name="download" />Open downloads</button></div>
    {error && <div className="manager-alert" role="alert">{error}</div>}
    {notice && <div className="manager-notice" role="status">{notice}<button onClick={onDownloads}>View downloads →</button></div>}
    {!current ? <>
      <form className="following-add" onSubmit={e => { e.preventDefault(); if (url.trim()) load(url.trim(), true); }}><label htmlFor="following-url">Follow a source</label><div><input id="following-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a profile, channel, playlist, or favorites URL…" /><button className="m-button primary" disabled={busy || !url.trim()}>Load source</button></div><p>Browse everything available from a supported source, then choose what to download. Private content may need a connection in Settings.</p></form>
      <div className="directory-heading">{lists.length} saved sources</div>
      <div className="following-sources">{lists.map(l => <article key={l.url}><Icon name="connections" /><div><h2>{l.title || l.url}</h2><p>{l.url}</p><small>{l.count} items · {l.owned} in your library · {l.new} new</small></div><div className="following-source-actions"><button className="m-button" disabled={busy} onClick={() => load(l.url)}>Browse</button><button className="m-button" disabled={busy} onClick={() => load(l.url, true)}>Check for updates</button><button className="clear-filters" disabled={busy} onClick={() => unfollow(l.url)} aria-label={"Unfollow " + (l.title || l.url)}>Unfollow</button></div></article>)}</div>
      {!lists.length && <div className="manager-empty"><Icon name="connections" /><h2>Your sources, in one place</h2><p>Add a source above to browse its content and save it here for future checks.</p></div>}
    </> : <>
      <div className="following-source-heading"><button className="m-button" disabled={busy} onClick={() => { setCurrent(""); setNotice(""); setError(""); }}>← All sources</button><div><h2>{lists.find(l => l.url === current)?.title || "Source content"}</h2><p>{current}</p></div><button className="m-button" disabled={busy} onClick={() => load(current, true)}>Check for updates</button></div>
      <div className="following-toolbar"><div className="manager-search"><Icon name="search" /><input aria-label="Search source content" placeholder="Search this source…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className="m-button" disabled={busy || !selected.length} onClick={() => download(selected)}>Download selected ({selected.length})</button><button className="m-button primary" disabled={busy || !fresh.length} onClick={() => download(fresh.map(i => i.url))}>Download available ({fresh.length})</button></div>
      <nav className="utility-tabs following-status-tabs" aria-label="Source item status">{[["all", "All", items.length], ["available", "Available", fresh.length], ["downloaded", "Downloaded", downloaded.length], ["progress", "In progress", inProgress.length]].map(([id, label, count]) => <button key={id} className={statusFilter === id ? "active" : ""} aria-pressed={statusFilter === id} onClick={() => setStatusFilter(String(id))}>{label}<span>{count}</span></button>)}</nav>
      {!libraryReady && <p className="following-summary" role="status">Checking your library before enabling downloads…</p>}
      {busy && <p role="status">Working… Large sources can take a moment.</p>}
      {!busy && !items.length && <div className="manager-empty"><h2>No items returned</h2><p>Check the URL and your connections. Some sites do not support listing an entire account.</p><button className="m-button" onClick={() => load(current, true)}>Try again</button></div>}
      {!busy && items.length > 0 && !visible.length && <p>No items match your search.</p>}
      <div className="following-items">{visible.map((i, n) => {
        const state = stateFor(i), available = canDownload(i), saved = state === "Downloaded";
        return <div key={i.url + n} className={"following-item " + (saved ? "is-downloaded" : available ? "is-available" : "is-pending")}>
          {available ? <label><input type="checkbox" disabled={busy} checked={selected.includes(i.url)} onChange={() => { if (!canDownload(i)) return; setSelected(v => v.includes(i.url) ? v.filter(u => u !== i.url) : [...v, i.url]); }} /><span>{i.title || i.url}</span></label> : <div className="following-item-title"><span className="following-item-mark" aria-hidden="true">{saved ? <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9" /></svg> : <Icon name="download" />}</span><span>{i.title || i.url}</span></div>}
          <span className="following-item-status">{state}</span>
        </div>;
      })}</div>
    </>}
  </section>;
}
