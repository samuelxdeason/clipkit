import { useState } from 'react';
import { ArrowUpRight, Film, Tags, Users } from 'lucide-react';
import { Avatar, Icon, Identity, MediaCard, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { identityIndex, type DirectoryEntry } from './directory-model';

import { IdentityWash, identityToneName } from './identity-style';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter((part) => /[\p{L}\p{N}]/u.test(part))
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join('')
    .toLocaleUpperCase();
}

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
  const letters = kind === 'people' ? initials(name) : '';
  return (
    <Identity asChild tone={identityToneName(name)}>
      <Avatar.Root
        data-identity-tone={identityIndex(name)}
        shape={round ? 'round' : portrait ? 'portrait' : 'tile'}
      >
        <Avatar.Frame>
          <Avatar.Wash aria-hidden="true" />
          {src && failed !== src ? (
            <Avatar.Image src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
          ) : letters ? (
            <Avatar.Initials aria-hidden="true">{letters}</Avatar.Initials>
          ) : (
            <Icon glyph={kind === 'people' ? Users : Tags} />
          )}
        </Avatar.Frame>
      </Avatar.Root>
    </Identity>
  );
}

/** Profile artwork keeps identity color local to a soft glow, never the panel border. */
export function IdentityPortrait({ name, src }: { name: string; src?: string }) {
  return (
    <Identity asChild tone={identityToneName(name)}>
      <Avatar.Root>
        <Avatar.Glow aria-hidden="true" />
        <IdentityMark name={name} src={src} kind="people" portrait />
      </Avatar.Root>
    </Identity>
  );
}

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
        <MediaCard.Link href={href}>
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
              <span className={css({ display: 'inline-flex', alignItems: 'center', gap: '2' })}>
                <Identity tone={identityToneName(entry.name)}>
                  <Icon glyph={Film} size="sm" />
                </Identity>
                <Text as="span" size="sm" tone="muted">
                  {count}
                </Text>
              </span>
            </MediaCard.Footer>
          </MediaCard.Body>
        </MediaCard.Link>
      </MediaCard.Root>
    );
  }
  return (
    <MediaCard.Root kind="tag" aria-label={entry.displayName} data-directory-kind={kind}>
      <IdentityWash name={entry.name} placement="tag" />
      <MediaCard.Link href={href}>
        <MediaCard.Body>
          <div
            className={css({
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'space-between',
              gap: '4',
            })}
          >
            <Identity asChild tone={identityToneName(entry.name)}>
              <MediaCard.Symbol aria-hidden="true">
                <Tags />
              </MediaCard.Symbol>
            </Identity>
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
      </MediaCard.Link>
    </MediaCard.Root>
  );
}
