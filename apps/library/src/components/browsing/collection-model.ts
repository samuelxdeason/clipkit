import type { Collection } from '../../services/library-client';

/** The collection and its ancestors, root first. Cycles stop the walk. */
export function collectionTrail(collections: Collection[], id: number): Collection[] {
  const trail: Collection[] = [];
  const seen = new Set<number>();
  let current = collections.find((item) => item.id === id);
  while (current && !seen.has(current.id)) {
    trail.unshift(current);
    seen.add(current.id);
    const parent = current.parentId;
    current = collections.find((item) => item.id === parent);
  }
  return trail;
}

export function collectionPath(collections: Collection[], id: number) {
  return collectionTrail(collections, id)
    .map((item) => item.name)
    .join(' / ');
}

export function isLocked(collection: Collection | undefined) {
  return !!collection && (collection.locked || collection.inheritedLocked);
}

/** A collection cannot move into itself, its own descendants, or a locked folder. */
export function canMoveCollection(collections: Collection[], id: number, destination: number) {
  const source = collections.find((item) => item.id === id);
  if (!source || source.parentId === destination) return false;
  if (destination === 0) return true;
  const target = collections.find((item) => item.id === destination);
  if (!target || isLocked(target)) return false;
  return !collectionTrail(collections, destination).some((item) => item.id === id);
}

const pinKey = 'clipkitPinnedAlbums';

/** Pinned folders are a per-browser convenience, kept where the existing app keeps them. */
export function readPinned(): number[] {
  try {
    const ids = JSON.parse(localStorage.getItem(pinKey) || '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function writePinned(ids: number[]) {
  try {
    localStorage.setItem(pinKey, JSON.stringify(ids));
  } catch {
    /* Pins are optional. */
  }
}

const unlockKey = 'clipkit.collections.unlocked';

/** A locked collection opened this session stays open until the tab closes. */
export function readUnlocked(): number[] {
  try {
    const ids = JSON.parse(sessionStorage.getItem(unlockKey) || '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function writeUnlocked(ids: number[]) {
  try {
    sessionStorage.setItem(unlockKey, JSON.stringify(ids));
  } catch {
    /* The gate asks again next time. */
  }
}

/**
 * Subfolders of `id`, by name. With a search, every descendant whose name
 * matches (or, at the top level, every collection that matches).
 */
export function childCollections(collections: Collection[], id: number, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return collections
    .filter((item) =>
      item.id === id
        ? false
        : needle
          ? (!id || collectionTrail(collections, item.id).some((parent) => parent.id === id)) &&
            item.name.toLocaleLowerCase().includes(needle)
          : item.parentId === id,
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function countLabel(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
