import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import * as api from "./api";
import { canDropCollection, dragOperation } from "./collectionDrag";
import type { CollectionDrag } from "./collectionDrag";

type DragContext = {
  payload: CollectionDrag | null; busy: boolean; target: number | null;
  begin: (e: ReactPointerEvent, payload: CollectionDrag) => void;
  suppressClick: () => boolean;
};
const Context = createContext<DragContext | null>(null);

export function CollectionDndProvider({ collections, onChanged, children }: { collections: api.Album[]; onChanged: () => void; children: ReactNode }) {
  const [payload,setPayload] = useState<CollectionDrag|null>(null);
  const [target,setTarget] = useState<number|null>(null);
  const [point,setPoint] = useState<{x:number;y:number;copy:boolean}|null>(null);
  const [busy,setBusy] = useState(false),[message,setMessage] = useState("");
  const [error,setError] = useState(false);
  const inFlight=useRef(false),ignoreClick=useRef(false),cleanup=useRef<(()=>void)|null>(null);
  const latest=useRef({collections,onChanged});latest.current={collections,onChanged};
  useEffect(()=>{
    const click=(e:MouseEvent)=>{if(ignoreClick.current){ignoreClick.current=false;e.preventDefault();e.stopPropagation();}};
    window.addEventListener('click',click,true);
    return()=>{cleanup.current?.();window.removeEventListener('click',click,true);};
  },[]);
  const transfer=async(data:CollectionDrag,id:number,copy:boolean)=>{
    if(inFlight.current||!canDropCollection(data,id,latest.current.collections))return;
    inFlight.current=true;setBusy(true);setError(false);
    const name=id?latest.current.collections.find(c=>c.id===id)?.name||"folder":"Collections";
    try{
      if(data.kind==="folder")await api.MoveAlbum(data.id,id);
      else await api.TransferCollectionItems(data.sourceId,id,data.videos,data.photos,copy);
      const count=data.kind==="folder"?1:data.photos.length+data.videos.length;
      setMessage(`${dragOperation(data,copy)==="Move"?"Moved":"Added"} ${count} ${data.kind==="folder"?"folder":count===1?"item":"items"} to ${name}.`);
      latest.current.onChanged();
    }catch(e){setError(true);setMessage(String(e));}finally{inFlight.current=false;setBusy(false);}
  };
  const begin=(e:ReactPointerEvent,data:CollectionDrag)=>{
    if(e.button!==0||e.pointerType==="touch"||inFlight.current)return;
    if((e.target as Element).closest('input,textarea,select,.row-select,.video-card-select'))return;
    cleanup.current?.();ignoreClick.current=false;
    const startX=e.clientX,startY=e.clientY;let started=false;
    const hit=(x:number,y:number)=>{
      const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-collection-drop]');
      const id=el?Number(el.dataset.collectionDrop):null;
      return id!==null&&canDropCollection(data,id,latest.current.collections)?id:null;
    };
    const clear=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',key);window.removeEventListener('blur',cancel);document.body.classList.remove('collection-dragging');cleanup.current=null;};
    const finish=()=>{clear();setPayload(null);setTarget(null);setPoint(null);};
    const cancel=()=>{if(started)ignoreClick.current=true;finish();};
    const key=(ev:KeyboardEvent)=>{if(ev.key==='Escape'){ev.preventDefault();cancel();}};
    const move=(ev:PointerEvent)=>{
      if(!started&&Math.hypot(ev.clientX-startX,ev.clientY-startY)<7)return;
      if(!started){started=true;ignoreClick.current=true;setPayload(data);setMessage("");document.body.classList.add('collection-dragging');}
      ev.preventDefault();setPoint({x:ev.clientX,y:ev.clientY,copy:ev.ctrlKey||ev.metaKey});setTarget(hit(ev.clientX,ev.clientY));
      const scroll=document.elementFromPoint(ev.clientX,ev.clientY)?.closest<HTMLElement>('.collection-tree-scroll,.manager-main');
      if(scroll){const r=scroll.getBoundingClientRect();if(ev.clientY<r.top+28)scroll.scrollTop-=12;else if(ev.clientY>r.bottom-28)scroll.scrollTop+=12;}
    };
    const up=(ev:PointerEvent)=>{if(started)setTimeout(()=>{ignoreClick.current=false;},0);const id=started?hit(ev.clientX,ev.clientY):null;finish();if(id!==null)void transfer(data,id,ev.ctrlKey||ev.metaKey);};
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',key);window.addEventListener('blur',cancel);cleanup.current=clear;
  };
  const name=target?collections.find(c=>c.id===target)?.name:"Collections";
  const count=payload?.kind==="folder"?1:payload?payload.photos.length+payload.videos.length:0;
  return <Context.Provider value={{payload,busy,target,begin,suppressClick:()=>{const suppress=ignoreClick.current;ignoreClick.current=false;return suppress;}}}>{children}
    {payload&&point&&<div className="collection-pointer-badge" style={{left:Math.min(point.x+16,window.innerWidth-170),top:Math.min(point.y+16,window.innerHeight-50)}}>{payload.kind==="folder"?"Folder":`${count} item${count===1?"":"s"}`}</div>}
    {(payload||busy||message)&&<div className={`collection-drag-status ${error?"is-error":""}`} role={error?"alert":"status"}>
      {payload?target!==null?`${dragOperation(payload,point?.copy||false)} to ${name}`:payload.kind==="folder"?"Drop onto a folder or Collections.":"Drop onto a folder · Hold Ctrl to keep in both":busy?"Organizing…":message}
      {!payload&&!busy&&<button aria-label="Dismiss organization message" onClick={()=>setMessage("")}>×</button>}
    </div>}
  </Context.Provider>;
}
export function useCollectionDrag(data?:CollectionDrag){
  const ctx=useContext(Context);
  return data&&ctx?{draggable:false,onDragStart:(e:React.DragEvent)=>e.preventDefault(),onPointerDown:(e:ReactPointerEvent)=>ctx.begin(e,data),onClickCapture:(e:React.MouseEvent)=>{if(ctx.suppressClick()){e.preventDefault();e.stopPropagation();}},'data-collection-draggable':true}:{};
}
export function useCollectionDrop(id:number){
  const ctx=useContext(Context);
  return {props:{'data-collection-drop':id},over:!!ctx?.payload&&ctx.target===id,dragging:!!ctx?.payload};
}
export function CollectionDropTarget({id,children,className=""}:{id:number;children:ReactNode;className?:string}){
  const {props,over}=useCollectionDrop(id);
  return <span {...props} className={`collection-drop-target ${over?"is-drop-target":""} ${className}`}>{children}</span>;
}
