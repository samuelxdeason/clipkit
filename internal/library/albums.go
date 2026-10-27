package library

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Collections retain their IDs and video memberships as they become mixed albums.
func (db *DB) migrateAlbums() error {
	if _, err := db.sql.Exec(`ALTER TABLE photos ADD COLUMN person_assigned INTEGER NOT NULL DEFAULT 0`); err != nil && !strings.Contains(err.Error(), "duplicate column") {
		return err
	}
	if _, err := db.sql.Exec(`ALTER TABLE collections ADD COLUMN parent_id INTEGER NOT NULL DEFAULT 0`); err != nil && !strings.Contains(err.Error(), "duplicate column") {
		return err
	}
	_, err := db.sql.Exec(`
CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id);
CREATE TABLE IF NOT EXISTS collection_photos (
 collection_id INTEGER NOT NULL, photo_id TEXT NOT NULL, added TEXT NOT NULL,
 PRIMARY KEY(collection_id,photo_id)
);
CREATE INDEX IF NOT EXISTS idx_collection_photos_photo ON collection_photos(photo_id);
CREATE TABLE IF NOT EXISTS imported_photo_albums (name TEXT PRIMARY KEY, collection_id INTEGER NOT NULL);
CREATE VIEW IF NOT EXISTS collection_ancestors AS
 WITH RECURSIVE ancestors(album_id,ancestor_id) AS (
 SELECT id,id FROM collections
 UNION SELECT a.album_id,c.parent_id FROM ancestors a JOIN collections c ON c.id=a.ancestor_id WHERE c.parent_id<>0
 ) SELECT * FROM ancestors;`)
	if err != nil {
		return err
	}
	// Import legacy photo album labels once. Removing memberships later must
	// remain a user choice, including across application restarts.
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var migrated int
	if err := tx.QueryRow(`SELECT COUNT(*) FROM meta WHERE key='mixed-albums-v1'`).Scan(&migrated); err != nil {
		return err
	}
	if migrated == 0 {
		rows, err := tx.Query(`SELECT DISTINCT album FROM photos WHERE COALESCE(album,'')<>''`)
		if err != nil {
			return err
		}
		var names []string
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				rows.Close()
				return err
			}
			names = append(names, name)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return err
		}
		for _, name := range names {
			id, err := importedPhotoAlbum(tx, name)
			if err != nil {
				return err
			}
			if _, err := tx.Exec(`INSERT OR IGNORE INTO collection_photos(collection_id,photo_id,added) SELECT ?,id,COALESCE(added,'') FROM photos WHERE album=?`, id, name); err != nil {
				return err
			}
		}
		if _, err := tx.Exec(`INSERT INTO meta(key,value) VALUES('mixed-albums-v1','1')`); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func importedPhotoAlbum(tx *sql.Tx, name string) (int64, error) {
	var id int64
	err := tx.QueryRow(`SELECT c.id FROM imported_photo_albums m JOIN collections c ON c.id=m.collection_id WHERE m.name=?`, name).Scan(&id)
	if err == nil {
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, err
	}
	r, err := tx.Exec(`INSERT INTO collections(name,created) VALUES(?,?)`, name, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		return 0, err
	}
	id, err = r.LastInsertId()
	if err != nil {
		return 0, err
	}
	_, err = tx.Exec(`INSERT INTO imported_photo_albums(name,collection_id) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET collection_id=excluded.collection_id`, name, id)
	return id, err
}

const photoNotHidden = `NOT EXISTS (SELECT 1 FROM collection_photos cp
 JOIN collection_ancestors a ON a.album_id=cp.collection_id
 JOIN collections c ON c.id=a.ancestor_id WHERE cp.photo_id=photos.id AND c.hidden=1)`

func requireAlbum(tx *sql.Tx, id int64) error {
	var found int64
	if err := tx.QueryRow(`SELECT id FROM collections WHERE id=?`, id).Scan(&found); err != nil {
		return fmt.Errorf("album is no longer available: %w", err)
	}
	return nil
}

func (db *DB) CreateAlbum(name string, parent int64) (int64, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, fmt.Errorf("give the collection a name")
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	if parent != 0 {
		if err := requireAlbum(tx, parent); err != nil {
			return 0, err
		}
	}
	r, err := tx.Exec(`INSERT INTO collections(name,parent_id,created) VALUES(?,?,?)`, name, parent, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		return 0, err
	}
	id, err := r.LastInsertId()
	if err != nil {
		return 0, err
	}
	return id, tx.Commit()
}

func (db *DB) MoveAlbum(id, parent int64) error {
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := requireAlbum(tx, id); err != nil {
		return err
	}
	if parent != 0 {
		if err := requireAlbum(tx, parent); err != nil {
			return err
		}
		var cycle int
		if err := tx.QueryRow(`SELECT COUNT(*) FROM collection_ancestors WHERE album_id=? AND ancestor_id=?`, parent, id).Scan(&cycle); err != nil {
			return err
		}
		if cycle != 0 {
			return fmt.Errorf("a folder cannot be moved inside itself or one of its subfolders")
		}
	}
	if _, err := tx.Exec(`UPDATE collections SET parent_id=? WHERE id=?`, parent, id); err != nil {
		return err
	}
	return tx.Commit()
}

