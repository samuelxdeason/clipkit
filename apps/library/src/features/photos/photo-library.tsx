import { ManageBar } from '../../components/browsing/manage-bar';
import { useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { Button, Checkbox, EmptyState, Notice, PageHeader, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { ConnectionPanel } from '../../app/connection-panel';
import { BrowseFooter, BrowseGrid } from '../../components/browsing/browse-controls';
import { PhotoToolbar } from './photo-toolbar';
import { PhotoCard } from './photo-card';
import { PhotoDialogs, type PhotoDialogKind } from './photo-dialogs';
import { usePhotoLibrary } from './use-photo-library';
import { emptyPhotoFilters, photoPageSize } from './model';

export function PhotoLibrary({ person }: { person?: string }) {
  const library = usePhotoLibrary(person);
  const [dialog, setDialog] = useState<PhotoDialogKind>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const results = useRef<HTMLDivElement>(null);
  const allSelected =
    library.visible.length > 0 &&
    library.visible.every((photo) => library.selected.includes(photo.id));
  function changePage(page: number) {
    library.changePage(page);
    requestAnimationFrame(() => {
      results.current?.scrollIntoView({ block: 'start' });
      results.current?.focus();
    });
  }
  const content = (
    <>
      <fieldset disabled={library.busy} className={css({ minW: '0' })}>
        {!person && (
          <PageHeader
            title="Your photo library"
            description="Explore your photos, revisit a collection, and keep every moment easy to find."
            actions={
              <Button variant="neutral" onClick={() => void library.refresh()}>
                {library.loading ? 'Refreshing…' : 'Refresh library'}
              </Button>
            }
          />
        )}
        <PhotoToolbar
          filters={library.filters}
          onFilters={library.updateFilters}
          sort={library.sort}
          onSort={library.updateSort}
          size={library.size}
          onSize={library.setSize}
          manage={library.manage}
          onManage={library.toggleManage}
          count={library.matches.length}
          people={[...new Set(library.photos.map((photo) => photo.model).filter(Boolean))].sort()}
          albums={[...new Set(library.photos.map((photo) => photo.album).filter(Boolean))].sort()}
          collections={library.collections}
        />
        {library.notice && <Notice className={css({ my: '3' })}>{library.notice}</Notice>}
        {library.error && (
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
        <div
          ref={results}
          tabIndex={-1}
          aria-label="Photo results"
          className={css({ pt: '4', outline: 'none', scrollMarginTop: '4' })}
        >
          {library.loading && (!library.photos.length || !!library.filters.collection) ? (
            <EmptyState state="loading" title="Loading your photos…" />
          ) : !library.matches.length ? (
            <EmptyState
              state={library.error ? 'error' : 'empty'}
              symbol={<Image />}
              title={
                library.error
                  ? 'Photos are unavailable'
                  : library.photos.length
                    ? 'No photos match'
                    : 'Your photo library is empty'
              }
              description={
                library.photos.length
                  ? 'Try another search or clear your filters.'
                  : 'Add photos in the existing app, then refresh. Hidden collections are excluded.'
              }
              actions={
                <Button onClick={() => library.updateFilters(emptyPhotoFilters)}>
                  Clear search and filters
                </Button>
              }
            />
          ) : (
            <BrowseGrid kind="photos" size={library.size} testId="photo-grid">
              {library.visible.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  src={library.client?.media(photo.filepath) || ''}
                  manage={library.manage}
                  selected={library.selected.includes(photo.id)}
                  onSelect={(checked) => library.select(photo.id, checked)}
                  onOpen={() => setActiveId(photo.id)}
                />
              ))}
            </BrowseGrid>
          )}
        </div>
        {!library.loading && (
          <BrowseFooter
            noun="photos"
            page={library.page}
            pageSize={photoPageSize}
            count={library.matches.length}
            onPage={changePage}
          />
        )}
        {!person && (
          <ConnectionPanel
            server={library.server}
            onConnect={library.connect}
            busy={library.busy}
          />
        )}
        {library.manage && (
          <ManageBar noun="photos" onClose={library.toggleManage}>
            <Checkbox
              label="Select this page"
              checked={allSelected ? true : library.selected.length ? 'indeterminate' : false}
              onCheckedChange={library.selectPage}
            />
            <Text size="sm" color="info" fontWeight="bold" role="status">
              {library.selected.length} selected
            </Text>
            <Button
              variant="quiet"
              disabled={!library.selected.length}
              onClick={() => setDialog('person')}
            >
              Assign person
            </Button>
            <Button
              variant="quiet"
              disabled={!library.selected.length}
              onClick={() => setDialog('collection')}
            >
              Add to collection
            </Button>
            <Button
              variant="danger"
              disabled={!library.selected.length}
              onClick={() => setDialog('trash')}
            >
              Move to trash
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
      <PhotoDialogs
        library={library}
        kind={dialog}
        onClose={() => setDialog(null)}
        activeId={activeId}
        onPreview={setActiveId}
      />
    </>
  );
  return person ? content : <LibraryShell page="photos">{content}</LibraryShell>;
}
