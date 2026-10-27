import { DialogHeader } from "./WorkspaceUI";
import { albumTrail } from "./AlbumPicker";
import { LoadState } from "./WorkspaceUI";
import { Button } from "./UIControls";
import { useEffect, useState } from "react";
import * as api from "./api";
import { library } from "../wailsjs/go/models";
import DetailDialog from "./DetailDialog";
import OrganizePicker from "./OrganizePicker";
import AlbumPicker from "./AlbumPicker";

export default function MediaOrganizeDialog({ kind, photos = [], videos = [], sourceId = 0, onClose, onDone }: {
  kind: "assign" | "album" | "move"; sourceId?: number; photos?: string[]; videos?: library.Video[]; onClose: () => void; onDone: () => void;
}) {
  const [people,setPeople]=useState<library.Model[]>([]), [albums,setAlbums]=useState<api.Album[]>([]);
  const [person,setPerson]=useState(""), [album,setAlbum]=useState<number|null>(null);
  const [busy,setBusy]=useState(false), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [newName,setNewName]=useState("");
  useEffect(() => { let live=true; Promise.all([api.Models(),api.Collections()]).then(([p,a])=> {if(live){setPeople(p||[]);setAlbums(a||[]);}}).catch(e=>{if(live)setError(String(e));}).finally(()=>{if(live)setLoading(false);}); return ()=>{live=false;}; },[]);
  const save=async()=> {
    setBusy(true);setError("");
    try {
      if(kind==="move") await api.TransferCollectionItems(sourceId,album!,videos,photos);
      else if(kind==="album") await api.AddAlbumItems(album!,videos,photos);
      else {
        if(photos.length) await api.AssignPhotos(photos,person);
        for(const v of videos) await api.SetModels(v.site,v.id,[...new Set([...(v.models||[]),person])]);
      }
      onDone();
    }catch(e){setError(String(e));}finally{setBusy(false);}
  };
  const create=async()=> {
    setBusy(true);setError("");
    try {
      if(kind!=="assign") { const id=await api.CreateAlbum(newName,album||0);setAlbums(await api.Collections()||[]);setAlbum(id); }
      else { await api.CreatePerson(newName.trim());setPeople(await api.Models()||[]);setPerson(newName.trim()); }
      setNewName("");
    }catch(e){setError(String(e));}finally{setBusy(false);}
  };
  return <DetailDialog label={kind==="move"?"Move to folder":kind==="album"?"Add to collection":"Assign person"} className="album-dialog" onClose={()=>!busy&&onClose()}>
    <DialogHeader title={kind==="move"?"Move to folder":kind==="album"?"Add to collection":"Assign person"} disabled={busy} onClose={onClose}/>
    <p>{photos.length+videos.length} selected {photos.length+videos.length===1?"item":"items"} {kind!=="assign"?(kind==="move"?"will move out of this folder into the destination folder.":"will stay in your library and any other collections."):"will appear on this person’s profile."}{kind==="assign"&&photos.length>0&&" This replaces the current person on selected photos."}</p>
    {loading&&<LoadState busy title="Loading destinations…"/>}
    <fieldset disabled={busy||loading} hidden={loading}>
      {kind!=="assign"?<AlbumPicker albums={albums} disabledId={kind==="move"?sourceId:0} value={album} onChange={setAlbum}/>:<><OrganizePicker key={people.length} kind="assign" choices={people.map(p=>({value:p.name,label:p.nickname||p.name}))} value={person} onChange={setPerson}/>{person&&<p className="album-muted">Person: {people.find(p=>p.name===person)?.nickname||person}</p>}</>}
      <details className="album-create-inline"><summary>{kind!=="assign"?(album===null?"New collection":"New folder in selected destination"):"Create a person"}</summary><input aria-label={kind!=="assign"?"New collection name":"New person name"} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name"/>{kind!=="assign"&&album!==null&&<p className="album-muted">Create inside: {albumTrail(albums,album).map(a=>a.name).join(" / ")}</p>}<Button variant="neutral" disabled={!newName.trim()} onClick={create}>Create</Button></details>
    </fieldset>
    {error&&<p role="alert" className="modal-error">{error}</p>}
    <footer><Button variant="neutral" disabled={busy} onClick={onClose}>Cancel</Button><Button variant="primary" disabled={busy||loading||(kind!=="assign"?album===null:!person)} onClick={save}>{busy?"Saving…":kind==="move"?"Move to folder":kind==="album"?"Add to collection":"Assign person"}</Button></footer>
  </DetailDialog>;
}
