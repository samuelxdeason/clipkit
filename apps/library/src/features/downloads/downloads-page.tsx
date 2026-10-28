import { DownloadComposer } from './download-composer';
import { QueueOverview, queueCategories as categories } from './queue-overview';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button, ChoiceSelect, EmptyState, Heading, Notice, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { ConnectionPanel } from '../../app/connection-panel';
import { PageIntro } from '../../components/browsing/page-intro';
import {
  ActiveFilters,
  BrowseFooter,
  BrowseToolbar,
} from '../../components/browsing/browse-controls';
import { useLibraryResource } from '../../services/use-library-resource';
import type { LibraryClient } from '../../services/library-client';
import { DownloadRow, type QueueAction } from './download-row';
import { matchesStatus, parseLinks, type DownloadJob } from './model';

const loadQueue = (api: LibraryClient, signal: AbortSignal) =>
  api.request<DownloadJob[]>('/api/queue', { signal });
const row = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'center' });

export function DownloadsPage() {
  const library = useLibraryResource(loadQueue);
  const [links, setLinks] = useState('');
  const [inputError, setInputError] = useState('');
  const [added, setAdded] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('queue');
  const [page, setPage] = useState(1);
  const jobs = library.data || [];
  const waiting = jobs.filter((job) => job.status === 'queued');
  const matches = jobs.filter(
    (job) =>
      matchesStatus(job, status) &&
      `${job.title} ${job.url} ${job.error}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (sort === 'title') matches.sort((a, b) => (a.title || a.url).localeCompare(b.title || b.url));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(matches.length / 24)));
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);
  useEffect(() => {
    if (!library.client || library.busy || library.loading) return;
    // Progress events can be frequent or lost during reconnect; snapshots remain authoritative.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void library.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [library.client, library.busy, library.loading, library.refresh]);

  async function submit() {
    setInputError('');
    setAdded(null);
    let urls: string[];
    try {
      urls = parseLinks(links);
    } catch (error) {
      setInputError(String(error instanceof Error ? error.message : error));
      return;
    }
    let count = 0;
    const success = await library.mutate(async (api) => {
      const result = await api.request<{ added: number }>('/api/enqueue/many', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      count = result.added;
    }, 'Links submitted.');
    if (success) {
      setLinks('');
      setAdded(count);
    }
  }
  function bulkAction(path: string, body: unknown, message: string) {
    setAdded(null);
    void library.mutate((api) => api.post(path, body), message);
  }
  function action(job: DownloadJob, action: QueueAction) {
    const path = action === 'remove' ? 'remove' : action === 'retry' ? 'retry' : 'move';
    void library.mutate(
      (api) =>
        api.post(`/api/job/${path}`, {
          id: job.id,
          ...(path === 'move' ? { direction: action } : {}),
        }),
      action === 'remove' ? 'Waiting entry removed. Media files are unchanged.' : 'Queue updated.',
    );
  }
  const chips = [];
  if (query)
    chips.push({
      key: 'query',
      label: `Search: ${query}`,
      onRemove: () => {
        setQuery('');
        setPage(1);
      },
    });
  if (status !== 'all')
    chips.push({
      key: 'status',
      label: categories.find((item) => item.value === status)!.label,
      onRemove: () => {
        setStatus('all');
        setPage(1);
      },
    });
  const clear = () => {
    setQuery('');
    setStatus('all');
    setPage(1);
  };
  return (
    <LibraryShell page="downloads">
      <div className={css({ display: 'grid', gap: '6' })}>
        <div className={`${row} ${css({ justifyContent: 'space-between' })}`}>
          <PageIntro title="Downloads" description="Bring your next favorites into the library." />
          <Button variant="neutral" onClick={() => void library.refresh()} disabled={library.busy}>
            Refresh queue
          </Button>
        </div>
        <section
          aria-label="Download center"
          className={css({
            p: { base: '4', md: '6' },
            display: 'grid',
            gap: '5',
            borderWidth: '1px',
            borderColor: 'line',
            borderRadius: 'panel',
            bg: 'surface',
            backgroundImage:
              '[radial-gradient(ellipse at top left, color-mix(in srgb, token(colors.info) 12%, transparent), transparent 75%)]',
          })}
        >
          <DownloadComposer
            value={links}
            onChange={setLinks}
            busy={library.busy}
            connected={!!library.client}
            error={inputError}
            onSubmit={() => void submit()}
          />
          <QueueOverview
            jobs={jobs}
            ready={!!library.data}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </section>
        {library.error && (
          <Notice
            tone="danger"
            actions={
              <Button
                variant="quiet"
                size="compact"
                disabled={library.busy}
                onClick={() => void library.refresh()}
              >
                Retry connection
              </Button>
            }
          >
            {library.error}
          </Notice>
        )}
        {(library.notice || added !== null) && (
          <Notice>
            {added !== null
              ? `${added} new downloads added. Existing queue entries may be skipped.`
              : library.notice}
          </Notice>
        )}
        <div>
          <div className={css({ mb: '4' })}>
            <Heading as="h2">Download queue</Heading>
            <Text size="sm" tone="muted">
              Follow progress and choose what downloads next.
            </Text>
          </div>
          <BrowseToolbar
            noun="downloads"
            query={query}
            onQuery={(value) => {
              setQuery(value);
              setPage(1);
            }}
            count={matches.length}
            chips={<ActiveFilters items={chips} onClear={clear} />}
          >
            <ChoiceSelect
              hideLabel
              appearance="toolbar"
              label="Download status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[{ value: 'all', label: 'All downloads' }, ...categories]}
            />
            <ChoiceSelect
              hideLabel
              appearance="toolbar"
              label="Sort downloads"
              value={sort}
              onChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              options={[
                { value: 'queue', label: 'Queue order' },
                { value: 'title', label: 'Title A–Z' },
              ]}
            />
          </BrowseToolbar>
          <div className={`${row} ${css({ py: '4' })}`}>
            <Button
              variant="quiet"
              disabled={library.busy || !jobs.some((job) => job.status === 'error')}
              onClick={() =>
                bulkAction('/api/job/retry', { id: '' }, 'Failed downloads submitted for retry.')
              }
            >
              Retry failed
            </Button>
            <Button
              variant="quiet"
              disabled={library.busy || !jobs.some((job) => matchesStatus(job, 'completed'))}
              onClick={() =>
                bulkAction(
                  '/api/queue/clear-completed',
                  {},
                  'Completed entries cleared. Downloaded files are unchanged.',
                )
              }
            >
              Clear completed
            </Button>
          </div>
          <div className={css({ display: 'grid', gap: '3' })}>
            {library.loading && !library.data ? (
              <EmptyState state="loading" title="Loading queue…" />
            ) : matches.length ? (
              matches.slice((currentPage - 1) * 24, currentPage * 24).map((job) => (
                <DownloadRow
                  key={job.id}
                  job={job}
                  busy={library.busy}
                  position={waiting.findIndex((item) => item.id === job.id) + 1}
                  first={waiting[0]?.id === job.id}
                  last={waiting.at(-1)?.id === job.id}
                  onAction={(value) => {
                    setAdded(null);
                    action(job, value);
                  }}
                />
              ))
            ) : (
              <EmptyState
                state={library.error && !library.data ? 'error' : 'empty'}
                symbol={<Download />}
                title={
                  library.error && !library.data
                    ? 'Queue unavailable'
                    : jobs.length
                      ? 'No matching downloads'
                      : 'Your queue is clear'
                }
                description={
                  jobs.length
                    ? 'Try another search or clear your filters.'
                    : 'Paste links above to get started.'
                }
                actions={
                  jobs.length > 0 && (
                    <Button variant="quiet" onClick={clear}>
                      Clear filters
                    </Button>
                  )
                }
              />
            )}
          </div>
          {library.data && (
            <BrowseFooter
              noun="downloads"
              page={currentPage}
              pageSize={24}
              count={matches.length}
              onPage={setPage}
            />
          )}
        </div>
        <ConnectionPanel server={library.server} onConnect={library.connect} busy={library.busy} />
      </div>
    </LibraryShell>
  );
}
