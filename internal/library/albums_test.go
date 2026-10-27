package library

import (
	"database/sql"
	"path/filepath"
	"testing"
)

func TestMixedAlbumsAndHierarchy(t *testing.T) {
	db := openTestDB(t)
	root, err := db.CreateAlbum("Trips", 0)
	if err != nil {
		t.Fatal(err)
	}
	child, err := db.CreateAlbum("Chicago", root)
	if err != nil {
		t.Fatal(err)
	}
	grandchild, err := db.CreateAlbum("Day one", child)
	if err != nil {
		t.Fatal(err)
	}
	seedDuplicateVideo(t, db, "Local", "v", "")
	if err := db.AddPhoto(Photo{ID: "p", Filepath: filepath.Join(db.root, "p.jpg"), Filename: "p.jpg"}); err != nil {
		t.Fatal(err)
	}
	keys := []VideoKey{{"Local", "v"}}
	if err := db.UpdateAlbumItems(child, keys, []string{"p", "p"}, false); err != nil {
		t.Fatal(err)
	}
	if err := db.UpdateAlbumItems(root, nil, []string{"p"}, false); err != nil {
		t.Fatal(err)
	}
	albums, err := db.Collections()
	if err != nil {
		t.Fatal(err)
	}
	for _, a := range albums {
		if a.ID == child && (a.Count != 2 || a.PhotoCount != 1 || a.VideoCount != 1 || a.AlbumCount != 1 || a.ParentID != root) {
			t.Fatalf("bad album %+v", a)
		}
	}
	if err := db.MoveAlbum(root, grandchild); err == nil {
		t.Fatal("cycle accepted")
	}
	if err := db.MoveAlbum(child, child); err == nil {
		t.Fatal("self parent accepted")
	}
	if err := db.MoveAlbum(child, 99999); err == nil {
		t.Fatal("missing parent accepted")
	}
	if _, err := db.CreateAlbum("orphan", 99999); err == nil {
		t.Fatal("missing parent accepted")
	}
	if _, err := db.CreateAlbum("  ", 0); err == nil {
		t.Fatal("empty name accepted")
	}
	if err := db.UpdateAlbumItems(root, keys, []string{"missing"}, false); err == nil {
		t.Fatal("stale batch accepted")
	}
	vs, err := db.VideosByCollection(root)
	if err != nil || len(vs) != 0 {
		t.Fatal("partial batch persisted", vs, err)
	}
	if err := db.UpdateAlbumItems(child, nil, []string{"p"}, true); err != nil {
		t.Fatal(err)
	}
	ps, err := db.PhotosByCollection(root)
	if err != nil || len(ps) != 1 || !db.PhotoExists("p") {
		t.Fatal("other membership lost", ps, err)
	}
	if err := db.DeleteCollection(child); err != nil {
		t.Fatal(err)
	}
	albums, err = db.Collections()
	if err != nil {
		t.Fatal(err)
	}
	for _, a := range albums {
		if a.ID == grandchild && a.ParentID != root {
			t.Fatal("subalbum not promoted", a)
		}
	}
	vs, err = db.AllVideos(100, 0, "newest", "", false, 0)
	if err != nil || len(vs) != 1 {
		t.Fatal("deleting album deleted media", vs, err)
	}
}

func TestAlbumPrivacyInheritedByPhotosAndVideos(t *testing.T) {
	db := openTestDB(t)
	parent, err := db.CreateAlbum("Private", 0)
	if err != nil {
		t.Fatal(err)
	}
	child, err := db.CreateAlbum("Nested", parent)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.SetCollectionHidden(parent, true); err != nil {
		t.Fatal(err)
	}
	if err := db.SetCollectionLocked(parent, true); err != nil {
		t.Fatal(err)
	}
	seedDuplicateVideo(t, db, "Local", "v", "")
	if err := db.AddPhoto(Photo{ID: "p", Model: "Pat", Filepath: "p.jpg", Filename: "p.jpg", Added: "2026-09-22"}); err != nil {
		t.Fatal(err)
	}
	if err := db.UpdateAlbumItems(child, []VideoKey{{"Local", "v"}}, []string{"p"}, false); err != nil {
		t.Fatal(err)
	}
	ps, err := db.AllPhotos(100, 0, "")
	if err != nil || len(ps) != 0 {
		t.Fatal("hidden photo visible", ps, err)
	}
	ps, err = db.PhotosByModel("Pat")
	if err != nil || len(ps) != 0 {
		t.Fatal("hidden person photo visible", ps, err)
	}
	vs, err := db.AllVideos(100, 0, "newest", "", false, 0)
	if err != nil || len(vs) != 0 {
		t.Fatal("hidden video visible", vs, err)
	}
	ps, err = db.PhotosByCollection(child)
	if err != nil || len(ps) != 1 {
		t.Fatal("album cannot show own photo", ps, err)
	}
	albums, err := db.Collections()
	if err != nil {
		t.Fatal(err)
	}
	for _, a := range albums {
		if a.ID == child && (!a.InheritedHidden || !a.InheritedLocked || len(a.Covers) != 0) {
			t.Fatal("privacy not inherited", a)
		}
	}
	if err := db.MoveAlbum(child, 0); err != nil {
		t.Fatal(err)
	}
	ps, err = db.AllPhotos(100, 0, "")
	if err != nil || len(ps) != 1 {
		t.Fatal("moved photo still hidden", ps, err)
	}
}

