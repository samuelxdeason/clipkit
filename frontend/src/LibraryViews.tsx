import PersonAvatar from "./PersonAvatar";
import { useEffect, useState } from "react";
import { library } from "../wailsjs/go/models";
import { GetModelInfo, SaveModelInfo } from "./api";
import { Icon } from "./App";

type Video = library.Video;
export type OrganizeMode = "all" | "people" | "tags";
export function PersonHeader({ person, videos, media, onBack, onChanged }: { person: library.Model; videos: Video[]; media: (p: string) => string; onBack: () => void; onChanged: () => void }) {
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
  return <section className="person-profile"><button className="profile-back" onClick={onBack}>← People</button><div className="profile-identity"><PersonAvatar className="profile-avatar" name={person.nickname || person.name} src={person.thumbnail ? media(person.thumbnail) : undefined} /><div className="profile-copy"><span className="profile-eyebrow">PERSON</span><h1>{info?.nickname || person.nickname || person.name}</h1><p>{info?.bio || "A dedicated home for their videos."}</p><div className="profile-stats"><span><b>{videos.length}</b> video{videos.length === 1 ? "" : "s"}</span><span><b>{videos.filter(v => v.favorite).length}</b> favorite{videos.filter(v => v.favorite).length === 1 ? "" : "s"}</span><span><b>{hours >= 1 ? `${hours.toFixed(1)} hr` : `${Math.round(hours * 60)} min`}</b> in your library</span></div></div><button className="m-button" disabled={!info} onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit profile"}</button></div>{editing && <form className="profile-edit" onSubmit={e => { e.preventDefault(); save(); }}><label>Display name<input aria-label="Display name" value={name} onChange={e => setName(e.target.value)} required /></label><label>About<textarea aria-label="About this person" value={bio} onChange={e => setBio(e.target.value)} rows={3} /></label><button className="m-button primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save profile"}</button></form>}{error && <p className="profile-error" role="alert">{error}</p>}</section>;
}

export function SmartView({ view, videos, mode, onMode, days, onDays }: { view: string; videos: Video[]; mode: OrganizeMode; onMode: (m: OrganizeMode) => void; days: number; onDays: (n: number) => void }) {
  const missingPeople = videos.filter(v => !v.people?.length).length;
  const missingTags = videos.filter(v => !v.labels?.length).length;
  const needsWork = videos.filter(v => !v.people?.length || !v.labels?.length).length;
  const complete = videos.length ? Math.round((videos.length - needsWork) / videos.length * 100) : 0;
  if (view === "unorganized") return <section className="organize-overview"><div className="organize-summary"><span className="smart-symbol amber"><Icon name="grid" /></span><div><h2>A little attention. A better library.</h2><p>Select videos below to assign people or add tags together.</p></div><div className="organize-completion"><strong>{complete}%</strong><span>organized</span></div></div><div className="organize-segments">{([["all", "To organize", needsWork], ["people", "Missing people", missingPeople], ["tags", "Missing tags", missingTags]] as [OrganizeMode, string, number][]).map(([id, label, count]) => <button key={id} aria-pressed={mode === id} className={mode === id ? "active" : ""} onClick={() => onMode(id)}><span>{label}</span><strong>{count}</strong><span className="segment-arrow">↗</span></button>)}</div></section>;
  if (view === "recent") return <section className="recent-overview"><span className="smart-symbol blue"><Icon name="clock" /></span><div><h2>Fresh additions, in order.</h2><p>Browse your latest saves by the day they arrived.</p></div><div className="utility-tabs" aria-label="Recently added period">{[7, 30, 90].map(n => <button key={n} aria-pressed={days === n} className={days === n ? "active" : ""} onClick={() => onDays(n)}>{n} days</button>)}</div></section>;
  if (view === "favorites") return <section className="favorites-overview"><span className="smart-symbol rose"><Icon name="heart-fill" /></span><div><h2>Worth coming back to.</h2><p>Your favorites, gathered in one place. Ready whenever you are.</p></div><span className="favorites-count">{videos.filter(v => v.favorite).length}<small>saved favorites</small></span></section>;
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

