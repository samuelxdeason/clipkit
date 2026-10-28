/** Hash identity, never sorted position, so decorative colors remain stable. */
export function identityIndex(identity: string) {
  let hash = 2166136261;
  for (const character of identity.trim().toLocaleLowerCase())
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) % 4;
}

export interface DirectoryEntry {
  name: string;
  displayName: string;
  count: number;
  thumbnail?: string;
  detail?: string;
}
export function directoryMatches(
  entries: DirectoryEntry[],
  query: string,
  sort: string,
  coverage: string,
) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return entries
    .filter(
      (entry) =>
        terms.every((term) =>
          `${entry.name} ${entry.displayName}`.toLocaleLowerCase().includes(term),
        ) &&
        (coverage === 'all' || (coverage === 'used' ? entry.count > 0 : entry.count === 0)),
    )
    .sort(
      (a, b) =>
        (sort === 'count' ? b.count - a.count : 0) ||
        a.displayName.localeCompare(b.displayName) ||
        a.name.localeCompare(b.name),
    );
}
