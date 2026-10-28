import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LibraryClient,
  resolveServer,
  validateServer,
  type Collection,
  type Person,
} from '../../services/library-client';
import {
  emptyFilters,
  filterVideos,
  fromCatalogue,
  pageSize,
  type Filters,
  type Video,
} from './model';

function savedServer() {
  try {
    return localStorage.getItem('clipkit.library.server') || '';
  } catch {
    return '';
  }
}
function preferences(person?: string) {
  const storageKey = person ? `clipkit.person.${person}.videos` : 'clipkit.library.browse';
  const route = new URLSearchParams(window.location.search);
  if (!person && (route.has('person') || route.has('tag'))) {
    return {
      filters: {
        ...emptyFilters,
        people: route.get('person') ? [route.get('person')!] : [],
        tags: route.get('tag') ? [route.get('tag')!] : [],
      },
      sort: 'newest',
      size: 'medium',
      page: 1,
    };
  }
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    const filters = { ...emptyFilters };
    for (const key of Object.keys(filters) as (keyof Filters)[]) {
      const next = value.filters?.[key];
      if (
        Array.isArray(filters[key])
          ? Array.isArray(next) && next.every((item: unknown) => typeof item === 'string')
          : typeof next === typeof filters[key]
      ) {
        Object.assign(filters, { [key]: next });
      }
    }
    return {
      filters,
      sort: ['newest', 'oldest', 'title', 'duration', 'largest'].includes(value.sort)
        ? value.sort
        : 'newest',
      size: ['small', 'medium', 'large'].includes(value.size) ? value.size : 'medium',
      page: Number.isInteger(value.page) && value.page > 0 ? value.page : 1,
    };
  } catch {
    return { filters: emptyFilters, sort: 'newest', size: 'medium', page: 1 };
  }
}

