package server

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"trove/internal/core"
	"trove/internal/library"
)

func TestDuplicateReviewEndpointsPersistAndRecycleFiles(t *testing.T) {
	root := t.TempDir()
	c, err := core.New(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"a", "b"} {
		path := filepath.Join(root, id+".mp4")
		if err := os.WriteFile(path, []byte("test media"), 0600); err != nil {
			t.Fatal(err)
		}
		if err := c.UpsertVideo(library.Video{Site: "Local", ID: id, Title: id, Filepath: path, Filename: id + ".mp4"}); err != nil {
			t.Fatal(err)
		}
	}
	handler := New(c, NewHub(), nil).Handler()
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("POST", "/api/duplicates/create", strings.NewReader(`{"videos":[{"site":"Local","id":"a"},{"site":"Local","id":"b"}]}`)))
	if rec.Code != 200 {
		c.Close()
		t.Fatal(rec.Body.String())
	}
	var id int64
	if err := json.Unmarshal(rec.Body.Bytes(), &id); err != nil {
		c.Close()
		t.Fatal(err)
	}
	c.Close()
	c, err = core.New(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	handler = New(c, NewHub(), nil).Handler()
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/api/duplicates", nil))
	var groups []library.DuplicateGroup
	if err := json.Unmarshal(rec.Body.Bytes(), &groups); err != nil || len(groups) != 1 || groups[0].ID != id {
		t.Fatalf("queue not persisted: %s %v", rec.Body.String(), err)
	}
	payload, _ := json.Marshal(map[string]any{"id64": id, "keep": []library.VideoKey{{Site: "Local", ID: "a"}}})
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("POST", "/api/duplicates/resolve", strings.NewReader(string(payload))))
	if rec.Code != 200 {
		t.Fatal(rec.Body.String())
	}
	videos, err := c.AllVideos(100, 0, "newest", "", false, 0)
	if err != nil || len(videos) != 1 || videos[0].ID != "a" {
		t.Fatalf("wrong keeper: %+v %v", videos, err)
	}

	if _, err := os.Stat(filepath.Join(root, "a.mp4")); err != nil {
		t.Fatal("keeper moved", err)
	}
	if _, err := os.Stat(filepath.Join(root, "b.mp4")); !os.IsNotExist(err) {
		t.Fatal("duplicate still at original path", err)
	}
	matches, err := filepath.Glob(filepath.Join(root, library.RecycleDirName, "*", "b.mp4"))
	if err != nil || len(matches) != 1 {
		t.Fatal("duplicate not in recycle bin", matches, err)
	}
	content, err := os.ReadFile(matches[0])
	if err != nil || string(content) != "test media" {
		t.Fatal("recycled file content changed", err)
	}
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest("GET", "/api/duplicates/recycle-folder", nil))
	var folder string
	if err := json.Unmarshal(rec.Body.Bytes(), &folder); err != nil || folder != filepath.Join(root, library.RecycleDirName) {
		t.Fatal("wrong recycle folder", folder, err)
	}
}
