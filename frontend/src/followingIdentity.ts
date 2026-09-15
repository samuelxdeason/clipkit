type Source = { url?: string; webpage_url?: string; id?: string; site?: string };
const key = (site: string, id: string) => {
  const name = site.toLowerCase().replace(/^youtubetab$/, "youtube").replace(/^x$/, "twitter");
  return name && id ? name + ":" + id : "";
};
export function sourceKeys(source: Source): string[] {
  const keys = new Set<string>();
  if (source.site && source.id) keys.add(key(source.site, source.id));
  try {
    const url = new URL(source.url || source.webpage_url || "");
    url.hash = ""; url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol === "http:") url.protocol = "https:";
    for (const field of [...url.searchParams.keys()]) if (field.startsWith("utm_") || ["fbclid", "gclid"].includes(field)) url.searchParams.delete(field);
    url.searchParams.sort(); keys.add("url:" + url.toString());
    const host = url.hostname, parts = url.pathname.split("/").filter(Boolean);
    let site = "", id = "";
    if (host === "pornhub.com" || host.endsWith(".pornhub.com") || host === "pornhubpremium.com" || host.endsWith(".pornhubpremium.com")) { site = "pornhub"; id = url.searchParams.get("viewkey") || ""; }
    else if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) { site = "youtube"; id = host === "youtu.be" ? parts[0] || "" : url.searchParams.get("v") || (["shorts", "embed"].includes(parts[0]) ? parts[1] || "" : ""); }
    else if (["x.com", "twitter.com", "mobile.twitter.com", "mobile.x.com"].includes(host)) { site = "twitter"; const index = parts.indexOf("status"); if (index >= 0) id = parts[index + 1] || ""; }
    if (site && id) keys.add(key(site, id));
    if (site && source.id) keys.add(key(site, source.id));
  } catch { /* Older entries may have only a site and ID. */ }
  return [...keys].filter(Boolean);
}
export function libraryIndex(videos: Source[]): Set<string> { return new Set(videos.flatMap(sourceKeys)); }
export function isInLibrary(item: Source, index: Set<string>): boolean { return sourceKeys(item).some(k => index.has(k)); }
