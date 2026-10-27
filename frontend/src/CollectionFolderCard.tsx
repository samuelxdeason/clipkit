import { useState } from "react";
import type { Album } from "./api";
import { Icon } from "./App";
import { useCollectionDrag,useCollectionDrop } from "./CollectionDnd";

export default function CollectionFolderCard({folder,media,onOpen,onCreate,path}:{folder:Album;media:(path:string)=>string;onOpen:()=>void;onCreate:()=>void;path?:string}){
  const [failedCover,setFailedCover]=useState("");
  const drop=useCollectionDrop(folder.id),drag=useCollectionDrag({kind:"folder",id:folder.id});
  return <div {...drop.props} className={`folder-card-shell compact-folder ${drop.over?"is-drop-target":""}`}>
    <button {...drag} className="album-card" onClick={onOpen} aria-label={`Open folder ${folder.name}`}>
      <span className="compact-folder-icon">{folder.covers?.[0]&&failedCover!==folder.covers[0]?<img onError={()=>setFailedCover(folder.covers[0])} draggable={false} src={media(folder.covers[0])} alt="" loading="lazy"/>:<Icon name={folder.locked||folder.inheritedLocked?"lock":"folder"}/>}</span>
      <span className="compact-folder-copy"><strong>{folder.name}</strong><small>{path||`${folder.count} item${folder.count===1?"":"s"}${folder.albumCount?` · ${folder.albumCount} folder${folder.albumCount===1?"":"s"}`:""}`}</small></span>
    </button>
    <button className="folder-card-new" aria-label={`New folder in ${folder.name}`} title="New subfolder" disabled={folder.locked||folder.inheritedLocked} onClick={onCreate}>＋</button>
  </div>;
}
