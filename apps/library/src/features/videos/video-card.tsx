import { Film, Users } from 'lucide-react';
import { useState } from 'react';
import { Button, Checkbox, MediaCard, Tag, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { formatDuration, type Video } from './model';

export function VideoCard({
  video,
  previewStyle = 'portrait',
  manage,
  selected,
  onSelect,
  onOpen,
  onTag,
}: {
  video: Video;
  previewStyle?: string;
  manage: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  onTag: (tag: string) => void;
}) {
  const [failedArtwork, setFailedArtwork] = useState<string>();
  const [portraitPoster, setPortraitPoster] = useState<string>();
  const [failedTriptych, setFailedTriptych] = useState<string>();
  const useTriptych =
    previewStyle === 'triptych' &&
    video.triptych &&
    video.triptych !== failedTriptych &&
    (!video.artwork || portraitPoster === video.artwork);
  const artwork = useTriptych ? video.triptych : video.artwork;
  return (
    <MediaCard.Root kind="video" aria-label={video.title} data-selected={selected || undefined}>
      <MediaCard.Frame>
        <MediaCard.Media
          type="button"
          aria-label={
            manage ? `${selected ? 'Deselect' : 'Select'} ${video.title}` : `Preview ${video.title}`
          }
          onClick={manage ? () => onSelect(!selected) : onOpen}
        >
          {!useTriptych &&
            portraitPoster === video.artwork &&
            video.artwork &&
            failedArtwork !== video.artwork && (
              <MediaCard.Backdrop
                aria-hidden="true"
                data-portrait-backdrop=""
                style={{ backgroundImage: `url(${JSON.stringify(video.artwork)})` }}
              />
            )}
          {artwork && failedArtwork !== artwork ? (
            <img
              className={css({ position: 'relative', zIndex: '1' })}
              src={artwork}
              alt=""
              loading="lazy"
              onLoad={(event) => {
                const image = event.currentTarget;
                if (!useTriptych && image.naturalHeight > image.naturalWidth)
                  setPortraitPoster(video.artwork);
              }}
              onError={() =>
                useTriptych ? setFailedTriptych(video.triptych) : setFailedArtwork(artwork)
              }
            />
          ) : (
            <MediaCard.Fallback>
              <Film aria-hidden="true" />
              <span>Preview unavailable</span>
            </MediaCard.Fallback>
          )}
        </MediaCard.Media>
        {video.duration > 0 && (
          <MediaCard.Badge className={css({ bottom: '3', right: '3' })}>
            {formatDuration(video.duration)}
          </MediaCard.Badge>
        )}
        {video.resolution && (
          <MediaCard.Badge className={css({ bottom: '3', left: '3' })}>
            {video.resolution}
          </MediaCard.Badge>
        )}
        {manage && (
          <MediaCard.Select>
            <Checkbox
              label={`Select checkbox: ${video.title}`}
              hideLabel
              checked={selected}
              onCheckedChange={onSelect}
            />
          </MediaCard.Select>
        )}
        {video.progress > 0 && (
          <MediaCard.Progress
            role="img"
            aria-label={video.progress === 1 ? 'Finished' : 'In progress'}
          >
            <MediaCard.ProgressValue style={{ width: `${video.progress * 100}%` }} />
          </MediaCard.Progress>
        )}
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title title={video.title}>{video.title}</MediaCard.Title>
        <MediaCard.Subtitle
          title={video.person || 'No people linked'}
          data-empty={video.person ? undefined : ''}
        >
          <Users aria-hidden="true" />
          <span>{video.person || 'No people linked'}</span>
        </MediaCard.Subtitle>
        {manage && video.collection && (
          <Text size="sm" tone="muted">
            In {video.collection}
          </Text>
        )}
        <MediaCard.Secondary>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '1', minW: '0' })}>
            {video.tags.slice(0, 2).map((tag) => (
              <Tag
                key={tag}
                title={tag}
                aria-label={`Filter by tag: ${tag}`}
                onClick={() => onTag(tag)}
                className={css({ maxW: '[130px]' })}
              >
                {tag}
              </Tag>
            ))}
            {video.tags.length > 2 && (
              <Text
                size="sm"
                tone="muted"
                title={video.tags.slice(2).join(', ')}
                aria-label={`${video.tags.length - 2} more tags: ${video.tags.slice(2).join(', ')}`}
              >
                +{video.tags.length - 2}
              </Text>
            )}
          </div>
          {!manage && (
            <Button
              size="compact"
              variant="quiet"
              aria-label={`Open details for ${video.title}`}
              onClick={onOpen}
            >
              File info
            </Button>
          )}
        </MediaCard.Secondary>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}
