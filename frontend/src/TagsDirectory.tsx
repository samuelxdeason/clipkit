import { useMemo, useState } from "react";
import { library } from "../wailsjs/go/models";
import { Icon } from "./App";

export default function TagsDirectory({ videos, query, onOpen, onClear, onLibrary }: {
  videos: library.Video[]; query: string; onOpen: (tag: string) => void;
  onClear: () => void; onLibrary: () => void;
}) {
  const [sort, setSort] = useState("name");
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of videos) for (const tag of new Set(video.labels || [])) counts.set(tag, (counts.get(tag) || 0) + 1);
    return [...counts].map(([name, count]) => ({ name, count }));
  }, [videos]);
  const matches = useMemo(() => tags.filter(t => t.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => (sort === "count" ? b.count - a.count : 0) || a.name.localeCompare(b.name)), [tags, query, sort]);
  return <section className="tags-directory" aria-label="Tags directory">
    <div className="tags-directory-toolbar"><span role="status">{matches.length} of {tags.length} tag{tags.length === 1 ? "" : "s"}{query.trim() ? " matching your search" : " in your library"}</span><label>Sort by<select aria-label="Sort tags" value={sort} onChange={e => setSort(e.target.value)}><option value="name">Name A–Z</option><option value="count">Most videos</option></select></label></div>
    <div className="tags-directory-grid">{matches.map(tag => <button key={tag.name} className="tag-directory-card" onClick={() => onOpen(tag.name)} aria-label={`Browse tag ${tag.name}`}>
      <span className="tag-directory-symbol" aria-hidden="true"><Icon name="tag" /></span><span className="tag-directory-copy"><strong>{tag.name}</strong><small>{tag.count} video{tag.count === 1 ? "" : "s"}</small></span><span className="tag-directory-arrow" aria-hidden="true">→</span>
    </button>)}</div>
    {!matches.length ? <div className="manager-empty"><Icon name={tags.length ? "search" : "tag"}/><h2>{tags.length ? "No matching tags" : "Make your library easier to find"}</h2><p>{tags.length ? "Try a different tag name or clear your search." : "Select videos in your library and choose Add tags, or add tags while watching."}</p><button className="m-button" onClick={tags.length ? onClear : onLibrary}>{tags.length ? "Clear search" : "Browse videos"}</button></div> : <p className="tags-directory-hint">Open a tag to browse its videos. Add more filters or select videos to organize them together.</p>}
  </section>;
}
