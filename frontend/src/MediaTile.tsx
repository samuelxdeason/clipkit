import { Icon } from "./Icons";
import { CardImage, CardSelection } from "./LibraryCards";
import { useCollectionDrag } from "./CollectionDnd";
import type { CollectionDrag } from "./collectionDrag";

export default function MediaTile({ title, subtitle, subtitleIcon, thumbnail, kind, selected, selectionMode, onSelect, onOpen, dragData }: {
  title: string; subtitle?: string; subtitleIcon?: "people" | "folder"; thumbnail: string; kind: "photo" | "video"; selected: boolean;
  selectionMode: boolean; onSelect: (shift: boolean) => void; onOpen: () => void;
  dragData?: CollectionDrag;
}) {
  const drag=useCollectionDrag(dragData);
  return <div className={`library-card library-card--${kind} mixed-media-tile ${selected ? "is-selected" : ""} ${selectionMode ? "is-selecting" : ""}`}>
    <button {...drag} className="photo-tile" aria-label={`${selectionMode ? "Select" : "Open"} ${title}`} aria-pressed={selectionMode ? selected : undefined}
      onClick={e => selectionMode || e.ctrlKey || e.metaKey || e.shiftKey ? onSelect(e.shiftKey) : onOpen()}
      onDoubleClick={onOpen}>
      <span className="photo-tile-frame"><CardImage src={thumbnail} kind={kind} fallbackClass="media-tile-placeholder" /></span>
      <strong title={title}>{title}</strong><small className="media-tile-subtitle" data-icon={subtitleIcon} title={subtitle}>{subtitleIcon && <Icon name={subtitleIcon}/>}<span>{subtitle || (kind === "photo" ? "Photo" : "Video")}</span></small>
    </button>
    <CardSelection className="row-select media-tile-select" label={`${selected ? "Deselect" : "Select"} ${title}`} selected={selected} onClick={e => onSelect(e.shiftKey)} />
    <span className="mixed-media-kind" aria-hidden><Icon name={kind === "photo" ? "photo" : "film"} />{kind === "photo" ? "Photo" : "Video"}</span>
  </div>;
}
