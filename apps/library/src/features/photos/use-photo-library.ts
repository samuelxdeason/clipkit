import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LibraryClient,
  resolveServer,
  validateServer,
  type CataloguePhoto,
  type Collection,
  type Person,
} from '../../services/library-client';
import { emptyPhotoFilters, filterPhotos, photoPageSize, type PhotoFilters } from './model';

function savedSettings(person?: string) {
  const storageKey = person ? `clipkit.person.${person}.photos` : 'clipkit.photos.browse';
  const route = new URLSearchParams(window.location.search);
  if (!person && route.get('person'))
    return {
      filters: { ...emptyPhotoFilters, person: route.get('person')! },
      sort: 'newest',
      size: 'medium',
      page: 1,
    };
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    const filters = { ...emptyPhotoFilters };
    for (const key of Object.keys(filters) as (keyof PhotoFilters)[]) {
      if (typeof value.filters?.[key] === typeof filters[key])
        Object.assign(filters, { [key]: value.filters[key] });
    }
    return {
      filters,
      sort: ['newest', 'oldest', 'name'].includes(value.sort) ? value.sort : 'newest',
      size: ['small', 'medium', 'large'].includes(value.size) ? value.size : 'medium',
      page: Number.isInteger(value.page) && value.page > 0 ? value.page : 1,
    };
  } catch {
    return { filters: emptyPhotoFilters, sort: 'newest', size: 'medium', page: 1 };
  }
}
function savedServer() {
  try {
    return localStorage.getItem('clipkit.library.server') || '';
  } catch {
    return '';
  }
}

