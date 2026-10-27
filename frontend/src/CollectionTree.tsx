import { Chevron } from "./UIControls";
import { useEffect, useState } from "react";
import type { Album } from "./api";
import { Icon } from "./App";
import { albumTrail } from "./AlbumPicker";
import { useCollectionDrag, useCollectionDrop } from "./CollectionDnd";

function FolderRow({ folder, depth, expanded, onExpand, onOpen, active }: {
  folder:Album;depth:number;expanded:boolean;onExpand:()=>void;onOpen:()=>void;active:boolean;
}) {
  const drop=useCollectionDrop(folder.id),drag=useCollectionDrag({kind:"folder",id:folder.id});
  useEffect(()=>{if(!drop.over||expanded||!folder.albumCount)return;const timer=setTimeout(onExpand,650);return()=>clearTimeout(timer);},[drop.over,expanded,folder.albumCount,onExpand]);
  return <div {...drop.props} className={`collection-tree-row ${active?"active":""} ${drop.over?"is-drop-target":""}`} style={{paddingLeft:8+Math.min(depth,6)*13}}>
    <button className="folder-expand" aria-label={`${expanded?"Collapse":"Expand"} ${folder.name}`} aria-expanded={expanded} disabled={!folder.albumCount} onClick={onExpand}>{folder.albumCount?<Chevron expanded={expanded}/>:null}</button>
    <button {...drag} className="folder-open" aria-current={active ? "page" : undefined} onClick={onOpen} title={folder.name}><Icon name={folder.locked||folder.inheritedLocked?"lock":"folder"}/><span>{folder.name}</span></button>
  </div>;
}

export default function CollectionTree({collections,currentId,pinned,onOpen,onRoot,onCreate}:{
  collections:Album[];currentId:number;pinned:number[];onOpen:(c:Album)=>void;onRoot:()=>void;onCreate:(parent:number)=>void;
}) {
  const [expanded,setExpanded]=useState<Set<number>>(new Set());
  const [show,setShow]=useState(true);
  const [query,setQuery]=useState(""),[onlyPinned,setOnlyPinned]=useState(false);
  const root=useCollectionDrop(0);
  useEffect(()=>{setExpanded(old=>new Set([...old,...albumTrail(collections,currentId).map(c=>c.id)]));},[currentId,collections]);
  const toggle=(id:number)=>setExpanded(old=>{const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next;});
  const visible=collections.filter(c=>!c.hidden&&!c.inheritedHidden).sort((a,b)=>a.name.localeCompare(b.name));
  const render=(parent:number,depth:number,seen:Set<number>):JSX.Element[]=>visible.filter(c=>c.parentId===parent&&!seen.has(c.id)).flatMap(c=>[
    <FolderRow key={c.id} folder={c} depth={depth} expanded={expanded.has(c.id)} onExpand={()=>toggle(c.id)} onOpen={()=>onOpen(c)} active={currentId===c.id}/>,
    ...(expanded.has(c.id)?render(c.id,depth+1,new Set([...seen,c.id])):[])
  ]);
  const matches=visible.filter(c=>(!onlyPinned||pinned.includes(c.id))&&albumTrail(collections,c.id).map(a=>a.name).join(" / ").toLowerCase().includes(query.trim().toLowerCase()));
  return <nav className="collection-tree" aria-label="Collection folders">
    <div {...root.props} className={`collection-tree-heading ${root.over?"is-drop-target":""}`}><button aria-expanded={show} aria-label={show ? "Collapse collection folders" : "Expand collection folders"} onClick={()=>setShow(!show)}><Chevron expanded={show}/></button><button onClick={onRoot}>Folders</button><button aria-label="New collection" title="New collection (Ctrl+Shift+N)" onClick={()=>onCreate(0)}>＋</button></div>
    {show&&<><div className="folder-tree-tools"><input aria-label="Find folder" placeholder="Find folder…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Escape" && query){e.preventDefault();e.stopPropagation();setQuery("");}}}/>{query&&<button aria-label="Clear folder search" onClick={()=>setQuery("")}>×</button>}<button title="Show pinned folders" aria-label="Show pinned folders" aria-pressed={onlyPinned} onClick={()=>setOnlyPinned(!onlyPinned)}>{onlyPinned ? "★" : "☆"}</button></div>
    <div className="collection-tree-scroll">{query.trim()||onlyPinned?matches.map(c=><div key={c.id}><FolderRow folder={c} depth={0} expanded={expanded.has(c.id)} onExpand={()=>{setQuery("");setOnlyPinned(false);setExpanded(old=>new Set([...old,...albumTrail(collections,c.id).map(a=>a.id)]));}} onOpen={()=>onOpen(c)} active={currentId===c.id}/><small className="folder-search-path">{albumTrail(collections,c.id).slice(0,-1).map(a=>a.name).join(" / ")||"Collections"}</small></div>):render(0,0,new Set())}
    {!matches.length&&<p className="folder-empty">{query?"No matching folders":onlyPinned?"Pin a folder from its options menu.":"No collections yet"}</p>}
    </div></>}
  </nav>;
}
