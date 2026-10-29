import { useState } from 'react';
import { Folder, Lock, Plus } from 'lucide-react';
import { CoverMosaic, MediaCard } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import type { Collection } from '../../services/library-client';
import { countLabel, isLocked } from '../../components/browsing/collection-model';

const counts = ['one', 'two', 'three'] as const;

/** `.featured-collection`: a collection at the top level, with up to three covers. */
export function CollectionCard({
  collection,
  media,
  onCreate,
}: {
  collection: Collection;
  media: (path: string) => string;
  onCreate: () => void;
}) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const covers = (collection.covers || []).filter((src) => !failed.has(src)).slice(0, 3);
  const locked = isLocked(collection);
  const detail = `${countLabel(collection.count || 0, 'item')}${
    collection.albumCount ? ` · ${countLabel(collection.albumCount, 'folder')}` : ''
  }`;
  return (
    <MediaCard.Root kind="collection" aria-label={collection.name}>
      <MediaCard.Link
        href={`/?view=collection&id=${collection.id}`}
        aria-label={`Open collection ${collection.name}`}
      >
        <MediaCard.Frame>
          {covers.length ? (
            <CoverMosaic count={counts[covers.length - 1]}>
              {covers.map((src) => (
                <img
                  key={src}
                  src={media(src)}
                  alt=""
                  loading="lazy"
                  onError={() => setFailed((previous) => new Set([...previous, src]))}
                />
              ))}
            </CoverMosaic>
          ) : locked ? (
            <Lock aria-hidden="true" />
          ) : (
            <Folder aria-hidden="true" />
          )}
          <MediaCard.Badge className={css({ top: '3.5', left: '3.5' })}>
            {locked ? <Lock aria-hidden="true" /> : <Folder aria-hidden="true" />}
            {locked ? 'Locked collection' : 'Collection'}
          </MediaCard.Badge>
        </MediaCard.Frame>
        <MediaCard.Body>
          <MediaCard.Title title={collection.name}>{collection.name}</MediaCard.Title>
          <MediaCard.Subtitle title={detail}>
            <span>{detail}</span>
          </MediaCard.Subtitle>
        </MediaCard.Body>
        <MediaCard.Footer>
          <span>{countLabel(collection.photoCount || 0, 'photo')}</span>
          <span>{countLabel(collection.videoCount || 0, 'video')}</span>
        </MediaCard.Footer>
      </MediaCard.Link>
      <MediaCard.Action
        type="button"
        aria-label={`New folder in ${collection.name}`}
        title="New subfolder"
        disabled={locked}
        onClick={onCreate}
      >
        <Plus aria-hidden="true" />
      </MediaCard.Action>
    </MediaCard.Root>
  );
}
