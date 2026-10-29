import { useEffect, useState } from 'react';
import { ChevronRight, Folder, Lock, Plus, Star, X } from 'lucide-react';
import { FolderTree } from '@clipkit/ui';
import { useLibraryResource } from '../../services/use-library-resource';
import type { Collection, LibraryClient } from '../../services/library-client';
import { collectionPath, collectionTrail, isLocked, readPinned } from './collection-model';

async function loadCollections(api: LibraryClient, signal: AbortSignal) {
  return (await api.listCollections(signal)) || [];
}

/**
 * The sidebar's folder outline, as in the existing app: hidden collections
 * stay out of it, the current collection's ancestors start expanded, and the
 * find box searches full paths. Pins are the browser's own.
 */
export function CollectionTree({ currentId = 0 }: { currentId?: number }) {
  const library = useLibraryResource(loadCollections);
  const collections = library.data || [];
  const [show, setShow] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [query, setQuery] = useState('');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [pinned, setPinned] = useState<number[]>(readPinned);
  useEffect(() => {
    const refresh = () => setPinned(readPinned());
    window.addEventListener('storage', refresh);
    window.addEventListener('clipkit:pins', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('clipkit:pins', refresh);
    };
  }, []);
  useEffect(() => {
    // Only the current collection's ancestry opens on its own.
    const trail = collectionTrail(library.data || [], currentId);
    setExpanded((old) => new Set([...old, ...trail.map((item) => item.id)]));
  }, [currentId, library.data]);

  const visible = collections
    .filter((item) => !item.hidden && !item.inheritedHidden)
    .sort((a, b) => a.name.localeCompare(b.name));
  const searching = !!query.trim() || onlyPinned;
  const matches = visible.filter(
    (item) =>
      (!onlyPinned || pinned.includes(item.id)) &&
      collectionPath(collections, item.id)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  function toggle(id: number) {
    setExpanded((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function row(folder: Collection, depth: number) {
    const children = visible.some((item) => item.parentId === folder.id);
    const open = expanded.has(folder.id);
    const active = currentId === folder.id;
    return (
      <FolderTree.Row
        key={folder.id}
        data-active={active || undefined}
        style={{ paddingLeft: 8 + Math.min(depth, 6) * 13 }}
      >
        <FolderTree.Expand
          type="button"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${folder.name}`}
          aria-expanded={children ? open : undefined}
          disabled={!children}
          onClick={() => toggle(folder.id)}
        >
          {children && <ChevronRight aria-hidden="true" />}
        </FolderTree.Expand>
        <FolderTree.Open
          href={`/?view=collection&id=${folder.id}`}
          aria-current={active ? 'page' : undefined}
          title={folder.name}
        >
          {isLocked(folder) ? <Lock aria-hidden="true" /> : <Folder aria-hidden="true" />}
          <span>{folder.name}</span>
        </FolderTree.Open>
      </FolderTree.Row>
    );
  }
  function branch(parent: number, depth: number, seen: Set<number>): JSX.Element[] {
    return visible
      .filter((item) => item.parentId === parent && !seen.has(item.id))
      .flatMap((item) => [
        row(item, depth),
        ...(expanded.has(item.id) ? branch(item.id, depth + 1, new Set([...seen, item.id])) : []),
      ]);
  }
  return (
    <FolderTree.Root aria-label="Collection folders">
      <FolderTree.Heading>
        <button
          type="button"
          aria-expanded={show}
          aria-label={show ? 'Collapse collection folders' : 'Expand collection folders'}
          onClick={() => setShow((value) => !value)}
        >
          <ChevronRight
            aria-hidden="true"
            style={{ transform: show ? 'rotate(90deg)' : undefined }}
          />
        </button>
        <a href="/?view=collections">Folders</a>
        <a href="/?view=collections&new=1" aria-label="New collection" title="New collection">
          <Plus aria-hidden="true" />
        </a>
      </FolderTree.Heading>
      {show && (
        <>
          <FolderTree.Tools>
            <input
              aria-label="Find folder"
              placeholder="Find folder…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  event.stopPropagation();
                  setQuery('');
                }
              }}
            />
            {query && (
              <button type="button" aria-label="Clear folder search" onClick={() => setQuery('')}>
                <X aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              title="Show pinned folders"
              aria-label="Show pinned folders"
              aria-pressed={onlyPinned}
              onClick={() => setOnlyPinned((value) => !value)}
            >
              <Star aria-hidden="true" />
            </button>
          </FolderTree.Tools>
          <FolderTree.Scroll>
            {searching
              ? matches.map((item) => (
                  <div key={item.id}>
                    {row(item, 0)}
                    <FolderTree.Path>
                      {collectionTrail(collections, item.id)
                        .slice(0, -1)
                        .map((parent) => parent.name)
                        .join(' / ') || 'Collections'}
                    </FolderTree.Path>
                  </div>
                ))
              : branch(0, 0, new Set())}
            {!library.loading && !matches.length && (
              <FolderTree.Empty>
                {library.error
                  ? 'Folders are unavailable.'
                  : query
                    ? 'No matching folders'
                    : onlyPinned
                      ? 'Pin a folder from its options menu.'
                      : 'No collections yet'}
              </FolderTree.Empty>
            )}
          </FolderTree.Scroll>
        </>
      )}
    </FolderTree.Root>
  );
}
