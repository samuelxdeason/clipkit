import type { CataloguePhoto, CatalogueVideo } from '../../services/library-client';

export const itemPageSize = 60;

export interface CollectionItem {
  key: string;
  title: string;
  added: string;
  photo?: CataloguePhoto;
  video?: CatalogueVideo;
}

export function collectionItems(videos: CatalogueVideo[], photos: CataloguePhoto[]) {
  return [
    ...photos.map<CollectionItem>((photo) => ({
      key: JSON.stringify(['photo', photo.id]),
      title: photo.filename || 'Untitled photo',
      added: photo.added,
      photo,
    })),
    ...videos.map<CollectionItem>((video) => ({
      key: JSON.stringify(['video', video.site, video.id]),
      title: video.title || video.filename || 'Untitled video',
      added: video.added,
      video,
    })),
  ];
}

/** The existing browser's rules: a kind filter, a title/people search, newest or name order. */
export function filterItems(items: CollectionItem[], filter: string, query: string, sort: string) {
  const needle = query.trim().toLocaleLowerCase();
  return items
    .filter(
      (item) =>
        (filter === 'all' || (filter === 'photos' ? !!item.photo : !!item.video)) &&
        [item.title, item.photo?.model, ...(item.video?.people || [])]
          .join(' ')
          .toLocaleLowerCase()
          .includes(needle),
    )
    .sort((a, b) =>
      sort === 'name' ? a.title.localeCompare(b.title) : b.added.localeCompare(a.added),
    );
}
