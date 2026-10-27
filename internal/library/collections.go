package library

import (
	"fmt"
	"strings"
	"time"
)

// Collection is a user-defined grouping of videos. A hidden collection's members
// are kept out of the normal library/search/model views (see notHidden); a locked
// collection is meant to require a gate in the UI before its page opens. Both
// flags exist to keep sensitive content (e.g. adult media) separate and private.
type Collection struct {
	ID              int64    `json:"id"`
	Name            string   `json:"name"`
	Hidden          bool     `json:"hidden"`
	Locked          bool     `json:"locked"`
	Count           int      `json:"count"` // number of member videos
	Created         string   `json:"created"`
	ParentID        int64    `json:"parentId"`
	PhotoCount      int      `json:"photoCount"`
	VideoCount      int      `json:"videoCount"`
	AlbumCount      int      `json:"albumCount"`
	InheritedHidden bool     `json:"inheritedHidden"`
	InheritedLocked bool     `json:"inheritedLocked"`
	Covers          []string `json:"covers"`
}

// Collections lists every collection with its member count, newest first.
func (db *DB) Collections() ([]Collection, error) {
	rows, err := db.sql.Query(`
SELECT c.id, c.name, c.hidden, c.locked, COALESCE(c.created,''),
       (SELECT COUNT(*) FROM collection_items ci JOIN videos v ON v.site=ci.site AND v.id=ci.video_id WHERE ci.collection_id = c.id),
       c.parent_id,
       (SELECT COUNT(*) FROM collection_photos cp JOIN photos p ON p.id=cp.photo_id WHERE cp.collection_id=c.id),
       (SELECT COUNT(*) FROM collections child WHERE child.parent_id=c.id),
       EXISTS(SELECT 1 FROM collection_ancestors a JOIN collections p ON p.id=a.ancestor_id WHERE a.album_id=c.id AND p.id<>c.id AND p.hidden=1),
       EXISTS(SELECT 1 FROM collection_ancestors a JOIN collections p ON p.id=a.ancestor_id WHERE a.album_id=c.id AND p.id<>c.id AND p.locked=1)
FROM collections c
ORDER BY c.created DESC, c.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Collection
	for rows.Next() {
		var c Collection
		var hidden, locked int
		if err := rows.Scan(&c.ID, &c.Name, &hidden, &locked, &c.Created, &c.VideoCount, &c.ParentID, &c.PhotoCount, &c.AlbumCount, &c.InheritedHidden, &c.InheritedLocked); err != nil {
			return nil, err
		}
		c.Hidden, c.Locked = hidden == 1, locked == 1
		c.Count = c.VideoCount + c.PhotoCount
		out = append(out, c)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	for i := range out {
		out[i].Covers = []string{}
		if out[i].Locked || out[i].InheritedLocked || out[i].Hidden || out[i].InheritedHidden {
			continue
		}
		covers, err := db.sql.Query(`SELECT path FROM (
 SELECT p.filepath AS path FROM collection_photos cp JOIN photos p ON p.id=cp.photo_id WHERE cp.collection_id=? AND `+strings.ReplaceAll(photoNotHidden, "photos.id", "p.id")+`
 UNION ALL SELECT v.thumbnail AS path FROM collection_items ci JOIN videos v ON v.site=ci.site AND v.id=ci.video_id WHERE ci.collection_id=? AND `+strings.ReplaceAll(notHidden, "videos.", "v.")+`
 ) WHERE path IS NOT NULL AND path<>'' LIMIT 4`, out[i].ID, out[i].ID)
		if err != nil {
			return nil, err
		}
		for covers.Next() {
			var path string
			if err := covers.Scan(&path); err != nil {
				covers.Close()
				return nil, err
			}
			out[i].Covers = append(out[i].Covers, db.abs(path))
		}
		err = covers.Err()
		covers.Close()
		if err != nil {
			return nil, err
		}
	}
	return out, nil
}

// CreateCollection makes a new collection and returns its id.
func (db *DB) CreateCollection(name string, hidden bool) (int64, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, fmt.Errorf("give the album a name")
	}
	res, err := db.sql.Exec(`INSERT INTO collections (name, hidden, created) VALUES (?,?,?)`,
		name, b2i(hidden), time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// RenameCollection changes a collection's name.
func (db *DB) RenameCollection(id int64, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("give the album a name")
	}
	_, err := db.sql.Exec(`UPDATE collections SET name=? WHERE id=?`, name, id)
	return err
}

// SetCollectionHidden toggles whether a collection's members hide from default views.
func (db *DB) SetCollectionHidden(id int64, hidden bool) error {
	_, err := db.sql.Exec(`UPDATE collections SET hidden=? WHERE id=?`, b2i(hidden), id)
	return err
}

// SetCollectionLocked toggles a collection's locked flag.
func (db *DB) SetCollectionLocked(id int64, locked bool) error {
	_, err := db.sql.Exec(`UPDATE collections SET locked=? WHERE id=?`, b2i(locked), id)
	return err
}

// DeleteCollection removes a collection and its memberships (the videos remain).
func (db *DB) DeleteCollection(id int64) error {
	tx, err := db.sql.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := requireAlbum(tx, id); err != nil {
		return err
	}
	// Keep subalbums and all media when deleting their container.
	for _, query := range []string{`UPDATE collections SET parent_id=(SELECT parent_id FROM collections WHERE id=?) WHERE parent_id=?`, `DELETE FROM collection_items WHERE collection_id=?`, `DELETE FROM collection_photos WHERE collection_id=?`, `DELETE FROM collections WHERE id=?`} {
		args := []any{id}
		if strings.HasPrefix(query, "UPDATE") {
			args = append(args, id)
		}
		if _, err := tx.Exec(query, args...); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// AddToCollection adds a video (site+id) to a collection. Idempotent.
func (db *DB) AddToCollection(id int64, site, videoID string) error {
	_, err := db.sql.Exec(`
INSERT INTO collection_items (collection_id, site, video_id, added) VALUES (?,?,?,?)
ON CONFLICT(collection_id, site, video_id) DO NOTHING`,
		id, site, videoID, time.Now().Format("2006-01-02 15:04:05"))
	return err
}

// RemoveFromCollection drops a video from a collection.
func (db *DB) RemoveFromCollection(id int64, site, videoID string) error {
	_, err := db.sql.Exec(`DELETE FROM collection_items WHERE collection_id=? AND site=? AND video_id=?`,
		id, site, videoID)
	return err
}

// VideosByCollection returns a collection's members, newest-added first. This
// deliberately omits the notHidden filter: opening a hidden collection is how you
// view the content you've chosen to keep out of the normal library.
func (db *DB) VideosByCollection(id int64) ([]Video, error) {
	return db.query(`
JOIN collection_items ci ON ci.site = videos.site AND ci.video_id = videos.id
WHERE ci.collection_id = ? ORDER BY ci.added DESC, videos.id`, id)
}

// CollectionsForVideo returns the ids of collections a video belongs to (so the
// UI can show/toggle membership).
func (db *DB) CollectionsForVideo(site, videoID string) ([]int64, error) {
	rows, err := db.sql.Query(`SELECT collection_id FROM collection_items WHERE site=? AND video_id=?`, site, videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []int64
	for rows.Next() {
		var cid int64
		if err := rows.Scan(&cid); err != nil {
			return nil, err
		}
		out = append(out, cid)
	}
	return out, rows.Err()
}
