import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Download, ExternalLink, Film, Play, Rss } from 'lucide-react';
import {
  Avatar,
  Button,
  ChoiceSelect,
  EmptyState,
  Hero,
  Icon,
  Identity,
  Input,
  Notice,
  PageHeader,
  Panel,
  RemoteItem as RemoteItemCard,
  Rule,
  SearchField,
  SectionHeading,
  SourceCard,
  Stat,
  StatusBadge,
  Text,
  TextLink,
  Toolbar,
} from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { identityToneName, IdentityWash } from '../../components/browsing/identity-style';
import { useLibraryResource } from '../../services/use-library-resource';
import type {
  Account,
  CatalogueVideo,
  LibraryClient,
  Person,
  RemoteItem,
  SyncSummary,
} from '../../services/library-client';
import {
  accountLookup,
  accountName,
  canDownload,
  checkedAt,
  duration,
  hostOf,
  itemState,
  jobIndex,
  libraryIndex,
  safeLink,
  savedVideoIndex,
  sourceKeys,
} from './model';

export interface PlayerControls {
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onChanged: () => void;
}

async function loadFollowing(api: LibraryClient, signal: AbortSignal) {
  const [lists, accounts, catalogue, queue] = await Promise.all([
    api.syncedLists(signal),
    api.accounts(signal),
    api.catalogue(signal),
    api.queue(signal),
  ]);
  return {
    lists: lists || [],
    accounts: (accounts || []) as (Account & { display_name?: string })[],
    videos: catalogue.videos,
    people: catalogue.people,
    queue: queue || [],
  };
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || '')
    .join('')
    .toLocaleUpperCase();
}

/**
 * Following, as in the existing app: followed sources as cards, a form to
 * load a new source, and one source's items with their library state, from
 * which available items are queued for download.
 */
