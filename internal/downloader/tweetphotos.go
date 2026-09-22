// X (Twitter) pictures. yt-dlp only knows video, so a tweet whose media is
// pictures is handed to gallery-dl, which resolves the original-size
// pbs.twimg.com URLs (behind X's login wall, using the vault's cookies), and
// the pictures are catalogued as photos in an "@handle" album. They are
// attributed to whoever has connected that X account; if nobody has, they
// stay unassigned — people are never created automatically.
//
// A copied image address (pbs.twimg.com/media/…, or any URL that ends in an
// image extension) is fetched straight into the photo library too, instead of
// being left to yt-dlp's generic extractor, which would save it as a bogus
// "unknown_video". X CDN links are upgraded to the original upload size.
package downloader

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"trove/internal/library"
)

// tweetRequest reports whether raw is an X/Twitter status URL, the handle in
// it, and whether it names a picture (…/status/<id>/photo/<n>) — in which
// case yt-dlp needn't be tried first.
func tweetRequest(raw string) (handle string, isTweet, photoOnly bool) {
	site, id := remoteIdentity(raw)
	if site != "twitter" || id == "" {
		return "", false, false
	}
	u, err := url.Parse(raw)
	if err != nil {
		return "", false, false
	}
	return library.XHandleFromURL(raw), true, strings.Contains(u.Path, "/photo/")
}

// directImageRequest reports whether raw points straight at a picture file
// rather than a page, and returns the URL worth fetching plus the album the
// picture files under (the site it came from). X's CDN serves the same media
// id at several sizes; whatever size was copied, the original is requested.
func directImageRequest(raw string) (fetchURL, album string, ok bool) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return "", "", false
	}
	host := strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
	if host == "pbs.twimg.com" && strings.HasPrefix(u.Path, "/media/") {
		q := u.Query()
		if q.Get("format") == "" {
			q.Set("format", "jpg")
		}
		q.Set("name", "orig")
		u.RawQuery = q.Encode()
		u.Fragment = ""
		return u.String(), "x.com", true
	}
	if looksLikeImage.MatchString(u.Path) {
		return raw, host, true
	}
	return "", "", false
}

// runDirectImage saves one picture file as a photo and settles the job.
func (d *Downloader) runDirectImage(j *Job, fetchURL, album string) {
	d.mu.Lock()
	j.Title = photoBaseName(fetchURL)
	d.mu.Unlock()
	d.emitQueue()
	if d.db != nil && d.db.PhotoExists(photoID(fetchURL)) {
		d.finishPhotos(j, 0, 1, "")
		return
	}
	client := &http.Client{Timeout: 90 * time.Second}
	urls := []string{fetchURL}
	if fetchURL != j.URL {
		urls = append(urls, j.URL) // the size that was copied, if the original is refused
	}
	added := 0
	if d.downloadPhotoGroup(client, urls, "", "", album) {
		added = 1
	}
	if d.emit != nil {
		d.emit("import", map[string]any{"done": 1, "total": 1, "added": added, "finished": true})
	}
	d.finishPhotos(j, added, 0, "The picture couldn't be fetched. Check the link, or paste the tweet's link instead.")
}

// runTweetPhotos downloads a tweet's pictures into the vault as photos and
// settles the queue job. ytErr is what yt-dlp said when it was tried first
// ("" if it wasn't); it is reported when there are no pictures either.
func (d *Downloader) runTweetPhotos(j *Job, ytErr string) {
	handle, _, _ := tweetRequest(j.URL)
	if d.galleryDLArgv() == nil {
		d.finishPhotos(j, 0, 0, "Picture tweets need gallery-dl: put gallery-dl.exe next to yt-dlp.exe in resources/ (github.com/mikf/gallery-dl/releases), then add the link again.")
		return
	}
	groups := d.galleryDLURLs(j.URL)
	if len(groups) == 0 {
		msg := "No pictures found in this tweet. Check the link, or reconnect your x.com cookies if the post needs a login."
		if ytErr != "" {
			msg = ytErr + " (and no pictures were found in the tweet either)"
		}
		d.finishPhotos(j, 0, 0, msg)
		return
	}
	model, album := "", ""
	if handle != "" {
		album = "@" + handle
		if d.db != nil {
			_ = d.db.UpsertAccount(library.AccountInfo{Platform: "x", Handle: handle, URL: "https://x.com/" + handle, Source: "download"})
			model = d.db.AccountPerson("x", handle)
		}
	}
	d.mu.Lock()
	j.Title = "Pictures from " + firstNonEmpty(album, "X")
	d.mu.Unlock()
	d.emitQueue()

	client := &http.Client{Timeout: 90 * time.Second}
	added, existing := 0, 0
	for i, g := range groups {
		if d.db != nil && d.db.PhotoExists(photoID(g[0])) {
			existing++
		} else if d.downloadPhotoGroup(client, g, j.URL, model, album) {
			added++
		}
		d.mu.Lock()
		j.Percent = float64(i+1) / float64(len(groups)) * 100
		d.mu.Unlock()
		d.emitQueue()
	}
	if d.emit != nil { // the Photos page refreshes on this stream
		d.emit("import", map[string]any{"done": len(groups), "total": len(groups), "added": added, "finished": true})
	}
	d.finishPhotos(j, added, existing, "The pictures couldn't be fetched from X. Try again in a moment.")
}

// finishPhotos settles a picture job: done when anything new was saved,
// duplicate when every picture was already in the vault, otherwise the error.
func (d *Downloader) finishPhotos(j *Job, added, existing int, errMsg string) {
	d.mu.Lock()
	switch {
	case added > 0:
		j.Status, j.Count, j.Percent, j.Error = "done", added, 100, ""
	case existing > 0:
		j.Status, j.Percent = "duplicate", 100
	default:
		j.Status, j.Error = "error", errMsg
	}
	d.mu.Unlock()
	d.emitQueue()
}
