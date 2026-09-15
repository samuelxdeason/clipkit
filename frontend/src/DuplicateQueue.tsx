import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";
import { videoKey, formatBytes, comparisonRows } from "./duplicateComparison";

export default function DuplicateQueue({ version, media, onChanged, onPlay }: {
  version: number; media: (path: string) => string; onChanged: () => void;
  onPlay: (v: library.Video, list: library.Video[]) => void;
}) {
  const [groups, setGroups] = useState<api.DuplicateGroup[]>([]);
  const [activeID, setActiveID] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [recycleFolder, setRecycleFolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const resolved = useRef(new Set<number>());
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const index = Math.max(0, groups.findIndex(g => g.id === activeID));
  const group = groups[index];
  useEffect(() => {
    let cancelled = false;
    setError("");
    Promise.all([api.DuplicateGroups(), api.DuplicateRecycleFolder()]).then(([data, folder]) => {
      if (!cancelled) { setGroups(data.filter(g => !resolved.current.has(g.id))); setRecycleFolder(folder); }
    }).catch(e => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version, retry]);
  useEffect(() => {
    if (group && activeID !== group.id) setActiveID(group.id);
    if (moveFocus.current) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "nearest" });
      moveFocus.current = false;
    }
  }, [group?.id, activeID]);
  const navigate = (id: number) => { moveFocus.current = true; setActiveID(id); };
  const save = async (keep: library.Video[]) => {
    if (!group || busy) return;
    setBusy(true); setError("");
    try {
      await api.ResolveDuplicateGroup(group.id, keep);
      resolved.current.add(group.id);
      const removed = group.videos.length - keep.length;
      setNotice(removed ? `Kept ${keep.length}. Moved ${removed} video${removed === 1 ? "" : "s"} to Recycle bin.` : `Kept all ${keep.length} videos. Group cleared.`);
      setReviewed(n => n + 1);
      const next = groups[index + 1] || groups[index - 1];
      moveFocus.current = true;
      setActiveID(next?.id ?? null);
      setGroups(current => current.filter(g => g.id !== group.id));
      setDrafts(current => { const next = { ...current }; delete next[group.id]; return next; });
      onChanged();
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };
  if (loading) return <p role="status">Loading potential duplicates…</p>;
  return <section className="duplicate-queue" aria-label="Potential duplicate review queue" aria-busy={busy}>
    <div className="dq-intro"><p>Compare the copies. Choose what stays.</p><details className="dq-recycle-info"><summary><Icon name="folder" />About recycling</summary><div><strong>Your files stay on this drive</strong><p>Recycled videos leave your library and move here. Delete them manually later to free space.</p><code>{recycleFolder || "Folder unavailable"}</code></div></details></div>
    {notice && <div className="dq-notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><Icon name="x" /></button></div>}
    {error && <div className="manager-alert" role="alert">{error}<button disabled={busy} onClick={() => setRetry(n => n + 1)}>Refresh queue</button></div>}
    {group ? <>
      <nav className="dq-navigation" aria-label="Review groups">
        <div className="dq-progress"><strong>{groups.length} group{groups.length === 1 ? "" : "s"} left</strong>{reviewed > 0 && <span>{reviewed} reviewed this session</span>}</div>
        <div className="dq-pager"><button className="m-button" aria-label="Previous group" disabled={busy || index === 0} onClick={() => navigate(groups[index - 1].id)}>←</button><label><span className="sr-only">Jump to group</span><select value={group.id} disabled={busy} onChange={e => navigate(Number(e.target.value))}>{groups.map((g, i) => <option key={g.id} value={g.id}>Group {i + 1} of {groups.length} · {g.videos.length} videos</option>)}</select></label><button className="m-button" aria-label="Next group" disabled={busy || index === groups.length - 1} onClick={() => navigate(groups[index + 1].id)}>→</button></div>
      </nav>
      <ReviewGroup heading={heading} key={group.id} group={group} media={media} onPlay={onPlay} busy={busy} keep={drafts[group.id] ?? group.videos.map(videoKey)} onKeep={keys => setDrafts(current => ({ ...current, [group.id]: keys }))} onSave={save} onSkip={() => navigate(groups[(index + 1) % groups.length].id)} canSkip={groups.length > 1} />
    </> : !error && <div className="manager-empty dq-empty"><Icon name="film" /><h2 ref={heading} tabIndex={-1}>{reviewed ? "All reviewed" : "No potential duplicates"}</h2><p>{reviewed ? "Your decisions are saved. Recycled files stay in the Recycle bin folder until you delete them." : "Select two or more videos in your library, then choose “Mark as potential duplicates”."}</p></div>}
  </section>;
}

function ReviewGroup({ heading, group, media, onPlay, keep, onKeep, busy, onSave, onSkip, canSkip }: {
  heading: RefObject<HTMLHeadingElement>; group: api.DuplicateGroup; media: (path: string) => string;
  onPlay: (v: library.Video, list: library.Video[]) => void;
  keep: string[]; onKeep: (keys: string[]) => void; busy: boolean;
  onSave: (keep: library.Video[]) => Promise<void>; onSkip: () => void; canSkip: boolean;
}) {
  const [details, setDetails] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewErrors, setPreviewErrors] = useState<Set<string>>(new Set());
  const table = useRef<HTMLTableElement>(null);
  const selected = group.videos.filter(v => keep.includes(videoKey(v)));
  const discarded = group.videos.filter(v => !keep.includes(videoKey(v)));
  const recycledBytes = discarded.reduce((n, v) => n + (v.filesize || 0), 0);
  const rows = comparisonRows(group.videos);
  const pausePreviews = () => table.current?.querySelectorAll("video").forEach(v => { v.pause(); v.removeAttribute("src"); v.load(); });
  const save = (videos: library.Video[]) => { pausePreviews(); setPreview(false); void onSave(videos); };
  return <div className="dq-review">
    <div className="dq-compare-tools"><h2 ref={heading} tabIndex={-1} className="dq-group-heading">Compare {group.videos.length} videos</h2><div><button className={`m-button ${preview ? "pressed" : ""}`} aria-pressed={preview} disabled={busy} onClick={() => setPreview(v => !v)}>{preview ? "Show thumbnails" : "Preview side by side"}</button><button className={`m-button ${details ? "pressed" : ""}`} aria-pressed={details} onClick={() => setDetails(v => !v)}>{details ? "Fewer details" : "More details"}</button></div></div>
    <div className="dq-table-scroll" tabIndex={0} role="region" aria-label="Video comparison. Scroll horizontally to see more copies.">
      <table className="dq-table" ref={table} style={{ "--dq-columns": group.videos.length } as CSSProperties}>
        <caption className="sr-only">Compare resolution, duration, file size, and metadata. Highest resolution describes pixel count, not verified image quality.</caption>
        <thead><tr><th scope="col" className="dq-row-label"><span>Copies</span><small>Play to check the content.</small></th>{group.videos.map((v, i) => <th scope="col" key={videoKey(v)} className={keep.includes(videoKey(v)) ? "dq-kept" : "dq-recycled"}>
          <div className="dq-copy-heading"><span>Copy {i + 1}</span><span className={`dq-status ${keep.includes(videoKey(v)) ? "keep" : "recycle"}`}>{keep.includes(videoKey(v)) ? "✓ Keep" : "Recycle"}</span></div>
          <div className="dq-preview">{preview && previewErrors.has(videoKey(v)) ? <span className="dq-preview-error" role="status">Preview unavailable for this file.</span> : preview ? <video src={media(v.filepath)} poster={v.thumbnail ? media(v.thumbnail) : undefined} controls preload="metadata" playsInline aria-label={`Preview copy ${i + 1}`} onError={() => setPreviewErrors(current => new Set([...current, videoKey(v)]))} onPlay={e => { const current = e.currentTarget; table.current?.querySelectorAll("video").forEach(el => { if (el !== current) el.pause(); }); }} /> : <button aria-label={`Play copy ${i + 1}: ${v.title || v.filename}`} disabled={busy} onClick={() => onPlay(v, group.videos)}>{v.thumbnail ? <img src={media(v.thumbnail)} alt="" /> : <Icon name="film" />}<span className="dq-play">▶ Play</span></button>}</div>
          <strong className="dq-video-title" title={v.title || v.filename}>{v.title || v.filename || "Untitled video"}</strong>
          <div className="dq-choice"><label className={keep.includes(videoKey(v)) ? "is-kept" : "is-recycled"}><input aria-label={`Keep copy ${i + 1}`} type="checkbox" checked={keep.includes(videoKey(v))} disabled={busy} onChange={() => onKeep(keep.includes(videoKey(v)) ? keep.filter(k => k !== videoKey(v)) : [...keep, videoKey(v)])} /><span className="dq-choice-copy"><strong>{keep.includes(videoKey(v)) ? "Keep this video" : "Recycle this video"}</strong><small>{keep.includes(videoKey(v)) ? "Stays in your library" : "Moves to Recycle bin when saved"}</small></span></label><button disabled={busy || selected.length === 1 && keep.includes(videoKey(v))} onClick={() => onKeep([videoKey(v)])} aria-label={`Keep only copy ${i + 1}`}>Keep only this</button></div>
        </th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.cells.map((cell, i) => <td key={videoKey(group.videos[i])} className={keep.includes(videoKey(group.videos[i])) ? "dq-kept" : "dq-recycled"}><strong>{cell.value}</strong>{cell.note && <small className={cell.highlight ? "dq-highlight" : ""}>{cell.note}</small>}</td>)}</tr>)}
          {details && <>
            <tr><th scope="row">Added</th>{group.videos.map(v => <td key={videoKey(v)}>{v.added && !Number.isNaN(Date.parse(v.added.replace(" ", "T"))) ? new Date(v.added.replace(" ", "T")).toLocaleDateString() : "Unknown"}</td>)}</tr>
            <tr><th scope="row">People</th>{group.videos.map(v => <td key={videoKey(v)}>{v.people?.join(", ") || "None assigned"}</td>)}</tr>
            <tr><th scope="row">Tags</th>{group.videos.map(v => <td key={videoKey(v)}>{v.labels?.join(", ") || "No tags"}</td>)}</tr>
            <tr><th scope="row">Filename</th>{group.videos.map(v => <td key={videoKey(v)} className="dq-path">{v.filename || "Unknown"}</td>)}</tr>
            <tr><th scope="row">Location</th>{group.videos.map(v => <td key={videoKey(v)} className="dq-path">{v.filepath || "Unknown"}</td>)}</tr>
          </>}
        </tbody>
      </table>
    </div>
    <p className="dq-comparison-note">Higher resolution and larger files don’t always mean better quality. Preview the content before choosing.{group.videos.length > 2 && " Scroll sideways to compare every copy."}</p>
    <div className="dq-decision-bar"><div className="dq-decision-summary"><strong>{selected.length} to keep <span>·</span> {discarded.length} to recycle</strong><small>{!selected.length ? "Choose at least one video to keep." : discarded.length ? `${recycledBytes ? formatBytes(recycledBytes) + (discarded.some(v => !v.filesize) ? "+" : "") + " will move to Recycle bin. " : ""}Files are not permanently deleted.` : "All copies are currently marked to keep."}</small></div><div className="dq-decision-actions"><button className="m-button" disabled={busy || !canSkip} onClick={onSkip}>Skip for now</button><button className="m-button" disabled={busy} onClick={() => save(group.videos)}>Keep all</button><button className="m-button primary" disabled={busy || !selected.length || !discarded.length} onClick={() => save(selected)}>{busy ? "Saving…" : canSkip ? "Save & next" : "Save & finish"}</button></div></div>
  </div>;
}
