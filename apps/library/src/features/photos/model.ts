import type { CataloguePhoto } from '../../services/library-client';

export const photoPageSize = 24;
export const emptyPhotoFilters = {
  query: '',
  person: '',
  album: '',
  days: '',
  collection: '',
  unassigned: false,
};
export type PhotoFilters = typeof emptyPhotoFilters;

export function filterPhotos(
  photos: CataloguePhoto[],
  filters: PhotoFilters,
  sort: string,
  membership: Set<string> | null = null,
) {
  const terms = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return photos
    .filter((photo) => {
      const text = [photo.filename, photo.model, photo.album].join(' ').toLocaleLowerCase();
      return (
        terms.every((term) => text.includes(term)) &&
        (!filters.person || photo.model === filters.person) &&
        (!filters.album || photo.album === filters.album) &&
        (!filters.unassigned || !photo.model) &&
        (!filters.days ||
          Date.now() - Date.parse(photo.added.replace(' ', 'T')) <
            Number(filters.days) * 86400000) &&
        (!filters.collection || !!membership?.has(photo.id))
      );
    })
    .sort((a, b) => {
      if (sort === 'name') return a.filename.localeCompare(b.filename) || a.id.localeCompare(b.id);
      const order = a.added.localeCompare(b.added);
      return (sort === 'oldest' ? order : -order) || a.id.localeCompare(b.id);
    });
}
