import { Button, ActionGroup } from "./UIControls";
import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";
import { LoadState, PageHeader } from "./WorkspaceUI";
import DetailDialog from "./DetailDialog";
import AlbumPicker, { albumTrail } from "./AlbumPicker";
import MediaOrganizeDialog from "./MediaOrganizeDialog";
import MediaTile from "./MediaTile";
import CollectionFolderCard from "./CollectionFolderCard";
import { useCollectionDrop } from "./CollectionDnd";

type Item = { key: string; title: string; added: string; photo?: library.Photo; video?: library.Video };
const countLabel = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;
export default function AlbumBrowser({ albums, albumId, onOpen, version, onChanged, media, onPlay, pinned, onPin }: {
  albums: api.Album[]; albumId: number; onOpen: (id: number) => void; version: number; onChanged: () => void;
  media: (path: string) => string; onPlay: (v: library.Video, list: library.Video[]) => void;
  pinned: boolean; onPin: () => void;
}) {
  const current=albums.find(a=>a.id===albumId);
  const drop=useCollectionDrop(albumId);
  const [createParent,setCreateParent]=useState(albumId);
  const [videos,setVideos]=useState<library.Video[]>([]),[photos,setPhotos]=useState<library.Photo[]>([]);
  const [loading,setLoading]=useState(false),[loadError,setLoadError]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [query,setQuery]=useState(""),[filter,setFilter]=useState("all"),[sort,setSort]=useState("newest"),[page,setPage]=useState(0);
  const [selected,setSelected]=useState<Set<string>>(new Set()),[selectMode,setSelectMode]=useState(false);
  const selectionAnchor=useRef<string|null>(null);
  const options=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const close=(e:PointerEvent)=>{if(options.current&&!options.current.contains(e.target as Node))options.current.open=false;};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[]);
  const [dialog,setDialog]=useState<"create"|"rename"|"move"|"delete"|null>(null),[name,setName]=useState(""),[destination,setDestination]=useState<number|null>(null);
  const [organize,setOrganize]=useState<"assign"|"album"|"move"|null>(null),[active,setActive]=useState<string|null>(null);
  useEffect(()=> { setQuery("");setFilter("all");setSelected(new Set());setSelectMode(false);setActive(null);setNotice("");setError("");setPage(0); },[albumId]);
  useEffect(()=> {
    let live=true;setLoading(true);setLoadError("");
    if(!albumId){setLoading(false);return;}
    Promise.all([api.VideosByCollection(albumId),api.PhotosByCollection(albumId)]).then(([v,p])=>{if(live){setVideos(v||[]);setPhotos(p||[]);}}).catch(e=>{if(live)setLoadError(String(e));}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[albumId,version]);
  const items=useMemo<Item[]>(()=>[
    ...photos.map<Item>(p=>({key:JSON.stringify(["photo",p.id]),title:p.filename||"Untitled photo",added:p.added,photo:p})),
    ...videos.map<Item>(v=>({key:JSON.stringify(["video",v.site,v.id]),title:v.title||v.filename||"Untitled video",added:v.added,video:v}))
  ].filter(i=>(filter==="all"||(filter==="photos"?!!i.photo:!!i.video))&&[i.title,i.photo?.model,...(i.video?.people||[])].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):b.added.localeCompare(a.added)),[photos,videos,filter,query,sort]);
  const searching=query.trim().length>0;
  const children=albums.filter(a=>a.id!==albumId&&(searching?(!albumId||albumTrail(albums,a.id).some(p=>p.id===albumId))&&a.name.toLowerCase().includes(query.trim().toLowerCase()):a.parentId===albumId)).sort((a,b)=>a.name.localeCompare(b.name));
  useEffect(()=> {setSelected(s=>new Set([...s].filter(k=>items.some(i=>i.key===k))));setPage(0);},[items]);
  const picked=items.filter(i=>selected.has(i.key)), pickedPhotos=picked.flatMap(i=>i.photo?[i.photo.id]:[]),pickedVideos=picked.flatMap(i=>i.video?[i.video]:[]);
  const toggle=(key:string,shift=false)=>{const from=items.findIndex(i=>i.key===selectionAnchor.current),to=items.findIndex(i=>i.key===key);selectionAnchor.current=key;setSelected(s=>{const next=new Set(s);if(shift&&from>=0&&to>=0)items.slice(Math.min(from,to),Math.max(from,to)+1).forEach(i=>next.add(i.key));else next.has(key)?next.delete(key):next.add(key);return next;});};
  const run=async(action:()=>Promise<unknown>,message:string)=>{setBusy(true);setError("");try{await action();setDialog(null);setSelected(new Set());setSelectMode(false);setNotice(message);onChanged();}catch(e){setError(String(e));}finally{setBusy(false);}};
  const begin=(kind:typeof dialog,parent=albumId)=>{if(options.current)options.current.open=false;setCreateParent(parent);setError("");setName(kind==="rename"?current?.name||"":"");setDestination(current?.parentId||0);setDialog(kind);};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(document.querySelector('[role="dialog"]')||(e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key==="Escape"){setSelected(new Set());setSelectMode(false);}if(e.altKey&&e.key==="ArrowUp"&&current){e.preventDefault();onOpen(current.parentId);}if(e.key==="F2"&&current){e.preventDefault();begin("rename");}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="a"&&(e.target as HTMLElement).closest('.album-browser')){e.preventDefault();setSelectMode(true);setSelected(new Set(items.map(i=>i.key)));}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[current,items]);
  const save=()=>run(async()=>{
    if(dialog==="create") await api.CreateAlbum(name,createParent);
    if(dialog==="rename") await api.RenameCollection(albumId,name);
    if(dialog==="move") { await api.MoveAlbum(albumId,destination!); }
    if(dialog==="delete") {await api.DeleteCollection(albumId);onOpen(current?.parentId||0);}
  },dialog==="delete"?"Collection removed. Your media is still in the library.":"Collection saved.");
  const preview=photos.find(p=>p.id===active);
  return <section {...drop.props} className={`album-browser ${albumId ? "collection-detail" : "collection-directory"} ${drop.over?"is-drop-target":""}`}>
    <PageHeader title={current?.name||"Collections"} description={current?[countLabel(current.photoCount,"photo"),countLabel(current.videoCount,"video"),countLabel(current.albumCount,"subfolder")].join(" · "):"Your photos and videos, together in one place."}
      actions={<ActionGroup className="album-actions"><Button variant="primary" onClick={()=>begin("create")}><Icon name="plus"/>{albumId?"New folder":"New collection"}</Button>{current&&<details ref={options} className="album-menu" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();e.currentTarget.open=false;e.currentTarget.querySelector("summary")?.focus();}}}><summary className="m-button" aria-label="Collection options">•••</summary><div><button onClick={()=>{onPin();if(options.current)options.current.open=false;}}>{pinned?"Unpin from sidebar":"Pin to sidebar"}</button><button onClick={()=>begin("rename")}>Rename</button><button onClick={()=>begin("move")}>Move collection…</button><button onClick={()=>begin("delete")}>Delete collection…</button></div></details>}</ActionGroup>}/>
    <div className="album-toolbar">{!!current&&<Button variant="neutral" className="collection-up" aria-label="Go to parent folder" title="Go to parent folder" onClick={()=>onOpen(current.parentId)}>↑ Up</Button>}<div className="manager-search"><Icon name="search"/><input aria-label="Search collection" placeholder={albumId?"Search this collection…":"Find a collection…"} value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear collection search" onClick={()=>setQuery("")}>×</button>}</div>{!!albumId&&<><div className="view-switch">{["all","photos","videos"].map(f=><button key={f} aria-pressed={filter===f} className={filter===f?"chosen":""} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="photos"?"Photos":"Videos"}</button>)}</div><select aria-label="Sort collection items" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option></select></>}</div>
    <details className="collection-help"><summary>Organizing tips</summary><p>Drag items onto a folder to move them. Hold Ctrl to keep them in both. Use Shift to select a range, F2 to rename this folder, or Ctrl+Shift+N to create a folder.</p></details>
    {error&&!dialog&&<p role="alert" className="manager-alert">{error}</p>}{notice&&<p role="status" className="manager-notice">{notice}</p>}
    {!!children.length&&<section aria-label="Subfolders"><div className="album-section-heading"><h2>{searching?"Matching folders":albumId?"Folders":"Your collections"}</h2><span>{children.length}</span></div><div className="album-grid">{children.map(a=><CollectionFolderCard key={a.id} featured={!albumId} folder={a} path={searching?albumTrail(albums,a.id).slice(0,-1).map(p=>p.name).join(" / ")||"Collections":undefined} media={media} onOpen={()=>onOpen(a.id)} onCreate={()=>begin("create",a.id)} />)}</div></section>}
    {!!albumId&&<section aria-label="Collection media"><div className="album-section-heading"><div className="collection-media-heading"><h2>{filter === "photos" ? "Photos" : filter === "videos" ? "Videos" : "Photos & videos"}</h2><span>{loading ? "Loading…" : `${items.length} matching item${items.length === 1 ? "" : "s"}`}</span></div><ActionGroup className="album-actions"><Button variant="neutral" disabled={loading||!items.length} aria-pressed={selectMode} onClick={()=>{setSelectMode(!selectMode);setSelected(new Set());}}>{selectMode?"Cancel selection":"Select items"}</Button>{selectMode&&<Button variant="neutral" onClick={()=>setSelected(new Set(selected.size===items.length?[]:items.map(i=>i.key)))}>{selected.size===items.length?"Deselect all":"Select all matching"}</Button>}</ActionGroup></div>
      {loading?<LoadState title="Opening collection…" busy/>:loadError?<LoadState title="Couldn’t load this collection" message={loadError} onRetry={onChanged}/>:items.length?<div className="manager-grid photo-library-grid">{items.slice(page*60,(page+1)*60).map(i=><MediaTile dragData={{kind:"media",sourceId:albumId,photos:selected.has(i.key)?pickedPhotos:i.photo?[i.photo.id]:[],videos:(selected.has(i.key)?pickedVideos:i.video?[i.video]:[]).map(v=>({site:v.site,id:v.id}))}} key={i.key} title={i.title} subtitle={i.photo?i.photo.model||"Photo":i.video?.people?.join(", ")||"Video"} kind={i.photo?"photo":"video"} thumbnail={i.photo?media(i.photo.filepath):i.video?.thumbnail?media(i.video.thumbnail):""} selected={selected.has(i.key)} selectionMode={selectMode} onSelect={shift=>!busy&&toggle(i.key,shift)} onOpen={()=>i.photo?setActive(i.photo.id):onPlay(i.video!,videos)}/>)}</div>:<div className="manager-empty"><Icon name="folder"/><h2>{query||filter!=="all"?"No matching media":"Ready for your photos and videos"}</h2><p>Select media in Photos or Videos and choose Add to collection. You can also add media from another collection.</p></div>}
      {items.length>60&&<footer className="manager-footer"><span>{page*60+1}–{Math.min((page+1)*60,items.length)} of {items.length} items</span><div><button disabled={!page} onClick={()=>setPage(p=>p-1)}>← Previous</button><button disabled={(page+1)*60>=items.length} onClick={()=>setPage(p=>p+1)}>Next →</button></div></footer>}
    </section>}
    {!albumId&&!children.length&&<div className="manager-empty"><Icon name="folder"/><h2>{query?"No matching collections":"Make room for a collection"}</h2><p>Create your first collection, then add photos, videos, or subfolders.</p>{!query&&<Button variant="neutral" onClick={()=>begin("create")}>New collection</Button>}</div>}
    {!!picked.length&&<div className="bulk-bar collection-selection-bar" role="toolbar" aria-label="Collection selection actions"><strong>{picked.length} selected</strong><button disabled={busy} onClick={()=>setOrganize("move")}>Move to folder</button><button disabled={busy} onClick={()=>setOrganize("assign")}>Assign person</button><details className="collection-more"><summary>More</summary><div><button disabled={busy} onClick={()=>setOrganize("album")}>Add to collection</button><button disabled={busy} onClick={()=>run(()=>api.RemoveAlbumItems(albumId,pickedVideos,pickedPhotos),"Removed from this collection. Files remain in your library.")}>Remove from this folder</button><button disabled={busy} onClick={()=>run(()=>api.TrashMedia(pickedVideos,pickedPhotos),"Moved to your vault’s Recycle bin folder.")}>Move to trash</button></div></details><button disabled={busy} onClick={()=>setSelected(new Set())} aria-label="Clear selection">×</button></div>}
    {organize&&<MediaOrganizeDialog sourceId={albumId} kind={organize} photos={pickedPhotos} videos={pickedVideos} onClose={()=>setOrganize(null)} onDone={()=>{setOrganize(null);setSelected(new Set());setNotice("Changes saved.");onChanged();}}/>}
    {dialog&&<DetailDialog label={dialog==="create"?"New collection":dialog==="rename"?"Rename collection":dialog==="move"?"Move collection":"Delete collection"} className="album-dialog" onClose={()=>!busy&&setDialog(null)}>
      <header><h2>{dialog==="create"?(createParent?"New subfolder":"New collection"):dialog==="rename"?"Rename collection":dialog==="move"?"Move collection":"Delete collection"}</h2><button disabled={busy} onClick={()=>setDialog(null)} aria-label="Close">×</button></header>
      {dialog==="delete"?<p>Delete “{current?.name}”? Photos and videos stay in your library. Any subfolders move up one level.</p>:dialog==="move"?<fieldset disabled={busy}><AlbumPicker albums={albums} value={destination} onChange={setDestination} exclude={albumId} allowRoot/></fieldset>:<><p>{dialog==="create"?`Inside ${albumTrail(albums,createParent).map(a=>a.name).join(" / ")||"Collections"}`:"Choose a name that makes this collection easy to find."}</p><input autoFocus aria-label="Collection name" value={name} disabled={busy} placeholder="Collection name" onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&name.trim()&&!busy)save();}}/></>}
      {error&&<p role="alert" className="modal-error">{error}</p>}<footer><Button variant="neutral" disabled={busy} onClick={()=>setDialog(null)}>Cancel</Button><Button variant={dialog === "delete" ? "danger" : "primary"} disabled={busy||(dialog==="move"?destination===null:dialog!=="delete"&&!name.trim())} onClick={save}>{busy?"Saving…":dialog==="delete"?"Delete collection":"Save"}</Button></footer>
    </DetailDialog>}
    {preview&&<DetailDialog label={preview.filename} className="photo-viewer" onClose={()=>setActive(null)}><header><strong>{preview.filename}</strong><button aria-label="Close photo" onClick={()=>setActive(null)}>×</button></header><img src={media(preview.filepath)} alt={preview.filename}/></DetailDialog>}
  </section>;
}
