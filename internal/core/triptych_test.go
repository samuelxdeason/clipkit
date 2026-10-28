package core

import (
	"crypto/sha256"
	"fmt"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"trove/internal/library"
)

func TestTriptychCacheAndPathBoundary(t *testing.T) {
	root := t.TempDir()
	c, err := New(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	width, height, duration := 90, 160, 3
	source := filepath.Join(root, "fixture.mp4")
	if err := os.WriteFile(source, []byte("synthetic cache fixture"), 0600); err != nil {
		t.Fatal(err)
	}
	v := library.Video{Site: "Local", ID: "fixture", Filepath: source, Width: &width, Height: &height, Duration: &duration}
	if err := c.db.Upsert(v); err != nil {
		t.Fatal(err)
	}
	stat, _ := os.Stat(source)
	key := sha256.Sum256([]byte(fmt.Sprintf("v1|%s|%s|%s|%d|%d", v.Site, v.ID, source, stat.Size(), stat.ModTime().UnixNano())))
	directory := filepath.Join(c.stateDir, "cache", "triptychs")
	os.MkdirAll(directory, 0700)
	cached := []byte("cached synthetic image")
	os.WriteFile(filepath.Join(directory, fmt.Sprintf("%x.jpg", key)), cached, 0600)
	rec := httptest.NewRecorder()
	c.ServeTriptych(rec, httptest.NewRequest("GET", "/api/videos/triptych?site=Local&id=fixture", nil))
	if rec.Code != 200 || rec.Body.String() != string(cached) {
		t.Fatalf("cache: %d %s", rec.Code, rec.Body.String())
	}
	outside := filepath.Join(t.TempDir(), "outside.mp4")
	os.WriteFile(outside, []byte("outside"), 0600)
	v.Filepath = outside
	if err := c.db.Upsert(v); err != nil {
		t.Fatal(err)
	}
	rec = httptest.NewRecorder()
	c.ServeTriptych(rec, httptest.NewRequest("GET", "/api/videos/triptych?site=Local&id=fixture", nil))
	if rec.Code != 404 {
		t.Fatalf("outside root accepted: %d", rec.Code)
	}
}
