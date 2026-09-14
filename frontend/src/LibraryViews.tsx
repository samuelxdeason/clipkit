import DetailDialog from "./DetailDialog";
import PersonAvatar from "./PersonAvatar";
import { useEffect, useState } from "react";
import { library } from "../wailsjs/go/models";
import { GetModelInfo, SaveModelInfo } from "./api";
import { Icon } from "./App";

type Video = library.Video;
export type OrganizeMode = "all" | "people" | "tags";
export function PersonHeader({ person, videos, media, onChanged }: { person: library.Model; videos: Video[]; media: (p: string) => string; onChanged: () => void }) {
  const [info, setInfo] = useState<library.ModelInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.nickname || person.name);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; GetModelInfo(person.name).then(i => { if (live) { setInfo(i); setBio(i?.bio || ""); setName(i?.nickname || person.nickname || person.name); } }).catch(e => { if (live) setError(String(e)); }); return () => { live = false; }; }, [person.name]);
  const save = async () => {
    setBusy(true); setError("");
    try { await SaveModelInfo(person.name, name.trim(), bio.trim(), info?.links || []); setInfo(i => ({ ...i, name: person.name, nickname: name.trim(), bio: bio.trim(), links: i?.links || [], cover: i?.cover || "" } as library.ModelInfo)); setEditing(false); onChanged(); }
    catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  };
  const hours = videos.reduce((n, v) => n + (v.duration || 0), 0) / 3600;
  return <section className="person-profile"><div className="profile-identity"><PersonAvatar className="profile-avatar" name={person.nickname || person.name} src={person.thumbnail ? media(person.thumbnail) : undefined} /><div className="profile-copy"><h1>{info?.nickname || person.nickname || person.name}</h1>{info?.bio && <p>{info.bio}</p>}<div className="profile-stats"><span><b>{videos.length}</b> video{videos.length === 1 ? "" : "s"}</span><span><b>{videos.filter(v => v.favorite).length}</b> favorite{videos.filter(v => v.favorite).length === 1 ? "" : "s"}</span><span><b>{hours >= 1 ? `${hours.toFixed(1)} hr` : `${Math.round(hours * 60)} min`}</b> in your library</span></div></div><button className="m-button" disabled={!info} onClick={() => { setName(info?.nickname || person.nickname || person.name); setBio(info?.bio || ""); setEditing(true); }}>Edit profile</button></div>{editing && <DetailDialog label="Edit profile" onClose={() => { if (!busy) setEditing(false); }} className="profile-editor-dialog"><form className="profile-edit" onSubmit={e => { e.preventDefault(); save(); }}><h2>Edit profile</h2><label>Display name<input aria-label="Display name" value={name} onChange={e => setName(e.target.value)} required /></label><label>About<textarea aria-label="About this person" value={bio} onChange={e => setBio(e.target.value)} rows={3} /></label><div className="dialog-actions"><button type="button" className="m-button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button><button className="m-button primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save profile"}</button></div>{error && <p className="profile-error" role="alert">{error}</p>}</form></DetailDialog>}{error && !editing && <p className="profile-error" role="alert">{error}</p>}</section>;
}

export function SmartView({ view, videos, mode, onMode, days, onDays }: { view: string; videos: Video[]; mode: OrganizeMode; onMode: (m: OrganizeMode) => void; days: number; onDays: (n: number) => void }) {
  const missingPeople = videos.filter(v => !v.people?.length).length;
  const missingTags = videos.filter(v => !v.labels?.length).length;
  const needsWork = videos.filter(v => !v.people?.length || !v.labels?.length).length;
  if (view === "unorganized") return <nav className="smart-view-controls" aria-label="Organization filters">{([["all", "All incomplete", needsWork], ["people", "Missing people", missingPeople], ["tags", "Missing tags", missingTags]] as [OrganizeMode, string, number][]).map(([id, label, count]) => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} onClick={() => onMode(id)}>{label}<span>{count}</span></button>)}</nav>;
  if (view === "recent") return <div className="smart-view-controls"><span>Added in the last</span><nav aria-label="Recently added period">{[7, 30, 90].map(n => <button key={n} aria-pressed={days === n} className={days === n ? "active" : ""} onClick={() => onDays(n)}>{n} days</button>)}</nav></div>;
  if (view === "favorites") return <p className="smart-view-caption">{videos.filter(v => v.favorite).length} favorite videos</p>;
  return null;
}

export function addedGroup(value: string) {
  const day = new Date(value.replace(" ", "T"));
  if (isNaN(day.getTime())) return "Date unknown";
  const today = new Date();
  if (day.toDateString() === today.toDateString()) return "Today";
  today.setDate(today.getDate() - 1);
  if (day.toDateString() === today.toDateString()) return "Yesterday";
  return day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

