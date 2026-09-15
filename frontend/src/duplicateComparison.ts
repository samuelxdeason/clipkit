import { library } from "../wailsjs/go/models";
import type { VideoKey } from "./api";

export const videoKey = (v: VideoKey) => JSON.stringify([v.site, v.id]);
export function formatBytes(n: number): string {
  if (!(n > 0)) return "Unknown";
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
export function formatDuration(n: number): string {
  const total = Math.round(n), hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60), seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}
type Cell = { value: string; note?: string; highlight?: boolean };
export function comparisonRows(videos: library.Video[]): { label: string; cells: Cell[] }[] {
  const pixels = videos.map(v => (v.width || 0) * (v.height || 0));
  const lengths = videos.map(v => Math.max(0, v.duration || 0));
  const sizes = videos.map(v => Math.max(0, v.filesize || 0));
  const maxPixels = Math.max(...pixels), maxLength = Math.max(...lengths);
  const knownSizes = sizes.filter(n => n > 0), minSize = Math.min(...knownSizes);
  const differentPixels = new Set(pixels.filter(n => n > 0)).size > 1;
  const differentLengths = new Set(lengths.filter(n => n > 0)).size > 1;
  const differentSizes = new Set(knownSizes).size > 1;
  return [
    { label: "Resolution", cells: videos.map((v, i) => ({ value: pixels[i] ? `${v.width?.toLocaleString()} × ${v.height?.toLocaleString()}` : "Unknown", note: pixels[i] && pixels[i] === maxPixels && differentPixels ? "Highest resolution" : pixels[i] ? (v.width || 0) > (v.height || 0) ? "Landscape" : (v.width || 0) < (v.height || 0) ? "Portrait" : "Square" : undefined, highlight: pixels[i] === maxPixels && differentPixels })) },
    { label: "Duration", cells: lengths.map(n => ({ value: n ? formatDuration(n) : "Unknown", note: n && differentLengths ? n === maxLength ? "Longest version" : `${formatDuration(maxLength - n)} shorter` : n && lengths.every(x => x === n) ? "Same length" : undefined, highlight: !!n && n === maxLength && differentLengths })) },
    { label: "File size", cells: sizes.map(n => ({ value: formatBytes(n), note: n && differentSizes ? n === minSize ? "Smallest file" : `${formatBytes(n - minSize)} larger` : n && sizes.every(x => x === n) ? "Same size" : undefined, highlight: !!n && n === minSize && differentSizes })) },
    { label: "Source / format", cells: videos.map(v => ({ value: v.site || "Unknown source", note: v.ext?.toUpperCase() || "Unknown format" })) },
  ];
}