export function usePhotoLibrary(person?: string) {
  const [initial] = useState(() => savedSettings(person));
  const [server, setServer] = useState(savedServer);
  const [client, setClient] = useState<LibraryClient | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [photos, setPhotos] = useState<CataloguePhoto[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [membership, setMembership] = useState<Set<string> | null>(null);
  const [filters, setFilters] = useState<PhotoFilters>(initial.filters);
  const [sort, setSort] = useState<string>(initial.sort);
  const [size, setSize] = useState<string>(initial.size);
  const [page, setPage] = useState<number>(initial.page);
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    if (person) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('person')) {
      url.searchParams.delete('person');
      window.history.replaceState(null, '', url);
    }
  }, [person]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current?.abort();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    pending.current?.abort();
    setClient(null);
    setPhotos([]);
    setMembership(null);
    setPeople([]);
    setCollections([]);
    setSelected([]);
    setLoading(true);
    setError('');
    setMutationError('');
    resolveServer(server)
      .then((origin) => {
        if (!cancelled) setClient(new LibraryClient(origin));
      })
      .catch((error) => {
        if (!cancelled) {
          setError(String(error));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      pending.current?.abort();
    };
  }, [server, attempt]);

  const refresh = useCallback(async () => {
    if (!client || !mounted.current) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    try {
      const [rows, persons, albums] = await Promise.all([
        client.photos(controller.signal),
        client.request<Person[] | null>('/api/models', { signal: controller.signal }),
        client.request<Collection[] | null>('/api/collections', { signal: controller.signal }),
      ]);
      let ids: Set<string> | null = null;
      if (filters.collection) {
        const album = albums?.find((album) => String(album.id) === filters.collection);
        if (
          !album ||
          album.hidden ||
          album.inheritedHidden ||
          album.locked ||
          album.inheritedLocked
        ) {
          if (!controller.signal.aborted && mounted.current) {
            setPhotos(rows);
            setMembership(null);
            setCollections(albums || []);
          }
          throw new Error(
            'This collection is unavailable, hidden or locked. Clear the collection filter to continue.',
          );
        }
        ids = new Set(
          ((await client.photosInCollection(filters.collection, controller.signal)) || []).map(
            (photo) => photo.id,
          ),
        );
      }
      if (!controller.signal.aborted && mounted.current) {
        setPhotos(rows);
        setPeople(persons || []);
        setCollections(albums || []);
        setMembership(ids);
        setError('');
      }
    } catch (error) {
      if (!controller.signal.aborted && mounted.current)
        setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (pending.current === controller && mounted.current) setLoading(false);
    }
  }, [client, filters.collection]);
  useEffect(() => {
    if (!client) return;
    void refresh();
    const off = client.subscribe(() => {
      if (!lock.current) void refresh();
    });
    return () => {
      off();
      pending.current?.abort();
    };
  }, [client, refresh]);

  const matches = useMemo(
    () =>
      filterPhotos(
        person ? photos.filter((photo) => photo.model === person) : photos,
        filters,
        sort,
        membership,
      ),
    [photos, filters, sort, membership, person],
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(matches.length / photoPageSize)));
  const visible = matches.slice((currentPage - 1) * photoPageSize, currentPage * photoPageSize);
  const visibleIds = JSON.stringify(visible.map((photo) => photo.id));
  useEffect(() => {
    const ids = new Set<string>(JSON.parse(visibleIds));
    setSelected((current) => current.filter((id) => ids.has(id)));
    if (!loading) setPage(currentPage);
  }, [visibleIds, loading, currentPage]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        person ? `clipkit.person.${person}.photos` : 'clipkit.photos.browse',
        JSON.stringify({ filters, sort, size, page }),
      );
    } catch {
      /* Optional session persistence. */
    }
  }, [filters, sort, size, page, person]);

  async function mutate(action: (api: LibraryClient) => Promise<unknown>, message: string) {
    if (!client || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setMutationError('');
    setNotice('');
    pending.current?.abort();
    let success = false;
    try {
      await action(client);
      success = true;
      if (mounted.current) {
        setNotice(message);
        setSelected([]);
      }
    } catch (error) {
      if (mounted.current) setMutationError(error instanceof Error ? error.message : String(error));
    } finally {
      await refresh();
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
    return success;
  }
  return {
    photos,
    people,
    collections,
    filters,
    sort,
    size,
    page: currentPage,
    visible,
    matches,
    manage,
    selected,
    loading,
    busy,
    error: mutationError || error,
    notice,
    server,
    client,
    refresh: client ? refresh : () => setAttempt((value) => value + 1),
    connect(value: string) {
      if (lock.current) return;
      try {
        const next = validateServer(value);
        try {
          localStorage.setItem('clipkit.library.server', next);
        } catch {
          /* Session-only connection. */
        }
        if (next === server) {
          if (client) void refresh();
          else setAttempt((value) => value + 1);
        } else {
          setFilters(emptyPhotoFilters);
          setPage(1);
          setServer(next);
        }
      } catch (error) {
        setError(String(error));
      }
    },
    updateFilters(next: Partial<PhotoFilters>) {
      if (lock.current) return;
      if (next.collection !== undefined && next.collection !== filters.collection)
        setMembership(null);
      setFilters((current) => ({ ...current, ...next }));
      setPage(1);
      setSelected([]);
    },
    updateSort(value: string) {
      setSort(value);
      setPage(1);
      setSelected([]);
    },
    setSize,
    changePage(value: number) {
      setPage(value);
      setSelected([]);
    },
    toggleManage() {
      setManage((value) => !value);
      setSelected([]);
    },
    selectPage(checked: boolean) {
      setSelected(checked ? visible.map((photo) => photo.id) : []);
    },
    select(id: string, checked: boolean) {
      setSelected((current) =>
        checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
      );
    },
    assign(name: string) {
      return mutate((api) => api.assignPhotos(selected, name), 'Photo person assignments saved.');
    },
    collect(id: string) {
      const target = collections.find((item) => String(item.id) === id);
      if (!target || target.locked || target.inheritedLocked) {
        setMutationError('Choose an unlocked collection.');
        return Promise.resolve(false);
      }
      return mutate(
        (api) => api.collectPhotos(target.id, selected),
        `Photos added to “${target.name}”.`,
      );
    },
    trash() {
      return mutate(
        (api) => api.trashPhotos(selected),
        'Photos moved to the vault’s recoverable trash. No in-app Undo is available.',
      );
    },
  };
}
