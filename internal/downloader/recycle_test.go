package downloader

import (
	"os"
	"path/filepath"
	"testing"
	"trove/internal/library"
)

func TestRebuildSkipsRecycleBin(t *testing.T) {
	d, db, root := newReplaceFixture(t)
	dir := filepath.Join(root, library.RecycleDirName, "batch")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	write(t, filepath.Join(dir, "clip.mp4"), "recycled bytes")
	write(t, filepath.Join(dir, "clip.info.json"), `{"id":"recycled","extractor_key":"Generic","title":"Recycled"}`)
	if n, err := d.RebuildFromDisk(); err != nil || n != 0 {
		t.Fatal("recycled video imported", n, err)
	}
	if n, err := db.Count(); err != nil || n != 0 {
		t.Fatal("recycled entry in catalogue", n, err)
	}
}
