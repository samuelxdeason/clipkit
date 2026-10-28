import { useState } from 'react';
import { ArrowUpRight, Film, Tags, Users } from 'lucide-react';
import { Icon, Text } from '@clipkit/ui';
import { css, cva } from '@clipkit/ui/css';
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

// Shared interaction and spacing recipe; each directory keeps its own silhouette.
const directoryLink = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    h: 'full',
    minW: '0',
    color: 'text',
    textDecoration: 'none',
    position: 'relative',
    _focusVisible: {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: 'accent',
      outlineOffset: '-1',
    },
  },
  variants: {
    kind: {
      people: { gap: '0' },
      tags: { p: '5', gap: '6', minH: '[180px]' },
    },
  },
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
  const person = kind === 'people';
  return (
    <article
      aria-label={entry.displayName}
      data-directory-kind={kind}
      className={css({
        minW: '0',
        bg: 'surface',
        borderWidth: '1px',
        borderColor: 'line',
        borderRadius: 'panel',
        overflow: 'hidden',
        position: 'relative',
        transition: 'colors',
        _hover: { borderColor: 'muted' },
        _focusWithin: { borderColor: 'accent' },
      })}
    >
      {!person && <IdentityWash name={entry.name} placement="tag" />}
      <a href={href} className={directoryLink({ kind })}>
        <div
          className={css({
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'space-between',
            position: 'relative',
            ...(person
              ? {
                  p: '6',
                  justifyContent: 'center',
                  minH: '[200px]',
                  bg: 'canvas',
                  borderBottomWidth: '1px',
                  borderColor: 'line',
                }
              : {}),
          })}
        >
          {person && <IdentityWash name={entry.name} placement="card" />}
          <div
            className={css({
              position: 'relative',
              flexShrink: '0',
              ...(person ? { w: '[60%]', maxW: '[180px]' } : { w: '12' }),
            })}
          >
            <IdentityMark
              name={entry.name}
              src={person ? entry.thumbnail : undefined}
              kind={kind}
              round={person}
            />
          </div>
          <span
            aria-hidden="true"
            className={css({
              color: 'muted',
              display: 'inline-flex',
              ...(person ? { position: 'absolute', right: '4', top: '4' } : {}),
            })}
          >
            <Icon glyph={ArrowUpRight} size="sm" />
          </span>
        </div>
        <div
          className={css({
            minW: '0',
            display: 'grid',
            gap: '2',
            position: 'relative',
            ...(person ? { p: '4', flex: '1', alignContent: 'start' } : { mt: 'auto' }),
          })}
        >
          <h2
            title={entry.displayName}
            className={css({
              textStyle: 'cardTitle',
              overflowWrap: 'anywhere',
              lineClamp: 2,
              ...(person ? { minH: '[44px]' } : { fontSize: 'xl', lineHeight: '[1.25]' }),
            })}
          >
            {entry.displayName}
          </h2>
          {person && (
            <Text size="sm" tone="muted" title={entry.name} truncate>
              {entry.displayName !== entry.name ? entry.name : 'Person in your library'}
            </Text>
          )}
          <Text
            size="sm"
            tone="muted"
            className={
              person
                ? css({
                    borderTopWidth: '1px',
                    borderColor: 'line',
                    pt: '3',
                    mt: '1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2',
                  })
                : undefined
            }
          >
            {person && (
              <span className={identityTone(entry.name)}>
                <Icon glyph={Film} size="sm" />
              </span>
            )}
            {entry.count} {entry.count === 1 ? 'video' : 'videos'}
          </Text>
          {entry.detail && (
            <Text size="sm" tone="muted" title={entry.detail} truncate>
              {entry.detail}
            </Text>
          )}
        </div>
      </a>
    </article>
  );
}
