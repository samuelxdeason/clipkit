import { isInLibrary, libraryIndex, sourceKeys, accountLookup } from "./followingIdentity";
import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { downloader, library } from "../wailsjs/go/models";
import { Icon } from "./App";
import PersonAvatar from "./PersonAvatar";
const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Source"; } };
const safeLink = (url: string) => /^https?:\/\//i.test(url);
const checkedAt = (value?: string) => value && !isNaN(Date.parse(value)) ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not checked yet";
const duration = (seconds: number) => Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
function SavedThumbnail({ src }: { src?: string }) {
 const [failed, setFailed] = useState(false);
 return src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : <Icon name="film" />;
}

export default function Following({ onDownloads, queue, onQueued, version, videos, libraryReady, people, media, onPlay, onPerson }: { people: library.Model[]; media: (path: string) => string; onPlay: (video: library.Video, queue: library.Video[]) => void; onPerson: (person: library.Model) => void; videos: library.Video[]; libraryReady: boolean; version: number; onDownloads: () => void; queue: downloader.Job[]; onQueued: () => void }) {
  const [accounts, setAccounts] = useState<api.AccountInfo[]>([]);
  const [sourceSearch, setSourceSearch] = useState("");
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
  const [itemLimit, setItemLimit] = useState(100);
  const [listsLoading, setListsLoading] = useState(true);
  const [sourceRetry, setSourceRetry] = useState(0);
  useEffect(() => { let live = true; api.AllAccounts().then(a => { if (live) setAccounts(a || []); }).catch(() => { if (live) setError("Could not load account connections. Refresh Following to see associated people."); }); return () => { live = false; }; }, [version]);
  const accountFor = useMemo(() => accountLookup(accounts), [accounts]);
  const peopleByName = useMemo(() => new Map(people.map(p => [p.name, p])), [people]);
  const personFor = (source: string) => peopleByName.get(accountFor(source)?.person || "");
  const savedVideos = useMemo(() => { const map = new Map<string, library.Video>(); for (const video of videos) for (const key of sourceKeys(video)) map.set(key, video); return map; }, [videos]);
  const videoFor = (item: downloader.RemoteItem) => sourceKeys(item).map(key => savedVideos.get(key)).find(Boolean);
  const avatar = (source: string) => { const person = personFor(source); return <PersonAvatar className="following-avatar" name={person?.nickname || person?.name || accountFor(source)?.displayName || hostOf(source)} src={person?.thumbnail ? media(person.thumbnail) : undefined} />; };
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
  useEffect(() => { let live = true; setListsLoading(true); setError(""); api.SyncedLists().then(v => { if (live) setLists(v || []); }).catch(e => { if (live) setError(String(e)); }).finally(() => { if (live) setListsLoading(false); }); return () => { live = false; request.current++; }; }, [sourceRetry]);
  useEffect(() => { setItemLimit(100); }, [current, query, statusFilter]);
  const load = async (source: string, refresh = false) => {
    const id = ++request.current;
    setBusy(true); setError(""); setNotice(""); setCurrent(source); setItems([]); setSelected([]); setQuery(""); setStatusFilter("all");
    try { const result = await api.Enumerate(source, refresh); if (id !== request.current) return; setItems(result || []); void api.SyncedLists().then(saved => { if (id === request.current) setLists(saved || []); }).catch(e => { if (id === request.current) setError(String(e)); }); }
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
  const visible = items.filter(i => (statusFilter === "all" || statusFilter === "available" && canDownload(i) || statusFilter === "downloaded" && stateFor(i) === "Downloaded" || statusFilter === "progress" && inProgress.includes(i)) && [i.title, i.url, videoFor(i)?.title, videoFor(i)?.source_title].join(" ").toLowerCase().includes(query.toLowerCase()));
  const playback = items.map(videoFor).filter((v): v is library.Video => !!v);
  return <section className="following-page">
    <div className="following-queue-link"><span>{queue.filter(j => j.status === "queued" || j.status === "downloading").length} active downloads</span><button className="m-button" onClick={onDownloads}><Icon name="download" />Open downloads</button></div>
    {error && <div className="manager-alert" role="alert">{error}<button onClick={() => current ? load(current, true) : setSourceRetry(v => v + 1)}>Retry</button></div>}
    {notice && <div className="manager-notice" role="status">{notice}<button onClick={onDownloads}>View downloads →</button></div>}
    {!current ? <>
      <form className="following-add" onSubmit={e => { e.preventDefault(); if (url.trim()) load(url.trim(), true); }}><label htmlFor="following-url">Follow a source</label><div><input id="following-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a profile, channel, playlist, or favorites URL…" /><button className="m-button primary" disabled={busy || !url.trim()}>Load source</button></div><p>Browse everything available from a supported source, then choose what to download. Private content may need a connection in Settings.</p></form>
      <div className="following-directory-toolbar"><div className="manager-search"><Icon name="search" /><input aria-label="Search followed sources" placeholder="Search sources or people…" value={sourceSearch} onChange={e => setSourceSearch(e.target.value)} /></div><span>{lists.length} saved sources</span></div>
      <div className="following-sources">{lists.filter(l => [l.title, l.url, personFor(l.url)?.name, personFor(l.url)?.nickname].join(" ").toLowerCase().includes(sourceSearch.toLowerCase())).map(l => {
        const person = personFor(l.url), account = accountFor(l.url);
        return <article key={l.url}>{avatar(l.url)}<div className="following-source-copy"><button className="following-source-name" onClick={() => load(l.url)} disabled={busy}>{person?.nickname || person?.name || account?.displayName || l.title || hostOf(l.url)}</button><p>{hostOf(l.url)}{account?.handle ? " · @" + account.handle : ""}{l.kind ? " · " + l.kind : ""}</p>{person && l.title && <p className="following-source-description">{l.title}</p>}<small>{l.count} videos · {l.owned} downloaded · {l.new} available</small><small className="following-checked">Last checked: {checkedAt(l.fetchedAt)}</small></div><div className="following-source-actions">{person && <button className="m-button" onClick={() => onPerson(person)}>View person</button>}<button className="m-button" disabled={busy} onClick={() => load(l.url)}>Browse</button><button className="m-button" disabled={busy} onClick={() => load(l.url, true)}>Check for updates</button><button className="clear-filters" disabled={busy} onClick={() => unfollow(l.url)} aria-label={"Unfollow " + (l.title || l.url)}>Unfollow</button></div></article>;
      })}</div>
      {!!lists.length && !lists.some(l => [l.title, l.url, personFor(l.url)?.name, personFor(l.url)?.nickname].join(" ").toLowerCase().includes(sourceSearch.toLowerCase())) && <div className="manager-empty"><h2>No matching sources</h2><p>Try a person’s name, source name, or website.</p></div>}
      {listsLoading && <p role="status">Loading followed sources…</p>}
      {!listsLoading && !error && !lists.length && <div className="manager-empty"><Icon name="connections" /><h2>Your sources, in one place</h2><p>Add a source above to browse its content and save it here for future checks.</p></div>}
    </> : <>
      <button className="m-button following-back" disabled={busy} onClick={() => { setCurrent(""); setItems([]); setSelected([]); setNotice(""); setError(""); }}>← All sources</button>
      <div className="following-source-heading">{avatar(current)}<div><h2>{personFor(current)?.nickname || personFor(current)?.name || lists.find(l => l.url === current)?.title || "Source content"}</h2><p>{current}</p><small>Last checked: {checkedAt(lists.find(l => l.url === current)?.fetchedAt)}</small></div><div className="following-source-actions">{personFor(current) && <button className="m-button" onClick={() => onPerson(personFor(current)!)}>View person</button>}{safeLink(current) && <a className="m-button" href={current} target="_blank" rel="noreferrer">Open source ↗</a>}<button className="m-button" disabled={busy} onClick={() => load(current, true)}>Check for updates</button></div></div>
      <nav className="utility-tabs following-status-tabs" aria-label="Source item status">{[["all", "All", items.length], ["available", "Available", fresh.length], ["downloaded", "Downloaded", downloaded.length], ["progress", "In progress", inProgress.length]].map(([id, label, count]) => <button key={id} className={statusFilter === id ? "active" : ""} aria-pressed={statusFilter === id} onClick={() => setStatusFilter(String(id))}>{label}<span>{count}</span></button>)}</nav>
      <div className="following-toolbar"><div className="manager-search"><Icon name="search" /><input aria-label="Search source content" placeholder="Search this source…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className="m-button" disabled={busy || !selected.length} onClick={() => download(selected)}>Download selected ({selected.length})</button><button className="m-button primary" disabled={busy || !fresh.length} onClick={() => download(fresh.map(i => i.url))}>Download available ({fresh.length})</button></div>
      {!libraryReady && <p className="following-summary" role="status">Checking your library before enabling downloads…</p>}
      {busy && <p role="status">Working… Large sources can take a moment.</p>}
      {!busy && !error && !items.length && <div className="manager-empty"><h2>No items returned</h2><p>Check the URL and your connections. Some sites do not support listing an entire account.</p><button className="m-button" onClick={() => load(current, true)}>Try again</button></div>}
      {!busy && items.length > 0 && !visible.length && <p>No items match your search.</p>}
      <div className="following-items">{visible.slice(0, itemLimit).map((i, n) => {
        const state = stateFor(i), available = canDownload(i), saved = state === "Downloaded", video = videoFor(i);
        const title = video?.title || i.title || i.url;
        return <div key={i.url + n} className={"following-item following-media-item " + (saved ? "is-downloaded" : available ? "is-available" : "is-pending")}>
          {available ? <input className="following-select" type="checkbox" aria-label={"Select " + title} disabled={busy} checked={selected.includes(i.url)} onChange={() => { if (canDownload(i)) setSelected(v => v.includes(i.url) ? v.filter(u => u !== i.url) : [...v, i.url]); }} /> : <span className="following-item-mark" aria-label={saved ? "Downloaded" : state}>{saved ? <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9" /></svg> : <Icon name="download" />}</span>}
          {video ? <button className="following-thumbnail" aria-label={"Play " + title} onClick={() => onPlay(video, playback)}><SavedThumbnail key={video.thumbnail} src={video.thumbnail ? media(video.thumbnail) : undefined} /><span className="following-thumbnail-play"><Icon name="play-fill" /></span></button> : <div className="following-thumbnail is-placeholder"><Icon name="film" /></div>}
          <div className="following-media-copy">{video ? <button className="following-video-title" onClick={() => onPlay(video, playback)}>{title}</button> : <button className="following-video-title" disabled={!available || busy} onClick={() => { if (available) setSelected(v => v.includes(i.url) ? v.filter(u => u !== i.url) : [...v, i.url]); }}>{title}</button>}
          {video?.source_title && video.source_title !== title && <p className="following-original" title={video.source_title}>Original: {video.source_title}</p>}
          <p>{[video?.site || hostOf(i.url), video?.duration ? duration(video.duration) : "", video?.height ? video.height + "p" : "", video?.filesize ? Math.round(video.filesize / 1048576) + " MB" : ""].filter(Boolean).join(" · ")}</p>
          {!!video?.people?.length && <p>{video.people.map(name => peopleByName.get(name)?.nickname || name).join(", ")}</p>}
          </div><div className="following-media-actions"><span className="following-item-status">{state}</span>{video ? <button className="m-button" onClick={() => onPlay(video, playback)}><Icon name="play-fill" />Play</button> : safeLink(i.url) && <a className="following-source-link" href={i.url} target="_blank" rel="noreferrer">View source ↗</a>}</div>
        </div>;
      })}</div>
      {visible.length > itemLimit && <button className="m-button" onClick={() => setItemLimit(limit => limit + 100)}>Show more ({Math.min(itemLimit, visible.length)} of {visible.length})</button>}
    </>}
  </section>;
}
