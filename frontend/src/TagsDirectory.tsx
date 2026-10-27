import { SortMenu } from "./UIControls";
import { TagCard } from "./LibraryCards";
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
    <div className="tags-directory-toolbar"><span role="status">{matches.length} of {tags.length} tag{tags.length === 1 ? "" : "s"}{query.trim() ? " matching your search" : " in your library"}</span><label>Sort by<SortMenu label="Sort tags" value={sort} onChange={setSort} options={[{"value":"name","label":"Name A–Z"},{"value":"count","label":"Most videos"}]}/></label></div>
    <div className="tags-directory-grid">{matches.map(tag => <TagCard key={tag.name} name={tag.name} count={tag.count} onOpen={() => onOpen(tag.name)} />)}</div>
    {!matches.length ? <div className="manager-empty"><Icon name={tags.length ? "search" : "tag"}/><h2>{tags.length ? "No matching tags" : "Make your library easier to find"}</h2><p>{tags.length ? "Try a different tag name or clear your search." : "Select videos in your library and choose Add tags, or add tags while watching."}</p><button className="m-button" onClick={tags.length ? onClear : onLibrary}>{tags.length ? "Clear search" : "Browse videos"}</button></div> : <p className="tags-directory-hint">Open a tag to browse its videos. Add more filters or select videos to organize them together.</p>}
  </section>;
}
