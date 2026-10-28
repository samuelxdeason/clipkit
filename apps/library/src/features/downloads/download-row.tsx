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
import {
  Button,
  Disclosure,
  Heading,
  Icon,
  IconButton,
  IconTile,
  Panel,
  ProgressBar,
  StatusBadge,
  Text,
} from '@clipkit/ui';
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
    <Panel asChild accent={active ? 'info' : undefined}>
      <article
        aria-label={job.title || job.url}
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) auto' },
          alignItems: 'center',
          gap: '4',
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
            <IconTile
              aria-hidden="true"
              tone={active ? 'info' : 'neutral'}
              className={css({ display: { base: 'none', md: 'grid' } })}
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
            </IconTile>
            <div className={css({ minW: '0', flex: '1', overflowWrap: 'anywhere' })}>
              <Heading as="h2" size="sm">
                {job.title || 'Untitled download'}
              </Heading>
              <Text size="sm" tone="muted">
                {job.url}
              </Text>
            </div>
            <StatusBadge
              tone={
                job.status === 'error'
                  ? 'danger'
                  : job.status === 'done'
                    ? 'success'
                    : job.status === 'duplicate'
                      ? 'warning'
                      : active
                        ? 'info'
                        : 'neutral'
              }
            >
              {statusLabels[job.status] || job.status}
            </StatusBadge>
          </div>
          {job.replace && (
            <Text size="sm" tone="muted">
              Replacing an existing copy
            </Text>
          )}
          {active && (
            <>
              <ProgressBar aria-label="Download progress" max={100} value={progress(job)} />
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
            <Disclosure.Root tone="danger">
              <Disclosure.Summary>View error details</Disclosure.Summary>
              <Disclosure.Content
                className={css({ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })}
              >
                {job.error}
              </Disclosure.Content>
            </Disclosure.Root>
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
                  variant="neutral"
                  disabled={busy || first}
                  onClick={() => onAction('next')}
                >
                  Download next
                </Button>
                <IconButton
                  aria-label="Move up"
                  title="Move up"
                  variant="quiet"
                  disabled={busy || first}
                  onClick={() => onAction('up')}
                >
                  <Icon glyph={ArrowUp} size="sm" />
                </IconButton>
                <IconButton
                  aria-label="Move down"
                  title="Move down"
                  variant="quiet"
                  disabled={busy || last}
                  onClick={() => onAction('down')}
                >
                  <Icon glyph={ArrowDown} size="sm" />
                </IconButton>
                <IconButton
                  aria-label="Remove from queue"
                  title="Remove from queue"
                  variant="quiet"
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
                variant="neutral"
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
    </Panel>
  );
}
