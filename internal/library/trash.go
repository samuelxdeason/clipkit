package library

import (
	"errors"
	"fmt"
)

// TrashMedia moves a selection into the vault's recoverable recycle folder.
// Catalogue changes and file moves are rolled back together on failure.
func (db *DB) TrashMedia(videos []VideoKey, photos []string) error {
	if len(videos)+len(photos) == 0 {
		return fmt.Errorf("select photos or videos to move to trash")
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var paths []string
	removed := map[VideoKey]bool{}
	seenPhotos := map[string]bool{}
	for _, k := range videos {
		if removed[k] {
			continue
		}
		var path string
		if err := tx.QueryRow(`SELECT COALESCE(filepath,'') FROM videos WHERE site=? AND id=?`, k.Site, k.ID).Scan(&path); err != nil {
			return fmt.Errorf("video is no longer available: %w", err)
		}
		if path == "" {
			return fmt.Errorf("video has no file path")
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
	for _, id := range photos {
		if seenPhotos[id] {
			continue
		}
		var path string
		if err := tx.QueryRow(`SELECT COALESCE(filepath,'') FROM photos WHERE id=?`, id).Scan(&path); err != nil {
			return fmt.Errorf("photo is no longer available: %w", err)
		}
		if path == "" {
			return fmt.Errorf("photo has no file path")
		}
		paths = append(paths, db.abs(path))
		if _, err := tx.Exec(`DELETE FROM photos WHERE id=?`, id); err != nil {
			return err
		}
		// A photo used as a person's cover must not leave a broken image.
		if _, err := tx.Exec(`UPDATE model_info SET cover=NULL WHERE cover=?`, path); err != nil {
			return err
		}
		seenPhotos[id] = true
	}
	if err := pruneDuplicateGroups(tx, removed); err != nil {
		return err
	}
	rows, err := tx.Query(`SELECT filepath FROM videos WHERE filepath IS NOT NULL UNION SELECT filepath FROM photos WHERE filepath IS NOT NULL`)
	if err != nil {
		return err
	}
	var protected []string
	for rows.Next() {
		var path string
		if err := rows.Scan(&path); err != nil {
			rows.Close()
			return err
		}
		if path != "" {
			protected = append(protected, db.abs(path))
		}
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	// Refuse to move media still referenced by an unselected library item.
	undo, err := db.recycleDuplicateFiles(paths, protected)
	if err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return errors.Join(err, undo())
	}
	return nil
}
