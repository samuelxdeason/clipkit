package downloader

import (
	"encoding/json"
	"net/url"
	"strings"
)

func sourceKey(site, id string) string {
	site = strings.ToLower(site)
	switch site {
	case "x":
		site = "twitter"
	case "youtubetab":
		site = "youtube"
	}
	if site == "" || id == "" {
		return ""
	}
	return site + " " + id
}
func remoteIdentity(raw string) (string, string) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", ""
	}
	host := strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	switch host {
	case "pornhub.com", "de.pornhub.com", "fr.pornhub.com", "es.pornhub.com", "it.pornhub.com", "jp.pornhub.com", "pornhubpremium.com":
		return "pornhub", u.Query().Get("viewkey")
	case "youtube.com", "m.youtube.com":
		if id := u.Query().Get("v"); id != "" {
			return "youtube", id
		}
		if len(parts) == 2 && (parts[0] == "shorts" || parts[0] == "embed") {
			return "youtube", parts[1]
		}
	case "youtu.be":
		if len(parts) == 1 {
			return "youtube", parts[0]
		}
	case "x.com", "twitter.com", "mobile.twitter.com":
		for i, part := range parts {
			if part == "status" && i+1 < len(parts) {
				return "twitter", parts[i+1]
			}
		}
	}
	return "", ""
}
func sourceURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	u.Fragment = ""
	u.Host = strings.TrimPrefix(strings.ToLower(u.Host), "www.")
	if u.Scheme == "http" {
		u.Scheme = "https"
	}
	return u.String()
}
func parseRemote(line string) (RemoteItem, bool) {
	var entry struct {
		ID         string
		Title      string
		URL        string
		WebpageURL string `json:"webpage_url"`
		Extractor  string `json:"extractor_key"`
		IEKey      string `json:"ie_key"`
	}
	if json.Unmarshal([]byte(line), &entry) != nil {
		return RemoteItem{}, false
	}
	raw := entry.WebpageURL
	if raw == "" {
		raw = entry.URL
	}
	site := entry.IEKey
	if site == "" {
		site = entry.Extractor
	}
	if !strings.HasPrefix(raw, "http://") && !strings.HasPrefix(raw, "https://") {
		if strings.EqualFold(site, "Youtube") && entry.ID != "" {
			raw = "https://www.youtube.com/watch?v=" + url.QueryEscape(entry.ID)
		} else {
			return RemoteItem{}, false
		}
	}
	inferredSite, inferredID := remoteIdentity(raw)
	if inferredSite != "" {
		site = inferredSite
	}
	if entry.ID == "" {
		entry.ID = inferredID
	}
	return RemoteItem{URL: raw, Title: entry.Title, ID: entry.ID, Site: strings.ToLower(site)}, true
}
func (d *Downloader) ownedSources() map[string]bool {
	result := d.archiveSet()
	if d.db != nil {
		if videos, err := d.db.VideoSources(); err == nil {
			for _, v := range videos {
				if key := sourceKey(v.Site, v.ID); key != "" {
					result[key] = true
				}
				if v.WebpageURL != "" {
					result["url:"+sourceURL(v.WebpageURL)] = true
					site, id := remoteIdentity(v.WebpageURL)
					if key := sourceKey(site, id); key != "" {
						result[key] = true
					}
				}
			}
		}
	}
	return result
}
func isOwned(it RemoteItem, owned map[string]bool) bool {
	if owned["url:"+sourceURL(it.URL)] {
		return true
	}
	site, id := remoteIdentity(it.URL)
	if owned[sourceKey(site, id)] {
		return true
	}
	if it.Site != "" {
		site = it.Site
	}
	if it.ID != "" {
		id = it.ID
	}
	return owned[sourceKey(site, id)]
}
