import { useState } from 'react';
import { Image, ImageOff, Users } from 'lucide-react';
import { Checkbox, MediaCard } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import type { CataloguePhoto } from '../../services/library-client';

export function PhotoCard({
  photo,
  src,
  manage,
  selected,
  onSelect,
  onOpen,
}: {
  photo: CataloguePhoto;
  src: string;
  manage: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState<string>();
  const title = photo.filename || 'Untitled photo';
  return (
    <MediaCard.Root kind="photo" aria-label={photo.filename} data-selected={selected || undefined}>
      <MediaCard.Frame>
        <MediaCard.Media
          type="button"
          aria-label={`${manage ? (selected ? 'Deselect' : 'Select') : 'Preview'} ${photo.filename}`}
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
          <Image aria-hidden="true" /> Photo
        </MediaCard.Badge>
        {manage && (
          <MediaCard.Select>
            <Checkbox
              label={`Select ${photo.filename}`}
              hideLabel
              checked={selected}
              onCheckedChange={onSelect}
            />
          </MediaCard.Select>
        )}
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title title={title} className={css({ lineClamp: 1, whiteSpace: 'nowrap' })}>
          {title}
        </MediaCard.Title>
        <MediaCard.Subtitle
          title={photo.model || 'No person assigned'}
          data-empty={photo.model ? undefined : ''}
        >
          <Users aria-hidden="true" />
          <span>{photo.model || 'No person assigned'}</span>
        </MediaCard.Subtitle>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}