export function useConnectedLibrary(enabled: boolean, person?: string) {
  const [initial] = useState(() => preferences(person));
  const [server, setServer] = useState(savedServer);
  const [client, setClient] = useState<LibraryClient | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [sort, setSort] = useState<string>(initial.sort);
  const [size, setSize] = useState<string>(initial.size);
  const [page, setPage] = useState<number>(initial.page);
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const active = useRef(true);
  useEffect(() => {
    if (!enabled || person) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('person') || url.searchParams.has('tag')) {
      url.searchParams.delete('person');
      url.searchParams.delete('tag');
      window.history.replaceState(null, '', url);
    }
  }, [enabled, person]);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    generation.current++;
    pending.current?.abort();
    setClient(null);
    setMutationError('');
    setNotice('');
    setVideos([]);
    setPeople([]);
    setCollections([]);
    setSelected([]);
    setLoading(true);
    setError('');
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
  }, [enabled, server, connectionAttempt]);

  const refresh = useCallback(async () => {
    if (!client || !active.current) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const current = generation.current;
    setLoading(true);
    try {
      const data = await client.catalogue(controller.signal);
      if (controller.signal.aborted || current !== generation.current || !active.current) return;
      setVideos(
        data.videos.map((row) => ({
          ...fromCatalogue(row, data.people, (path) => client.media(path)),
          triptych:
            row.width && row.height && row.height > row.width ? client.triptych(row) : undefined,
        })),
      );
      setPeople(data.people);
      setCollections(data.collections);
      setError('');
    } catch (error) {
      if (!controller.signal.aborted && active.current)
        setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (pending.current === controller && active.current) setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (!enabled || !client) return;
    void refresh();
    const off = client.subscribe(() => {
      if (!lock.current) void refresh();
    });
    return () => {
      off();
      pending.current?.abort();
    };
  }, [enabled, client, refresh]);

  const matches = useMemo(
    () =>
      filterVideos(
        person ? videos.filter((video) => (video.people || []).includes(person)) : videos,
        filters,
        sort,
      ),
    [videos, filters, sort, person],
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(matches.length / pageSize)));
  const visible = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleIds = visible.map((video) => video.id).join('\n');
  useEffect(() => {
    const ids = new Set(visibleIds.split('\n'));
    setSelected((current) => current.filter((id) => ids.has(id)));
    if (!loading) setPage(currentPage);
  }, [visibleIds, currentPage, loading]);
  useEffect(() => {
    if (!enabled) return;
    try {
      sessionStorage.setItem(
        person ? `clipkit.person.${person}.videos` : 'clipkit.library.browse',
        JSON.stringify({ filters, sort, size, page }),
      );
    } catch {
      /* Browsing still works without storage. */
    }
  }, [enabled, filters, sort, size, page, person]);

  function connect(value: string) {
    if (lock.current) return;
    setMutationError('');
    try {
      const origin = validateServer(value);
      try {
        localStorage.setItem('clipkit.library.server', origin);
      } catch {
        /* Session connection remains usable. */
      }
      if (origin === server) {
        if (client) void refresh();
        else setConnectionAttempt((attempt) => attempt + 1);
      } else {
        setPage(1);
        setFilters(emptyFilters);
        setServer(origin);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  async function mutate(action: (api: LibraryClient) => Promise<unknown>, message: string) {
    if (!client || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setMutationError('');
    setNotice('');
    pending.current?.abort();
    let success = false;
    let failure = '';
    try {
      await action(client);
      success = true;
      if (active.current) {
        setNotice(message);
        setSelected([]);
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    } finally {
      // Reconcile even on failure: earlier writes in a bulk operation may have succeeded.
      await refresh();
      if (active.current) {
        if (failure) setMutationError(failure);
        setBusy(false);
      }
      lock.current = false;
    }
    return success;
  }

  const picked = videos.filter((video) => selected.includes(video.id));
  async function each(
    targets: Video[],
    action: (video: Video, api: LibraryClient) => Promise<unknown>,
    message: string,
  ) {
    return mutate(async (api) => {
      let completed = 0;
      for (const video of targets) {
        try {
          await action(video, api);
          completed++;
        } catch (error) {
          throw new Error(
            `${completed} of ${targets.length} updated. Completed changes are saved; retry to finish. ${error instanceof Error ? error.message : error}`,
          );
        }
      }
    }, message);
  }

  return {
    videos,
    filters,
    sort,
    size,
    page: currentPage,
    manage,
    selected,
    visible,
    matches,
    notice,
    error: mutationError || error,
    busy,
    loading,
    server,
    people,
    collections,
    client,
    connect,
    refresh: client ? refresh : () => setConnectionAttempt((attempt) => attempt + 1),
    updateFilters(next: Partial<Filters>) {
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
    toggleManage() {
      setManage((value) => !value);
      setSelected([]);
    },
    toggleSelection(id: string, checked: boolean) {
      setSelected((current) =>
        checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
      );
    },
    selectPage(checked: boolean) {
      setSelected(checked ? visible.map((video) => video.id) : []);
    },
    changePage(value: number) {
      setPage(value);
      setSelected([]);
    },
    favorite(id: string) {
      const video = videos.find((video) => video.id === id);
      return video
        ? mutate((api) => api.favorite(video.source!, !video.favorite), 'Favorite updated.')
        : Promise.resolve(false);
    },
    favoriteSelected() {
      return each(
        picked,
        (video, api) => api.favorite(video.source!, true),
        'Selected videos added to favorites.',
      );
    },
    collect(id: string) {
      const target = collections.find((collection) => String(collection.id) === id);
      if (!target || target.locked || target.inheritedLocked) {
        setError('Choose an unlocked collection.');
        return Promise.resolve(false);
      }
      return mutate(
        (api) =>
          api.collect(
            target.id,
            picked.map((video) => video.source!),
          ),
        `Added to “${target.name}”.`,
      );
    },
    addTags(value: string) {
      const tags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      return each(
        picked,
        (video, api) => api.labels(video.source!, [...new Set([...video.tags, ...tags])]),
        'Tags added.',
      );
    },
    addPerson(name: string) {
      return each(
        picked,
        (video, api) =>
          api.people(video.source!, [...new Set([...(video.source?.models || []), name])]),
        'Person linked to selected videos.',
      );
    },
    removeSelected() {
      return mutate(
        (api) => api.trash(picked.map((video) => video.source!)),
        'Moved to the vault’s recoverable trash. No in-app Undo is available.',
      );
    },
    removed: [] as Video[],
    undo() {},
    reset: refresh,
  };
}
