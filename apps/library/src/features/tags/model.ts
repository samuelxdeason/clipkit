import type { CatalogueVideo } from '../../services/library-client';
import type { DirectoryEntry } from '../../components/browsing/directory-model';

/** The daemon's label tally, which counts user labels once per accessible video. */
export function labelEntries(counts: { label: string; count: number }[]): DirectoryEntry[] {
  return counts
    .filter((entry) => entry.label.trim())
    .map((entry) => ({ name: entry.label, displayName: entry.label, count: entry.count }));
}

/** The same tally computed in the app, for a catalogue already in hand. */
export function tagEntries(videos: CatalogueVideo[]): DirectoryEntry[] {
  const counts = new Map<string, number>();
  for (const video of videos)
    for (const tag of new Set(video.labels || []))
      if (tag.trim()) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, displayName: name, count }));
}