export function FollowingPage({
  renderPlayer,
}: {
  renderPlayer: (
    video: CatalogueVideo,
    client: LibraryClient,
    controls: PlayerControls,
  ) => ReactNode;
}) {
  const library = useLibraryResource(loadFollowing);
  const data = library.data;
  const lists = data?.lists || [];
  const queue = data?.queue || [];
  const [url, setUrl] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceSort, setSourceSort] = useState('saved');
  const [current, setCurrent] = useState('');
  const [items, setItems] = useState<RemoteItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemSort, setItemSort] = useState('source');
  const [limit, setLimit] = useState(100);
  const [playing, setPlaying] = useState<string | null>(null);
  const request = useRef(0);

  const accountFor = useMemo(() => accountLookup(data?.accounts || []), [data?.accounts]);
  const peopleByName = useMemo(
    () => new Map((data?.people || []).map((person) => [person.name, person])),
    [data?.people],
  );
  const personFor = (source: string): Person | undefined =>
    peopleByName.get(accountFor(source)?.person || '');
  const savedIndex = useMemo(() => libraryIndex(data?.videos || []), [data?.videos]);
  const savedVideos = useMemo(() => savedVideoIndex(data?.videos || []), [data?.videos]);
  const jobs = useMemo(() => jobIndex(queue), [queue]);
  const videoFor = (item: RemoteItem) =>
    sourceKeys(item)
      .map((key) => savedVideos.get(key))
      .find(Boolean);
  const libraryReady = !!data && !library.loading;
  const context = { saved: savedIndex, jobs, pending: new Set(pending), libraryReady };
  const stateOf = (item: RemoteItem) => itemState(item, context);
  const media = (path: string) => library.client?.media(path) || '';

  useEffect(() => {
    setPending((value) => value.filter((url) => !sourceKeys({ url }).some((key) => jobs.has(key))));
  }, [jobs]);
  const downloadable = items.filter((item) => canDownload(stateOf(item)));
  const downloadableKey = downloadable.map((item) => item.url).join('\n');
  useEffect(() => {
    const allowed = new Set(downloadableKey.split('\n'));
    setSelected((value) => value.filter((url) => allowed.has(url)));
  }, [downloadableKey]);
  useEffect(() => setLimit(100), [current, query, statusFilter]);

  const load = useCallback(
    async (source: string, refresh = false) => {
      const client = library.client;
      if (!client) return;
      const id = ++request.current;
      setBusy(true);
      setError('');
      setNotice('');
      setCurrent(source);
      setItems([]);
      setSelected([]);
      setQuery('');
      setStatusFilter('all');
      try {
        const result = await client.enumerate(source, refresh);
        if (id !== request.current) return;
        setItems(result || []);
        void library.refresh();
      } catch (failure) {
        if (id === request.current)
          setError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        if (id === request.current) setBusy(false);
      }
    },
    [library.client, library.refresh],
  );
  async function download(urls: string[]) {
    const client = library.client;
    if (!client) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const allowed = new Set(downloadable.map((item) => item.url));
      const requested = [...new Set(urls)].filter((url) => allowed.has(url));
      const result = await client.enqueueMany(requested);
      setPending((value) => [...new Set([...value, ...requested])]);
      setSelected([]);
      setNotice(`${result.added} downloads added to the queue.`);
      void library.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  }
  async function unfollow(source: string) {
    await library.mutate((api) => api.removeSync(source), 'Source removed from Following.');
  }
  function leave() {
    request.current++;
    setCurrent('');
    setItems([]);
    setSelected([]);
    setNotice('');
    setError('');
    setBusy(false);
  }

  const sourceName = (source: SyncSummary) => {
    const person = personFor(source.url);
    const account = accountFor(source.url);
    return (
      person?.nickname || person?.name || accountName(account) || source.title || hostOf(source.url)
    );
  };
  const matchingSources = lists.filter((list) =>
    [list.title, list.url, personFor(list.url)?.name, personFor(list.url)?.nickname]
      .join(' ')
      .toLocaleLowerCase()
      .includes(sourceSearch.toLocaleLowerCase()),
  );
  if (sourceSort !== 'saved')
    matchingSources.sort((a, b) =>
      sourceSort === 'available' ? b.new - a.new : sourceName(a).localeCompare(sourceName(b)),
    );

  const fresh = downloadable;
  const downloaded = items.filter((item) => stateOf(item).kind === 'downloaded');
  const inProgress = items.filter((item) => ['queued', 'downloading'].includes(stateOf(item).kind));
  const visible = items.filter((item) => {
    const state = stateOf(item);
    return (
      (statusFilter === 'all' ||
        (statusFilter === 'available' && canDownload(state)) ||
        (statusFilter === 'downloaded' && state.kind === 'downloaded') ||
        (statusFilter === 'progress' && inProgress.includes(item))) &&
      [item.title, item.url, videoFor(item)?.title, videoFor(item)?.source_title]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
    );
  });
  if (itemSort === 'title')
    visible.sort((a, b) =>
      (videoFor(a)?.title || a.title || a.url).localeCompare(
        videoFor(b)?.title || b.title || b.url,
      ),
    );
  const playable = items.flatMap((item) => {
    const video = videoFor(item);
    return video ? [video] : [];
  });
  const playingIndex = playable.findIndex(
    (video) => JSON.stringify([video.site, video.id]) === playing,
  );
  const currentList = lists.find((list) => list.url === current);
  const currentPerson = current ? personFor(current) : undefined;
  const currentAccount = current ? accountFor(current) : undefined;
  const identity = currentPerson?.name || current;
  const active = queue.filter(
    (job) => job.status === 'queued' || job.status === 'downloading',
  ).length;

  function art(source: string, size: 'card' | 'hero') {
    const person = personFor(source);
    const name =
      person?.nickname || person?.name || accountName(accountFor(source)) || hostOf(source);
    const src = person?.thumbnail ? media(person.thumbnail) : '';
    if (size === 'card')
      return (
        <Identity asChild tone={identityToneName(person?.name || source)}>
          <SourceCard.Art aria-hidden="true">
            {src ? <img src={src} alt="" loading="lazy" /> : person ? initials(name) : <Film />}
          </SourceCard.Art>
        </Identity>
      );
    return (
      <Identity asChild tone={identityToneName(person?.name || source)}>
        <Hero.Cover aria-hidden="true">
          <Avatar.Root shape="portrait">
            <Avatar.Frame>
              <Avatar.Wash aria-hidden="true" />
              {src ? (
                <Avatar.Image src={src} alt="" />
              ) : (
                <Avatar.Initials aria-hidden="true">
                  {person ? initials(name) : <Film />}
                </Avatar.Initials>
              )}
            </Avatar.Frame>
          </Avatar.Root>
        </Hero.Cover>
      </Identity>
    );
  }

  return (
    <LibraryShell page="following">
      <PageHeader
        title="Following"
        description="Follow sources, check for new content, and download entire collections."
      />
      <Rule
        side="bottom"
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '3',
          mb: '4.5',
        })}
      >
        <Text size="sm" tone="muted">
          {active} active downloads
        </Text>
        <Button asChild>
          <a href="/?view=downloads">
            <Icon glyph={Download} size="sm" />
            Open downloads
          </a>
        </Button>
      </Rule>
      {(error || (library.error && !current)) && (
        <Notice
          tone="danger"
          className={css({ my: '3' })}
          actions={
            <Button
              variant="quiet"
              size="compact"
              onClick={() => (current ? void load(current, true) : void library.refresh())}
            >
              Retry
            </Button>
          }
        >
          {error || library.error}
        </Notice>
      )}
      {(notice || library.notice) && (
        <Notice
          className={css({ my: '3' })}
          actions={
            notice && (
              <Button asChild variant="quiet" size="compact">
                <a href="/?view=downloads">View downloads →</a>
              </Button>
            )
          }
        >
          {notice || library.notice}
        </Notice>
      )}
      {!current ? (
        <>
          <Panel
            asChild
            className={css({
              mb: '6',
              position: 'relative',
              isolation: 'isolate',
              overflow: 'hidden',
            })}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (url.trim()) void load(url.trim(), true);
              }}
            >
              <IdentityWash name="following" placement="hero" />
              <div className={css({ position: 'relative', display: 'grid', gap: '4' })}>
                <SectionHeading eyebrow="Your sources, together" title="Follow something new" />
                <div
                  className={css({
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '3',
                  })}
                >
                  <div className={css({ flex: '1', minW: '[min(100%, 240px)]' })}>
                    <Input
                      id="following-url"
                      type="url"
                      required
                      aria-label="Source URL"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Paste a profile, channel, playlist, or favorites URL…"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={busy || !url.trim() || !library.client}
                  >
                    Load source
                  </Button>
                </div>
                <Text size="sm" tone="muted">
                  Browse everything available from a supported source, then choose what to download.
                  Private content may need a connection in Settings.
                </Text>
              </div>
            </form>
          </Panel>
          <Toolbar.Root aria-label="Followed source controls">
            <Toolbar.Search>
              <SearchField
                label="Search followed sources"
                placeholder="Search sources or people…"
                value={sourceSearch}
                onChange={setSourceSearch}
              />
            </Toolbar.Search>
            <Toolbar.Row>
              <Toolbar.Summary role="status">
                {matchingSources.length} of {lists.length} saved sources
              </Toolbar.Summary>
              <Toolbar.Controls>
                <ChoiceSelect
                  hideLabel
                  appearance="toolbar"
                  label="Sort followed sources"
                  value={sourceSort}
                  onChange={setSourceSort}
                  options={[
                    { value: 'saved', label: 'Saved order' },
                    { value: 'name', label: 'Name A–Z' },
                    { value: 'available', label: 'Most available' },
                  ]}
                />
              </Toolbar.Controls>
            </Toolbar.Row>
          </Toolbar.Root>
          {library.loading && !data ? (
            <EmptyState state="loading" title="Loading followed sources…" />
          ) : matchingSources.length ? (
            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(440px, 100%), 1fr))',
                gap: { base: '3', md: '6' },
              })}
            >
              {matchingSources.map((list) => {
                const person = personFor(list.url);
                const account = accountFor(list.url);
                const name = sourceName(list);
                return (
                  <SourceCard.Root key={list.url} aria-label={list.title || hostOf(list.url)}>
                    {art(list.url, 'card')}
                    <SourceCard.Copy>
                      <SourceCard.Name
                        type="button"
                        disabled={busy}
                        onClick={() => void load(list.url)}
                      >
                        {name}
                      </SourceCard.Name>
                      <SourceCard.Meta>
                        {[hostOf(list.url), account?.handle ? `@${account.handle}` : '', list.kind]
                          .filter(Boolean)
                          .join(' · ')}
                      </SourceCard.Meta>
                      {person && list.title && <SourceCard.Meta>{list.title}</SourceCard.Meta>}
                      <SourceCard.Stats>
                        <SourceCard.Stat>
                          <b>{list.count}</b> videos
                        </SourceCard.Stat>
                        <SourceCard.Stat>
                          <b>{list.owned}</b> downloaded
                        </SourceCard.Stat>
                        <SourceCard.Stat>
                          <b>{list.new}</b> available
                        </SourceCard.Stat>
                      </SourceCard.Stats>
                      <SourceCard.Checked>
                        Last checked: {checkedAt(list.fetchedAt)}
                      </SourceCard.Checked>
                    </SourceCard.Copy>
                    <SourceCard.Actions>
                      {person && (
                        <Button asChild>
                          <a href={`/?view=person&name=${encodeURIComponent(person.name)}`}>
                            View person
                          </a>
                        </Button>
                      )}
                      <Button disabled={busy} onClick={() => void load(list.url)}>
                        Browse
                      </Button>
                      <Button disabled={busy} onClick={() => void load(list.url, true)}>
                        Check for updates
                      </Button>
                      <Button
                        variant="quiet"
                        className={css({ ml: 'auto' })}
                        disabled={busy || library.busy}
                        aria-label={`Unfollow ${list.title || list.url}`}
                        onClick={() => void unfollow(list.url)}
                      >
                        Unfollow
                      </Button>
                    </SourceCard.Actions>
                  </SourceCard.Root>
                );
              })}
            </div>
          ) : lists.length ? (
            <EmptyState
              title="No matching sources"
              description="Try a person’s name, source name, or website."
            />
          ) : (
            <EmptyState
              symbol={<Rss />}
              title="Your sources, in one place"
              description="Add a source above to browse its content and save it here for future checks."
            />
          )}
        </>
      ) : (
        <>
          <Button className={css({ mb: '4' })} disabled={busy} onClick={leave}>
            ← All sources
          </Button>
          <Hero.Root cover="portrait" aria-label="Followed source">
            <IdentityWash name={identity} placement="hero" />
            {art(current, 'hero')}
            <Hero.Copy>
              <Identity asChild tone={identityToneName(identity)}>
                <Hero.Eyebrow>Followed source</Hero.Eyebrow>
              </Identity>
              <PageHeader
                as="h2"
                title={
                  currentPerson?.nickname ||
                  currentPerson?.name ||
                  accountName(currentAccount) ||
                  currentList?.title ||
                  'Source content'
                }
                actions={
                  <>
                    {currentPerson && (
                      <Button asChild>
                        <a href={`/?view=person&name=${encodeURIComponent(currentPerson.name)}`}>
                          View person
                        </a>
                      </Button>
                    )}
                    {safeLink(current) && (
                      <Button asChild>
                        <a href={current} target="_blank" rel="noreferrer">
                          Open source <Icon glyph={ExternalLink} size="sm" />
                        </a>
                      </Button>
                    )}
                    <Button disabled={busy} onClick={() => void load(current, true)}>
                      Check for updates
                    </Button>
                  </>
                }
              />
              <Hero.Caption>
                {[
                  hostOf(current),
                  currentAccount?.handle ? `@${currentAccount.handle.replace(/^@/, '')}` : '',
                  currentList?.kind,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Hero.Caption>
              <Hero.Note>{current}</Hero.Note>
              <Rule asChild side="top" className={css({ mt: '6', pt: '5' })}>
                <dl
                  aria-label="Source overview"
                  className={css({
                    display: 'grid',
                    gridTemplateColumns: {
                      base: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: '4',
                  })}
                >
                  {(
                    [
                      ['Source items', items.length],
                      ['Downloaded', downloaded.length],
                      ['Available', fresh.length],
                      ['In progress', inProgress.length],
                    ] as const
                  ).map(([label, value]) => (
                    <Stat.Root key={label}>
                      <Stat.Label>{label}</Stat.Label>
                      <Stat.Value>
                        {(busy && !items.length) || !libraryReady || (error && !items.length)
                          ? '—'
                          : value.toLocaleString()}
                      </Stat.Value>
                    </Stat.Root>
                  ))}
                </dl>
              </Rule>
              <Hero.Note>
                {(busy && !items.length) || !libraryReady
                  ? 'Checking source and library…'
                  : error && !items.length
                    ? 'Source counts unavailable. Try checking for updates again.'
                    : `Last checked: ${checkedAt(currentList?.fetchedAt)}`}
              </Hero.Note>
            </Hero.Copy>
          </Hero.Root>
          <Toolbar.Root aria-label="Source browsing controls">
            <Toolbar.Search>
              <SearchField
                label="Search source content"
                placeholder="Search this source…"
                value={query}
                onChange={setQuery}
              />
            </Toolbar.Search>
            <Toolbar.Row>
              <Toolbar.Summary role="status">
                {visible.length} of {items.length} items{query ? ' matching your search' : ''}
                {selected.length > 0 && (
                  <>
                    {' · '}
                    <Button size="compact" variant="quiet" onClick={() => setSelected([])}>
                      Clear selection ({selected.length})
                    </Button>
                  </>
                )}
              </Toolbar.Summary>
              <Toolbar.Controls>
                <ChoiceSelect
                  hideLabel
                  appearance="toolbar"
                  label="Source item status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: `All (${items.length})` },
                    { value: 'available', label: `Available (${fresh.length})` },
                    { value: 'downloaded', label: `Downloaded (${downloaded.length})` },
                    { value: 'progress', label: `In progress (${inProgress.length})` },
                  ]}
                />
                <ChoiceSelect
                  hideLabel
                  appearance="toolbar"
                  label="Sort source content"
                  value={itemSort}
                  onChange={setItemSort}
                  options={[
                    { value: 'source', label: 'Source order' },
                    { value: 'title', label: 'Title A–Z' },
                  ]}
                />
                <Button disabled={busy || !selected.length} onClick={() => void download(selected)}>
                  Download selected ({selected.length})
                </Button>
                <Button
                  variant="primary"
                  disabled={busy || !fresh.length}
                  onClick={() => void download(fresh.map((item) => item.url))}
                >
                  Download available ({fresh.length})
                </Button>
              </Toolbar.Controls>
            </Toolbar.Row>
            <Toolbar.Chips>
              <Text size="sm" tone="muted">
                Download available includes all available items in this source.
              </Text>
            </Toolbar.Chips>
          </Toolbar.Root>
          {!libraryReady && (
            <Text size="sm" tone="muted" role="status">
              Checking your library before enabling downloads…
            </Text>
          )}
          {busy && <EmptyState state="loading" title="Working… Large sources can take a moment." />}
          {!busy && !error && !items.length && (
            <EmptyState
              title="No items returned"
              description="Check the URL and your connections. Some sites do not support listing an entire account."
              actions={<Button onClick={() => void load(current, true)}>Try again</Button>}
            />
          )}
          {!busy && items.length > 0 && !visible.length && (
            <EmptyState
              title="No matching items"
              description="Try another search or status filter."
            />
          )}
          <div
            className={css({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
              gap: { base: '5', md: '6' },
            })}
          >
            {visible.slice(0, limit).map((item, index) => {
              const state = stateOf(item);
              const available = canDownload(state);
              const saved = state.kind === 'downloaded';
              const video = videoFor(item);
              const title = video?.title || item.title || item.url;
              const isSelected = selected.includes(item.url);
              const toggle = () =>
                setSelected((value) =>
                  value.includes(item.url)
                    ? value.filter((url) => url !== item.url)
                    : [...value, item.url],
                );
              const play = () => video && setPlaying(JSON.stringify([video.site, video.id]));
              return (
                <RemoteItemCard.Root
                  key={`${item.url}:${index}`}
                  aria-label={title}
                  data-selected={isSelected || undefined}
                >
                  {available ? (
                    <RemoteItemCard.Mark asChild>
                      <input
                        type="checkbox"
                        aria-label={`Select ${title}`}
                        disabled={busy}
                        checked={isSelected}
                        onChange={toggle}
                      />
                    </RemoteItemCard.Mark>
                  ) : (
                    <RemoteItemCard.Mark
                      aria-label={state.label}
                      data-state={saved ? 'downloaded' : 'pending'}
                    >
                      {saved ? <Check /> : <Download />}
                    </RemoteItemCard.Mark>
                  )}
                  {video ? (
                    <RemoteItemCard.Preview asChild>
                      <button type="button" aria-label={`Play ${title}`} onClick={play}>
                        {video.thumbnail ? (
                          <img src={media(video.thumbnail)} alt="" loading="lazy" />
                        ) : (
                          <Film aria-hidden="true" />
                        )}
                        <RemoteItemCard.Play aria-hidden="true">
                          <Play />
                        </RemoteItemCard.Play>
                      </button>
                    </RemoteItemCard.Preview>
                  ) : (
                    <RemoteItemCard.Preview>
                      <Film aria-hidden="true" />
                      <span>No saved preview</span>
                    </RemoteItemCard.Preview>
                  )}
                  <RemoteItemCard.Copy>
                    <RemoteItemCard.Title
                      type="button"
                      disabled={!video && (!available || busy)}
                      onClick={video ? play : toggle}
                    >
                      {title}
                    </RemoteItemCard.Title>
                    {video?.source_title && video.source_title !== title && (
                      <RemoteItemCard.Original title={video.source_title}>
                        Original: {video.source_title}
                      </RemoteItemCard.Original>
                    )}
                    <RemoteItemCard.Line>
                      {[
                        video?.site || hostOf(item.url),
                        video?.duration ? duration(video.duration) : '',
                        video?.height ? `${video.height}p` : '',
                        video?.filesize ? `${Math.round(video.filesize / 1048576)} MB` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </RemoteItemCard.Line>
                    {!!video?.people?.length && (
                      <RemoteItemCard.Line>
                        {video.people
                          .map((name) => peopleByName.get(name)?.nickname || name)
                          .join(', ')}
                      </RemoteItemCard.Line>
                    )}
                  </RemoteItemCard.Copy>
                  <RemoteItemCard.Actions>
                    <StatusBadge
                      tone={
                        saved
                          ? 'success'
                          : state.kind === 'queued' || state.kind === 'downloading'
                            ? 'info'
                            : state.kind === 'failed'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {state.label}
                    </StatusBadge>
                    {video ? (
                      <Button onClick={play}>
                        <Icon glyph={Play} size="sm" />
                        Play
                      </Button>
                    ) : (
                      safeLink(item.url) && (
                        <TextLink href={item.url} target="_blank" rel="noreferrer">
                          View source ↗
                        </TextLink>
                      )
                    )}
                  </RemoteItemCard.Actions>
                </RemoteItemCard.Root>
              );
            })}
          </div>
          {visible.length > limit && (
            <Button className={css({ mt: '5' })} onClick={() => setLimit((value) => value + 100)}>
              Show more ({Math.min(limit, visible.length)} of {visible.length})
            </Button>
          )}
        </>
      )}
      {playingIndex >= 0 &&
        library.client &&
        renderPlayer(playable[playingIndex], library.client, {
          onClose: () => setPlaying(null),
          onPrevious:
            playingIndex > 0
              ? () =>
                  setPlaying(
                    JSON.stringify([
                      playable[playingIndex - 1].site,
                      playable[playingIndex - 1].id,
                    ]),
                  )
              : undefined,
          onNext:
            playingIndex < playable.length - 1
              ? () =>
                  setPlaying(
                    JSON.stringify([
                      playable[playingIndex + 1].site,
                      playable[playingIndex + 1].id,
                    ]),
                  )
              : undefined,
          onChanged: () => void library.refresh(),
        })}
    </LibraryShell>
  );
}
