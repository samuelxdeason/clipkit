import { Button, IconButton } from "./UIControls";
import { useEffect, useRef, useState } from "react";
import { library } from "../wailsjs/go/models";
import * as api from "./api";
import PersonAvatar from "./PersonAvatar";
import RedownloadControl from "./RedownloadControl";

export type WatchTab = "people" | "tags" | "collections" | "file";
const names: Record<WatchTab, string> = { people: "People", tags: "Tags", collections: "Collections", file: "File" };

export default function WatchOrganizer({ video, tab, onTab, onClose, onChanged, media }: {
  video: library.Video; tab: WatchTab; onTab: (tab: WatchTab) => void; onClose: () => void;
  onChanged: () => void; media: (path: string) => string;
}) {
  const [people, setPeople] = useState<library.Model[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [collections, setCollections] = useState<api.Album[]>([]);
  const [models, setModels] = useState(video.models || []);
  const [labels, setLabels] = useState(video.labels || []);
  const [memberships, setMemberships] = useState<number[]>([]);
  const [automatic] = useState((video.people || []).filter(p => !(video.models || []).includes(p)));
  const [favorite, setFavorite] = useState(video.favorite);
  const [title, setTitle] = useState(video.title || video.filename);
  const [savedTitle, setSavedTitle] = useState(video.title || video.filename);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<null | (() => Promise<void>)>(null);

  useEffect(() => {
    let live = true;
    setLoading(true); setLoadError("");
    Promise.all([api.Models(), api.AllLabels(), api.Collections(), api.CollectionsForVideo(video.site, video.id)])
      .then(([p, t, c, m]) => { if (live) { setPeople(p || []); setTags(t || []); setCollections(c || []); setMemberships(m || []); } })
      .catch(() => { if (live) setLoadError("Couldn’t load your library. Your video can keep playing."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [video.site, video.id, attempt]);
  useEffect(() => { setQuery(""); }, [tab]);

  const perform = async (action: () => Promise<void>, message: string, reverse?: () => Promise<void>) => {
    if (guard.current) return;
    guard.current = true; setBusy(true); setError("");
    try {
      await action(); setNotice(message); setUndo(reverse ? () => reverse : null); onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t save. Please try again."); }
    finally { guard.current = false; setBusy(false); }
  };
  const savePeople = async (next: string[]) => { await api.SetModels(video.site, video.id, next); setModels(next); };
  const saveTags = async (next: string[]) => { await api.SetLabels(video.site, video.id, next); setLabels(next); };
  const togglePerson = (name: string) => {
    const before = models, linked = before.includes(name);
    perform(() => savePeople(linked ? before.filter(p => p !== name) : [...before, name]), linked ? "Person removed." : "Person linked to this video.", () => savePeople(before));
  };
  const toggleTag = (name: string) => {
    const before = labels, linked = before.includes(name);
    perform(() => saveTags(linked ? before.filter(p => p !== name) : [...before, name]), linked ? "Tag removed." : "Tag added.", () => saveTags(before));
  };
  const saveCollection = async (id: number, add: boolean) => {
    if (add) await api.AddToCollection(id, video.site, video.id);
    else await api.RemoveFromCollection(id, video.site, video.id);
    setMemberships(ids => add ? [...new Set([...ids, id])] : ids.filter(n => n !== id));
  };
  const term = query.trim(), lower = term.toLocaleLowerCase();
  const allPeople = [...new Set([...models, ...automatic, ...people.map(p => p.name)])].map(name => ({ name, person: people.find(p => p.name === name) }));
  const allTags = [...new Set([...labels, ...tags])];
  const visibleCollections = collections.filter(c => !c.locked && !c.inheritedLocked);
  const matchingPeople = allPeople.filter(p => `${p.name} ${p.person?.nickname || ""}`.toLocaleLowerCase().includes(lower))
    .sort((a, b) => Number(models.includes(b.name) || automatic.includes(b.name)) - Number(models.includes(a.name) || automatic.includes(a.name)) || a.name.localeCompare(b.name));
  const matchingTags = allTags.filter(t => t.toLocaleLowerCase().includes(lower)).sort((a,b) => Number(labels.includes(b)) - Number(labels.includes(a)) || a.localeCompare(b));
  const matchingCollections = visibleCollections.filter(c => c.name.toLocaleLowerCase().includes(lower)).sort((a,b) => Number(memberships.includes(b.id)) - Number(memberships.includes(a.id)) || a.name.localeCompare(b.name));
  const canCreate = term && (tab === "people" ? !allPeople.some(p => [p.name, p.person?.nickname].some(n => n?.toLocaleLowerCase() === lower)) : tab === "tags" ? !allTags.some(t => t.toLocaleLowerCase() === lower) : !collections.some(c => c.name.toLocaleLowerCase() === lower));
  const create = () => {
    if (!canCreate) return;
    const before = tab === "people" ? models : labels;
    let createdCollection = 0;
    perform(async () => {
      if (tab === "people") {
        await api.CreatePerson(term);
        setPeople(ps => [...ps, new library.Model({ name: term, nickname: "" })]);
        await savePeople([...new Set([...models, term])]);
      } else if (tab === "tags") {
        await saveTags([...labels, term]); setTags(ts => [...new Set([...ts, term])]);
      } else {
        createdCollection = await api.CreateAlbum(term);
        setCollections(cs => [...cs, { id: createdCollection, name: term, parentId: 0 } as api.Album]);
        await saveCollection(createdCollection, true);
      }
      setQuery("");
    }, tab === "people" ? "Person created and linked." : tab === "tags" ? "Tag created and added." : "Collection created and video added.",
    () => tab === "people" ? savePeople(before) : tab === "tags" ? saveTags(before) : saveCollection(createdCollection, false));
  };
  const disabled = busy || loading || !!loadError;
  return <section className="watch-organizer" aria-label="Organize this video" aria-busy={busy}>
    <header className="wo-heading"><div><span>YOUR LIBRARY</span><h3>Make it yours</h3></div><IconButton type="button" onClick={onClose} label="Close organization panel">×</IconButton></header>
    <nav className="wo-tabs" aria-label="Video information sections">{(Object.keys(names) as WatchTab[]).map(t => <button type="button" key={t} aria-pressed={tab === t} onClick={() => onTab(t)}>{names[t]}</button>)}</nav>
    <div className="wo-feedback" aria-live="polite">{busy ? "Saving…" : notice || "Changes save automatically."}{undo && !busy && <button type="button" onClick={() => perform(undo, "Change undone.")}>Undo</button>}</div>
    {error && <p className="wo-error" role="alert">{error}</p>}
    {tab !== "file" ? <>
      <div className="wo-intro"><h4>{tab === "people" ? "Who’s in this video?" : tab === "tags" ? "Make it easy to find" : "Find a home for this video"}</h4><p>{tab === "people" ? "Link anyone you recognize. Select again to unlink." : tab === "tags" ? "Add a few useful labels. Select again to remove." : "Add to as many collections as you like."}</p></div>
      <form className="wo-search" onSubmit={e => { e.preventDefault(); if (!disabled) create(); }}><input aria-label={`Search ${names[tab].toLowerCase()}`} placeholder={`Search ${names[tab].toLowerCase()}…`} value={query} onChange={e => setQuery(e.target.value)} disabled={loading || !!loadError} /></form>
      {loadError ? <div className="wo-empty" role="alert"><p>{loadError}</p><Button className="m-button" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div> : loading ? <p className="wo-empty" role="status">Loading your library…</p> : <>
        {canCreate && <Button type="button" className="wo-create" disabled={disabled} onClick={create}>＋ {tab === "people" ? "Create and link" : tab === "tags" ? "Create tag" : "Create collection"} “{term}”</Button>}
        <div className="wo-options">
          {tab === "people" && matchingPeople.map(({name, person}) => {
            const auto = automatic.includes(name), linked = auto || models.includes(name);
            return <button type="button" className="wo-option" key={name} aria-pressed={linked} disabled={disabled || auto} onClick={() => togglePerson(name)}>
              <PersonAvatar name={person?.nickname || name} src={person?.thumbnail ? media(person.thumbnail) : undefined} />
              <span className="wo-option-name"><strong>{person?.nickname || name}</strong><small>{auto ? "Linked through a source account" : person?.nickname ? name : linked ? "In this video" : "Link to video"}</small></span><span className="wo-check" aria-hidden="true">{linked ? "✓" : "+"}</span>
            </button>;
          })}
          {tab === "tags" && matchingTags.map(name => <button type="button" className="wo-option" key={name} aria-pressed={labels.includes(name)} disabled={disabled} onClick={() => toggleTag(name)}><span className="wo-symbol">#</span><span className="wo-option-name"><strong>{name}</strong><small>{labels.includes(name) ? "Added to this video" : "Add tag"}</small></span><span className="wo-check" aria-hidden="true">{labels.includes(name) ? "✓" : "+"}</span></button>)}
          {tab === "collections" && matchingCollections.map(c => <button type="button" className="wo-option" key={c.id} aria-pressed={memberships.includes(c.id)} disabled={disabled} onClick={() => { const add = !memberships.includes(c.id); perform(() => saveCollection(c.id, add), add ? "Added to collection." : "Removed from collection.", () => saveCollection(c.id, !add)); }}><span className="wo-symbol">▤</span><span className="wo-option-name"><strong>{c.name}</strong><small>{c.parentId ? collections.find(p => p.id === c.parentId)?.name || "Nested collection" : "Collection"}{memberships.includes(c.id) ? " · Added" : ""}</small></span><span className="wo-check" aria-hidden="true">{memberships.includes(c.id) ? "✓" : "+"}</span></button>)}
        </div>
        {(tab === "people" ? !matchingPeople.length : tab === "tags" ? !matchingTags.length : !matchingCollections.length) && <p className="wo-empty">{term ? "No matches. Use the create button above to add something new." : `No ${names[tab].toLowerCase()} yet. Type a name to get started.`}</p>}
      </>}
    </> : <div className="wo-file">
      <form onSubmit={e => { e.preventDefault(); if (title.trim()) perform(async () => { await api.SetTitle(video.site, video.id, title.trim()); setSavedTitle(title.trim()); }, "Title updated."); }}><label>Video title<input aria-label="Video title" value={title} onChange={e => setTitle(e.target.value)} /></label>{title.trim() !== savedTitle && <Button type="submit" className="m-button" disabled={busy || !title.trim()}>Save title</Button>}</form>
      <Button className="m-button" aria-pressed={favorite} disabled={busy} onClick={() => perform(async () => { await api.SetFavorite(video.site, video.id, !favorite); setFavorite(!favorite); }, favorite ? "Removed from favorites." : "Added to favorites.")}>{favorite ? "♥ Favorited" : "♡ Add to favorites"}</Button>
      <dl><dt>Source</dt><dd>{video.site || "Local"}</dd><dt>Resolution</dt><dd>{video.width && video.height ? `${video.width} × ${video.height}` : "Unknown"}</dd><dt>Duration</dt><dd>{video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, "0")}` : "Unknown"}</dd><dt>File size</dt><dd>{video.filesize ? `${Math.round(video.filesize / 1048576)} MB` : "Unknown"}</dd><dt>Added</dt><dd>{video.added || "Unknown"}</dd><dt>Original title</dt><dd>{video.source_title || video.title}</dd><dt>File path</dt><dd>{video.filepath}</dd></dl>
      {video.webpage_url && <label>Source link<input aria-label="Source link" readOnly value={video.webpage_url} onFocus={e => e.target.select()} /></label>}
      <RedownloadControl site={video.site} id={video.id} source={video.webpage_url} disabled={busy} />
    </div>}
  </section>;
}
