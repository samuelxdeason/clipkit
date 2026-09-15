package library

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFindDuplicateCandidates(t *testing.T) {
	db := openTestDB(t)
	dur, size := 125, int64(50_000_000)
	other, otherSize := 300, int64(70_000_000)
	third := 301
	seed := func(site, id, title, url string, d *int, s *int64) {
		t.Helper()
		if err := db.Upsert(Video{ID: id, Site: site, Title: title, WebpageURL: url, Duration: d, Filesize: s, Added: "2026-01-01 00:00:00"}); err != nil {
			t.Fatal(err)
		}
	}
	seed("Local", "a", "Beach Day - Part 1", "", &dur, &size)
	seed("Local", "b", "beach day part 1!", "", &dur, &otherSize) // same title + duration as a
	seed("Local", "c", "Something Else", "", &dur, &size)         // same bytes + duration as a
	seed("Site", "d", "Different", "https://www.example.com/v/1/", &other, &otherSize)
	seed("Site", "e", "Unrelated", "http://example.com/v/1", &other, nil)             // same URL + duration as d
	seed("Site", "e2", "Second video in post", "http://example.com/v/1", &third, nil) // same URL, other duration
	seed("Local", "f", "Video", "", &dur, nil)                                        // short placeholder title: ignored
	seed("Local", "g", "Lone", "", &other, nil)
	seed("Twitter", "h", "Someone clip", "", &third, nil) // cleaner fallback title: ignored
	seed("Twitter", "i", "Someone clip", "", &third, nil)

	cands, err := db.FindDuplicateCandidates()
	if err != nil {
		t.Fatal(err)
	}
	if len(cands) != 2 {
		t.Fatalf("want 2 groups, got %+v", cands)
	}
	if got := cands[0].Keys(); len(got) != 3 || got[0].ID != "a" || got[1].ID != "b" || got[2].ID != "c" {
		t.Fatalf("group 1 members: %+v", got)
	}
	if len(cands[0].Reasons) != 2 {
		t.Fatalf("group 1 reasons: %v", cands[0].Reasons)
	}
	if got := cands[1].Keys(); len(got) != 2 || got[0].ID != "d" || got[1].ID != "e" || cands[1].Reasons[0] != reasonSameURL {
		t.Fatalf("group 2: %+v", cands[1])
	}

	// A saved review group covering the same members hides the candidate.
	if _, err := db.CreateDuplicateGroup(cands[1].Keys()); err != nil {
		t.Fatal(err)
	}
	cands, err = db.FindDuplicateCandidates()
	if err != nil || len(cands) != 1 || cands[0].Keys()[0].ID != "a" {
		t.Fatalf("after queueing: %+v %v", cands, err)
	}

	// Hidden-collection videos never enter the shared queue.
	col, err := db.CreateCollection("Hidden", true)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AddToCollection(col, "Local", "b"); err != nil {
		t.Fatal(err)
	}
	cands, err = db.FindDuplicateCandidates()
	if err != nil || len(cands) != 1 || len(cands[0].Videos) != 2 {
		t.Fatalf("after hiding b: %+v %v", cands, err)
	}
}

// Two catalogue rows for one file are flagged as duplicates, and resolving
// them removes the row without moving the file anyone still uses.
func TestSameFileRowsResolveWithoutRecycling(t *testing.T) {
	db := openTestDB(t)
	a, b := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}
	seedDuplicateVideo(t, db, a.Site, a.ID, "")
	path := filepath.Join(db.root, "Local-a.mp4")
	if err := db.Upsert(Video{Site: b.Site, ID: b.ID, Title: "other name", Filepath: filepath.Join(db.root, "LOCAL-A.mp4"), Filename: "Local-a.mp4"}); err != nil {
		t.Fatal(err)
	}
	cands, err := db.FindDuplicateCandidates()
	if err != nil || len(cands) != 1 || len(cands[0].Videos) != 2 || cands[0].Reasons[0] != reasonSameFile {
		t.Fatalf("same-file rows not flagged: %+v %v", cands, err)
	}
	id, err := db.CreateDuplicateGroup(cands[0].Keys())
	if err != nil {
		t.Fatal(err)
	}
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a}); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("shared file was moved: %v", err)
	}
	if _, err := os.Stat(filepath.Join(db.root, RecycleDirName)); !os.IsNotExist(err) {
		t.Fatal("recycle folder created for a catalogue-only removal")
	}
	if _, ok, _ := db.VideoByKey(b.Site, b.ID); ok {
		t.Fatal("duplicate row still present")
	}
	if _, ok, _ := db.VideoByKey(a.Site, a.ID); !ok {
		t.Fatal("kept row lost")
	}
}
