import type { DownloadJob } from './download-client';

/** HTTP DTOs deliberately stay independent of generated Wails models and shared UI. */
export interface CatalogueVideo {
  site: string;
  id: string;
  title: string;
  source_title?: string;
  filename?: string;
  filepath: string;
  thumbnail?: string;
  people?: string[] | null;
  models?: string[] | null;
  labels?: string[] | null;
  tags?: string[] | null;
  uploader?: string;
  duration?: number | null;
  position?: number | null;
  height?: number | null;
  width?: number | null;
  filesize?: number | null;
  webpage_url?: string;
  added: string;
  favorite: boolean;
}
export interface Person {
  name: string;
  nickname?: string;
  count?: number;
  totalSeconds?: number;
  bytes?: number;
  sites?: string;
  thumbnail?: string;
}
export interface PersonInfo {
  name: string;
  nickname: string;
  bio: string;
  cover: string;
  links: { label: string; url: string }[] | null;
}
export interface Account {
  platform: string;
  handle: string;
  person: string;
  kind: string;
  displayName: string;
  url: string;
  source: string;
}
export interface CataloguePhoto {
  id: string;
  model: string;
  album: string;
  filepath: string;
  filename: string;
  added: string;
}
export interface Collection {
  id: number;
  name: string;
  parentId: number;
  hidden: boolean;
  locked: boolean;
  inheritedHidden: boolean;
  inheritedLocked: boolean;
  count?: number;
  photoCount?: number;
  videoCount?: number;
  albumCount?: number;
  covers?: string[];
}
export interface MediaKeys {
  videos: VideoKey[];
  photos: string[];
}
export interface VideoKey {
  site: string;
  id: string;
}
export interface RemoteItem {
  site?: string;
  url: string;
  title: string;
  id: string;
  owned: boolean;
}
export interface SyncSummary {
  url: string;
  title: string;
  kind: string;
  fetchedAt: string;
  count: number;
  owned: number;
  new: number;
}
export interface Catalogue {
  videos: CatalogueVideo[];
  people: Person[];
  collections: Collection[];
}

type DesktopWindow = Window & { go?: { main?: { App?: { APIBase?: () => Promise<string> } } } };

export function validateServer(value: string) {
  if (!value.trim()) return '';
  const url = new URL(value.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'Use a server origin such as http://localhost:8899, without a path or credentials.',
    );
  }
  return url.origin;
}

export async function resolveServer(configured: string) {
  const native = (window as DesktopWindow).go?.main?.App?.APIBase;
  return native ? validateServer(await native()) : validateServer(configured);
}

