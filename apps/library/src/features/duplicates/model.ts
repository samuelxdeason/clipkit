import type { CatalogueVideo, VideoKey } from '../../services/library-client';

/** A group of videos someone marked as possible copies of each other. */
export interface DuplicateGroup {
  id: number;
  created: string;
  videos: CatalogueVideo[];
}

export const videoKey = (video: VideoKey) => JSON.stringify([video.site, video.id]);

export function formatBytes(value: number) {
  if (!(value > 0)) return 'Unknown';
  if (value >= 1073741824) return `${(value / 1073741824).toFixed(2)} GB`;
  if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

export function formatDuration(value: number) {
  const total = Math.round(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

export interface ComparisonCell {
  value: string;
  note?: string;
  highlight?: boolean;
}

/**
 * The existing app's comparison rows: resolution, duration, file size and
 * source. A note names the highest resolution, the longest version and the
 * smallest file when the copies differ, and says so when they do not.
 */
export function comparisonRows(
  videos: CatalogueVideo[],
): { label: string; cells: ComparisonCell[] }[] {
  const pixels = videos.map((video) => (video.width || 0) * (video.height || 0));
  const lengths = videos.map((video) => Math.max(0, video.duration || 0));
  const sizes = videos.map((video) => Math.max(0, video.filesize || 0));
  const maxPixels = Math.max(...pixels);
  const maxLength = Math.max(...lengths);
  const knownSizes = sizes.filter((n) => n > 0);
  const minSize = Math.min(...knownSizes);
  const differentPixels = new Set(pixels.filter((n) => n > 0)).size > 1;
  const differentLengths = new Set(lengths.filter((n) => n > 0)).size > 1;
  const differentSizes = new Set(knownSizes).size > 1;
  return [
    {
      label: 'Resolution',
      cells: videos.map((video, i) => ({
        value: pixels[i]
          ? `${video.width?.toLocaleString()} × ${video.height?.toLocaleString()}`
          : 'Unknown',
        note:
          pixels[i] && pixels[i] === maxPixels && differentPixels
            ? 'Highest resolution'
            : pixels[i]
              ? (video.width || 0) > (video.height || 0)
                ? 'Landscape'
                : (video.width || 0) < (video.height || 0)
                  ? 'Portrait'
                  : 'Square'
              : undefined,
        highlight: pixels[i] === maxPixels && differentPixels,
      })),
    },
    {
      label: 'Duration',
      cells: lengths.map((n) => ({
        value: n ? formatDuration(n) : 'Unknown',
        note:
          n && differentLengths
            ? n === maxLength
              ? 'Longest version'
              : `${formatDuration(maxLength - n)} shorter`
            : n && lengths.every((x) => x === n)
              ? 'Same length'
              : undefined,
        highlight: !!n && n === maxLength && differentLengths,
      })),
    },
    {
      label: 'File size',
      cells: sizes.map((n) => ({
        value: formatBytes(n),
        note:
          n && differentSizes
            ? n === minSize
              ? 'Smallest file'
              : `${formatBytes(n - minSize)} larger`
            : n && sizes.every((x) => x === n)
              ? 'Same size'
              : undefined,
        highlight: !!n && n === minSize && differentSizes,
      })),
    },
    {
      label: 'Source / format',
      cells: videos.map((video) => ({
        value: video.site || 'Unknown source',
        note:
          video.ext?.toUpperCase() ||
          video.filename?.split('.').pop()?.toUpperCase() ||
          'Unknown format',
      })),
    },
  ];
}
