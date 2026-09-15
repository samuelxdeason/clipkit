package library

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDuplicateReview(t *testing.T) {
	db := openTestDB(t)
	a, b, c := VideoKey{"Local", "same"}, VideoKey{"Other", "same"}, VideoKey{"Local", "third"}
	for _, k := range []VideoKey{a, b, c} {
		seedDuplicateVideo(t, db, k.Site, k.ID, "")
	}
	if _, err := db.CreateDuplicateGroup([]VideoKey{a, a}); err == nil {
		t.Fatal("accepted repeated video")
	}
	if _, err := db.CreateDuplicateGroup([]VideoKey{a, {"Local", "missing"}}); err == nil {
		t.Fatal("accepted missing video")
	}
	id, err := db.CreateDuplicateGroup([]VideoKey{a, b, c})
	if err != nil {
		t.Fatal(err)
	}
	groups, err := db.DuplicateGroups()
	if err != nil || len(groups) != 1 || len(groups[0].Videos) != 3 {
		t.Fatalf("groups: %+v %v", groups, err)
	}
	if err := db.ResolveDuplicateGroup(id, nil); err == nil {
		t.Fatal("accepted empty keep list")
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{{"Local", "missing"}}); err == nil {
		t.Fatal("accepted foreign keeper")
	}
	col, err := db.CreateCollection("Test", false)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AddToCollection(col, b.Site, b.ID); err != nil {
		t.Fatal(err)
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a, c}); err != nil {
		t.Fatal(err)
	}
	for _, k := range []VideoKey{a, c} {
		if _, ok, err := db.VideoByKey(k.Site, k.ID); err != nil || !ok {
			t.Fatalf("keeper lost: %v %v", k, err)
		}
	}
	if _, ok, err := db.VideoByKey(b.Site, b.ID); err != nil || ok {
		t.Fatalf("duplicate still present: %v", err)
	}
	items, err := db.VideosByCollection(col)
	if err != nil || len(items) != 0 {
		t.Fatalf("collection not cleaned: %v", err)
	}
	groups, err = db.DuplicateGroups()
	if err != nil || len(groups) != 0 {
		t.Fatalf("queue not cleared: %v", err)
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a}); err == nil {
		t.Fatal("accepted stale review")
	}
	id, err = db.CreateDuplicateGroup([]VideoKey{a, c})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a, c}); err != nil {
		t.Fatal(err)
	}
	for _, k := range []VideoKey{a, c} {
		if _, ok, err := db.VideoByKey(k.Site, k.ID); err != nil || !ok {
			t.Fatal("keep all removed a video")
		}
	}
}

func TestDuplicateQueuePrivacy(t *testing.T) {
	for _, locked := range []bool{false, true} {
		t.Run(map[bool]string{false: "hidden", true: "locked"}[locked], func(t *testing.T) {
			db := openTestDB(t)
			a, b := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}
			seedDuplicateVideo(t, db, a.Site, a.ID, "")
			seedDuplicateVideo(t, db, b.Site, b.ID, "")
			id, err := db.CreateDuplicateGroup([]VideoKey{a, b})
			if err != nil {
				t.Fatal(err)
			}
			col, err := db.CreateCollection("Private", !locked)
			if err != nil {
				t.Fatal(err)
			}
			if locked {
				if err := db.SetCollectionLocked(col, true); err != nil {
					t.Fatal(err)
				}
			}
			if err := db.AddToCollection(col, a.Site, a.ID); err != nil {
				t.Fatal(err)
			}
			groups, err := db.DuplicateGroups()
			if err != nil || len(groups) != 0 {
				t.Fatalf("private group leaked: %+v %v", groups, err)
			}
			if _, err := db.CreateDuplicateGroup([]VideoKey{a, b}); err == nil {
				t.Fatal("accepted private video")
			}
			if err := db.ResolveDuplicateGroup(id, []VideoKey{b}); err == nil {
				t.Fatal("removed private video")
			}
			if _, ok, _ := db.VideoByKey(a.Site, a.ID); !ok {
				t.Fatal("private video lost")
			}
		})
	}
}

func TestDuplicateOverlap(t *testing.T) {
	db := openTestDB(t)
	a, b, c, d := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}, VideoKey{"Local", "c"}, VideoKey{"Local", "d"}
	for _, k := range []VideoKey{a, b, c, d} {
		seedDuplicateVideo(t, db, k.Site, k.ID, "")
	}
	first, err := db.CreateDuplicateGroup([]VideoKey{a, b})
	if err != nil {
		t.Fatal(err)
	}
	overlap, err := db.CreateDuplicateGroup([]VideoKey{b, c, d})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.ResolveDuplicateGroup(first, []VideoKey{a}); err != nil {
		t.Fatal(err)
	}
	groups, err := db.DuplicateGroups()
	if err != nil || len(groups) != 1 || len(groups[0].Videos) != 2 {
		t.Fatalf("remaining comparison lost: %+v %v", groups, err)
	}
	if groups[0].ID == overlap {
		t.Fatal("stale review ID reused")
	}
	if err := db.ResolveDuplicateGroup(overlap, []VideoKey{c}); err == nil {
		t.Fatal("stale comparison accepted")
	}
}

func seedDuplicateVideo(t *testing.T, db *DB, site, id, model string) {
	t.Helper()
	path := filepath.Join(db.root, site+"-"+id+".mp4")
	if err := os.WriteFile(path, []byte(id), 0600); err != nil {
		t.Fatal(err)
	}
	if err := db.Upsert(Video{Site: site, ID: id, Title: id, Filepath: path, Filename: filepath.Base(path)}); err != nil {
		t.Fatal(err)
	}
}
