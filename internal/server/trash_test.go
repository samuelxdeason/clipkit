package server

import (
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"trove/internal/core"
	"trove/internal/library"
)

func TestTrashEndpoint(t *testing.T) {
	root := t.TempDir()
	events := 0
	c, err := core.New(root, func(name string, _ any) {
		if name == "library" {
			events++
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	for _, name := range []string{"video.mp4", "photo.jpg"} {
		if err := os.WriteFile(filepath.Join(root, name), []byte(name), 0600); err != nil {
			t.Fatal(err)
		}
	}
	if err := c.UpsertVideo(library.Video{Site: "Local", ID: "video", Filepath: filepath.Join(root, "video.mp4")}); err != nil {
		t.Fatal(err)
	}
	if err := c.AddPhoto(library.Photo{ID: "photo", Filepath: filepath.Join(root, "photo.jpg")}); err != nil {
		t.Fatal(err)
	}
	handler := New(c, NewHub(), nil).Handler()
	before := events
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("POST", "/api/media/trash", strings.NewReader(`{"videos":[{"site":"Local","id":"video"}],"photos":["photo"]}`)))
	if rec.Code != 200 {
		t.Fatal(rec.Code, rec.Body.String())
	}
	if events != before+1 {
		t.Fatal("library update not emitted")
	}
	videos, err := c.AllVideos(100, 0, "newest", "", false, 0)
	if err != nil || len(videos) != 0 {
		t.Fatal(videos, err)
	}
	photos, err := c.AllPhotos(100, 0, "")
	if err != nil || len(photos) != 0 {
		t.Fatal(photos, err)
	}
	// Stale retries fail without emitting a successful change.
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("POST", "/api/media/trash", strings.NewReader(`{"photos":["photo"]}`)))
	if rec.Code == 200 || events != before+1 {
		t.Fatal("stale selection succeeded", rec.Body.String())
	}
}
