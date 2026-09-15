import { library } from "../wailsjs/go/models";
import { Icon } from "./App";

export default function VideoCard({ video: v, selected, selectionMode, thumbnail, people, onSelect, onPlay, onTag }: { video: library.Video; selected: boolean; selectionMode: boolean; thumbnail: string; people: string[]; onSelect: (shift: boolean) => void; onPlay: () => void; onTag: (tag: string) => void }) {
  const title = v.title || v.filename || "Untitled video";
  const activate = (e: React.MouseEvent<HTMLButtonElement>) => { if (selectionMode || e.shiftKey || e.ctrlKey || e.metaKey) onSelect(e.shiftKey); else onPlay(); };
  const portrait = !!v.height && !!v.width && v.height > v.width;
  const seconds = v.duration || 0;
  return <article className={`video-card ${portrait ? "is-portrait" : ""} ${selected ? "is-selected" : ""} ${selectionMode ? "is-selecting" : ""}`}>
    <div className="video-card-frame"><button className="video-card-play" aria-label={`${selectionMode ? "Toggle selection for" : "Play"} ${title}`} aria-pressed={selectionMode ? selected : undefined} onClick={activate} onDoubleClick={() => { if (selectionMode) onPlay(); }}>{thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <Icon name="film" />}<span className="video-card-play-symbol"><Icon name={selectionMode ? "check" : "play-fill"} /></span></button><button className="video-card-select" aria-label={`Select ${title}`} aria-pressed={selected} onClick={e => onSelect(e.shiftKey)}><span className="card-selection-mark" aria-hidden="true">{selected && <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9" /></svg>}</span></button><span className="video-card-duration">{Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, "0")}</span>{portrait && <span className="video-card-format">Portrait</span>}{v.favorite && <span className="video-card-liked" title="Favorite"><Icon name="heart-fill" /></span>}</div>
    <div className="video-card-body"><button className="video-card-title" title={v.source_title ? `${title}\nOriginal title: ${v.source_title}` : title} onClick={activate} onDoubleClick={() => { if (selectionMode) onPlay(); }}>{title}</button><div className={`video-card-people ${people.length ? "" : "is-unassigned"}`} title={people.join(", ") || "No people assigned"}><Icon name="people" /><span>{people.join(", ") || "Unassigned"}</span></div><p>{v.site}{v.height ? ` · ${v.height}p` : ""}</p><div className="tag-list">{(v.labels || []).slice(0, 3).map(t => <button className="tag-pill" key={t} onClick={() => onTag(t)}>{t}</button>)}</div></div>
  </article>;
}

