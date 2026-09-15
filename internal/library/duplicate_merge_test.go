package library

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMergeSameFileRowsKeepsEverything(t *testing.T) {
	db := openTestDB(t)
	path := filepath.Join(db.root, "local-abc.mp4")
	if err := os.WriteFile(path, []byte("bytes"), 0600); err != nil {
		t.Fatal(err)
	}
	dur, pos := 90, 12.5
	// The keeper is the row the file is named after, even though it is newer
	// and carries less metadata.
	if err := db.Upsert(Video{Site: "Local", ID: "local_abc", Title: "Alice clip", Filepath: path, Filename: "local-abc.mp4",
		Models: []string{"Alice"}, Labels: []string{"keep"}, Added: "2026-02-01 00:00:00"}); err != nil {
		t.Fatal(err)
	}
	if err := db.Upsert(Video{Site: "Local", ID: "local_old", Title: "Beach day", Filepath: filepath.Join(db.root, "LOCAL-ABC.mp4"), Filename: "local-abc.mp4",
		Models: []string{"Bob"}, Labels: []string{"keep", "summer"}, Tags: []string{"sun"}, Duration: &dur, Added: "2026-01-01 00:00:00", Favorite: true}); err != nil {
		t.Fatal(err)
	}
	if err := db.SetFavorite("Local", "local_old", true); err != nil {
		t.Fatal(err)
	}
	if _, err := db.sql.Exec(`UPDATE videos SET watched_at='2026-03-01', position=? WHERE id='local_old'`, pos); err != nil {
		t.Fatal(err)
	}
	col, err := db.CreateCollection("Summer", false)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AddToCollection(col, "Local", "local_old"); err != nil {
		t.Fatal(err)
	}
	group, err := db.CreateDuplicateGroup([]VideoKey{{"Local", "local_abc"}, {"Local", "local_old"}})
	if err != nil {
		t.Fatal(err)
	}
	// An unrelated row sharing nothing stays untouched.
	seedDuplicateVideo(t, db, "Local", "solo", "")

	rep, err := db.MergeSameFileRows(true)
	if err != nil || len(rep.Files) != 1 || rep.RowsDropped != 1 {
		t.Fatalf("dry run: %+v %v", rep, err)
	}
	if rep.Files[0].Keep.ID != "local_abc" || rep.Files[0].Dropped[0].ID != "local_old" || len(rep.Files[0].DroppedCollections[0]) != 1 {
		t.Fatalf("dry run plan: %+v", rep.Files[0])
	}
	if _, ok, _ := db.VideoByKey("Local", "local_old"); !ok {
		t.Fatal("dry run changed the catalogue")
	}

	rep, err = db.MergeSameFileRows(false)
	if err != nil || rep.RowsDropped != 1 || rep.ItemsMoved != 1 {
		t.Fatalf("apply: %+v %v", rep, err)
	}
	v, ok, err := db.VideoByKey("Local", "local_abc")
	if err != nil || !ok {
		t.Fatal("keeper lost", err)
	}
	if v.Title != "Beach day" || !v.Favorite || v.Duration == nil || *v.Duration != dur || v.WatchedAt != "2026-03-01" || v.Position == nil || *v.Position != pos || v.Added != "2026-01-01 00:00:00" {
		t.Fatalf("scalar fields not merged: %+v", v)
	}
	if len(v.Models) != 2 || len(v.Labels) != 2 || len(v.Tags) != 1 {
		t.Fatalf("lists not merged: people %v labels %v tags %v", v.Models, v.Labels, v.Tags)
	}
	if _, ok, _ := db.VideoByKey("Local", "local_old"); ok {
		t.Fatal("dropped row still present")
	}
	items, err := db.VideosByCollection(col)
	if err != nil || len(items) != 1 || items[0].ID != "local_abc" {
		t.Fatalf("collection membership not carried over: %+v %v", items, err)
	}
	groups, err := db.DuplicateGroups()
	if err != nil || len(groups) != 0 {
		t.Fatalf("review group %d should be gone: %+v %v", group, groups, err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatal("file moved", err)
	}
	if _, err := os.Stat(filepath.Join(db.root, RecycleDirName)); !os.IsNotExist(err) {
		t.Fatal("recycle folder created")
	}
	if rep, err := db.MergeSameFileRows(true); err != nil || len(rep.Files) != 0 {
		t.Fatalf("second pass should find nothing: %+v %v", rep, err)
	}
}

func TestMergeSameFileRowsRespectsManualTitle(t *testing.T) {
	db := openTestDB(t)
	path := filepath.Join(db.root, "local-x.mp4")
	if err := os.WriteFile(path, []byte("bytes"), 0600); err != nil {
		t.Fatal(err)
	}
	for _, v := range []Video{
		{Site: "Local", ID: "local_x", Title: "My name", TitleStatus: TitleStatusManual, Filepath: path, Filename: "local-x.mp4", Added: "2026-02-01 00:00:00"},
		{Site: "Local", ID: "local_y", Title: "Source name", Filepath: path, Filename: "local-x.mp4", Added: "2026-01-01 00:00:00"},
	} {
		if err := db.Upsert(v); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := db.sql.Exec(`UPDATE videos SET title_status=? WHERE id='local_x'`, TitleStatusManual); err != nil {
		t.Fatal(err)
	}
	if _, err := db.MergeSameFileRows(false); err != nil {
		t.Fatal(err)
	}
	v, _, err := db.VideoByKey("Local", "local_x")
	if err != nil || v.Title != "My name" {
		t.Fatalf("manual title overwritten: %+v %v", v, err)
	}
}