func TestAssignPhotosAtomicAndVisibleOnPerson(t *testing.T) {
	db := openTestDB(t)
	if err := db.CreatePerson("Pat"); err != nil {
		t.Fatal(err)
	}
	if err := db.AddPhoto(Photo{ID: "p", Model: "Old", Filepath: "p.jpg", Filename: "p.jpg", Added: "2026-09-22"}); err != nil {
		t.Fatal(err)
	}
	if err := db.AssignPhotos([]string{"p", "missing"}, "Pat"); err == nil {
		t.Fatal("stale selection accepted")
	}
	ps, err := db.PhotosByModel("Old")
	if err != nil || len(ps) != 1 {
		t.Fatal("partial assignment persisted", ps, err)
	}
	if err := db.AssignPhotos([]string{"p"}, "Missing person"); err == nil {
		t.Fatal("unregistered person accepted")
	}
	if err := db.AssignPhotos([]string{"p"}, "Pat"); err != nil {
		t.Fatal(err)
	}
	if err := db.AddPhoto(Photo{ID: "p", Model: "Old", Filepath: "p.jpg", Filename: "p.jpg", Added: "2026-09-22"}); err != nil {
		t.Fatal(err)
	}
	ps, err = db.PhotosByModel("Pat")
	if err != nil || len(ps) != 1 || ps[0].Model != "Pat" {
		t.Fatal(ps, err)
	}
	if err := db.AssignPhotos([]string{"p"}, ""); err != nil {
		t.Fatal(err)
	}
	ps, err = db.PhotosByModel("")
	if err != nil || len(ps) != 1 {
		t.Fatal("unassign failed", ps, err)
	}
}

func TestAlbumMigrationPreservesLegacyCollections(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "library.db")
	legacy, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := legacy.Exec(schema); err != nil {
		t.Fatal(err)
	}
	if _, err := legacy.Exec(`INSERT INTO collections(id,name,hidden,locked) VALUES(42,'Existing',1,1); INSERT INTO videos(site,id,title,uploader,ext,filepath,filename,thumbnail,thumbnail_url,webpage_url,upload_date,tags,categories,description,added) VALUES('Local','v','','','','','','','','','','[]','[]','',''); INSERT INTO collection_items(collection_id,site,video_id) VALUES(42,'Local','v')`); err != nil {
		t.Fatal(err)
	}
	legacy.Close()
	for i := 0; i < 2; i++ {
		db, err := Open(path, root)
		if err != nil {
			t.Fatal(err)
		}
		albums, err := db.Collections()
		if err != nil {
			t.Fatal(err)
		}
		if len(albums) != 1 || albums[0].ID != 42 || albums[0].ParentID != 0 || albums[0].Count != 1 || !albums[0].Hidden || !albums[0].Locked {
			t.Fatal("legacy album changed", albums)
		}
		db.Close()
	}
}

func TestImportedPhotoAlbumsPersistUserOrganization(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "library.db")
	db, err := Open(path, root)
	if err != nil {
		t.Fatal(err)
	}
	photo := Photo{ID: "p", Album: "Trip", Filepath: "p.jpg", Filename: "p.jpg", Added: "2026-09-22"}
	if err := db.AddPhoto(photo); err != nil {
		t.Fatal(err)
	}
	albums, err := db.Collections()
	if err != nil || len(albums) != 1 || albums[0].PhotoCount != 1 {
		t.Fatal(albums, err)
	}
	id := albums[0].ID
	if err := db.UpdateAlbumItems(id, nil, []string{"p"}, true); err != nil {
		t.Fatal(err)
	}
	db.Close()
	db, err = Open(path, root)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	ps, err := db.PhotosByCollection(id)
	if err != nil || len(ps) != 0 {
		t.Fatal("removed membership restored on reopen", ps, err)
	}
	if err := db.RenameCollection(id, "Renamed trip"); err != nil {
		t.Fatal(err)
	}
	photo.ID = "p2"
	if err := db.AddPhoto(photo); err != nil {
		t.Fatal(err)
	}
	albums, err = db.Collections()
	if err != nil || len(albums) != 1 || albums[0].ID != id || albums[0].Name != "Renamed trip" || albums[0].PhotoCount != 1 {
		t.Fatal("import did not reuse renamed album", albums, err)
	}
}

