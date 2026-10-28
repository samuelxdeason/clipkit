import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { Icon, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/** Shared spacing for photo/video metadata; media frames remain feature-owned. */
export function MediaCardBody({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return (
    <div
      className={css({
        px: '3.5',
        py: '3',
        display: 'grid',
        gap: '2',
        minW: '0',
        ...(fill ? { flex: '1', gridTemplateRows: '1fr auto' } : {}),
      })}
    >
      {children}
    </div>
  );
}

export function MediaCardCaption({
  title,
  people,
  emptyPeople,
  singleLine = false,
}: {
  title: string;
  people: string;
  emptyPeople: string;
  singleLine?: boolean;
}) {
  return (
    <div className={css({ minW: '0' })}>
      <h2
        title={title}
        className={css({
          textStyle: 'cardTitle',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...(singleLine ? { whiteSpace: 'nowrap' } : { lineClamp: 2, overflowWrap: 'anywhere' }),
        })}
      >
        {title}
      </h2>
      <Text
        size="sm"
        textStyle="metadata"
        tone="muted"
        title={people || emptyPeople}
        display="flex"
        alignItems="center"
        gap="2"
        minW="0"
      >
        <span className={css({ display: 'inline-flex', color: 'identity.plum', flexShrink: '0' })}>
          <Icon glyph={Users} size="sm" />
        </span>
        <span
          className={css({
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minW: '0',
          })}
        >
          {people || emptyPeople}
        </span>
      </Text>
    </div>
  );
}