export class LibraryClient {
  readonly origin: string;
  constructor(origin: string) {
    this.origin = origin;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.origin + path, options);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new Error(
        'Could not connect to ClipKit. Check the server address and that the backend is running.',
      );
    }
    const text = await response.text();
    if (/text\/html/i.test(response.headers.get('content-type') || '') || /^\s*</.test(text)) {
      throw new Error(
        'This address is serving a webpage instead of the ClipKit API. Connect to your backend server.',
      );
    }
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!response.ok) {
      const detail =
        typeof data === 'string'
          ? data
          : (data as { error?: string; message?: string })?.error ||
            (data as { message?: string })?.message;
      throw new Error(detail || `Request failed (${response.status}). Try again.`);
    }
    if (typeof data === 'string' && !text.startsWith('"'))
      throw new Error('The server returned an unreadable response.');
    return data as T;
  }

  post<T = unknown>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async catalogue(signal: AbortSignal): Promise<Catalogue> {
    const [people, collections] = await Promise.all([
      this.request<Person[] | null>('/api/models', { signal }),
      this.request<Collection[] | null>('/api/collections', { signal }),
    ]);
    // Match the existing library: fetch every accessible page before local filtering.
    // Never substitute collection-specific endpoints, which can reveal hidden media.
    const rows = new Map<string, CatalogueVideo>();
    for (let offset = 0; ; offset += 500) {
      const batch =
        (await this.request<CatalogueVideo[] | null>(
          `/api/videos?limit=500&offset=${offset}&sort=newest&site=&fav=0&seed=0`,
          { signal },
        )) || [];
      for (const video of batch) rows.set(JSON.stringify([video.site, video.id]), video);
      if (batch.length < 500) break;
    }
    return { videos: [...rows.values()], people: people || [], collections: collections || [] };
  }

  media(path: string) {
    return path ? `${this.origin}/media?p=${encodeURIComponent(path)}` : '';
  }
  triptych(video: CatalogueVideo) {
    return `${this.origin}/api/videos/triptych?site=${encodeURIComponent(video.site)}&id=${encodeURIComponent(video.id)}`;
  }
  async photos(signal: AbortSignal) {
    const rows = new Map<string, CataloguePhoto>();
    for (let offset = 0; ; offset += 120) {
      const batch =
        (await this.request<CataloguePhoto[] | null>(
          `/api/photos/all?limit=120&offset=${offset}&q=`,
          { signal },
        )) || [];
      for (const photo of batch) rows.set(photo.id, photo);
      if (batch.length < 120) return [...rows.values()];
    }
  }
  photosInCollection(id: string, signal: AbortSignal) {
    return this.request<CataloguePhoto[] | null>(
      `/api/albums/photos?id=${encodeURIComponent(id)}`,
      { signal },
    );
  }
  listPeople(signal: AbortSignal) {
    return this.request<Person[] | null>('/api/models', { signal });
  }
  personInfo(name: string, signal: AbortSignal) {
    return this.request<PersonInfo>('/api/modelinfo?name=' + encodeURIComponent(name), { signal });
  }
  accounts(signal: AbortSignal) {
    return this.request<Account[] | null>('/api/accounts', { signal });
  }
  createPerson(name: string) {
    return this.post('/api/people/create', { name });
  }
  savePerson(info: PersonInfo) {
    return this.post('/api/savemodelinfo', {
      name: info.name,
      nickname: info.nickname,
      bio: info.bio,
      links: info.links || [],
    });
  }
  renamePerson(name: string, newName: string) {
    return this.post('/api/model/rename', { name, newName });
  }
  deletePerson(name: string) {
    return this.post('/api/people/delete', { name });
  }
  connectAccount(name: string, account: Account) {
    return this.post('/api/accounts/connect', {
      name,
      platform: account.platform,
      handle: account.handle,
    });
  }
  createAccount(name: string, url: string) {
    return this.post('/api/accounts/create', { name, url });
  }
  assignPhotos(photos: string[], name: string) {
    return this.post('/api/photos/assign', { photos, name });
  }
  collectPhotos(id64: number, photos: string[]) {
    return this.post('/api/albums/add', { id64, photos, videos: [] });
  }
  trashPhotos(photos: string[]) {
    return this.post('/api/media/trash', { photos, videos: [] });
  }
  favorite(key: VideoKey, fav: boolean) {
    return this.post('/api/setfavorite', { site: key.site, id: key.id, fav });
  }
  labels(key: VideoKey, labels: string[]) {
    return this.post('/api/setlabels', { site: key.site, id: key.id, labels });
  }
  people(key: VideoKey, models: string[]) {
    return this.post('/api/setmodels', { site: key.site, id: key.id, models });
  }
  collect(id64: number, videos: VideoKey[]) {
    return this.post('/api/albums/add', {
      id64,
      videos: videos.map(({ site, id }) => ({ site, id })),
      photos: [],
    });
  }
  // Playback: the existing player's calls, in order. Position is in seconds;
  // the server clears it when duration says the video finished.
  markWatched(key: VideoKey) {
    return this.post('/api/markwatched', { site: key.site, id: key.id });
  }
  position(key: VideoKey, position: number, duration: number) {
    return this.post('/api/position', { site: key.site, id: key.id, position, duration });
  }
  setTitle(key: VideoKey, title: string) {
    return this.post('/api/settitle', { site: key.site, id: key.id, title });
  }
  allLabels(signal: AbortSignal) {
    return this.request<string[] | null>('/api/labels', { signal });
  }
  listCollections(signal: AbortSignal) {
    return this.request<Collection[] | null>('/api/collections', { signal });
  }
  collectionsForVideo(key: VideoKey, signal: AbortSignal) {
    return this.request<number[] | null>(
      `/api/collections-for-video?site=${encodeURIComponent(key.site)}&id=${encodeURIComponent(key.id)}`,
      { signal },
    );
  }
  uncollect(id64: number, key: VideoKey) {
    return this.post('/api/collections/remove', { id64, site: key.site, videoId: key.id });
  }
  createCollection(name: string) {
    return this.post<{ id: number }>('/api/collections/create', { name });
  }
  // Collections: the existing browser's calls, with their field names.
  videosByCollection(id: number, signal: AbortSignal) {
    return this.request<CatalogueVideo[] | null>(`/api/videos/by-collection?id=${id}`, {
      signal,
    });
  }
  createAlbum(name: string, parentId: number) {
    return this.post<{ id: number }>('/api/albums/create', { name, parentId });
  }
  moveAlbum(id64: number, parentId: number) {
    return this.post('/api/albums/move', { id64, parentId });
  }
  renameCollection(id64: number, name: string) {
    return this.post('/api/collections/rename', { id64, name });
  }
  deleteCollection(id64: number) {
    return this.post('/api/collections/delete', { id64 });
  }
  addAlbumItems(id64: number, items: MediaKeys) {
    return this.post('/api/albums/add', { id64, videos: items.videos, photos: items.photos });
  }
  removeAlbumItems(id64: number, items: MediaKeys) {
    return this.post('/api/albums/remove', { id64, videos: items.videos, photos: items.photos });
  }
  transferCollectionItems(sourceId: number, id64: number, items: MediaKeys, copy = false) {
    return this.post('/api/collections/transfer', {
      sourceId,
      id64,
      videos: items.videos,
      photos: items.photos,
      copy,
    });
  }
  trashMedia(items: MediaKeys) {
    return this.post('/api/media/trash', { videos: items.videos, photos: items.photos });
  }
  // Following: the existing screen's calls. Enumerating a source may reach
  // the network through the daemon; refresh asks it to re-list the source.
  syncedLists(signal: AbortSignal) {
    return this.request<SyncSummary[] | null>('/api/synced/lists', { signal });
  }
  removeSync(url: string) {
    return this.post('/api/synced/remove', { url });
  }
  enumerate(url: string, refresh: boolean, signal?: AbortSignal) {
    return this.request<RemoteItem[] | null>(
      `/api/enumerate?url=${encodeURIComponent(url)}&refresh=${refresh ? '1' : ''}`,
      { signal },
    );
  }
  enqueueMany(urls: string[]) {
    return this.post<{ added: number }>('/api/enqueue/many', { urls });
  }
  queue(signal: AbortSignal) {
    return this.request<DownloadJob[] | null>('/api/queue', { signal });
  }
  trash(videos: VideoKey[]) {
    return this.post('/api/media/trash', {
      videos: videos.map(({ site, id }) => ({ site, id })),
      photos: [],
    });
  }

  subscribe(refresh: () => void) {
    const events = new EventSource(this.origin + '/api/events');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    for (const name of ['library', 'queue', 'avatar', 'import'])
      events.addEventListener(name, schedule);
    // Refresh after reconnection as events may have been missed while offline.
    events.addEventListener('open', schedule);
    return () => {
      clearTimeout(timer);
      events.close();
    };
  }
}
