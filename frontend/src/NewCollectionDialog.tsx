import { Button } from "./UIControls";
import { useState } from "react";
import * as api from "./api";
import DetailDialog from "./DetailDialog";
import { albumTrail } from "./AlbumPicker";

export default function NewCollectionDialog({parentId,collections,onClose,onDone}:{parentId:number;collections:api.Album[];onClose:()=>void;onDone:()=>void}){
  const [name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const save=async()=>{if(!name.trim()||busy)return;setBusy(true);setError("");try{await api.CreateAlbum(name.trim(),parentId);onDone();}catch(e){setError(String(e));}finally{setBusy(false);}};
  return <DetailDialog className="album-dialog" label={parentId?"New folder":"New collection"} onClose={()=>!busy&&onClose()}><header><h2>{parentId?"New folder":"New collection"}</h2><button disabled={busy} aria-label="Close" onClick={onClose}>×</button></header><p>Inside {albumTrail(collections,parentId).map(c=>c.name).join(" / ")||"Collections"}</p><form onSubmit={e=>{e.preventDefault();save();}}><input autoFocus aria-label="Folder name" placeholder="Folder name" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/>{error&&<p className="modal-error" role="alert">{error}</p>}<footer><Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={busy||!name.trim()}>{busy?"Creating…":"Create"}</Button></footer></form></DetailDialog>;
}
