import { Icon } from "./App";
import { useCollectionDrag } from "./CollectionDnd";
import type { CollectionDrag } from "./collectionDrag";

export default function MediaTile({ title, subtitle, thumbnail, kind, selected, selectionMode, onSelect, onOpen, dragData }: {
  title: string; subtitle?: string; thumbnail: string; kind: "photo" | "video"; selected: boolean;
  selectionMode: boolean; onSelect: (shift: boolean) => void; onOpen: () => void;
  dragData?: CollectionDrag;
}) {
  const drag=useCollectionDrag(dragData);
  return <div className={`mixed-media-tile ${selected ? "is-selected" : ""}`}>
    <button {...drag} className="photo-tile" aria-label={`${selectionMode ? "Select" : "Open"} ${title}`} aria-pressed={selectionMode ? selected : undefined}
      onClick={e => selectionMode || e.ctrlKey || e.metaKey || e.shiftKey ? onSelect(e.shiftKey) : onOpen()}
      onDoubleClick={onOpen}>
      <span className="photo-tile-frame">{thumbnail ? <img draggable={false} src={thumbnail} alt="" loading="lazy" /> : <Icon name={kind === "photo" ? "photo" : "film"} />}</span>
      <strong title={title}>{title}</strong><small>{subtitle || (kind === "photo" ? "Photo" : "Video")}</small>
    </button>
    <button className="row-select media-tile-select" aria-label={`${selected ? "Deselect" : "Select"} ${title}`} aria-pressed={selected} onClick={e => onSelect(e.shiftKey)}>{selected && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>}</button>
    <span className="mixed-media-kind" aria-hidden><Icon name={kind === "photo" ? "photo" : "film"} /></span>
  </div>;
}
