package library

import (
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// DuplicateCandidate is a set of catalogued videos that look like the same
// recording, found by FindDuplicateCandidates. Reasons name the signals that
// linked them (e.g. "same source URL"); Videos is sorted by catalogue order.
type DuplicateCandidate struct {
	Reasons []string
	Videos  []Video
}

// Keys returns the group members as review-group keys.
func (c DuplicateCandidate) Keys() []VideoKey {
	keys := make([]VideoKey, 0, len(c.Videos))
	for _, v := range c.Videos {
		keys = append(keys, VideoKey{Site: v.Site, ID: v.ID})
	}
	return keys
}

// Signals that mark two entries as probable duplicates. Each is deliberately
// strict: the queue is a review list, not an automatic deletion.
const (
	reasonSameFile  = "same file on disk"
	reasonSameURL   = "same source URL and duration"
	reasonSameBytes = "same file size and duration"
	reasonSameTitle = "same title and duration"
)

// minTitleLen avoids linking videos on placeholder titles ("video", "clip").
const minTitleLen = 6

// FindDuplicateCandidates scans the reviewable catalogue (not hidden, not in a
// locked collection) for entries that point at the same file, or share a
// source URL, an identical file size, or an identical title, each at the same
// duration, and merges the matches into groups. Source URLs alone are not
// enough: one tweet can carry several distinct videos. Groups already covered by a saved review group are
// left out. Nothing is written.
func (db *DB) FindDuplicateCandidates() ([]DuplicateCandidate, error) {
	videos, err := db.query(`WHERE ` + notHidden + ` AND NOT EXISTS (SELECT 1 FROM collection_items ci JOIN collections c ON c.id=ci.collection_id WHERE c.locked=1 AND ci.site=videos.site AND ci.video_id=videos.id) ORDER BY added, site, id`)
	if err != nil {
		return nil, err
	}
	existing, err := db.DuplicateGroups()
	if err != nil {
		return nil, err
	}
	parent := make([]int, len(videos))
	for i := range parent {
		parent[i] = i
	}
	var find func(int) int
	find = func(i int) int {
		for parent[i] != i {
			parent[i] = parent[parent[i]]
			i = parent[i]
		}
		return i
	}
	reasons := map[int]map[string]bool{}
	link := func(bucket []int, reason string) {
		if len(bucket) < 2 {
			return
		}
		root := find(bucket[0])
		for _, i := range bucket[1:] {
			r := find(i)
			if r != root {
				parent[r] = root
				for k := range reasons[r] {
					if reasons[root] == nil {
						reasons[root] = map[string]bool{}
					}
					reasons[root][k] = true
				}
				delete(reasons, r)
			}
		}
		if reasons[root] == nil {
			reasons[root] = map[string]bool{}
		}
		reasons[root][reason] = true
	}
	byFile, byURL, byBytes, byTitle := map[string][]int{}, map[string][]int{}, map[string][]int{}, map[string][]int{}
	for i, v := range videos {
		if f := normalizePath(v.Filepath); f != "" {
			byFile[f] = append(byFile[f], i)
		}
		if u := normalizeURL(v.WebpageURL); u != "" && v.Duration != nil {
			byURL[u+"|"+itoa(*v.Duration)] = append(byURL[u+"|"+itoa(*v.Duration)], i)
		}
		if v.Filesize != nil && *v.Filesize > 0 && v.Duration != nil {
			k := strings.Join([]string{itoa64(*v.Filesize), itoa(*v.Duration)}, "|")
			byBytes[k] = append(byBytes[k], i)
		}
		if t := normalizeTitle(v); len(t) >= minTitleLen && v.Duration != nil && !isFallbackTitle(v.Title) {
			k := t + "|" + itoa(*v.Duration)
			byTitle[k] = append(byTitle[k], i)
		}
	}
	for _, b := range byFile {
		link(b, reasonSameFile)
	}
	for _, b := range byURL {
		link(b, reasonSameURL)
	}
	for _, b := range byBytes {
		link(b, reasonSameBytes)
	}
	for _, b := range byTitle {
		link(b, reasonSameTitle)
	}
	members := map[int][]int{}
	for i := range videos {
		if r := find(i); reasons[r] != nil {
			members[r] = append(members[r], i)
		}
	}
	roots := make([]int, 0, len(members))
	for r := range members {
		roots = append(roots, r)
	}
	sort.Ints(roots)
	var out []DuplicateCandidate
	for _, r := range roots {
		idx := members[r]
		sort.Ints(idx)
		c := DuplicateCandidate{}
		for _, i := range idx {
			c.Videos = append(c.Videos, videos[i])
		}
		if coveredByExisting(c.Keys(), existing) {
			continue
		}
		for k := range reasons[r] {
			c.Reasons = append(c.Reasons, k)
		}
		sort.Strings(c.Reasons)
		out = append(out, c)
	}
	return out, nil
}

// coveredByExisting reports whether every key already sits in one saved group.
func coveredByExisting(keys []VideoKey, groups []DuplicateGroup) bool {
	for _, g := range groups {
		have := map[VideoKey]bool{}
		for _, v := range g.Videos {
			have[VideoKey{v.Site, v.ID}] = true
		}
		all := true
		for _, k := range keys {
			if !have[k] {
				all = false
				break
			}
		}
		if all {
			return true
		}
	}
	return false
}

// normalizePath folds a catalogue path for comparison. Windows paths are
// case-insensitive, and the same file is the same file whichever case it was
// catalogued under.
func normalizePath(p string) string {
	p = strings.TrimSpace(p)
	if p == "" {
		return ""
	}
	return strings.ToLower(filepath.Clean(p))
}

// isFallbackTitle recognises the cleaner's "<people or uploader> clip" titles,
// which say nothing about the content and so cannot mark a duplicate.
func isFallbackTitle(t string) bool {
	return strings.HasSuffix(strings.ToLower(strings.TrimSpace(t)), " clip")
}

func normalizeURL(u string) string {
	u = strings.TrimSpace(strings.ToLower(u))
	u = strings.TrimPrefix(u, "http://")
	u = strings.TrimPrefix(u, "https://")
	u = strings.TrimPrefix(u, "www.")
	return strings.TrimRight(u, "/")
}

// normalizeTitle folds the source title (or the current title when the source
// is unchanged) to lowercase words so punctuation and spacing differences match.
func normalizeTitle(v Video) string {
	t := v.SourceTitle
	if t == "" {
		t = v.Title
	}
	var b strings.Builder
	space := false
	for _, r := range strings.ToLower(t) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r > 127:
			if space && b.Len() > 0 {
				b.WriteByte(' ')
			}
			space = false
			b.WriteRune(r)
		default:
			space = true
		}
	}
	return b.String()
}

func itoa(n int) string     { return strconv.Itoa(n) }
func itoa64(n int64) string { return strconv.FormatInt(n, 10) }
