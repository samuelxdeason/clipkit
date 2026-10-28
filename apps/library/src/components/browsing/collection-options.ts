import type { Collection } from '../../services/library-client';

export function collectionOptions(collections: Collection[]) {
  return collections
    .filter((item) => !item.locked && !item.inheritedLocked)
    .map((item) => {
      const names: string[] = [];
      const seen = new Set<number>();
      let current: Collection | undefined = item;
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        names.unshift(current.name);
        const parent: number = current.parentId;
        current = collections.find((candidate) => candidate.id === parent);
      }
      return {
        value: String(item.id),
        label: `${names.join(' / ')}${item.hidden || item.inheritedHidden ? ' · hidden (items leave this library view)' : ''}`,
      };
    });
}
