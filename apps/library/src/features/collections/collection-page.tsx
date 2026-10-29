import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, Folder, Lock, Plus, Star } from 'lucide-react';
import {
  Breadcrumbs,
  Button,
  Checkbox,
  ChoiceSelect,
  CoverMosaic,
  Dialog,
  EmptyState,
  FolderCard,
  Hero,
  Icon,
  Identity,
  Notice,
  PageHeader,
  Popover,
  Portal,
  Rule,
  SearchField,
  SectionHeading,
  Stat,
  Text,
  Toolbar,
} from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import {
  BrowseFooter,
  BrowseGrid,
  ManageToggle,
  PreviewSize,
} from '../../components/browsing/browse-controls';
import { ContentTabs } from '../../components/browsing/content-tabs';
import { ManageBar } from '../../components/browsing/manage-bar';
import { PhotoViewer } from '../../components/browsing/photo-viewer';
import { identityToneName, IdentityWash } from '../../components/browsing/identity-style';
import {
  childCollections,
  collectionTrail,
  countLabel,
  isLocked,
  readPinned,
  readUnlocked,
  writePinned,
  writeUnlocked,
} from '../../components/browsing/collection-model';
import type { CatalogueVideo, LibraryClient } from '../../services/library-client';
import { CollectionDialogs, type CollectionDialogKind } from './collection-dialogs';
import { CollectionItemCard } from './collection-item-card';
import { collectionItems, filterItems, itemPageSize } from './model';
import { useCollectionBrowser } from './use-collection-browser';

export interface PlayerControls {
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onChanged: () => void;
}

const counts = ['one', 'two', 'three'] as const;

