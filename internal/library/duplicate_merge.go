package library

import (
	"database/sql"
	"encoding/json"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// MergedFile records one file that had several catalogue rows: the row kept,
// the rows dropped (with the collections each belonged to, for recovery), and
// the keeper's fields that were filled in from the dropped rows.
type MergedFile struct {
	File               string
	Keep               VideoKey
	Dropped            []Video
	DroppedCollections [][]int64
	Filled             []string
}

// MergeReport says what MergeSameFileRows found or did.
type MergeReport struct {
	Files       []MergedFile
	RowsDropped int
	ItemsMoved  int // collection memberships carried over to keepers
}

// MergeSameFileRows finds files catalogued under more than one row and folds
// each set into one row, so nothing the user recorded is lost: people, tags,
// labels, favourite, watched position and collection memberships are merged
// into the keeper, and empty keeper fields are filled from the dropped rows.
// The keeper is the row the flat layout named the file after, else the oldest.
// Review groups that mentioned a dropped row are pruned. Files are not touched.
func (db *DB) MergeSameFileRows(dryRun bool) (MergeReport, error) {
	var rep MergeReport
	videos, err := db.query(`WHERE filepath IS NOT NULL AND filepath<>'' ORDER BY added, site, id`)
	if err != nil {
		return rep, err
	}
	byFile := map[string][]Video{}
	var order []string
	for _, v := range videos {
		k := normalizePath(v.Filepath)
		if _, seen := byFile[k]; !seen {
			order = append(order, k)
		}
		byFile[k] = append(byFile[k], v)
	}
	for _, k := range order {
		rows := byFile[k]
		if len(rows) < 2 {
			continue
		}
		keeper := chooseKeeper(rows)
		var others []Video
		for _, v := range rows {
			if v.Site != keeper.Site || v.ID != keeper.ID {
				others = append(others, v)
			}
		}
		merged, filled := mergeVideos(keeper, others)
		m := MergedFile{File: keeper.Filepath, Keep: VideoKey{keeper.Site, keeper.ID}, Dropped: others, Filled: filled}
		for _, o := range others {
			ids, err := db.collectionsOf(o.Site, o.ID)
			if err != nil {
				return rep, err
			}
			m.DroppedCollections = append(m.DroppedCollections, ids)
		}
		rep.Files = append(rep.Files, m)
		rep.RowsDropped += len(others)
		if dryRun {
			continue
		}
		if err := db.applyMerge(merged, m, &rep); err != nil {
			return rep, err
		}
	}
	return rep, nil
}

func (db *DB) collectionsOf(site, id string) ([]int64, error) {
	rows, err := db.sql.Query(`SELECT collection_id FROM collection_items WHERE site=? AND video_id=? ORDER BY collection_id`, site, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (db *DB) applyMerge(merged Video, m MergedFile, rep *MergeReport) error {
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var watched, added any
	if merged.WatchedAt != "" {
		watched = merged.WatchedAt
	}
	if merged.Added != "" {
		added = merged.Added
	}
	if _, err := tx.Exec(`UPDATE videos SET title=?, source_title=?, title_status=?, uploader=?, model=?, duration=?, width=?, height=?,
  ext=?, filename=?, thumbnail=?, thumbnail_url=?, webpage_url=?, upload_date=?, view_count=?, like_count=?, tags=?, categories=?,
  description=?, filesize=?, added=COALESCE(?,added), watched_at=?, favorite=?, labels=?, position=?, uploader_id=?, cast=?,
  source_platform=?, source_handle=? WHERE site=? AND id=?`,
		merged.Title, merged.SourceTitle, merged.TitleStatus, merged.Uploader, jsonArr(merged.Models), ptr(merged.Duration), ptr(merged.Width), ptr(merged.Height),
		merged.Ext, merged.Filename, db.rel(merged.Thumbnail), merged.ThumbnailURL, merged.WebpageURL, merged.UploadDate, ptr(merged.ViewCount), ptr(merged.LikeCount), jsonArr(merged.Tags), jsonArr(merged.Categories),
		merged.Description, ptr(merged.Filesize), added, watched, b2i(merged.Favorite), jsonArr(merged.Labels), ptr(merged.Position), merged.UploaderID, jsonArr(merged.Cast),
		merged.SourcePlatform, merged.SourceHandle, m.Keep.Site, m.Keep.ID); err != nil {
		return err
	}
	removed := map[VideoKey]bool{}
	for _, o := range m.Dropped {
		res, err := tx.Exec(`INSERT OR IGNORE INTO collection_items(collection_id,site,video_id,added)
  SELECT collection_id,?,?,added FROM collection_items WHERE site=? AND video_id=?`, m.Keep.Site, m.Keep.ID, o.Site, o.ID)
		if err != nil {
			return err
		}
		if n, err := res.RowsAffected(); err == nil {
			rep.ItemsMoved += int(n)
		}
		if _, err := tx.Exec(`DELETE FROM collection_items WHERE site=? AND video_id=?`, o.Site, o.ID); err != nil {
			return err
		}
		if _, err := tx.Exec(`DELETE FROM videos WHERE site=? AND id=?`, o.Site, o.ID); err != nil {
			return err
		}
		removed[VideoKey{o.Site, o.ID}] = true
	}
	if err := pruneDuplicateGroups(tx, removed); err != nil {
		return err
	}
	return tx.Commit()
}

// pruneDuplicateGroups rewrites every review group that mentions a removed
// video: the group is deleted and, when two or more members remain, saved
// again under a fresh ID so stale screens cannot resolve it. Groups listed in
// extra are deleted outright.
func pruneDuplicateGroups(tx *sql.Tx, removed map[VideoKey]bool, extra ...int64) error {
	rows, err := tx.Query(`SELECT id,members FROM duplicate_groups`)
	if err != nil {
		return err
	}
	skip := map[int64]bool{}
	for _, id := range extra {
		skip[id] = true
	}
	ids := append([]int64(nil), extra...)
	var replacements [][]VideoKey
	for rows.Next() {
		var id int64
		var data string
		if err := rows.Scan(&id, &data); err != nil {
			rows.Close()
			return err
		}
		if skip[id] {
			continue
		}
		var keys []VideoKey
		if err := json.Unmarshal([]byte(data), &keys); err != nil {
			rows.Close()
			return err
		}
		remaining := []VideoKey{}
		for _, k := range keys {
			if !removed[k] {
				remaining = append(remaining, k)
			}
		}
		if len(remaining) != len(keys) {
			ids = append(ids, id)
			if len(remaining) >= 2 {
				replacements = append(replacements, remaining)
			}
		}
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	for _, id := range ids {
		if _, err := tx.Exec(`DELETE FROM duplicate_groups WHERE id=?`, id); err != nil {
			return err
		}
	}
	for _, keys := range replacements {
		data, err := json.Marshal(keys)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(`INSERT INTO duplicate_groups(created,members) VALUES (?,?)`, time.Now().UTC().Format(time.RFC3339), string(data)); err != nil {
			return err
		}
	}
	return nil
}

// chooseKeeper prefers the row whose flat-layout name the file carries (the
// row the vault was organised around), then the oldest row.
func chooseKeeper(rows []Video) Video {
	for _, v := range rows {
		base := strings.TrimSuffix(filepath.Base(v.Filepath), filepath.Ext(v.Filepath))
		if strings.EqualFold(base, FlatBase(v.Site, v.ID)) {
			return v
		}
	}
	keeper := rows[0]
	for _, v := range rows[1:] {
		if v.Added != "" && (keeper.Added == "" || v.Added < keeper.Added) {
			keeper = v
		}
	}
	return keeper
}

// mergeVideos fills the keeper's empty fields from the other rows and unions
// the list-valued user data. It reports which fields changed.
func mergeVideos(keeper Video, others []Video) (Video, []string) {
	var filled []string
	note := func(name string) { filled = append(filled, name) }
	str := func(name string, dst *string, src string) {
		if *dst == "" && src != "" {
			*dst = src
			note(name)
		}
	}
	num := func(name string, dst **int, src *int) {
		if *dst == nil && src != nil {
			v := *src
			*dst = &v
			note(name)
		}
	}
	list := func(name string, dst *[]string, src []string) {
		before := len(*dst)
		*dst = unionStrings(*dst, src)
		if len(*dst) != before {
			note(name)
		}
	}
	for _, o := range others {
		if keeper.TitleStatus != TitleStatusManual && o.Title != "" &&
			(keeper.Title == "" || (isFallbackTitle(keeper.Title) && !isFallbackTitle(o.Title)) || o.TitleStatus == TitleStatusManual) {
			keeper.Title, keeper.SourceTitle, keeper.TitleStatus = o.Title, o.SourceTitle, o.TitleStatus
			note("title")
		}
		str("uploader", &keeper.Uploader, o.Uploader)
		str("uploader_id", &keeper.UploaderID, o.UploaderID)
		str("ext", &keeper.Ext, o.Ext)
		str("filename", &keeper.Filename, o.Filename)
		str("thumbnail", &keeper.Thumbnail, o.Thumbnail)
		str("thumbnail_url", &keeper.ThumbnailURL, o.ThumbnailURL)
		str("webpage_url", &keeper.WebpageURL, o.WebpageURL)
		str("upload_date", &keeper.UploadDate, o.UploadDate)
		str("description", &keeper.Description, o.Description)
		str("source_platform", &keeper.SourcePlatform, o.SourcePlatform)
		str("source_handle", &keeper.SourceHandle, o.SourceHandle)
		num("duration", &keeper.Duration, o.Duration)
		num("width", &keeper.Width, o.Width)
		num("height", &keeper.Height, o.Height)
		num("view_count", &keeper.ViewCount, o.ViewCount)
		num("like_count", &keeper.LikeCount, o.LikeCount)
		if keeper.Filesize == nil && o.Filesize != nil {
			v := *o.Filesize
			keeper.Filesize = &v
			note("filesize")
		}
		list("people", &keeper.Models, o.Models)
		list("cast", &keeper.Cast, o.Cast)
		list("tags", &keeper.Tags, o.Tags)
		list("categories", &keeper.Categories, o.Categories)
		list("labels", &keeper.Labels, o.Labels)
		if o.Favorite && !keeper.Favorite {
			keeper.Favorite = true
			note("favorite")
		}
		if o.WatchedAt > keeper.WatchedAt {
			keeper.WatchedAt = o.WatchedAt
			note("watched_at")
		}
		if o.Position != nil && (keeper.Position == nil || *o.Position > *keeper.Position) {
			v := *o.Position
			keeper.Position = &v
			note("position")
		}
		if o.Added != "" && (keeper.Added == "" || o.Added < keeper.Added) {
			keeper.Added = o.Added
			note("added")
		}
	}
	sort.Strings(filled)
	return keeper, unionStrings(filled, nil)
}

func unionStrings(a, b []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range append(append([]string(nil), a...), b...) {
		if s = strings.TrimSpace(s); s != "" && !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}
