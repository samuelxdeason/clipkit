import type { Account, CatalogueVideo, RemoteItem } from '../../services/library-client';
import type { DownloadJob } from '../../services/download-client';
export type { RemoteItem, SyncSummary } from '../../services/library-client';

type Source = { url?: string; webpage_url?: string; id?: string; site?: string };

const siteKey = (site: string, id: string) => {
  const name = site
    .toLowerCase()
    .replace(/^youtubetab$/, 'youtube')
    .replace(/^x$/, 'twitter');
  return name && id ? `${name}:${id}` : '';
};

/**
 * Every key a video or remote item can be matched by: its site and id, its
 * canonical URL, and the site id its URL carries. The existing app's rules.
 */
export function sourceKeys(source: Source): string[] {
  const keys = new Set<string>();
  if (source.site && source.id) keys.add(siteKey(source.site, source.id));
  try {
    const url = new URL(source.url || source.webpage_url || '');
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.protocol === 'http:') url.protocol = 'https:';
    for (const field of [...url.searchParams.keys()])
      if (field.startsWith('utm_') || ['fbclid', 'gclid'].includes(field))
        url.searchParams.delete(field);
    url.searchParams.sort();
    keys.add(`url:${url.toString()}`);
    const host = url.hostname;
    const parts = url.pathname.split('/').filter(Boolean);
    let site = '';
    let id = '';
    if (
      host === 'pornhub.com' ||
      host.endsWith('.pornhub.com') ||
      host === 'pornhubpremium.com' ||
      host.endsWith('.pornhubpremium.com')
    ) {
      site = 'pornhub';
      id = url.searchParams.get('viewkey') || '';
    } else if (['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
      site = 'youtube';
      id =
        host === 'youtu.be'
          ? parts[0] || ''
          : url.searchParams.get('v') ||
            (['shorts', 'embed'].includes(parts[0]) ? parts[1] || '' : '');
    } else if (['x.com', 'twitter.com', 'mobile.twitter.com', 'mobile.x.com'].includes(host)) {
      site = 'twitter';
      const index = parts.indexOf('status');
      if (index >= 0) id = parts[index + 1] || '';
    }
    if (site && id) keys.add(siteKey(site, id));
    if (site && source.id) keys.add(siteKey(site, source.id));
  } catch {
    /* Older entries may have only a site and id. */
  }
  return [...keys].filter(Boolean);
}

export function libraryIndex(videos: Source[]) {
  return new Set(videos.flatMap(sourceKeys));
}

export function isInLibrary(item: Source, index: Set<string>) {
  return sourceKeys(item).some((key) => index.has(key));
}

function normalizeAccount(raw: string) {
  try {
    const url = new URL(raw);
    let host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'x.com' || host === 'mobile.twitter.com') host = 'twitter.com';
    if (host.endsWith('.pornhub.com')) host = 'pornhub.com';
    return { host, path: url.pathname.replace(/\/+$/, ''), query: url.search };
  } catch {
    return undefined;
  }
}
type Address = ReturnType<typeof normalizeAccount>;
function accountMatches(a: Address, b: Address) {
  return (
    !!a &&
    !!b &&
    !!b.path &&
    a.host === b.host &&
    (!b.query || a.query === b.query) &&
    (a.path === b.path || a.path.startsWith(`${b.path}/`))
  );
}

/** The longest account URL that covers a source URL, cached per source. */
export function accountLookup<T extends { url: string }>(accounts: T[]) {
  const candidates = accounts
    .map((account) => ({
      account,
      address: normalizeAccount(account.url),
      length: account.url.length,
    }))
    .sort((a, b) => b.length - a.length);
  const cache = new Map<string, T | undefined>();
  return (source: string) => {
    if (!cache.has(source)) {
      const address = normalizeAccount(source);
      cache.set(
        source,
        candidates.find((candidate) => accountMatches(address, candidate.address))?.account,
      );
    }
    return cache.get(source);
  };
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

export function safeLink(url: string) {
  return /^https?:\/\//i.test(url);
}

export function checkedAt(value?: string) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not checked yet';
}

/** The daemon's account rows arrive in either naming; read the display name from both. */
export function accountName(account?: Account & { display_name?: string }) {
  return account?.displayName || account?.display_name || '';
}

export type ItemState =
  | { kind: 'downloaded'; label: 'Downloaded' }
  | { kind: 'downloading'; label: string }
  | { kind: 'queued'; label: 'Queued' }
  | { kind: 'checking'; label: 'Checking library' }
  | { kind: 'failed'; label: 'Failed · Retry' }
  | { kind: 'available'; label: 'Available' };

/**
 * What one remote item is to the library right now: the existing app's
 * order of precedence over ownership, saved videos, the queue and pending
 * requests. A job key ignores the URL fragment, as the queue does.
 */
export function itemState(
  item: RemoteItem,
  context: {
    saved: Set<string>;
    jobs: Map<string, DownloadJob>;
    pending: Set<string>;
    libraryReady: boolean;
  },
): ItemState {
  if (item.owned || isInLibrary(item, context.saved))
    return { kind: 'downloaded', label: 'Downloaded' };
  const job = sourceKeys({ url: item.url })
    .map((key) => context.jobs.get(key))
    .find(Boolean);
  if (job?.status === 'done' || job?.status === 'duplicate')
    return { kind: 'downloaded', label: 'Downloaded' };
  if (job?.status === 'downloading')
    return { kind: 'downloading', label: `Downloading ${Math.round(job.percent || 0)}%` };
  if (job?.status === 'queued' || context.pending.has(item.url))
    return { kind: 'queued', label: 'Queued' };
  if (!context.libraryReady) return { kind: 'checking', label: 'Checking library' };
  return job?.status === 'error'
    ? { kind: 'failed', label: 'Failed · Retry' }
    : { kind: 'available', label: 'Available' };
}

export function canDownload(state: ItemState) {
  return state.kind === 'available' || state.kind === 'failed';
}

export function jobIndex(queue: DownloadJob[]) {
  const index = new Map<string, DownloadJob>();
  for (const job of queue)
    if (job.status !== 'removed')
      for (const key of sourceKeys({ url: job.url })) index.set(key, job);
  return index;
}

/** The saved video a remote item corresponds to, if any. */
export function savedVideoIndex(videos: CatalogueVideo[]) {
  const index = new Map<string, CatalogueVideo>();
  for (const video of videos) for (const key of sourceKeys(video)) index.set(key, video);
  return index;
}

export function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
