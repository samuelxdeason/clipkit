import { useState } from 'react';
import { Folder, Plus } from 'lucide-react';
import { Button, EmptyState, Icon, Notice, PageHeader, SearchField, Toolbar } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { childCollections, countLabel } from '../../components/browsing/collection-model';
import { CollectionCard } from './collection-card';
import { CollectionDialogs, type CollectionDialogKind } from './collection-dialogs';
import { useCollectionBrowser } from './use-collection-browser';

/** The collections directory: every top-level collection, searchable, with New collection. */
export function CollectionsPage() {
  const library = useCollectionBrowser(0, []);
  const collections = library.data?.collections || [];
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<CollectionDialogKind>(() =>
    new URLSearchParams(window.location.search).get('new') === '1'
      ? { kind: 'create', parent: 0 }
      : null,
  );
  const children = childCollections(collections, 0, query);
  const searching = !!query.trim();
  const newCollection = (
    <Button variant="primary" onClick={() => setDialog({ kind: 'create', parent: 0 })}>
      <Icon glyph={Plus} size="sm" />
      New collection
    </Button>
  );
  return (
    <LibraryShell page="collections">
      <PageHeader
        title="Collections"
        description="Group photos and videos into collections. Use folders inside each collection to organize them further."
        actions={newCollection}
      />
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
      <Toolbar.Root aria-label="Collection browsing controls">
        <Toolbar.Search>
          <SearchField
            label="Search collections"
            placeholder="Find a collection…"
            value={query}
            onChange={setQuery}
          />
        </Toolbar.Search>
        <Toolbar.Row>
          <Toolbar.Summary role="status">
            {countLabel(children.length, 'collection')}
          </Toolbar.Summary>
        </Toolbar.Row>
      </Toolbar.Root>
      {library.loading && !library.data ? (
        <EmptyState state="loading" title="Opening your collections…" />
      ) : children.length ? (
        <div
          aria-label={searching ? 'Matching collections' : 'Your collections'}
          className={css({
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
            gap: { base: '3', md: '6' },
          })}
        >
          {children.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              media={(path) => library.client?.media(path) || ''}
              onCreate={() => setDialog({ kind: 'create', parent: collection.id })}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          state={library.error ? 'error' : 'empty'}
          symbol={<Folder />}
          title={
            library.error
              ? 'Collections are unavailable'
              : searching
                ? 'No matching collections'
                : 'Make room for a collection'
          }
          description={
            searching
              ? 'Try another name.'
              : 'Create your first collection, then add photos, videos, or subfolders.'
          }
          actions={!searching && !library.error && newCollection}
        />
      )}
      <CollectionDialogs
        dialog={dialog}
        collections={collections}
        people={library.data?.people || []}
        busy={library.busy}
        error={dialog ? library.error : ''}
        mutate={library.mutate}
        onClose={() => setDialog(null)}
        onDeleted={() => setDialog(null)}
      />
    </LibraryShell>
  );
}
