import { useState } from 'react';
import { Film, Image, ImageOff, Users } from 'lucide-react';
import { Checkbox, MediaCard } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import type { CollectionItem } from './model';

/** `.mixed-media-tile`: a photo or a video in a collection, with its kind in the corner. */
export function CollectionItemCard({
  item,
  src,
  manage,
  selected,
  onSelect,
  onOpen,
}: {
  item: CollectionItem;
  src: string;
  manage: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState<string>();
  const kind = item.photo ? 'photo' : 'video';
  const subtitle = item.photo
    ? item.photo.model || 'Photo'
    : item.video?.people?.length
      ? item.video.people.join(', ')
      : 'Video';
  const hasPeople = !!(item.photo?.model || item.video?.people?.length);
  return (
    <MediaCard.Root kind={kind} aria-label={item.title} data-selected={selected || undefined}>
      <MediaCard.Frame>
        <MediaCard.Media
          type="button"
          aria-label={`${manage ? (selected ? 'Deselect' : 'Select') : item.photo ? 'Preview' : 'Play'} ${item.title}`}
          onClick={manage ? () => onSelect(!selected) : onOpen}
        >
          {src && failed !== src ? (
            <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
          ) : (
            <MediaCard.Fallback>
              <ImageOff aria-hidden="true" />
              <span>Preview unavailable</span>
            </MediaCard.Fallback>
          )}
        </MediaCard.Media>
        <MediaCard.Badge className={css({ top: '3', right: '3' })}>
          {item.photo ? <Image aria-hidden="true" /> : <Film aria-hidden="true" />}
          {item.photo ? 'Photo' : 'Video'}
        </MediaCard.Badge>
        {manage && (
          <MediaCard.Select>
            <Checkbox
              label={`Select ${item.title}`}
              hideLabel
              checked={selected}
              onCheckedChange={onSelect}
            />
          </MediaCard.Select>
        )}
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title title={item.title} className={css({ lineClamp: 1, whiteSpace: 'nowrap' })}>
          {item.title}
        </MediaCard.Title>
        <MediaCard.Subtitle title={subtitle} data-empty={hasPeople ? undefined : ''}>
          {hasPeople && <Users aria-hidden="true" />}
          <span>{subtitle}</span>
        </MediaCard.Subtitle>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}
