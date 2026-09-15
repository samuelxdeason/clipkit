package library

import (
	"encoding/json"
	"fmt"
	"time"
)

type VideoKey struct {
	Site string `json:"site"`
	ID   string `json:"id"`
}

type DuplicateGroup struct {
	ID      int64   `json:"id"`
	Created string  `json:"created"`
	Videos  []Video `json:"videos"`
}

const duplicatesSchema = `CREATE TABLE IF NOT EXISTS duplicate_groups (
 id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT NOT NULL, members TEXT NOT NULL
);`

func (db *DB) CreateDuplicateGroup(keys []VideoKey) (int64, error) {
	unique := map[VideoKey]bool{}
	for _, k := range keys {
		unique[k] = true
	}
	if len(unique) < 2 || len(unique) != len(keys) {
		return 0, fmt.Errorf("select at least two distinct videos")
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	for _, k := range keys {
		var n int
		err = tx.QueryRow(`SELECT COUNT(*) FROM videos WHERE site=? AND id=? AND `+notHidden+` AND NOT EXISTS (SELECT 1 FROM collection_items ci JOIN collections c ON c.id=ci.collection_id WHERE c.locked=1 AND ci.site=videos.site AND ci.video_id=videos.id)`, k.Site, k.ID).Scan(&n)
		if err != nil {
			return 0, err
		}
		if n != 1 {
			return 0, fmt.Errorf("video is missing or belongs to a private collection")
		}
	}
	b, err := json.Marshal(keys)
	if err != nil {
		return 0, err
	}
	res, err := tx.Exec(`INSERT INTO duplicate_groups(created,members) VALUES (?,?)`, time.Now().UTC().Format(time.RFC3339), string(b))
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return id, tx.Commit()
}

func (db *DB) DuplicateGroups() ([]DuplicateGroup, error) {
	rows, err := db.sql.Query(`SELECT id,created,members FROM duplicate_groups ORDER BY id`)
	if err != nil {
		return nil, err
	}
	type stored struct {
		group DuplicateGroup
		keys  []VideoKey
	}
	var saved []stored
	for rows.Next() {
		var s stored
		var members string
		if err := rows.Scan(&s.group.ID, &s.group.Created, &members); err != nil {
			rows.Close()
			return nil, err
		}
		if err := json.Unmarshal([]byte(members), &s.keys); err != nil {
			rows.Close()
			return nil, err
		}
		saved = append(saved, s)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	out := []DuplicateGroup{}
	for _, s := range saved {
		private := false
		for _, k := range s.keys {
			vs, err := db.query(`WHERE site=? AND id=? AND `+notHidden+` AND NOT EXISTS (SELECT 1 FROM collection_items ci JOIN collections c ON c.id=ci.collection_id WHERE c.locked=1 AND ci.site=videos.site AND ci.video_id=videos.id)`, k.Site, k.ID)
			if err != nil {
				return nil, err
			}
			if len(vs) == 0 {
				private = true
				break
			}
			s.group.Videos = append(s.group.Videos, vs[0])
		}
		if !private {
			out = append(out, s.group)
		}
	}
	return out, nil
}

// ResolveDuplicateGroup moves discarded media to the vault recycle folder before
// committing the catalogue decision. Failed commits restore the original paths.
func (db *DB) ResolveDuplicateGroup(id int64, keep []VideoKey) error {
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var raw string
	if err := tx.QueryRow(`SELECT members FROM duplicate_groups WHERE id=?`, id).Scan(&raw); err != nil {
		return fmt.Errorf("review group is no longer available: %w", err)
	}
	var members []VideoKey
	if err := json.Unmarshal([]byte(raw), &members); err != nil {
		return err
	}
	retained := map[VideoKey]bool{}
	known := map[VideoKey]bool{}
	for _, k := range members {
		known[k] = true
	}
	for _, k := range keep {
		if !known[k] || retained[k] {
			return fmt.Errorf("invalid keep selection")
		}
		retained[k] = true
	}
	if len(retained) == 0 {
		return fmt.Errorf("choose at least one video to keep")
	}
	for _, k := range members {
		var n int
		if err := tx.QueryRow(`SELECT COUNT(*) FROM videos WHERE site=? AND id=? AND `+notHidden+` AND NOT EXISTS (SELECT 1 FROM collection_items ci JOIN collections c ON c.id=ci.collection_id WHERE c.locked=1 AND ci.site=videos.site AND ci.video_id=videos.id)`, k.Site, k.ID).Scan(&n); err != nil {
			return err
		}
		if n != 1 {
			return fmt.Errorf("group changed or contains private videos; refresh the queue")
		}
	}
	removed := map[VideoKey]bool{}
	var paths []string
	for _, k := range members {
		if !retained[k] {
			var path string
			if err := tx.QueryRow(`SELECT COALESCE(filepath,'') FROM videos WHERE site=? AND id=?`, k.Site, k.ID).Scan(&path); err != nil {
				return err
			}
			paths = append(paths, db.abs(path))
			if _, err := tx.Exec(`DELETE FROM collection_items WHERE site=? AND video_id=?`, k.Site, k.ID); err != nil {
				return err
			}
			if _, err := tx.Exec(`DELETE FROM videos WHERE site=? AND id=?`, k.Site, k.ID); err != nil {
				return err
			}
			removed[k] = true
		}
	}
	// Replace overlapping reviews with fresh IDs so stale screens cannot resolve
	// them, while preserving comparisons between their remaining videos.
	if err := pruneDuplicateGroups(tx, removed, id); err != nil {
		return err
	}
	if len(paths) == 0 {
		return tx.Commit()
	}
	// Protect files still referenced by any other catalogue entry, including photos.
	remaining, err := tx.Query(`SELECT filepath FROM videos WHERE filepath IS NOT NULL UNION SELECT filepath FROM photos WHERE filepath IS NOT NULL`)
	if err != nil {
		return err
	}
	var protected []string
	for remaining.Next() {
		var path string
		if err := remaining.Scan(&path); err != nil {
			remaining.Close()
			return err
		}
		if path != "" {
			protected = append(protected, db.abs(path))
		}
	}
	err = remaining.Err()
	remaining.Close()
	if err != nil {
		return err
	}
	// A removed entry whose file is still catalogued under a kept entry is a
	// duplicate catalogue row, not a duplicate file: drop the row, keep the file.
	paths = unreferencedPaths(paths, protected)
	if len(paths) == 0 {
		return tx.Commit()
	}
	undo, err := db.recycleDuplicateFiles(paths, protected)
	if err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		if restoreErr := undo(); restoreErr != nil {
			return fmt.Errorf("catalogue save failed: %v; %w", err, restoreErr)
		}
		return err
	}
	return nil
}

// unreferencedPaths drops every path that another catalogue entry still uses.
func unreferencedPaths(paths, protected []string) []string {
	used := map[string]bool{}
	for _, p := range protected {
		used[normalizePath(p)] = true
	}
	var out []string
	for _, p := range paths {
		if !used[normalizePath(p)] {
			out = append(out, p)
		}
	}
	return out
}
