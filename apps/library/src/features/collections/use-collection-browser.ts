import { useCallback } from 'react';
import type {
  CataloguePhoto,
  CatalogueVideo,
  Collection,
  LibraryClient,
  Person,
} from '../../services/library-client';
import { useLibraryResource } from '../../services/use-library-resource';
import { isLocked } from '../../components/browsing/collection-model';

export interface CollectionData {
  collections: Collection[];
  current?: Collection;
  gated: boolean;
  videos: CatalogueVideo[];
  photos: CataloguePhoto[];
  people: Person[];
}

/**
 * The collections list, and the current collection's members once its lock
 * has been answered. A locked collection's media is not requested until the
 * session has opened it, so the gate is not only visual.
 */
export function useCollectionBrowser(id: number, unlocked: number[]) {
  const opened = unlocked.includes(id);
  const load = useCallback(
    async (api: LibraryClient, signal: AbortSignal): Promise<CollectionData> => {
      const [collections, people] = await Promise.all([
        api.listCollections(signal),
        api.listPeople(signal),
      ]);
      const list = collections || [];
      const current = list.find((item) => item.id === id);
      const gated = !!id && isLocked(current) && !opened;
      if (!id || !current || gated)
        return { collections: list, current, gated, videos: [], photos: [], people: people || [] };
      const [videos, photos] = await Promise.all([
        api.videosByCollection(id, signal),
        api.photosInCollection(String(id), signal),
      ]);
      return {
        collections: list,
        current,
        gated,
        videos: videos || [],
        photos: photos || [],
        people: people || [],
      };
    },
    [id, opened],
  );
  return useLibraryResource(load);
}
