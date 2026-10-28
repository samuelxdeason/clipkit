import type { CatalogueVideo } from '../../services/library-client';
import type { DirectoryEntry } from '../../components/browsing/directory-model';

/** Count user labels only, from the accessible catalogue, once per video. */
export function tagEntries(videos: CatalogueVideo[]): DirectoryEntry[] {
  const counts = new Map<string, number>();
  for (const video of videos)
    for (const tag of new Set(video.labels || []))
      if (tag.trim()) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, displayName: name, count }));
}
