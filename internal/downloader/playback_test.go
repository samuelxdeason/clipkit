package downloader

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMissingMergedDownloadIsNotPublished(t *testing.T) {
	dir := t.TempDir()
	final := filepath.Join(dir, "Twitter-123.mp4")
	sidecar := filepath.Join(dir, "Twitter-123.info.json")
	if err := os.WriteFile(sidecar, []byte(`{"id":"123","extractor_key":"Twitter"}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "Twitter-123.fhls-1000.mp4"), []byte("separate video track"), 0600); err != nil {
		t.Fatal(err)
	}
	d := newTestDL()
	if _, ok := d.ingestFrom(final, sidecar); ok {
		t.Fatal("published missing merged file")
	}
	if _, err := os.Stat(sidecar); err != nil {
		t.Fatal("recovery metadata was moved or removed")
	}
	j := &Job{ID: "job"}
	d.finish(j, []string{final}, nil, "")
	if j.Status != "error" {
		t.Fatalf("unfinished merge reported as %s", j.Status)
	}
	if err := os.WriteFile(final, nil, 0600); err != nil {
		t.Fatal(err)
	}
	if _, ok := d.ingestFrom(final, sidecar); ok {
		t.Fatal("published empty merged file")
	}
}
