import { useState } from "react";
import type { Album } from "./api";
import { Icon } from "./App";
import { useCollectionDrag,useCollectionDrop } from "./CollectionDnd";

export default function CollectionFolderCard({folder,media,onOpen,onCreate,path,featured=false}:{folder:Album;media:(path:string)=>string;onOpen:()=>void;onCreate:()=>void;path?:string;featured?:boolean}){
  const [failedCovers,setFailedCovers]=useState<Set<string>>(()=>new Set());
  const covers=(folder.covers||[]).filter(src=>!failedCovers.has(src)).slice(0,featured?3:1);
  const drop=useCollectionDrop(folder.id),drag=useCollectionDrag({kind:"folder",id:folder.id});
  return <div {...drop.props} className={`library-card library-card--collection folder-card-shell compact-folder ${featured?"featured-collection":""} ${drop.over?"is-drop-target":""}`}>
    <button {...drag} className="album-card" onClick={onOpen} aria-label={`Open folder ${folder.name}`}>
      <span className={`compact-folder-icon ${featured&&covers.length>1?"collection-cover-mosaic":""}`} data-cover-count={covers.length}>{covers.length?covers.map((src,index)=><img key={`${src}-${index}`} onError={()=>setFailedCovers(previous=>new Set([...previous,src]))} draggable={false} src={media(src)} alt="" loading="lazy"/>):<Icon name={folder.locked||folder.inheritedLocked?"lock":"folder"}/>}</span>
      {featured&&<span className="collection-card-kind"><Icon name={folder.locked||folder.inheritedLocked?"lock":"folder"}/>{folder.locked||folder.inheritedLocked?"Locked collection":"Collection"}</span>}
      <span className="compact-folder-copy"><strong>{folder.name}</strong><small>{path||`${folder.count} item${folder.count===1?"":"s"}${folder.albumCount?` · ${folder.albumCount} folder${folder.albumCount===1?"":"s"}`:""}`}</small></span>
      {featured&&<span className="collection-card-stats"><span>{folder.photoCount||0} photos</span><span>{folder.videoCount||0} videos</span></span>}
    </button>
    <button className="folder-card-new" aria-label={`New folder in ${folder.name}`} title="New subfolder" disabled={folder.locked||folder.inheritedLocked} onClick={onCreate}>＋</button>
  </div>;
}
