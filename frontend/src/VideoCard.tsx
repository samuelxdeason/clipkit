import { useEffect, useRef, type MouseEvent } from "react";
import { CardImage, CardSelection } from "./LibraryCards";
import { library } from "../wailsjs/go/models";
import { Icon } from "./Icons";
import { useCollectionDrag } from "./CollectionDnd";
import type { CollectionDrag } from "./collectionDrag";

export default function VideoCard({ video: v, selected, selectionMode, thumbnail, people, onSelect, onPlay, onTag, dragData }: { video: library.Video; selected: boolean; selectionMode: boolean; thumbnail: string; people: string[]; onSelect: (shift: boolean) => void; onPlay: () => void; onTag: (tag: string) => void; dragData?: CollectionDrag }) {
  const info=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const close=(e:PointerEvent)=>{if(info.current&&!info.current.contains(e.target as Node))info.current.open=false;};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[]);
  const drag=useCollectionDrag(dragData);
  const progress = v.duration && v.position && v.duration > 0 && v.position > 0 ? Math.min(100, v.position / v.duration * 100) : 0;
  const title = v.title || v.filename || "Untitled video";
  const activate = (e: MouseEvent<HTMLButtonElement>) => {
    if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) onSelect(e.shiftKey);
    else onPlay();
  };
  const doubleClick = () => { if (selectionMode) onPlay(); };
  const portrait = !!v.height && !!v.width && v.height > v.width;
  const seconds = Math.max(0, Math.floor(v.duration || 0));
  const duration = seconds >= 3600
    ? `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const labels = v.labels || [];
  const fileSize = v.filesize && v.filesize > 0
    ? v.filesize >= 1073741824 ? `${(v.filesize / 1073741824).toFixed(1)} GB` : `${Math.max(1, Math.round(v.filesize / 1048576))} MB`
    : "";

  return <article {...drag} className={`library-card library-card--video video-card ${portrait ? "is-portrait" : ""} ${selected ? "is-selected" : ""} ${selectionMode ? "is-selecting" : ""}`}>
    <div className="video-card-frame">
      <button className="video-card-play" aria-label={`${selectionMode ? "Toggle selection for" : "Play"} ${title}`} aria-pressed={selectionMode ? selected : undefined} onClick={activate} onDoubleClick={doubleClick}>
        <CardImage src={thumbnail} kind="video" fallbackClass="video-card-placeholder" />
        <span className="video-card-play-symbol"><Icon name={selectionMode ? "check" : "play-fill"} /></span>
      </button>
      <CardSelection className="video-card-select" label={`Select ${title}`} selected={selected} onClick={e => onSelect(e.shiftKey)} />
      {seconds > 0 && <span className="video-card-duration">{duration}</span>}
      {!!v.height && <span className="video-card-quality">{v.height>=2160?"4K":`${v.height}p`}</span>}
      {portrait && <span className="video-card-format">Portrait</span>}
      {v.favorite && <span className="video-card-liked" role="img" aria-label="Favorite"><Icon name="heart-fill" /></span>}
      {progress > 0 && <span className="video-card-progress" role="img" aria-label={`${Math.round(progress)}% watched`} title="Continue from your saved position"><span style={{ width: `${progress}%` }}/></span>}
    </div>
    <div className="video-card-body">
      <button className="video-card-title" title={v.source_title ? `${title}\nOriginal title: ${v.source_title}` : title} onClick={activate} onDoubleClick={doubleClick}>{title}</button>
      {(people.length>0||selectionMode)&&<div className={`video-card-people ${people.length ? "" : "is-unassigned"}`} title={people.join(", ") || "No people assigned"}>
        <Icon name="people" /><span>{people.join(", ") || "No people assigned"}</span>
      </div>}
      <div className="video-card-secondary"><div className="tag-list">
        {labels.slice(0, 2).map(t => <button className="tag-pill" key={t} title={t} onClick={() => onTag(t)}>{t}</button>)}
        {labels.length > 2 && <span className="video-card-tag-count" title={labels.slice(2).join(", ")} aria-label={`${labels.length - 2} more tags: ${labels.slice(2).join(", ")}`}>+{labels.length - 2}</span>}
        {!labels.length && selectionMode && <span className="video-card-no-tags">No tags yet</span>}
      </div>
      <details ref={info} className="video-card-info" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();e.currentTarget.open=false;e.currentTarget.querySelector("summary")?.focus();}}}><summary aria-label={`File info for ${title}`}>File info</summary><div className="video-card-meta">
        <span className="video-card-source" title={v.site || "Local file"}><span aria-hidden="true" /><span className="video-card-source-name">{v.site || "Local file"}</span></span>
        <span className="video-card-specs">
          {v.height ? <span title={v.width ? `${v.width} × ${v.height}` : undefined}>{v.height}p</span> : null}
          {fileSize && <span>{fileSize}</span>}
        </span>
      </div></details></div>
    </div>
  </article>;
}
