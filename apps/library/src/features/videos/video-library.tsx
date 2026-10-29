import { ManageBar } from '../../components/browsing/manage-bar';
import { useRef, useState } from 'react';
import { Film, FolderPlus, Heart, RotateCcw, Trash2 } from 'lucide-react';
import {
  Button,
  Checkbox,
  ChoiceSelect,
  EmptyState,
  Icon,
  Notice,
  PageHeader,
  Text,
  Disclosure,
} from '@clipkit/ui';
import { BrowseGrid, BrowseFooter } from '../../components/browsing/browse-controls';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { LibraryToolbar } from './library-toolbar';
import { VideoDialogs, type VideoDialogKind } from './video-dialogs';
import { VideoPlayer } from './video-player';
import { VideoCard } from './video-card';
import { useVideoLibrary } from './use-video-library';
import { useConnectedLibrary } from './use-connected-library';
import { ConnectionPanel } from '../../app/connection-panel';
import { people as demoPeople, tags as demoTags } from './fixtures';
import { emptyFilters, pageSize, type Video } from './model';

export function VideoLibrary({ demo = false, person }: { demo?: boolean; person?: string }) {
  const synthetic = useVideoLibrary();
  const connected = useConnectedLibrary(!demo, person);
  const library = demo ? synthetic : connected;
  const busy = !demo && connected.busy;
  const [previewStyle, setPreviewStyle] = useState(() => {
    try {
      return localStorage.getItem('clipkit.library.preview-style') === 'triptych'
        ? 'triptych'
        : 'portrait';
    } catch {
      return 'portrait';
    }
  });
  function changePreviewStyle(value: string) {
    setPreviewStyle(value);
    try {
      localStorage.setItem('clipkit.library.preview-style', value);
    } catch {
      /* Session preference still works. */
    }
  }
  const [preview, setPreview] = useState<Video | null>(null);
  const previewIndex = preview ? library.matches.findIndex((item) => item.id === preview.id) : -1;
  const previousVideo = previewIndex > 0 ? library.matches[previewIndex - 1] : undefined;
  const nextVideo =
    previewIndex >= 0 && previewIndex < library.matches.length - 1
      ? library.matches[previewIndex + 1]
      : undefined;
  const [dialog, setDialog] = useState<VideoDialogKind>(null);
  const [demoState, setState] = useState('ready');
  const state = demo
    ? demoState
    : connected.loading && !connected.videos.length
      ? 'loading'
      : connected.error && !connected.videos.length
        ? 'error'
        : 'ready';
  const results = useRef<HTMLDivElement>(null);
  const allSelected =
    library.visible.length > 0 &&
    library.visible.every((video) => library.selected.includes(video.id));
  function changePage(page: number) {
    library.changePage(page);
    requestAnimationFrame(() => {
      results.current?.scrollIntoView({ block: 'start' });
      results.current?.focus();
    });
  }

  const content = (
    <>
      <fieldset disabled={busy} className={css({ minW: '0' })}>
        {!person && (
          <PageHeader
            title="Your video library"
            description="Find a favorite. Pick up where you left off."
            actions={
              <Button variant="neutral" onClick={library.reset}>
                <Icon glyph={RotateCcw} size="sm" />
                {demo ? 'Reset demo' : connected.loading ? 'Refreshing…' : 'Refresh library'}
              </Button>
            }
          />
        )}
        {!demo && connected.error && state !== 'error' && (
          <Notice tone="danger" className={css({ mb: '3' })}>
            {connected.error}
          </Notice>
        )}
        <LibraryToolbar
          connected={!demo}
          people={
            demo
              ? demoPeople
              : [...new Set(library.videos.flatMap((video) => video.people || []))].sort()
          }
          tags={
            demo ? demoTags : [...new Set(library.videos.flatMap((video) => video.tags))].sort()
          }
          sources={[
            ...new Set(library.videos.map((video) => video.source?.site || '').filter(Boolean)),
          ].sort()}
          filters={library.filters}
          onFilters={library.updateFilters}
          sort={library.sort}
          onSort={library.updateSort}
          size={library.size}
          onSize={library.setSize}
          previewStyle={previewStyle}
          onPreviewStyle={changePreviewStyle}
          manage={library.manage}
          onManage={library.toggleManage}
          count={library.matches.length}
        />
        {library.notice && (
          <Notice
            className={css({ my: '3' })}
            actions={
              library.removed.length > 0 && (
                <Button variant="quiet" size="compact" onClick={library.undo}>
                  Undo removal
                </Button>
              )
            }
          >
            {library.notice}
          </Notice>
        )}
        <div
          ref={results}
          tabIndex={-1}
          aria-label="Video results"
          className={css({ pt: '4', outline: 'none', scrollMarginTop: '4' })}
        >
          {state === 'loading' ? (
            <EmptyState
              state="loading"
              title="Loading your library…"
              description={
                demo
                  ? 'This is a preview of the loading state.'
                  : 'Loading the accessible catalogue so search and filters include every video.'
              }
              actions={
                demo && <Button onClick={() => setState('ready')}>Finish loading demo</Button>
              }
            />
          ) : state === 'error' ? (
            <EmptyState
              state="error"
              symbol={<Film />}
              title="We couldn’t load the videos"
              description={
                demo
                  ? 'Your demo collection is still here. Try again to return to it.'
                  : connected.error
              }
              actions={
                <Button onClick={() => (demo ? setState('ready') : void connected.refresh())}>
                  Retry
                </Button>
              }
            />
          ) : library.matches.length === 0 ? (
            <EmptyState
              symbol={<Film />}
              title={!demo && !library.videos.length ? 'Your library is empty' : 'No videos match'}
              description={
                !demo && !library.videos.length
                  ? 'Add videos in the existing app, then refresh this library. Hidden collections are excluded from this view.'
                  : 'Try another search or clear your filters.'
              }
              actions={
                !demo && !library.videos.length ? (
                  <Button onClick={() => void connected.refresh()}>Refresh library</Button>
                ) : (
                  <Button onClick={() => library.updateFilters(emptyFilters)}>
                    Clear search and filters
                  </Button>
                )
              }
            />
          ) : (
            <BrowseGrid size={library.size} testId="video-grid">
              {library.visible.map((video) => (
                <VideoCard
                  previewStyle={previewStyle}
                  key={video.id}
                  video={video}
                  manage={library.manage}
                  selected={library.selected.includes(video.id)}
                  onSelect={(checked) => library.toggleSelection(video.id, checked)}
                  onOpen={() => setPreview(video)}
                  onTag={(tag) =>
                    library.updateFilters({
                      ...library.filters,
                      tags: [...new Set([...library.filters.tags, tag])],
                    })
                  }
                />
              ))}
            </BrowseGrid>
          )}
        </div>
        {state === 'ready' && (
          <BrowseFooter
            noun="videos"
            page={library.page}
            pageSize={pageSize}
            count={library.matches.length}
            onPage={changePage}
          />
        )}
        {demo && (
          <Disclosure.Root className={css({ mt: '10' })}>
            <Disclosure.Summary>Demo tools · no real files or downloads</Disclosure.Summary>
            <div className={css({ mt: '3', maxW: 'container.narrow' })}>
              <ChoiceSelect
                label="Preview screen state"
                value={state}
                onChange={setState}
                options={[
                  { value: 'ready', label: 'Ready' },
                  { value: 'loading', label: 'Loading' },
                  { value: 'error', label: 'Error and recovery' },
                ]}
              />
            </div>
          </Disclosure.Root>
        )}
        {!demo && !person && (
          <ConnectionPanel server={connected.server} onConnect={connected.connect} busy={busy} />
        )}
        {library.manage && (
          <ManageBar noun="videos" onClose={library.toggleManage}>
            <Checkbox
              label="Select this page"
              checked={allSelected ? true : library.selected.length ? 'indeterminate' : false}
              onCheckedChange={library.selectPage}
            />
            <Text size="sm" color="info" fontWeight="heading" role="status">
              {library.selected.length} selected
            </Text>
            <Button
              variant="quiet"
              disabled={!library.selected.length}
              onClick={() => {
                setDialog('collection');
              }}
            >
              <Icon glyph={FolderPlus} size="sm" />
              Add to collection
            </Button>
            {!demo && (
              <>
                <Button
                  variant="quiet"
                  disabled={!library.selected.length}
                  onClick={() => {
                    setDialog('person');
                  }}
                >
                  Add people
                </Button>
                <Button
                  variant="quiet"
                  disabled={!library.selected.length}
                  onClick={() => {
                    setDialog('tags');
                  }}
                >
                  Add tags
                </Button>
              </>
            )}
            <Button
              variant="quiet"
              disabled={!library.selected.length}
              onClick={library.favoriteSelected}
            >
              <Icon glyph={Heart} size="sm" />
              Favorite selected
            </Button>
            <Button
              variant="danger"
              disabled={!library.selected.length}
              onClick={() => setDialog('remove')}
            >
              <Icon glyph={Trash2} size="sm" />
              {demo ? 'Remove from demo' : 'Move to trash'}
            </Button>
            <Button
              variant="quiet"
              disabled={!library.selected.length}
              onClick={() => library.selectPage(false)}
            >
              Clear selection
            </Button>
          </ManageBar>
        )}
      </fieldset>

      {preview && (
        <VideoPlayer
          key={preview.id}
          video={preview}
          client={demo ? null : connected.client}
          onClose={() => setPreview(null)}
          onPrevious={previousVideo && (() => setPreview(previousVideo))}
          onNext={nextVideo && (() => setPreview(nextVideo))}
          onChanged={demo ? undefined : () => void connected.refresh()}
        />
      )}
      <VideoDialogs
        demo={demo}
        library={library}
        connected={connected}
        dialog={dialog}
        setDialog={setDialog}
      />
    </>
  );
  return person ? content : <LibraryShell demo={demo}>{content}</LibraryShell>;
}
