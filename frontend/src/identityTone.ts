/** Identity-derived decoration: independent of result order and display names. */
export function cardTone(identity: string) {
  const tones = ["plum", "rose", "midnight", "amber"] as const;
  let hash = 2166136261;
  for (const character of identity.normalize("NFKC").trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return tones[(hash >>> 0) % tones.length];
}

