import { ArrowDownToLine, Check, Clock, CircleAlert } from 'lucide-react';
import { Button, Icon, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { matchesStatus, progress, type DownloadJob } from './model';

export const queueCategories = [
  { value: 'downloading', label: 'In progress', icon: ArrowDownToLine },
  { value: 'queued', label: 'Waiting', icon: Clock },
  { value: 'completed', label: 'Completed', icon: Check },
  { value: 'error', label: 'Needs attention', icon: CircleAlert },
];

/** Counts always describe the full queue, independent of the visible results. */
export function QueueOverview({
  jobs,
  ready,
  value,
  onChange,
}: {
  jobs: DownloadJob[];
  ready: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const current = jobs.find((job) => job.status === 'downloading');
  const next = jobs.find((job) => job.status === 'queued');
  return (
    <section
      aria-label="Queue overview"
      className={css({
        display: 'grid',
        gap: '4',
        alignContent: 'start',
      })}
    >
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: {
            base: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: '2',
        })}
      >
        {queueCategories.map((item) => (
          <Button
            key={item.value}
            variant="outline"
            aria-pressed={value === item.value}
            onClick={() => onChange(value === item.value ? 'all' : item.value)}
            bg="field"
            h="auto"
            p="3"
            justifyContent="flex-start"
          >
            <span className={css({ display: 'grid', gap: '2', textAlign: 'left', w: 'full' })}>
              <span
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2',
                  color: 'muted',
                  fontSize: 'sm',
                })}
              >
                <Icon glyph={item.icon} size="sm" />
                {item.label}
              </span>
              <span
                className={css({
                  color:
                    item.value === 'downloading'
                      ? 'info'
                      : item.value === 'completed'
                        ? 'success'
                        : item.value === 'error'
                          ? 'danger'
                          : 'text',
                  fontSize: '2xl',
                  fontWeight: 'bold',
                  fontVariantNumeric: 'tabular-nums',
                })}
              >
                {ready ? jobs.filter((job) => matchesStatus(job, item.value)).length : '—'}
              </span>
            </span>
          </Button>
        ))}
      </div>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          gap: '4',
          pt: '4',
          borderTopWidth: '1px',
          borderColor: 'line',
        })}
      >
        <div className={css({ minW: '0', display: 'grid', gap: '1' })}>
          <Text size="sm" tone="muted">
            Active now
          </Text>
          <Text fontWeight="semibold" truncate>
            {!ready
              ? 'Loading queue…'
              : current
                ? current.title || current.url
                : 'No active downloads'}
          </Text>
          {current && (
            <Text size="sm" tone="muted">
              {Math.round(progress(current))}%{current.speed ? ` · ${current.speed}` : ''}
              {current.eta ? ` · ${current.eta} remaining for this download` : ''}
            </Text>
          )}
        </div>
        <div className={css({ minW: '0', display: 'grid', gap: '1' })}>
          <Text size="sm" tone="muted">
            Up next
          </Text>
          <Text fontWeight="semibold" truncate>
            {!ready ? 'Loading queue…' : next ? next.title || next.url : 'Nothing waiting'}
          </Text>
          <Text size="sm" tone="muted">
            {next ? 'First in queue order · reorder below' : 'Add a link to get started.'}
          </Text>
        </div>
      </div>
    </section>
  );
}
