package library

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestRecycleKeepsNamesAndSupportsRollback(t *testing.T) {
	db := openTestDB(t)
	var paths []string
	for _, dir := range []string{"one", "two"} {
		folder := filepath.Join(db.root, dir)
		if err := os.Mkdir(folder, 0755); err != nil {
			t.Fatal(err)
		}
		path := filepath.Join(folder, "video.mp4")
		if err := os.WriteFile(path, []byte(dir), 0600); err != nil {
			t.Fatal(err)
		}
		paths = append(paths, path)
	}
	undo, err := db.recycleDuplicateFiles(paths, nil)
	if err != nil {
		t.Fatal(err)
	}
	manifests, err := filepath.Glob(filepath.Join(db.root, RecycleDirName, "*", "recycle-manifest.json"))
	if err != nil || len(manifests) != 1 {
		t.Fatal(manifests, err)
	}
	data, err := os.ReadFile(manifests[0])
	if err != nil {
		t.Fatal(err)
	}
	var files []recycledFile
	if err := json.Unmarshal(data, &files); err != nil || len(files) != 2 {
		t.Fatal("invalid manifest", err)
	}
	for i, item := range files {
		if item.Original != paths[i] || filepath.Base(item.Recycled) != "video.mp4" {
			t.Fatal("filename or original path lost", item)
		}
		got, err := os.ReadFile(item.Recycled)
		if err != nil || string(got) != []string{"one", "two"}[i] {
			t.Fatal("file overwritten", err)
		}
	}
	if err := undo(); err != nil {
		t.Fatal(err)
	}
	for _, path := range paths {
		if _, err := os.Stat(path); err != nil {
			t.Fatal("rollback did not restore file", err)
		}
	}
	// A later batch must not overwrite an earlier recycled copy.
	if _, err := db.recycleDuplicateFiles(paths, nil); err != nil {
		t.Fatal(err)
	}
	manifests, _ = filepath.Glob(filepath.Join(db.root, RecycleDirName, "*", "recycle-manifest.json"))
	if len(manifests) != 2 {
		t.Fatal("batch name collision")
	}
}

func TestRecycleFailurePreservesReview(t *testing.T) {
	// A removed entry whose file is shared with a kept entry is dropped without
	// moving anything; see TestSameFileRowsResolveWithoutRecycling.
	for _, mode := range []string{"missing", "outside", "blocked-folder"} {
		t.Run(mode, func(t *testing.T) {
			db := openTestDB(t)
			a, b := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}
			seedDuplicateVideo(t, db, a.Site, a.ID, "")
			seedDuplicateVideo(t, db, b.Site, b.ID, "")
			id, err := db.CreateDuplicateGroup([]VideoKey{a, b})
			if err != nil {
				t.Fatal(err)
			}
			original := filepath.Join(db.root, "Local-b.mp4")
			switch mode {
			case "missing":
				if err := os.Remove(original); err != nil {
					t.Fatal(err)
				}
			case "outside":
				original = filepath.Join(t.TempDir(), "outside.mp4")
				if err := os.WriteFile(original, []byte("outside"), 0600); err != nil {
					t.Fatal(err)
				}
				if _, err := db.sql.Exec(`UPDATE videos SET filepath=? WHERE id='b'`, original); err != nil {
					t.Fatal(err)
				}
			case "blocked-folder":
				if err := os.WriteFile(filepath.Join(db.root, RecycleDirName), []byte("blocked"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			if err := db.ResolveDuplicateGroup(id, []VideoKey{a}); err == nil {
				t.Fatal("unsafe recycle accepted")
			}
			for _, k := range []VideoKey{a, b} {
				if _, ok, err := db.VideoByKey(k.Site, k.ID); err != nil || !ok {
					t.Fatal("catalogue changed on failure", err)
				}
			}
			groups, err := db.DuplicateGroups()
			if err != nil || len(groups) != 1 {
				t.Fatal("review lost", err)
			}
			if _, err := os.Stat(filepath.Join(db.root, "Local-a.mp4")); err != nil {
				t.Fatal("keeper moved", err)
			}
			if mode != "missing" {
				if _, err := os.Stat(original); err != nil {
					t.Fatal("source moved on failure", err)
				}
			}
		})
	}
}

func TestKeepAllDoesNotCreateRecycleFolder(t *testing.T) {
	db := openTestDB(t)
	a, b := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}
	seedDuplicateVideo(t, db, a.Site, a.ID, "")
	seedDuplicateVideo(t, db, b.Site, b.ID, "")
	id, err := db.CreateDuplicateGroup([]VideoKey{a, b})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a, b}); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(db.root, RecycleDirName)); !os.IsNotExist(err) {
		t.Fatal("keep all touched recycle folder", err)
	}
}
