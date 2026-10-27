import { useMemo, useState } from "react";
import { library } from "../wailsjs/go/models";
import PersonAvatar from "./PersonAvatar";

export default function PeopleDirectory({ people, query, media, onOpen, onClear }: {
  people: library.Model[]; query: string; media: (path: string) => string;
  onOpen: (person: library.Model) => void; onClear: () => void;
}) {
  const [sort, setSort] = useState("name");
  const matches = useMemo(() => people.filter(p => [p.name, p.nickname].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => (sort === "count" ? (b.count || 0) - (a.count || 0) : 0) || (a.nickname || a.name).localeCompare(b.nickname || b.name)), [people, query, sort]);
  return <section className="people-directory" aria-label="People directory">
    <div className="people-directory-toolbar"><span role="status">{matches.length} {matches.length === 1 ? "person" : "people"}{query.trim() ? ` matching “${query.trim()}”` : " in your library"}</span><label>Sort by<select aria-label="Sort people" value={sort} onChange={e => setSort(e.target.value)}><option value="name">Name A–Z</option><option value="count">Most videos</option></select></label></div>
    <div className="people-directory-grid">{matches.map(p => <button key={p.name} className="person-tile" onClick={() => onOpen(p)}>
      <span className="person-tile-art"><PersonAvatar name={p.nickname || p.name} src={p.thumbnail ? media(p.thumbnail) : undefined}/><span className="person-tile-open" aria-hidden="true">↗</span></span>
      <span className="person-tile-copy"><strong>{p.nickname || p.name}</strong><span className="person-tile-alias">{p.nickname && p.nickname !== p.name ? p.name : "Person in your library"}</span><span className="person-tile-count">{p.count || 0} video{p.count === 1 ? "" : "s"}</span></span>
    </button>)}</div>
    {!matches.length && <div className="manager-empty"><h2>{people.length ? "No matching people" : "Your people, all together"}</h2><p>{people.length ? "Try a different name or clear your search." : "Create a person above, then link them to videos as you watch."}</p>{people.length > 0 && <button className="m-button" onClick={onClear}>Clear search</button>}</div>}
  </section>;
}