// UpdateAlbumItems changes memberships atomically; media files are never moved.
func (db *DB) UpdateAlbumItems(id int64, videos []VideoKey, photos []string, remove bool) error {
	if len(videos)+len(photos) == 0 {
		return fmt.Errorf("select media first")
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := updateCollectionItems(tx, id, videos, photos, remove); err != nil {
		return err
	}
	return tx.Commit()
}

func updateCollectionItems(tx *sql.Tx, id int64, videos []VideoKey, photos []string, remove bool) error {
	var err error
	if err := requireAlbum(tx, id); err != nil {
		return err
	}
	added := time.Now().Format("2006-01-02 15:04:05")
	for _, v := range videos {
		var n int
		if err := tx.QueryRow(`SELECT 1 FROM videos WHERE site=? AND id=?`, v.Site, v.ID).Scan(&n); err != nil {
			return fmt.Errorf("video is no longer available: %w", err)
		}
		if remove {
			_, err = tx.Exec(`DELETE FROM collection_items WHERE collection_id=? AND site=? AND video_id=?`, id, v.Site, v.ID)
		} else {
			_, err = tx.Exec(`INSERT OR IGNORE INTO collection_items(collection_id,site,video_id,added) VALUES(?,?,?,?)`, id, v.Site, v.ID, added)
		}
		if err != nil {
			return err
		}
	}
	for _, p := range photos {
		var n int
		if err := tx.QueryRow(`SELECT 1 FROM photos WHERE id=?`, p).Scan(&n); err != nil {
			return fmt.Errorf("photo is no longer available: %w", err)
		}
		if remove {
			_, err = tx.Exec(`DELETE FROM collection_photos WHERE collection_id=? AND photo_id=?`, id, p)
		} else {
			_, err = tx.Exec(`INSERT OR IGNORE INTO collection_photos(collection_id,photo_id,added) VALUES(?,?,?)`, id, p, added)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// TransferCollectionItems moves memberships together in a single transaction.
// Source zero means the main library: add membership without removing others.
// Copy keeps the source membership too; neither operation copies media bytes.
func (db *DB) TransferCollectionItems(source, destination int64, videos []VideoKey, photos []string, copyItems bool) error {
	if destination <= 0 || source < 0 || source == destination {
		return fmt.Errorf("choose a different destination folder")
	}
	if len(videos)+len(photos) == 0 {
		return fmt.Errorf("select photos or videos first")
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := requireAlbum(tx, destination); err != nil {
		return err
	}
	var locked int
	if err := tx.QueryRow(`SELECT COUNT(*) FROM collection_ancestors a JOIN collections c ON c.id=a.ancestor_id WHERE a.album_id=? AND c.locked=1`, destination).Scan(&locked); err != nil {
		return err
	}
	if locked > 0 {
		return fmt.Errorf("the destination folder is locked")
	}
	if source > 0 {
		if err := requireAlbum(tx, source); err != nil {
			return err
		}
		for _, v := range videos {
			var found int
			if err := tx.QueryRow(`SELECT 1 FROM collection_items WHERE collection_id=? AND site=? AND video_id=?`, source, v.Site, v.ID).Scan(&found); err != nil {
				return fmt.Errorf("a selected video is no longer in the source folder: %w", err)
			}
		}
		for _, p := range photos {
			var found int
			if err := tx.QueryRow(`SELECT 1 FROM collection_photos WHERE collection_id=? AND photo_id=?`, source, p).Scan(&found); err != nil {
				return fmt.Errorf("a selected photo is no longer in the source folder: %w", err)
			}
		}
	}
	if err := updateCollectionItems(tx, destination, videos, photos, false); err != nil {
		return err
	}
	if source > 0 && !copyItems {
		if err := updateCollectionItems(tx, source, videos, photos, true); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (db *DB) PhotosByCollection(id int64) ([]Photo, error) {
	rows, err := db.sql.Query(`SELECT p.id,COALESCE(p.model,''),COALESCE(p.album,''),COALESCE(p.filepath,''),COALESCE(p.filename,''),COALESCE(p.added,'') FROM photos p JOIN collection_photos cp ON cp.photo_id=p.id WHERE cp.collection_id=? ORDER BY cp.added DESC,p.id`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []Photo{}
	for rows.Next() {
		var p Photo
		if err := rows.Scan(&p.ID, &p.Model, &p.Album, &p.Filepath, &p.Filename, &p.Added); err != nil {
			return nil, err
		}
		p.Filepath = db.abs(p.Filepath)
		result = append(result, p)
	}
	return result, rows.Err()
}

func (db *DB) AssignPhotos(ids []string, person string) error {
	if len(ids) == 0 {
		return fmt.Errorf("select photos first")
	}
	person = strings.TrimSpace(person)
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if person != "" {
		var n int
		if err := tx.QueryRow(`SELECT 1 FROM model_info WHERE name=?`, person).Scan(&n); err != nil {
			return fmt.Errorf("choose an existing person: %w", err)
		}
	}
	for _, id := range ids {
		r, err := tx.Exec(`UPDATE photos SET model=?,person_assigned=1 WHERE id=?`, person, id)
		if err != nil {
			return err
		}
		n, err := r.RowsAffected()
		if err != nil {
			return err
		}
		if n != 1 {
			return fmt.Errorf("photo is no longer available: %s", id)
		}
	}
	return tx.Commit()
}
