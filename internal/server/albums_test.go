package server

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"trove/internal/core"
	"trove/internal/library"
)

func TestAlbumAndPhotoAssignmentEndpoints(t *testing.T) {
	c, err := core.New(t.TempDir(), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	if err := c.AddPhoto(library.Photo{ID: "photo", Filepath: "photo.jpg", Filename: "photo.jpg", Added: "2026-09-22"}); err != nil {
		t.Fatal(err)
	}
	if err := c.CreatePerson("Pat"); err != nil {
		t.Fatal(err)
	}
	h := New(c, NewHub(), nil).Handler()
	post := func(path, body string) *httptest.ResponseRecorder {
		t.Helper()
		r := httptest.NewRecorder()
		h.ServeHTTP(r, httptest.NewRequest("POST", path, strings.NewReader(body)))
		return r
	}
	r := post("/api/albums/create", `{"name":"Travel"}`)
	if r.Code != 200 {
		t.Fatal(r.Body.String())
	}
	var album struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal(r.Body.Bytes(), &album); err != nil {
		t.Fatal(err)
	}
	body, _ := json.Marshal(map[string]any{"id64": album.ID, "photos": []string{"photo"}})
	r = post("/api/albums/add", string(body))
	if r.Code != 200 {
		t.Fatal(r.Body.String())
	}
	r = post("/api/photos/assign", `{"photos":["photo"],"name":"Pat"}`)
	if r.Code != 200 {
		t.Fatal(r.Body.String())
	}
	ps, err := c.PhotosByCollection(album.ID)
	if err != nil || len(ps) != 1 || ps[0].Model != "Pat" {
		t.Fatal(ps, err)
	}
	r = post("/api/albums/remove", string(body))
	if r.Code != 200 {
		t.Fatal(r.Body.String())
	}
	ps, err = c.PhotosByModel("Pat")
	if err != nil || len(ps) != 1 {
		t.Fatal("removal changed media", ps, err)
	}
	r = post("/api/albums/move", `{"id64":999,"parentId":0}`)
	if r.Code == 200 {
		t.Fatal("invalid move accepted")
	}
}

func TestCollectionTransferEndpoint(t *testing.T) {
	c, err := core.New(t.TempDir(), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	if err := c.AddPhoto(library.Photo{ID: "p", Filepath: "p.jpg", Filename: "p.jpg"}); err != nil {
		t.Fatal(err)
	}
	a, err := c.CreateAlbum("Source", 0)
	if err != nil {
		t.Fatal(err)
	}
	b, err := c.CreateAlbum("Destination", 0)
	if err != nil {
		t.Fatal(err)
	}
	if err := c.UpdateAlbumItems(a, nil, []string{"p"}, false); err != nil {
		t.Fatal(err)
	}
	h := New(c, NewHub(), nil).Handler()
	for _, copyItems := range []bool{true, false} {
		body, _ := json.Marshal(map[string]any{"sourceId": a, "id64": b, "photos": []string{"p"}, "copy": copyItems})
		r := httptest.NewRecorder()
		h.ServeHTTP(r, httptest.NewRequest("POST", "/api/collections/transfer", strings.NewReader(string(body))))
		if r.Code != 200 {
			t.Fatal(r.Code, r.Body.String())
		}
		ps, err := c.PhotosByCollection(a)
		want := 0
		if copyItems {
			want = 1
		}
		if err != nil || len(ps) != want {
			t.Fatal("incorrect source membership", ps, err)
		}
		ps, err = c.PhotosByCollection(b)
		if err != nil || len(ps) != 1 {
			t.Fatal("incorrect destination membership", ps, err)
		}
	}
}
