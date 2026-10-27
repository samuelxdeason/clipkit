import type { ReactNode } from "react";
import { BrowseToolbar } from "./WorkspaceUI";
import { EmptyState } from "./WorkspaceUI";
import { SortMenu } from "./UIControls";
import { TagCard } from "./LibraryCards";
import { useMemo, useState } from "react";
import { library } from "../wailsjs/go/models";
import { Icon } from "./Icons";

export default function TagsDirectory({ search, videos, query, onOpen, onClear, onLibrary }: {
  search: ReactNode; videos: library.Video[]; query: string; onOpen: (tag: string) => void;
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
    <BrowseToolbar layout="results" label="Tag browsing controls" className="tags-directory-toolbar" search={search} controls={<SortMenu label="Sort tags" value={sort} onChange={setSort} options={[{"value":"name","label":"Name A–Z"},{"value":"count","label":"Most videos"}]}/>} summary={<>{matches.length} of {tags.length} tag{tags.length === 1 ? "" : "s"}{query.trim() ? " matching your search" : " in your library"}</>}/>
    <div className="tags-directory-grid">{matches.map(tag => <TagCard key={tag.name} name={tag.name} count={tag.count} onOpen={() => onOpen(tag.name)} />)}</div>
    {!matches.length ? <EmptyState title={tags.length ? "No matching tags" : "Make your library easier to find"} message={tags.length ? "Try a different tag name or clear your search." : "Select videos in your library and choose Add tags, or add tags while watching."} icon={<><Icon name={tags.length ? "search" : "tag"}/></>}><button className="m-button" onClick={tags.length ? onClear : onLibrary}>{tags.length ? "Clear search" : "Browse videos"}</button></EmptyState> : <p className="tags-directory-hint">Open a tag to browse its videos. Add more filters or select videos to organize them together.</p>}
  </section>;
}
