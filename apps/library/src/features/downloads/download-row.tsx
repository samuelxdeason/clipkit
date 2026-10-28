import {
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  X,
  Clock,
  Check,
  CircleAlert,
} from 'lucide-react';
import { Button, Heading, Icon, IconButton, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { progress, statusLabels, type DownloadJob } from './model';

export type QueueAction = 'up' | 'down' | 'next' | 'remove' | 'retry';

export function DownloadRow({
  job,
  busy,
  position,
  first,
  last,
  onAction,
}: {
  job: DownloadJob;
  busy: boolean;
  position: number;
  first: boolean;
  last: boolean;
  onAction: (action: QueueAction) => void;
}) {
  const active = job.status === 'downloading';
  return (
    <article
      aria-label={job.title || job.url}
      className={css({
        p: { base: '4', md: '5' },
        bg: 'surface',
        borderWidth: '1px',
        borderColor: 'line',
        borderRadius: 'panel',
        display: 'grid',
        gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) auto' },
        alignItems: 'center',
        gap: '4',
        minW: '0',
      })}
    >
      <div className={css({ minW: '0', display: 'grid', gap: '3' })}>
        <div
          className={css({
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3',
            alignItems: 'start',
            justifyContent: 'space-between',
          })}
        >
          <span
            aria-hidden="true"
            className={css({
              display: { base: 'none', md: 'inline-flex' },
              alignItems: 'center',
              justifyContent: 'center',
              w: '12',
              h: '12',
              bg: 'field',
              color: active ? 'info' : 'muted',
              borderRadius: 'control',
              flexShrink: '0',
            })}
          >
            <Icon
              glyph={
                active
                  ? ArrowDownToLine
                  : job.status === 'error'
                    ? CircleAlert
                    : job.status === 'queued'
                      ? Clock
                      : Check
              }
            />
          </span>
          <div className={css({ minW: '0', flex: '1', overflowWrap: 'anywhere' })}>
            <Heading as="h2" size="sm">
              {job.title || 'Untitled download'}
            </Heading>
            <Text size="sm" tone="muted">
              {job.url}
            </Text>
          </div>
          <Text
            size="sm"
            px="3"
            py="1"
            bg="field"
            borderRadius="full"
            color={job.status === 'error' ? 'danger' : active ? 'info' : 'muted'}
          >
            {statusLabels[job.status] || job.status}
          </Text>
        </div>
        {job.replace && (
          <Text size="sm" tone="muted">
            Replacing an existing copy
          </Text>
        )}
        {active && (
          <>
            <progress
              aria-label="Download progress"
              max={100}
              value={progress(job)}
              className={css({
                w: 'full',
                h: '2',
                appearance: 'none',
                borderRadius: 'full',
                overflow: 'hidden',
                '&::-webkit-progress-bar': { bg: 'field' },
                '&::-webkit-progress-value': { bg: 'info' },
                '&::-moz-progress-bar': { bg: 'info' },
              })}
            />
            <Text size="sm" tone="muted">
              {Math.round(progress(job))}%{job.speed ? ` · ${job.speed}` : ''}
              {job.eta ? ` · ${job.eta} remaining` : ''}
            </Text>
          </>
        )}
        {job.count > 0 && (
          <Text size="sm" tone="muted">
            {job.count} items processed
          </Text>
        )}
        {job.status === 'queued' && (
          <Text size="sm" tone="muted">
            #{position} in queue{first ? ' · Up next' : ''}
          </Text>
        )}
        {job.status === 'duplicate' && (
          <Text size="sm" tone="muted">
            Already saved in your library.
          </Text>
        )}
        {job.error && (
          <details className={css({ color: 'danger', fontSize: 'sm' })}>
            <summary className={css({ cursor: 'pointer' })}>View error details</summary>
            <Text
              size="sm"
              tone="danger"
              className={css({ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: '2' })}
            >
              {job.error}
            </Text>
          </details>
        )}
      </div>
      {['queued', 'error'].includes(job.status) && (
        <div
          className={css({
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2',
            alignItems: 'center',
            justifyContent: { base: 'start', lg: 'end' },
          })}
        >
          {job.status === 'queued' && (
            <>
              <Button
                size="compact"
                variant="outline"
                disabled={busy || first}
                onClick={() => onAction('next')}
              >
                Download next
              </Button>
              <IconButton
                aria-label="Move up"
                title="Move up"
                variant="plain"
                disabled={busy || first}
                onClick={() => onAction('up')}
              >
                <Icon glyph={ArrowUp} size="sm" />
              </IconButton>
              <IconButton
                aria-label="Move down"
                title="Move down"
                variant="plain"
                disabled={busy || last}
                onClick={() => onAction('down')}
              >
                <Icon glyph={ArrowDown} size="sm" />
              </IconButton>
              <IconButton
                aria-label="Remove from queue"
                title="Remove from queue"
                variant="plain"
                disabled={busy}
                onClick={() => onAction('remove')}
              >
                <Icon glyph={X} size="sm" />
              </IconButton>
            </>
          )}
          {job.status === 'error' && (
            <Button
              size="compact"
              variant="outline"
              disabled={busy}
              onClick={() => onAction('retry')}
            >
              <Icon glyph={RotateCcw} size="sm" />
              Retry download
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
