import { useState, type MouseEventHandler } from "react";
import { Icon } from "./Icons";
import PersonAvatar from "./PersonAvatar";

import { cardTone } from "./identityTone";

/** Shared image loading/failure behavior; the card variant owns cropping. */
export function CardImage({ src, kind, fallbackClass = "" }: { src: string; kind: "photo" | "video"; fallbackClass?: string }) {
  const [failed, setFailed] = useState("");
  return src && failed !== src
    ? <img draggable={false} src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)} />
    : <span className={`card-image-fallback ${fallbackClass}`}><Icon name={kind === "photo" ? "photo" : "film"}/><span>No preview</span></span>;
}

export function CardSelection({ label, selected, onClick, className = "" }: { label: string; selected: boolean; onClick: MouseEventHandler<HTMLButtonElement>; className?: string }) {
  return <button type="button" className={`card-select-control ${className}`} aria-label={label} aria-pressed={selected} onClick={onClick}>
    <span className="card-selection-mark" aria-hidden="true">{selected && <svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-9" /></svg>}</span>
  </button>;
}

export function PersonCard({ name, identity, alias, count, thumbnail, onOpen }: { name: string; identity?: string; alias?: string; count: number; thumbnail?: string; onOpen: () => void }) {
  return <button type="button" className="library-card library-card--person person-tile" data-card-tone={cardTone(identity || alias || name)} onClick={onOpen}>
    <span className="person-tile-art"><PersonAvatar name={name} src={thumbnail}/><span className="person-tile-open" aria-hidden="true">↗</span></span>
    <span className="person-tile-copy"><strong>{name}</strong><span className="person-tile-alias">{alias || "Person in your library"}</span><span className="person-tile-count">{count} video{count === 1 ? "" : "s"}</span></span>
  </button>;
}

export function TagCard({ name, count, onOpen }: { name: string; count: number; onOpen: () => void }) {
  return <button type="button" className="library-card library-card--tag tag-directory-card" data-card-tone={cardTone(name)} onClick={onOpen} aria-label={`Browse tag ${name}`}>
    <span className="tag-directory-symbol" aria-hidden="true"><Icon name="tag"/></span><span className="tag-directory-copy"><strong>{name}</strong><small>{count} video{count === 1 ? "" : "s"}</small></span><span className="tag-directory-arrow" aria-hidden="true">→</span>
  </button>;
}
