package library

import (
	"path/filepath"
	"testing"
)

func TestAllPhotosIncludesUnassignedAndPagesStably(t *testing.T) {
	root := t.TempDir()
	db, err := Open(filepath.Join(root, "test.db"), root)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	for _, p := range []Photo{
		{ID: "a", Model: "Alex", Album: "Summer", Filename: "garden.jpg", Filepath: filepath.Join(root, "garden.jpg"), Added: "2026-09-01"},
		{ID: "b", Filename: "river.jpg", Filepath: filepath.Join(root, "river.jpg"), Added: "2026-09-02"},
		{ID: "c", Model: "Jamie", Album: "Summer", Filename: "light.jpg", Filepath: filepath.Join(root, "light.jpg"), Added: "2026-09-02"},
	} {
		if err := db.AddPhoto(p); err != nil {
			t.Fatal(err)
		}
	}
	first, err := db.AllPhotos(2, 0, "")
	if err != nil || len(first) != 2 {
		t.Fatalf("first page: %v, %v", first, err)
	}
	if first[0].ID != "c" || first[1].ID != "b" {
		t.Fatalf("unstable order: %v", first)
	}
	if first[1].Model != "" || !filepath.IsAbs(first[1].Filepath) {
		t.Fatalf("unassigned photo or absolute path lost: %v", first[1])
	}
	next, err := db.AllPhotos(2, 2, "")
	if err != nil || len(next) != 1 || next[0].ID != "a" {
		t.Fatalf("next page: %v, %v", next, err)
	}
	for query, count := range map[string]int{"summer": 2, "Alex": 1, "river": 1, "missing": 0} {
		got, err := db.AllPhotos(120, 0, query)
		if err != nil || len(got) != count {
			t.Errorf("search %q: got %d, want %d, error %v", query, len(got), count, err)
		}
	}
	loose, err := db.PhotosByModel("")
	if err != nil || len(loose) != 1 || loose[0].ID != "b" {
		t.Fatalf("existing per-person query changed: %v, %v", loose, err)
	}
}
