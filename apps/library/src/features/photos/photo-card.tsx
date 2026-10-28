import { useState } from 'react';
import { ImageOff, Image } from 'lucide-react';
import { Checkbox, Icon, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { MediaCardBody, MediaCardCaption } from '../../components/browsing/media-card-content';
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
  return (
    <article
      aria-label={photo.filename}
      data-selected={selected || undefined}
      className={css({
        minW: '0',
        overflow: 'hidden',
        borderRadius: 'panel',
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
          aspectRatio: '[4 / 5]',
          bg: 'raised',
          overflow: 'hidden',
        })}
      >
        <button
          type="button"
          aria-label={`${manage ? (selected ? 'Deselect' : 'Select') : 'Preview'} ${photo.filename}`}
          onClick={manage ? () => onSelect(!selected) : onOpen}
          className={css({
            w: 'full',
            h: 'full',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            '& img': { w: 'full', h: 'full', objectFit: 'cover', transition: '[transform 200ms]' },
            _hover: { '& img': { transform: 'scale(1.035)' } },
            _focusVisible: {
              outlineWidth: '2px',
              outlineStyle: 'solid',
              outlineColor: 'accent',
              outlineOffset: '-1',
            },
          })}
        >
          {src && failed !== src ? (
            <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
          ) : (
            <div>
              <Icon glyph={ImageOff} />
              <Text size="sm">Preview unavailable</Text>
            </div>
          )}
        </button>
        <span
          className={css({
            position: 'absolute',
            top: '3',
            right: '3',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1',
            px: '2',
            py: '1',
            bg: 'canvas',
            color: 'text',
            borderRadius: 'sm',
            fontSize: 'xs',
            pointerEvents: 'none',
          })}
        >
          <Icon glyph={Image} size="sm" /> Photo
        </span>
        {manage && (
          <div className={css({ position: 'absolute', top: '2', left: '3' })}>
            <Checkbox
              label={`Select ${photo.filename}`}
              hideLabel
              checked={selected}
              onCheckedChange={onSelect}
            />
          </div>
        )}
      </div>
      <MediaCardBody>
        <MediaCardCaption
          title={photo.filename || 'Untitled photo'}
          people={photo.model || ''}
          emptyPeople="No person assigned"
          singleLine
        />
      </MediaCardBody>
    </article>
  );
}
