import { useState } from 'react';
import { ArrowUpRight, Film, Tags, Users } from 'lucide-react';
import { Icon, MediaCard, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { identityIndex, type DirectoryEntry } from './directory-model';

import { IdentityWash, identityTone } from './identity-style';

export function IdentityMark({
  name,
  src,
  kind,
  round = false,
  portrait = false,
}: {
  name: string;
  src?: string;
  kind: 'people' | 'tags';
  round?: boolean;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  return (
    <div
      data-identity-tone={identityIndex(name)}
      className={`${identityTone(name)} ${css({ position: 'relative', display: 'grid', placeItems: 'center', overflow: 'hidden', aspectRatio: portrait ? '[4 / 5]' : 'square', borderRadius: round ? 'full' : 'panel', w: 'full', isolation: 'isolate', borderWidth: '1px', borderColor: '[color-mix(in srgb, currentColor 30%, transparent)]' })}`}
    >
      <span
        aria-hidden="true"
        className={css({
          position: 'absolute',
          inset: '0',
          bg: 'currentColor',
          opacity: '0.12',
          zIndex: '-1',
        })}
      />
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(src)}
          className={css({ w: 'full', h: 'full', objectFit: 'cover' })}
        />
      ) : kind === 'people' ? (
        <span
          aria-hidden="true"
          className={css({ fontSize: '[clamp(2rem, 4vw, 3.5rem)]', fontWeight: 'bold' })}
        >
          {name
            .trim()
            .split(/\s+/)
            .filter((part) => /[\p{L}\p{N}]/u.test(part))
            .slice(0, 2)
            .map((part) => Array.from(part)[0])
            .join('')
            .toLocaleUpperCase() || <Icon glyph={Users} />}
        </span>
      ) : (
        <Icon glyph={Tags} />
      )}
    </div>
  );
}
/** Profile artwork keeps identity color local to a soft glow, never the panel border. */
export function IdentityPortrait({ name, src }: { name: string; src?: string }) {
  return (
    <div
      className={`${identityTone(name)} ${css({ position: 'relative', isolation: 'isolate', w: 'full' })}`}
    >
      <span
        aria-hidden="true"
        className={css({
          position: 'absolute',
          inset: '3',
          bg: 'currentColor',
          opacity: '0.28',
          filter: '[blur(28px)]',
          pointerEvents: 'none',
          zIndex: '-1',
        })}
      />
      <IdentityMark name={name} src={src} kind="people" portrait />
    </div>
  );
}

// The link is the whole card; MediaCard supplies the shell and silhouette.
const directoryLink = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minW: '0',
  color: 'inherit',
  textDecoration: 'none',
  _focusVisible: { outline: 'none' },
});

export function DirectoryCard({
  entry,
  kind,
  href,
}: {
  entry: DirectoryEntry;
  kind: 'people' | 'tags';
  href: string;
}) {
  const count = `${entry.count} ${entry.count === 1 ? 'video' : 'videos'}`;
  if (kind === 'people') {
    return (
      <MediaCard.Root kind="person" aria-label={entry.displayName} data-directory-kind={kind}>
        <a href={href} className={directoryLink}>
          <MediaCard.Frame>
            <IdentityWash name={entry.name} placement="card" />
            <div className={css({ position: 'relative', w: '[60%]', maxW: '[180px]' })}>
              <IdentityMark name={entry.name} src={entry.thumbnail} kind="people" round />
            </div>
            <MediaCard.Arrow
              aria-hidden="true"
              className={css({ position: 'absolute', top: '4', right: '4' })}
            >
              <ArrowUpRight />
            </MediaCard.Arrow>
          </MediaCard.Frame>
          <MediaCard.Body>
            <MediaCard.Title title={entry.displayName}>{entry.displayName}</MediaCard.Title>
            <MediaCard.Subtitle title={entry.name}>
              <span>
                {entry.displayName !== entry.name ? entry.name : 'Person in your library'}
              </span>
            </MediaCard.Subtitle>
            {entry.detail && (
              <MediaCard.Subtitle title={entry.detail}>
                <span>{entry.detail}</span>
              </MediaCard.Subtitle>
            )}
            <MediaCard.Footer>
              <span
                className={`${identityTone(entry.name)} ${css({ display: 'inline-flex', alignItems: 'center', gap: '2' })}`}
              >
                <Icon glyph={Film} size="sm" />
                <span className={css({ color: 'muted' })}>{count}</span>
              </span>
            </MediaCard.Footer>
          </MediaCard.Body>
        </a>
      </MediaCard.Root>
    );
  }
  return (
    <MediaCard.Root kind="tag" aria-label={entry.displayName} data-directory-kind={kind}>
      <IdentityWash name={entry.name} placement="tag" />
      <a href={href} className={directoryLink}>
        <MediaCard.Body>
          <div
            className={css({
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'space-between',
              gap: '4',
            })}
          >
            <MediaCard.Symbol aria-hidden="true" className={identityTone(entry.name)}>
              <Tags />
            </MediaCard.Symbol>
            <MediaCard.Arrow aria-hidden="true">
              <ArrowUpRight />
            </MediaCard.Arrow>
          </div>
          <div className={css({ mt: 'auto', display: 'grid', gap: '2', minW: '0' })}>
            <MediaCard.Title title={entry.displayName}>{entry.displayName}</MediaCard.Title>
            <Text size="sm" tone="muted">
              {count}
            </Text>
            {entry.detail && (
              <Text size="sm" tone="muted" title={entry.detail} truncate>
                {entry.detail}
              </Text>
            )}
          </div>
        </MediaCard.Body>
      </a>
    </MediaCard.Root>
  );
}
