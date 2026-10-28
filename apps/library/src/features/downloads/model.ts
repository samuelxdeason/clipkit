import type { DownloadJob } from '../../services/download-client';
export type { DownloadJob } from '../../services/download-client';

export const statusLabels: Record<string, string> = {
  queued: 'Waiting',
  downloading: 'In progress',
  done: 'Completed',
  duplicate: 'Already saved',
  error: 'Needs attention',
};

export function parseLinks(input: string) {
  const links = [...new Set(input.split(/\s+/).filter(Boolean))];
  if (!links.length) throw new Error('Paste at least one link.');
  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      throw new Error('Use complete http:// or https:// links.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Use HTTP(S) links without embedded credentials.');
  }
  return links;
}

export function progress(job: DownloadJob) {
  return Number.isFinite(job.percent) ? Math.max(0, Math.min(100, job.percent)) : 0;
}

export function matchesStatus(job: DownloadJob, status: string) {
  return (
    status === 'all' ||
    (status === 'completed' ? ['done', 'duplicate'].includes(job.status) : job.status === status)
  );
}
