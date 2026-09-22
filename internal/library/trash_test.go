package library

import (
	"os"
	"path/filepath"
	"testing"
)

func TestTrashMixedSelection(t *testing.T) {
	db := openTestDB(t)
	key := VideoKey{"Local", "video"}
	seedDuplicateVideo(t, db, key.Site, key.ID, "")
	photo := filepath.Join(db.root, "photo.jpg")
	if err := os.WriteFile(photo, []byte("photo bytes"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := db.AddPhoto(Photo{ID: "photo", Filepath: photo}); err != nil {
		t.Fatal(err)
	}
	coll, err := db.CreateCollection("Test", false)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AddToCollection(coll, key.Site, key.ID); err != nil {
		t.Fatal(err)
	}
	// Repeated IDs are harmless and must not move a file twice.
	if err := db.TrashMedia([]VideoKey{key, key}, []string{"photo", "photo"}); err != nil {
		t.Fatal(err)
	}
	for _, table := range []string{"videos", "photos", "collection_items"} {
		var count int
		if err := db.sql.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&count); err != nil || count != 0 {
			t.Fatalf("%s: %d %v", table, count, err)
		}
	}
	if _, err := os.Stat(photo); !os.IsNotExist(err) {
		t.Fatal("photo not moved", err)
	}
	matches, err := filepath.Glob(filepath.Join(db.root, RecycleDirName, "*", "photo.jpg"))
	if err != nil || len(matches) != 1 {
		t.Fatal(matches, err)
	}
	data, err := os.ReadFile(matches[0])
	if err != nil || string(data) != "photo bytes" {
		t.Fatal("photo damaged", err)
	}
}

func TestTrashFailureLeavesSelectionIntact(t *testing.T) {
	for _, mode := range []string{"missing", "outside", "shared", "stale"} {
		t.Run(mode, func(t *testing.T) {
			db := openTestDB(t)
			key := VideoKey{"Local", "video"}
			seedDuplicateVideo(t, db, key.Site, key.ID, "")
			path := filepath.Join(db.root, "photo.jpg")
			if mode == "outside" {
				path = filepath.Join(t.TempDir(), "photo.jpg")
			}
			if mode != "missing" {
				if err := os.WriteFile(path, []byte("photo"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			if err := db.AddPhoto(Photo{ID: "photo", Filepath: path}); err != nil {
				t.Fatal(err)
			}
			if mode == "shared" {
				if err := db.AddPhoto(Photo{ID: "keeper", Filepath: path}); err != nil {
					t.Fatal(err)
				}
			}
			ids := []string{"photo"}
			if mode == "stale" {
				ids = append(ids, "unknown")
			}
			if err := db.TrashMedia([]VideoKey{key}, ids); err == nil {
				t.Fatal("expected rejection")
			}
			if !db.PhotoExists("photo") {
				t.Fatal("photo row lost")
			}
			var count int
			if err := db.sql.QueryRow(`SELECT COUNT(*) FROM videos`).Scan(&count); err != nil || count != 1 {
				t.Fatal("video row lost", err)
			}
			if _, err := os.Stat(filepath.Join(db.root, "Local-video.mp4")); err != nil {
				t.Fatal("video file lost", err)
			}
		})
	}
}

func TestTrashEmptySelection(t *testing.T) {
	if err := openTestDB(t).TrashMedia(nil, nil); err == nil {
		t.Fatal("empty selection accepted")
	}
}