/** One collection: its hero, subfolders and media, with the organizing actions of the existing browser. */
export function CollectionPage({
  id,
  renderPlayer,
}: {
  id: number;
  renderPlayer: (
    video: CatalogueVideo,
    client: LibraryClient,
    controls: PlayerControls,
  ) => ReactNode;
}) {
  const [unlocked, setUnlocked] = useState<number[]>(readUnlocked);
  const library = useCollectionBrowser(id, unlocked);
  const data = library.data;
  const collections = data?.collections || [];
  const current = data?.current;
  const locked = isLocked(current);
  const [pinned, setPinned] = useState<number[]>(readPinned);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [size, setSize] = useState('medium');
  const [page, setPage] = useState(1);
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [dialog, setDialog] = useState<CollectionDialogKind>(null);
  const [failedCovers, setFailedCovers] = useState<Set<string>>(() => new Set());
  const results = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery('');
    setFilter('all');
    setSelected(new Set());
    setManage(false);
    setPage(1);
  }, [id]);

  const items = useMemo(
    () => filterItems(collectionItems(data?.videos || [], data?.photos || []), filter, query, sort),
    [data?.videos, data?.photos, filter, query, sort],
  );
  const children = childCollections(collections, id, query);
  const searching = !!query.trim();
  const currentPage = Math.min(page, Math.max(1, Math.ceil(items.length / itemPageSize)));
  const visible = items.slice((currentPage - 1) * itemPageSize, currentPage * itemPageSize);
  useEffect(() => {
    setSelected((old) => new Set([...old].filter((key) => items.some((item) => item.key === key))));
  }, [items]);
  const picked = items.filter((item) => selected.has(item.key));
  const pickedVideos = picked.flatMap((item) => (item.video ? [item.video] : []));
  const pickedPhotos = picked.flatMap((item) => (item.photo ? [item.photo] : []));
  const photos = items.flatMap((item) => (item.photo ? [item.photo] : []));
  const videoItems = items.flatMap((item) => (item.video ? [item.video] : []));
  const playingIndex = videoItems.findIndex(
    (video) => JSON.stringify([video.site, video.id]) === playing,
  );
  const media = (path: string) => library.client?.media(path) || '';

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        document.querySelector('[role="dialog"]') ||
        (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if (event.key === 'Escape') {
        setSelected(new Set());
        setManage(false);
      }
      if (event.altKey && event.key === 'ArrowUp' && current) {
        event.preventDefault();
        window.location.assign(
          current.parentId ? `/?view=collection&id=${current.parentId}` : '/?view=collections',
        );
      }
      if (event.key === 'F2' && current) {
        event.preventDefault();
        setDialog({ kind: 'rename' });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [current]);

  function togglePin() {
    if (!current) return;
    const next = pinned.includes(current.id)
      ? pinned.filter((item) => item !== current.id)
      : [...pinned, current.id];
    setPinned(next);
    writePinned(next);
    window.dispatchEvent(new Event('clipkit:pins'));
  }
  function unlock() {
    const next = [...new Set([...unlocked, id])];
    writeUnlocked(next);
    setUnlocked(next);
  }
  function changePage(value: number) {
    setPage(value);
    requestAnimationFrame(() => {
      results.current?.scrollIntoView({ block: 'start' });
      results.current?.focus();
    });
  }
  async function removeSelected() {
    const done = await library.mutate(
      (api) =>
        api.removeAlbumItems(id, {
          videos: pickedVideos.map(({ site, id }) => ({ site, id })),
          photos: pickedPhotos.map((photo) => photo.id),
        }),
      'Removed from this collection. Files remain in your library.',
    );
    if (done) setSelected(new Set());
  }
  async function trashSelected() {
    const done = await library.mutate(
      (api) =>
        api.trashMedia({
          videos: pickedVideos.map(({ site, id }) => ({ site, id })),
          photos: pickedPhotos.map((photo) => photo.id),
        }),
      'Moved to your vault’s recoverable trash. No in-app Undo is available.',
    );
    if (done) setSelected(new Set());
  }

  const covers = (current?.covers || []).filter((src) => !failedCovers.has(src)).slice(0, 3);
  const tone = identityToneName(`collection:${id}`);
  const trail = collectionTrail(collections, id);
  const isPinned = !!current && pinned.includes(current.id);
  const options = current && (
    <Popover.Root
      variant="menu"
      positioning={{ placement: 'bottom-end', strategy: 'fixed', gutter: 8, overflowPadding: 12 }}
    >
      <Popover.Trigger asChild>
        <Button aria-label="Collection options">•••</Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content aria-label="Collection options">
            <Popover.CloseTrigger asChild>
              <Button variant="quiet" justifyContent="flex-start" onClick={togglePin}>
                {isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
              </Button>
            </Popover.CloseTrigger>
            <Popover.CloseTrigger asChild>
              <Button
                variant="quiet"
                justifyContent="flex-start"
                onClick={() => setDialog({ kind: 'rename' })}
              >
                Rename
              </Button>
            </Popover.CloseTrigger>
            <Popover.CloseTrigger asChild>
              <Button
                variant="quiet"
                justifyContent="flex-start"
                onClick={() => setDialog({ kind: 'move' })}
              >
                Move collection…
              </Button>
            </Popover.CloseTrigger>
            <Popover.CloseTrigger asChild>
              <Button
                variant="quiet"
                justifyContent="flex-start"
                onClick={() => setDialog({ kind: 'delete' })}
              >
                Delete collection…
              </Button>
            </Popover.CloseTrigger>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
  const facts = current
    ? [
        ['Total items', current.count || 0],
        ['Photos', current.photoCount || 0],
        ['Videos', current.videoCount || 0],
        ['Subfolders', current.albumCount || 0],
      ]
    : [];

  return (
    <LibraryShell page="collections" collectionId={id}>
      <Breadcrumbs>
        <a href="/?view=collections">Collections</a>
        {trail.map((item, index) => (
          <span key={item.id} className={css({ display: 'contents' })}>
            <span aria-hidden="true">/</span>
            {index === trail.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <a href={`/?view=collection&id=${item.id}`}>{item.name}</a>
            )}
          </span>
        ))}
      </Breadcrumbs>
      {library.error && !dialog && (
        <Notice
          tone="danger"
          className={css({ my: '3' })}
          actions={
            <Button variant="quiet" size="compact" onClick={() => void library.refresh()}>
              Retry
            </Button>
          }
        >
          {library.error}
        </Notice>
      )}
      {library.notice && <Notice className={css({ my: '3' })}>{library.notice}</Notice>}
      {library.loading && !data ? (
        <EmptyState state="loading" title="Opening collection…" />
      ) : !current ? (
        <EmptyState
          symbol={<Folder />}
          title="This collection is no longer here"
          description="It may have been deleted. Your media is still in the library."
          actions={
            <Button asChild>
              <a href="/?view=collections">Back to collections</a>
            </Button>
          }
        />
      ) : (
        <>
          <Hero.Root aria-label="Collection overview">
            <IdentityWash name={`collection:${id}`} placement="hero" />
            <Identity asChild tone={tone}>
              <Hero.Cover aria-hidden="true">
                {covers.length ? (
                  <CoverMosaic even count={counts[covers.length - 1]}>
                    {covers.map((src) => (
                      <img
                        key={src}
                        src={media(src)}
                        alt=""
                        onError={() => setFailedCovers((previous) => new Set([...previous, src]))}
                      />
                    ))}
                  </CoverMosaic>
                ) : locked ? (
                  <Lock />
                ) : (
                  <Folder />
                )}
              </Hero.Cover>
            </Identity>
            <Hero.Copy>
              <Identity asChild tone={tone}>
                <Hero.Eyebrow>
                  {current.parentId ? 'Collection folder' : 'Your collection'}
                  {isPinned && (
                    <span>
                      <Icon glyph={Star} size="sm" /> Pinned to sidebar
                    </span>
                  )}
                  {locked && (
                    <span>
                      <Icon glyph={Lock} size="sm" /> Locked
                    </span>
                  )}
                </Hero.Eyebrow>
              </Identity>
              <PageHeader
                title={current.name}
                actions={
                  <>
                    <Button
                      variant="primary"
                      disabled={locked && data?.gated}
                      onClick={() => setDialog({ kind: 'create', parent: id })}
                    >
                      <Icon glyph={Plus} size="sm" />
                      New folder
                    </Button>
                    {options}
                  </>
                }
              />
              <Hero.Caption>
                {current.count
                  ? 'Photos and videos, collected in one place.'
                  : 'A place for your next collection of favorites.'}
              </Hero.Caption>
              <Rule asChild side="top" className={css({ mt: '6', pt: '5' })}>
                <dl
                  aria-label="Collection overview"
                  className={css({
                    display: 'grid',
                    gridTemplateColumns: {
                      base: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: '4',
                  })}
                >
                  {facts.map(([label, value]) => (
                    <Stat.Root key={label}>
                      <Stat.Label>{label}</Stat.Label>
                      <Stat.Value>{value.toLocaleString()}</Stat.Value>
                    </Stat.Root>
                  ))}
                </dl>
              </Rule>
            </Hero.Copy>
          </Hero.Root>
          <fieldset disabled={library.busy} className={css({ minW: '0' })}>
            <Toolbar.Root aria-label="Collection browsing controls">
              <Toolbar.Search>
                <div className={css({ display: 'flex', gap: '2', alignItems: 'center' })}>
                  <Button asChild aria-label="Go to parent folder" title="Go to parent folder">
                    <a
                      href={
                        current.parentId
                          ? `/?view=collection&id=${current.parentId}`
                          : '/?view=collections'
                      }
                    >
                      <Icon glyph={ArrowUp} size="sm" />
                      Up
                    </a>
                  </Button>
                  <div className={css({ flex: '1', minW: '0' })}>
                    <SearchField
                      label="Search collection"
                      placeholder="Search this collection…"
                      value={query}
                      onChange={setQuery}
                    />
                  </div>
                </div>
              </Toolbar.Search>
              <Toolbar.Row>
                <Toolbar.Summary role="status">
                  {library.loading
                    ? 'Loading…'
                    : `${countLabel(items.length, 'matching item')} · ${countLabel(children.length, 'folder')}`}
                </Toolbar.Summary>
                <Toolbar.Controls>
                  <ChoiceSelect
                    hideLabel
                    appearance="toolbar"
                    label="Sort collection items"
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: 'newest', label: 'Newest first' },
                      { value: 'name', label: 'Name A–Z' },
                    ]}
                  />
                  <PreviewSize value={size} onChange={setSize} />
                  <ManageToggle
                    active={manage}
                    onToggle={() => {
                      setManage((value) => !value);
                      setSelected(new Set());
                    }}
                  />
                </Toolbar.Controls>
              </Toolbar.Row>
            </Toolbar.Root>
            {children.length > 0 && (
              <section aria-label="Subfolders" className={css({ mb: '6' })}>
                <SectionHeading
                  title={searching ? 'Matching folders' : 'Folders'}
                  description={countLabel(children.length, 'folder')}
                  className={css({ mb: '4' })}
                />
                <div
                  className={css({
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
                    gap: '2.5',
                  })}
                >
                  {children.map((folder) => {
                    const folderCovers = (folder.covers || []).slice(0, 1);
                    const folderLocked = isLocked(folder);
                    return (
                      <FolderCard.Root key={folder.id} aria-label={folder.name}>
                        <FolderCard.Open
                          href={`/?view=collection&id=${folder.id}`}
                          aria-label={`Open folder ${folder.name}`}
                        >
                          <FolderCard.Icon>
                            {folderCovers.length ? (
                              <img src={media(folderCovers[0])} alt="" loading="lazy" />
                            ) : folderLocked ? (
                              <Lock aria-hidden="true" />
                            ) : (
                              <Folder aria-hidden="true" />
                            )}
                          </FolderCard.Icon>
                          <FolderCard.Copy>
                            <FolderCard.Name>{folder.name}</FolderCard.Name>
                            <FolderCard.Detail>
                              {searching
                                ? collectionTrail(collections, folder.id)
                                    .slice(0, -1)
                                    .map((parent) => parent.name)
                                    .join(' / ') || 'Collections'
                                : `${countLabel(folder.count || 0, 'item')}${
                                    folder.albumCount
                                      ? ` · ${countLabel(folder.albumCount, 'folder')}`
                                      : ''
                                  }`}
                            </FolderCard.Detail>
                          </FolderCard.Copy>
                        </FolderCard.Open>
                        <FolderCard.Action
                          type="button"
                          aria-label={`New folder in ${folder.name}`}
                          title="New subfolder"
                          disabled={folderLocked}
                          onClick={() => setDialog({ kind: 'create', parent: folder.id })}
                        >
                          <Plus aria-hidden="true" />
                        </FolderCard.Action>
                      </FolderCard.Root>
                    );
                  })}
                </div>
              </section>
            )}
            <section aria-label="Collection media">
              <ContentTabs
                label="Collection media"
                value={filter}
                onChange={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
                items={[
                  { value: 'all', label: 'Photos & videos' },
                  { value: 'photos', label: 'Photos' },
                  { value: 'videos', label: 'Videos' },
                ]}
              >
                <div
                  ref={results}
                  tabIndex={-1}
                  aria-label="Collection results"
                  className={css({ pt: '4', outline: 'none', scrollMarginTop: '4' })}
                >
                  {data?.gated ? (
                    <EmptyState
                      symbol={<Lock />}
                      title={`${current.name} is locked`}
                      description="This collection is kept private. Open it for this session to see its media."
                      actions={
                        <Button variant="primary" onClick={unlock}>
                          Open collection
                        </Button>
                      }
                    />
                  ) : library.loading && !items.length ? (
                    <EmptyState state="loading" title="Opening collection…" />
                  ) : items.length ? (
                    <BrowseGrid kind="photos" size={size} testId="collection-grid">
                      {visible.map((item) => (
                        <CollectionItemCard
                          key={item.key}
                          item={item}
                          src={
                            item.photo
                              ? media(item.photo.filepath)
                              : item.video?.thumbnail
                                ? media(item.video.thumbnail)
                                : ''
                          }
                          manage={manage}
                          selected={selected.has(item.key)}
                          onSelect={(checked) =>
                            setSelected((old) => {
                              const next = new Set(old);
                              if (checked) next.add(item.key);
                              else next.delete(item.key);
                              return next;
                            })
                          }
                          onOpen={() =>
                            item.photo
                              ? setActivePhoto(item.photo.id)
                              : setPlaying(JSON.stringify([item.video!.site, item.video!.id]))
                          }
                        />
                      ))}
                    </BrowseGrid>
                  ) : (
                    <EmptyState
                      symbol={<Folder />}
                      title={
                        query || filter !== 'all'
                          ? 'No matching media'
                          : 'Ready for your photos and videos'
                      }
                      description="Open Manage in Photos or Videos, select media, and choose Add to collection."
                    />
                  )}
                </div>
              </ContentTabs>
              {!data?.gated && items.length > 0 && (
                <BrowseFooter
                  noun="items"
                  page={currentPage}
                  pageSize={itemPageSize}
                  count={items.length}
                  onPage={changePage}
                />
              )}
            </section>
            {manage && (
              <ManageBar noun="collection items" onClose={() => setManage(false)}>
                <Checkbox
                  label="Select all matching"
                  checked={
                    items.length > 0 && selected.size === items.length
                      ? true
                      : selected.size
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) =>
                    setSelected(new Set(checked ? items.map((item) => item.key) : []))
                  }
                />
                <Text size="sm" color="info" fontWeight="heading" role="status">
                  {selected.size} selected
                </Text>
                <Button
                  variant="quiet"
                  disabled={!picked.length}
                  onClick={() =>
                    setDialog({
                      kind: 'organize',
                      action: 'move',
                      videos: pickedVideos,
                      photos: pickedPhotos,
                    })
                  }
                >
                  Move to folder
                </Button>
                <Button
                  variant="quiet"
                  disabled={!picked.length}
                  onClick={() =>
                    setDialog({
                      kind: 'organize',
                      action: 'assign',
                      videos: pickedVideos,
                      photos: pickedPhotos,
                    })
                  }
                >
                  Assign person
                </Button>
                <Button
                  variant="quiet"
                  disabled={!picked.length}
                  onClick={() =>
                    setDialog({
                      kind: 'organize',
                      action: 'add',
                      videos: pickedVideos,
                      photos: pickedPhotos,
                    })
                  }
                >
                  Add to collection
                </Button>
                <Button
                  variant="quiet"
                  disabled={!picked.length || locked}
                  onClick={() => void removeSelected()}
                >
                  Remove from this folder
                </Button>
                <Button
                  variant="danger"
                  disabled={!picked.length}
                  onClick={() => void trashSelected()}
                >
                  Move to trash
                </Button>
                <Button
                  variant="quiet"
                  disabled={!picked.length}
                  onClick={() => setSelected(new Set())}
                >
                  Clear selection
                </Button>
              </ManageBar>
            )}
          </fieldset>
        </>
      )}
      <CollectionDialogs
        dialog={dialog}
        collections={collections}
        current={current}
        people={data?.people || []}
        busy={library.busy}
        error={dialog ? library.error : ''}
        mutate={library.mutate}
        onClose={() => setDialog(null)}
        onDeleted={() =>
          window.location.assign(
            current?.parentId ? `/?view=collection&id=${current.parentId}` : '/?view=collections',
          )
        }
      />
      {current && data?.gated && (
        <Dialog.Root
          open
          onOpenChange={(event) => {
            if (!event.open) window.location.assign('/?view=collections');
          }}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Title>{current.name} is locked</Dialog.Title>
                <Dialog.Description>
                  This collection is kept private. Open it for this session?
                </Dialog.Description>
                <Dialog.Footer>
                  <Button asChild variant="quiet">
                    <a href="/?view=collections">Cancel</a>
                  </Button>
                  <Button variant="primary" onClick={unlock}>
                    Open collection
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
      <PhotoViewer
        photos={photos}
        activeId={activePhoto}
        onPreview={setActivePhoto}
        src={(photo) => media(photo.filepath)}
      />
      {playingIndex >= 0 &&
        library.client &&
        renderPlayer(videoItems[playingIndex], library.client, {
          onClose: () => setPlaying(null),
          onPrevious:
            playingIndex > 0
              ? () =>
                  setPlaying(
                    JSON.stringify([
                      videoItems[playingIndex - 1].site,
                      videoItems[playingIndex - 1].id,
                    ]),
                  )
              : undefined,
          onNext:
            playingIndex < videoItems.length - 1
              ? () =>
                  setPlaying(
                    JSON.stringify([
                      videoItems[playingIndex + 1].site,
                      videoItems[playingIndex + 1].id,
                    ]),
                  )
              : undefined,
          onChanged: () => void library.refresh(),
        })}
    </LibraryShell>
  );
}
