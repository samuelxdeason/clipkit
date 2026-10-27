import type { Album } from "./api";

export type MediaDrag = { kind: "media"; videos: { site: string; id: string }[]; photos: string[]; sourceId: number };
export type CollectionDrag = MediaDrag | { kind: "folder"; id: number };

export function canDropCollection(payload: CollectionDrag | null, destination: number, collections: Album[]): boolean {
  if (!payload) return false;
  const target = collections.find(c => c.id === destination);
  if (destination !== 0 && (!target || target.locked || target.inheritedLocked)) return false;
  if (payload.kind === "media") return destination > 0 && destination !== payload.sourceId && payload.photos.length + payload.videos.length > 0;
  const source = collections.find(c => c.id === payload.id);
  if (!source || source.parentId === destination) return false;
  const seen = new Set<number>();
  let id = destination;
  while (id) {
    if (id === payload.id || seen.has(id)) return false;
    seen.add(id); id = collections.find(c => c.id === id)?.parentId || 0;
  }
  return true;
}

export function dragOperation(payload: CollectionDrag, copy: boolean): "Move" | "Add" {
  return payload.kind === "media" && (!payload.sourceId || copy) ? "Add" : "Move";
}
