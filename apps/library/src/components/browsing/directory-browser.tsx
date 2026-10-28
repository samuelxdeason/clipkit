import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, ChoiceSelect, Heading, Text } from '@clipkit/ui';
import { PageIntro } from './page-intro';
import { css } from '@clipkit/ui/css';
import {
  ActiveFilters,
  BrowseFooter,
  BrowseGrid,
  BrowseToolbar,
  PreviewSize,
} from './browse-controls';
import { DirectoryCard } from './directory-card';
import { directoryMatches, type DirectoryEntry } from './directory-model';

function saved(kind: string) {
  try {
    const value = JSON.parse(sessionStorage.getItem(`clipkit.${kind}.directory`) || '{}');
    return {
      query: typeof value.query === 'string' ? value.query : '',
      sort: value.sort === 'count' ? 'count' : 'name',
      coverage: ['used', 'empty'].includes(value.coverage) ? value.coverage : 'all',
      size: ['small', 'large'].includes(value.size) ? value.size : 'medium',
      page: Number.isInteger(value.page) && value.page > 0 ? value.page : 1,
    };
  } catch {
    return { query: '', sort: 'name', coverage: 'all', size: 'medium', page: 1 };
  }
}
export function DirectoryBrowser({
  kind,
  entries,
  loading,
  error,
  notice,
  onRefresh,
  href,
  actions,
  connection,
}: {
  kind: 'people' | 'tags';
  entries: DirectoryEntry[];
  loading: boolean;
  error: string;
  notice: string;
  onRefresh: () => void;
  href: (entry: DirectoryEntry) => string;
  actions?: ReactNode;
  connection: ReactNode;
}) {
  const [settings, setSettings] = useState(() => saved(kind));
  const update = (next: Partial<typeof settings>) =>
    setSettings((current) => ({ ...current, ...next, page: 1 }));
  const matches = useMemo(
    () => directoryMatches(entries, settings.query, settings.sort, settings.coverage),
    [entries, settings],
  );
  const page = Math.min(settings.page, Math.max(1, Math.ceil(matches.length / 24)));
  const results = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      sessionStorage.setItem(`clipkit.${kind}.directory`, JSON.stringify(settings));
    } catch {
      /* Optional persistence. */
    }
  }, [settings, kind]);
  useEffect(() => {
    if (!loading)
      setSettings((current) => (current.page === page ? current : { ...current, page }));
  }, [page, loading]);
  const chips = [];
  if (settings.query)
    chips.push({
      key: 'query',
      label: `Search: ${settings.query}`,
      onRemove: () => update({ query: '' }),
    });
  if (settings.coverage !== 'all')
    chips.push({
      key: 'coverage',
      label: settings.coverage === 'used' ? 'With videos' : 'Without videos',
      onRemove: () => update({ coverage: 'all' }),
    });
  function changePage(page: number) {
    setSettings((current) => ({ ...current, page }));
    requestAnimationFrame(() => {
      results.current?.scrollIntoView({ block: 'start' });
      results.current?.focus();
    });
  }
  return (
    <>
      <header
        className={css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          flexWrap: 'wrap',
          gap: '4',
          mb: '4',
        })}
      >
        <div>
          <PageIntro
            title={kind === 'people' ? 'People' : 'Tags'}
            description={
              kind === 'people'
                ? 'Familiar faces. A collection that feels like yours.'
                : 'Find a mood, a theme, or a favorite.'
            }
          />
        </div>
        <div className={css({ display: 'flex', gap: '3', flexWrap: 'wrap' })}>
          <Button variant="neutral" onClick={onRefresh}>
            {loading ? 'Refreshing…' : 'Refresh library'}
          </Button>
          {actions}
        </div>
      </header>
      <BrowseToolbar
        noun={kind}
        query={settings.query}
        onQuery={(query) => update({ query })}
        count={matches.length}
        chips={
          <ActiveFilters items={chips} onClear={() => update({ query: '', coverage: 'all' })} />
        }
      >
        {kind === 'people' && (
          <ChoiceSelect
            hideLabel
            appearance="toolbar"
            label="Filter people"
            value={settings.coverage}
            onChange={(coverage) => update({ coverage })}
            options={[
              { value: 'all', label: 'All people' },
              { value: 'used', label: 'With videos' },
              { value: 'empty', label: 'Without videos' },
            ]}
          />
        )}
        <ChoiceSelect
          hideLabel
          appearance="toolbar"
          label={`Sort ${kind}`}
          value={settings.sort}
          onChange={(sort) => update({ sort })}
          options={[
            { value: 'name', label: 'Name A–Z' },
            { value: 'count', label: 'Most videos' },
          ]}
        />
        <PreviewSize
          value={settings.size}
          onChange={(size) => setSettings((current) => ({ ...current, size }))}
        />
      </BrowseToolbar>
      {notice && (
        <Text role="status" py="3">
          {notice}
        </Text>
      )}
      {error && (
        <div
          role="alert"
          className={css({ py: '4', display: 'flex', gap: '3', alignItems: 'center' })}
        >
          <Text tone="danger">{error}</Text>
          <Button onClick={onRefresh}>Retry</Button>
        </div>
      )}
      <div
        ref={results}
        tabIndex={-1}
        aria-label={`${kind} results`}
        className={css({ pt: '4', outline: 'none' })}
      >
        {loading && !entries.length ? (
          <Text role="status">Loading {kind}…</Text>
        ) : !matches.length ? (
          <div className={css({ py: '16', display: 'grid', justifyItems: 'center', gap: '4' })}>
            <Heading>
              {error
                ? 'Directory unavailable'
                : entries.length
                  ? `No matching ${kind}`
                  : kind === 'people'
                    ? 'Your people, all together'
                    : 'Make your library easier to find'}
            </Heading>
            <Text tone="muted">
              {entries.length
                ? 'Try a different search or clear your filters.'
                : kind === 'people'
                  ? 'Create a person, then link them to videos or photos.'
                  : 'Add tags to videos using Manage mode. Tags appear here when they are used.'}
            </Text>
            {entries.length ? (
              <Button onClick={() => update({ query: '', coverage: 'all' })}>
                Clear search and filters
              </Button>
            ) : (
              <Button asChild>
                <a href="/">Browse videos</a>
              </Button>
            )}
          </div>
        ) : (
          <BrowseGrid kind={kind} size={settings.size} testId={`${kind}-grid`}>
            {matches.slice((page - 1) * 24, page * 24).map((entry) => (
              <DirectoryCard key={entry.name} entry={entry} kind={kind} href={href(entry)} />
            ))}
          </BrowseGrid>
        )}
      </div>
      {!loading && (
        <BrowseFooter
          noun={kind}
          page={page}
          pageSize={24}
          count={matches.length}
          onPage={changePage}
        />
      )}
      {connection}
    </>
  );
}