func TestLegacyPhotoAlbumMigration(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "library.db")
	legacy, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := legacy.Exec(schema + `; ALTER TABLE photos ADD COLUMN album TEXT; INSERT INTO photos(id,model,album,filepath,filename,added) VALUES('p','','Summer','p.jpg','p.jpg','2026-09-22')`); err != nil {
		t.Fatal(err)
	}
	legacy.Close()
	db, err := Open(path, root)
	if err != nil {
		t.Fatal(err)
	}
	albums, err := db.Collections()
	if err != nil || len(albums) != 1 || albums[0].Name != "Summer" || albums[0].PhotoCount != 1 {
		t.Fatal(albums, err)
	}
	id := albums[0].ID
	if err := db.UpdateAlbumItems(id, nil, []string{"p"}, true); err != nil {
		t.Fatal(err)
	}
	db.Close()
	db, err = Open(path, root)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	albums, err = db.Collections()
	if err != nil || len(albums) != 1 || albums[0].ID != id || albums[0].PhotoCount != 0 {
		t.Fatal("migration ran twice", albums, err)
	}
}

func TestCollectionTransfers(t *testing.T) {
	db := openTestDB(t)
	makeFolder := func(name string, parent int64) int64 {
		t.Helper()
		id, err := db.CreateAlbum(name, parent)
		if err != nil {
			t.Fatal(err)
		}
		return id
	}
	source := makeFolder("Source", 0)
	destination := makeFolder("Destination", 0)
	other := makeFolder("Other", 0)
	seedDuplicateVideo(t, db, "Local", "v", "")
	if err := db.AddPhoto(Photo{ID: "p", Filepath: "p.jpg", Filename: "p.jpg"}); err != nil {
		t.Fatal(err)
	}
	videos := []VideoKey{{"Local", "v"}}
	photos := []string{"p"}
	check := func(id int64, want int) {
		t.Helper()
		ps, e := db.PhotosByCollection(id)
		vs, e2 := db.VideosByCollection(id)
		if e != nil || e2 != nil || len(ps) != want || len(vs) != want {
			t.Fatalf("folder %d: photos=%d videos=%d want=%d errors=%v/%v", id, len(ps), len(vs), want, e, e2)
		}
	}
	for _, id := range []int64{source, other} {
		if err := db.TransferCollectionItems(0, id, videos, photos, false); err != nil {
			t.Fatal(err)
		}
	}
	if err := db.TransferCollectionItems(source, destination, videos, photos, true); err != nil {
		t.Fatal(err)
	}
	check(source, 1)
	check(destination, 1)
	if err := db.TransferCollectionItems(source, destination, videos, photos, false); err != nil {
		t.Fatal(err)
	}
	check(source, 0)
	check(destination, 1)
	check(other, 1)
	if err := db.TransferCollectionItems(source, other, videos, photos, false); err == nil {
		t.Fatal("stale source accepted")
	}
	if err := db.TransferCollectionItems(destination, source, videos, []string{"missing"}, false); err == nil {
		t.Fatal("missing photo accepted")
	}
	check(source, 0)
	check(destination, 1)
	if err := db.TransferCollectionItems(0, source, videos, []string{"missing"}, false); err == nil {
		t.Fatal("partial library batch accepted")
	}
	check(source, 0)
	locked := makeFolder("Locked", 0)
	child := makeFolder("Child", locked)
	if err := db.SetCollectionLocked(locked, true); err != nil {
		t.Fatal(err)
	}
	for _, id := range []int64{locked, child, 99999, 0, destination} {
		if err := db.TransferCollectionItems(destination, id, videos, photos, false); err == nil {
			t.Fatalf("invalid destination accepted: %d", id)
		}
	}
	check(destination, 1)
	if err := db.TransferCollectionItems(0, source, nil, nil, false); err == nil {
		t.Fatal("empty selection accepted")
	}
	if !db.PhotoExists("p") {
		t.Fatal("photo deleted")
	}
}
