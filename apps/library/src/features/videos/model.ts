import type { CatalogueVideo, Person } from '../../services/library-client';

export interface Video {
  id: string;
  title: string;
  person: string;
  tags: string[];
  duration: number;
  progress: number;
  favorite: boolean;
  resolution: string;
  added: number;
  artwork?: string;
  triptych?: string;
  collection?: string;
  source?: CatalogueVideo;
  people?: string[];
  searchText?: string;
}

export interface Filters {
  query: string;
  watch: string;
  person: string;
  tag: string;
  resolution: string;
  favorites: boolean;
  unorganized: boolean;
  source: string;
  duration: string;
  days: string;
  organization: string;
  people: string[];
  tags: string[];
  tagMatch: string;
}

export const emptyFilters: Filters = {
  query: '',
  watch: 'all',
  person: 'all',
  tag: 'all',
  resolution: 'all',
  favorites: false,
  unorganized: false,
  source: 'all',
  duration: 'all',
  days: 'all',
  organization: 'all',
  people: [],
  tags: [],
  tagMatch: 'all',
};
export const pageSize = 12;

export function filterVideos(videos: Video[], filters: Filters, sort: string) {
  const terms = (filters.query.toLocaleLowerCase().match(/"[^"]+"|\S+/g) || []).map((term) =>
    term.replace(/^"|"$/g, ''),
  );
  return videos
    .filter((video) => {
      const status =
        video.progress <= 0 ? 'unplayed' : video.progress >= 0.95 ? 'finished' : 'progress';
      const people = video.people || (video.person ? [video.person] : []);
      const haystack = (
        video.searchText || [video.title, ...people, ...video.tags].join(' ')
      ).toLocaleLowerCase();
      const height =
        video.source?.height ||
        (video.resolution === '4K' ? 2160 : Number.parseInt(video.resolution) || 0);
      return (
        terms.every((term) => haystack.includes(term)) &&
        (filters.watch === 'all' || filters.watch === status) &&
        (filters.person === 'all' || people.includes(filters.person)) &&
        (filters.tag === 'all' || video.tags.includes(filters.tag)) &&
        (filters.resolution === 'all' ||
          height >= (filters.resolution === '4K' ? 2160 : Number.parseInt(filters.resolution))) &&
        (!filters.favorites || video.favorite) &&
        (!filters.unorganized || !people.length || !video.tags.length) &&
        (filters.source === 'all' || video.source?.site === filters.source) &&
        (filters.duration === 'all' ||
          (filters.duration === 'short'
            ? video.duration < 300
            : filters.duration === 'medium'
              ? video.duration >= 300 && video.duration < 1200
              : video.duration >= 1200)) &&
        (filters.days === 'all' || Date.now() - video.added < Number(filters.days) * 86400000) &&
        (filters.organization === 'all' ||
          (filters.organization === 'people' ? !people.length : !video.tags.length)) &&
        (!filters.people.length || filters.people.some((person) => people.includes(person))) &&
        (!filters.tags.length ||
          (filters.tagMatch === 'any'
            ? filters.tags.some((tag) => video.tags.includes(tag))
            : filters.tags.every((tag) => video.tags.includes(tag))))
      );
    })
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      if (sort === 'duration') return b.duration - a.duration || a.id.localeCompare(b.id);
      if (sort === 'largest')
        return (b.source?.filesize || 0) - (a.source?.filesize || 0) || a.id.localeCompare(b.id);
      return (
        (sort === 'oldest' ? a.added - b.added : b.added - a.added) || a.id.localeCompare(b.id)
      );
    });
}

export function fromCatalogue(
  row: CatalogueVideo,
  people: Person[],
  media: (path: string) => string,
): Video {
  const names = row.people || [];
  const duration = row.duration || 0;
  return {
    id: JSON.stringify([row.site, row.id]),
    source: row,
    title: row.title || row.filename || 'Untitled video',
    person: names.join(', '),
    people: names,
    tags: row.labels || [],
    favorite: row.favorite,
    duration,
    progress: duration > 0 ? Math.min(1, (row.position || 0) / duration) : row.position ? 0.01 : 0,
    resolution: row.height ? (row.height >= 2160 ? '4K' : `${row.height}p`) : 'Unknown',
    added: Date.parse(row.added.replace(' ', 'T')) || 0,
    artwork: row.thumbnail ? media(row.thumbnail) : undefined,
    searchText: [
      row.title,
      row.source_title,
      row.filename,
      row.filepath,
      row.site,
      row.uploader,
      ...names,
      ...people.filter((person) => names.includes(person.name)).map((person) => person.nickname),
      ...(row.labels || []),
      ...(row.tags || []),
    ].join(' '),
  };
}

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
