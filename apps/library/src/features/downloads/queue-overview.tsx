import { ArrowDownToLine, Check, Clock, CircleAlert } from 'lucide-react';
import { Button, Icon, Rule, Stat, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { matchesStatus, progress, type DownloadJob } from './model';

export const queueCategories = [
  { value: 'downloading', label: 'In progress', icon: ArrowDownToLine, tone: 'info' },
  { value: 'queued', label: 'Waiting', icon: Clock, tone: 'neutral' },
  { value: 'completed', label: 'Completed', icon: Check, tone: 'success' },
  { value: 'error', label: 'Needs attention', icon: CircleAlert, tone: 'danger' },
] as const;

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
            variant="neutral"
            aria-pressed={value === item.value}
            onClick={() => onChange(value === item.value ? 'all' : item.value)}
            h="auto"
            p="3"
            justifyContent="flex-start"
          >
            <Stat.Root tone={item.tone} className={css({ textAlign: 'left', w: 'full' })}>
              <Stat.Label asChild>
                <span>
                  <Icon glyph={item.icon} size="sm" />
                  {item.label}
                </span>
              </Stat.Label>
              <Stat.Value asChild>
                <span>
                  {ready ? jobs.filter((job) => matchesStatus(job, item.value)).length : '—'}
                </span>
              </Stat.Value>
            </Stat.Root>
          </Button>
        ))}
      </div>
      <Rule
        side="top"
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          gap: '4',
        })}
      >
        <div className={css({ minW: '0', display: 'grid', gap: '1' })}>
          <Text size="sm" tone="muted">
            Active now
          </Text>
          <Text fontWeight="label" truncate>
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
          <Text fontWeight="label" truncate>
            {!ready ? 'Loading queue…' : next ? next.title || next.url : 'Nothing waiting'}
          </Text>
          <Text size="sm" tone="muted">
            {next ? 'First in queue order · reorder below' : 'Add a link to get started.'}
          </Text>
        </div>
      </Rule>
    </section>
  );
}
