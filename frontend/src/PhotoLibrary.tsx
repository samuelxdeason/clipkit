import { useEffect, useMemo, useState } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";
import DetailDialog from "./DetailDialog";

export function PhotoLibrary({ person = "", query, media, version, onChanged }: { person?: string; query: string; media: (p: string) => string; version: number; onChanged: () => void }) {
  const [photos, setPhotos] = useState<library.Photo[]>([]);
  const [album, setAlbum] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    let live = true; setLoading(true); setError("");
    (async () => {
      let result: library.Photo[] = [];
      if (person) result = await api.PhotosByModel(person) || [];
      else for (let offset = 0; ; offset += 120) { const batch = await api.AllPhotos(120, offset) || []; if (!live) return; result.push(...batch); if (batch.length < 120) break; }
      if (live) setPhotos(result);
    })().catch(e => { if (live) setError(String(e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [person, version]);
  const albums = useMemo(() => [...new Set(photos.map(p => p.album).filter(Boolean))].sort(), [photos]);
  const filtered = useMemo(() => photos.filter(p => (!album || p.album === album) && [p.filename, p.model, p.album].join(" ").toLowerCase().includes(query.toLowerCase())), [photos, query, album]);
  useEffect(() => { setIndex(null); }, [query, album, person]);
  const active = index === null ? null : filtered[index];
  useEffect(() => { if (!active) return; const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") { e.preventDefault(); setIndex(i => Math.min(filtered.length - 1, (i || 0) + 1)); } if (e.key === "ArrowLeft") { e.preventDefault(); setIndex(i => Math.max(0, (i || 0) - 1)); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [!!active, filtered.length]);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(""); try { await action(); setUrlOpen(false); onChanged(); } catch (e) { setError(String(e)); } finally { setBusy(false); } };
  return <section className="photo-library"><div className="photo-toolbar"><span>{filtered.length} photo{filtered.length === 1 ? "" : "s"}</span><select aria-label="Photo album" value={album} onChange={e => setAlbum(e.target.value)}><option value="">All albums</option>{albums.map(a => <option key={a}>{a}</option>)}</select><div><button className="m-button" onClick={() => setUrlOpen(!urlOpen)}>From a link</button><button className="m-button primary" disabled={busy} onClick={() => run(() => api.ImportPhotosDialog(person))}><Icon name="plus" />{busy ? "Importing…" : "Add photos"}</button></div></div>{urlOpen && <form className="photo-import-form" onSubmit={e => { e.preventDefault(); run(() => api.ImportPhotosFromURL(url, person, albumName)); }}><input type="url" required aria-label="Photo gallery URL" placeholder="Gallery URL" value={url} onChange={e => setUrl(e.target.value)} /><input aria-label="Album name" placeholder="Album name (optional)" value={albumName} onChange={e => setAlbumName(e.target.value)} /><button className="m-button" disabled={busy}>Import gallery</button></form>}{error && <p className="manager-alert" role="alert">{error}</p>}{loading ? <p className="photo-loading">Loading photos…</p> : filtered.length ? <div className="photo-library-grid">{filtered.map((p, i) => <button key={p.id} onClick={() => setIndex(i)} className="photo-tile"><img src={media(p.filepath)} alt="" loading="lazy" /><span>{p.filename}</span><small>{p.album || p.model || "Photo"}</small></button>)}</div> : <div className="manager-empty"><Icon name="photo" /><h2>{photos.length ? "No matching photos" : "Your photos belong here, too"}</h2><p>{photos.length ? "Try another search or album." : "Import photos from your device or a gallery link."}</p></div>}{active && <DetailDialog onClose={() => setIndex(null)} label={active.filename} className="photo-viewer"><header><strong>{active.filename}</strong><button onClick={() => setIndex(null)} aria-label="Close photo"><Icon name="x" /></button></header><img src={media(active.filepath)} alt={active.filename} /><footer><button className="m-button" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, (i || 0) - 1))}>← Previous</button><span>{(index || 0) + 1} / {filtered.length} · {active.album || "Photos"}</span><button className="m-button" disabled={index === filtered.length - 1} onClick={() => setIndex(i => Math.min(filtered.length - 1, (i || 0) + 1))}>Next →</button></footer></DetailDialog>}</section>;
}

export function PersonAccounts({ person, query, onChanged }: { person: string; query: string; onChanged: () => void }) {
  const [accounts, setAccounts] = useState<api.AccountInfo[]>([]);
  const [available, setAvailable] = useState<api.AccountInfo[]>([]);
  const [url, setUrl] = useState("");
  const [account, setAccount] = useState("");
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let live = true; setLoading(true); Promise.all([api.AccountsForPerson(person), api.AllAccounts()]).then(([rows, all]) => { if (live) { setAccounts(rows || []); setAvailable((all || []).filter(a => !a.person)); } }).catch(e => { if (live) setError(String(e)); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [person, version]);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(""); try { await action(); setVersion(v => v + 1); onChanged(); setUrl(""); setAccount(""); } catch (e) { setError(String(e)); } finally { setBusy(false); } };
  return <section className="person-accounts"><h2>Connected accounts</h2><p>Connect the accounts this person uses. Their uploads will appear in this profile.</p>{error && <div className="manager-alert" role="alert">{error}</div>}{loading ? <p>Loading accounts…</p> : <div className="account-list">{accounts.filter(a => [a.platform, a.handle, a.displayName].join(" ").toLowerCase().includes(query.toLowerCase())).map(a => <div className="account-row" key={`${a.platform}/${a.handle}`}><span className="setting-icon"><Icon name="connections" /></span><div><strong>{a.displayName || a.handle}</strong><small>{a.platform} · @{a.handle}</small></div>{/^https?:\/\//i.test(a.url) && <a className="m-button" href={a.url} target="_blank" rel="noreferrer">View account ↗</a>}<button className="m-button" disabled={busy} onClick={() => run(() => api.ConnectAccount(a.platform, a.handle, ""))}>Disconnect</button></div>)}{!accounts.length && <p className="photo-loading">No accounts connected yet.</p>}</div>}<div className="account-connect"><h3>Connect an account</h3><form onSubmit={e => { e.preventDefault(); run(() => api.CreateAccount(url, person)); }}><input type="url" required aria-label="Account profile URL" placeholder="Paste an account profile URL…" value={url} onChange={e => setUrl(e.target.value)} /><button className="m-button primary" disabled={busy || !url.trim()}>Connect URL</button></form>{available.length > 0 && <form onSubmit={e => { e.preventDefault(); const a = available.find(a => JSON.stringify([a.platform, a.handle]) === account); if (a) run(() => api.ConnectAccount(a.platform, a.handle, person)); }}><select aria-label="Existing unassigned account" value={account} onChange={e => setAccount(e.target.value)}><option value="">Choose an unassigned account…</option>{available.map(a => <option key={`${a.platform}/${a.handle}`} value={JSON.stringify([a.platform, a.handle])}>{a.platform} · {a.handle}</option>)}</select><button className="m-button" disabled={busy || !account}>Connect account</button></form>}</div></section>;
}

