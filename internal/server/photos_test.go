package server

import (
	"encoding/json"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"trove/internal/core"
	"trove/internal/library"
)

func TestPhotoArchiveEndpoint(t *testing.T) {
	root := t.TempDir()
	c, err := core.New(root, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	if err := c.AddPhoto(library.Photo{ID: "loose", Filename: "garden.jpg", Filepath: filepath.Join(root, "garden.jpg"), Album: "Summer", Added: "2026-09-10"}); err != nil {
		t.Fatal(err)
	}
	handler := New(c, NewHub(), nil).Handler()
	for _, tc := range []struct {
		path  string
		count int
	}{
		{"/api/photos/all?limit=1&offset=0", 1},
		{"/api/photos/all?limit=1&offset=1", 0},
		{"/api/photos/all?q=summer", 1},
		{"/api/photos/all?q=missing", 0},
		{"/api/photos?model=", 1},
	} {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest("GET", tc.path, nil))
		if rec.Code != 200 {
			t.Fatalf("%s: status %d: %s", tc.path, rec.Code, rec.Body.String())
		}
		var photos []library.Photo
		if err := json.Unmarshal(rec.Body.Bytes(), &photos); err != nil {
			t.Fatal(err)
		}
		if len(photos) != tc.count {
			t.Errorf("%s: got %d photos, want %d", tc.path, len(photos), tc.count)
		}
	}
}
