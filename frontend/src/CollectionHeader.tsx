import { useState } from "react";
import type { ReactNode } from "react";
import type { Album } from "./api";
import { PageHeader } from "./WorkspaceUI";
import { Icon } from "./Icons";
import { cardTone } from "./identityTone";

/** Stable collection identity and totals; independent of browsing filters. */
export default function CollectionHeader({ album, media, pinned, actions }: {
  album: Album; media: (path: string) => string; pinned: boolean; actions: ReactNode;
}) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const covers = (album.covers || []).filter(src => !failed.has(src)).slice(0, 3);
  const locked = album.locked || album.inheritedLocked;
  return <header className="collection-hero" data-card-tone={cardTone(`collection:${album.id}`)}>
    <div className="collection-hero-cover" data-cover-count={covers.length} aria-hidden="true">
      {covers.length ? covers.map((src, index) => <img key={`${src}:${index}`} src={media(src)} alt="" draggable={false} onError={() => setFailed(previous => new Set([...previous, src]))} />) : <Icon name={locked ? "lock" : "folder"} />}
    </div>
    <div className="collection-hero-copy">
      <div className="collection-hero-eyebrow">{album.parentId ? "Collection folder" : "Your collection"}{pinned && <span>Pinned to sidebar</span>}{locked && <span><Icon name="lock" />Locked</span>}</div>
      <PageHeader title={album.name} actions={actions} />
      <p className="collection-hero-caption">{album.count ? "Photos and videos, collected in one place." : "A place for your next collection of favorites."}</p>
      <dl className="ui-detail-facts" aria-label="Collection overview">
        <div><dt>Total items</dt><dd>{(album.count || 0).toLocaleString()}</dd></div>
        <div><dt>Photos</dt><dd>{(album.photoCount || 0).toLocaleString()}</dd></div>
        <div><dt>Videos</dt><dd>{(album.videoCount || 0).toLocaleString()}</dd></div>
        <div><dt>Subfolders</dt><dd>{(album.albumCount || 0).toLocaleString()}</dd></div>
      </dl>
    </div>
  </header>;
}
