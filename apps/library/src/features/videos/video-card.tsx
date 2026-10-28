import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Button, Checkbox, Tag, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { MediaCardBody, MediaCardCaption } from '../../components/browsing/media-card-content';
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
    <article
      aria-label={video.title}
      data-selected={selected || undefined}
      className={css({
        minW: '0',
        flexShrink: '0',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'panel',
        overflow: 'hidden',
        borderWidth: '1px',
        borderColor: 'line',
        bg: 'surface',
        transition: 'colors',
        _hover: { borderColor: 'muted' },
        '&[data-selected]': { borderColor: 'accent' },
      })}
    >
      <div
        className={css({
          position: 'relative',
          aspectRatio: 'video',
          flexShrink: '0',
          overflow: 'hidden',
          bg: 'canvas',
        })}
      >
        <button
          type="button"
          aria-label={
            manage ? `${selected ? 'Deselect' : 'Select'} ${video.title}` : `Preview ${video.title}`
          }
          onClick={manage ? () => onSelect(!selected) : onOpen}
          className={css({
            position: 'absolute',
            inset: '0',
            display: 'grid',
            placeItems: 'center',
            w: 'full',
            h: 'full',
            cursor: 'pointer',
            '& img': {
              w: 'full',
              h: 'full',
              minW: '0',
              minH: '0',
              objectFit: 'contain',
              objectPosition: 'center',
            },
            _focusVisible: {
              outlineWidth: '2px',
              outlineStyle: 'solid',
              outlineColor: 'accent',
              outlineOffset: '-1',
            },
          })}
        >
          {!useTriptych &&
            portraitPoster === video.artwork &&
            video.artwork &&
            failedArtwork !== video.artwork && (
              <span
                aria-hidden="true"
                data-portrait-backdrop=""
                style={{ backgroundImage: `url(${JSON.stringify(video.artwork)})` }}
                className={css({
                  position: 'absolute',
                  inset: '0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: '[blur(18px)]',
                  transform: 'scale(1.12)',
                  opacity: '0.3',
                  pointerEvents: 'none',
                })}
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
            <div
              className={css({ display: 'grid', gap: '2', justifyItems: 'center', color: 'muted' })}
            >
              <ImageOff aria-hidden="true" />
              <Text size="sm">Preview unavailable</Text>
            </div>
          )}
        </button>
        {video.duration > 0 && (
          <span
            className={css({
              position: 'absolute',
              bottom: '3',
              right: '3',
              bg: 'canvas',
              color: 'text',
              px: '2',
              py: '0.5',
              borderRadius: 'sm',
              fontSize: 'xs',
              pointerEvents: 'none',
            })}
          >
            {formatDuration(video.duration)}
          </span>
        )}
        <span
          className={css({
            position: 'absolute',
            bottom: '3',
            left: '3',
            bg: 'canvas',
            px: '2',
            py: '0.5',
            borderRadius: 'sm',
            fontSize: 'xs',
            pointerEvents: 'none',
          })}
        >
          {video.resolution}
        </span>
        {manage && (
          <div className={css({ position: 'absolute', top: '2', left: '3' })}>
            <Checkbox
              label={`Select checkbox: ${video.title}`}
              hideLabel
              checked={selected}
              onCheckedChange={onSelect}
            />
          </div>
        )}
        {video.progress > 0 && (
          <div
            role="img"
            aria-label={video.progress === 1 ? 'Finished' : 'In progress'}
            className={css({
              position: 'absolute',
              bottom: '0',
              left: '0',
              w: 'full',
              h: '1',
              bg: 'canvas',
              pointerEvents: 'none',
            })}
          >
            <div
              style={{ width: `${video.progress * 100}%` }}
              className={css({ h: 'full', bg: 'accent' })}
            />
          </div>
        )}
      </div>
      <MediaCardBody fill>
        <MediaCardCaption
          title={video.title}
          people={video.person}
          emptyPeople="No people linked"
        />
        {manage && video.collection && (
          <Text size="sm" tone="muted">
            In {video.collection}
          </Text>
        )}
        <div
          className={css({
            display: 'flex',
            gap: '2',
            alignItems: 'center',
            justifyContent: 'space-between',
            minH: '6',
          })}
        >
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
        </div>
      </MediaCardBody>
    </article>
  );
}
