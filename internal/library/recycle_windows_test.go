package library

import (
	"os"
	"path/filepath"
	"syscall"
	"testing"
)

func TestRecycleLockedVideoRollsBackEarlierMoves(t *testing.T) {
	db := openTestDB(t)
	a, b, c := VideoKey{"Local", "a"}, VideoKey{"Local", "b"}, VideoKey{"Local", "c"}
	for _, k := range []VideoKey{a, b, c} {
		seedDuplicateVideo(t, db, k.Site, k.ID, "")
	}
	id, err := db.CreateDuplicateGroup([]VideoKey{a, b, c})
	if err != nil {
		t.Fatal(err)
	}
	path, err := syscall.UTF16PtrFromString(filepath.Join(db.root, "Local-c.mp4"))
	if err != nil {
		t.Fatal(err)
	}
	handle, err := syscall.CreateFile(path, syscall.GENERIC_READ, syscall.FILE_SHARE_READ, nil, syscall.OPEN_EXISTING, syscall.FILE_ATTRIBUTE_NORMAL, 0)
	if err != nil {
		t.Fatal(err)
	}
	defer syscall.CloseHandle(handle)
	if err := db.ResolveDuplicateGroup(id, []VideoKey{a}); err == nil {
		t.Fatal("locked file moved")
	}
	for _, k := range []VideoKey{a, b, c} {
		if _, ok, err := db.VideoByKey(k.Site, k.ID); err != nil || !ok {
			t.Fatal("catalogue changed on failure", err)
		}
		data, err := os.ReadFile(filepath.Join(db.root, "Local-"+k.ID+".mp4"))
		if err != nil || string(data) != k.ID {
			t.Fatal("earlier move not restored", k, err)
		}
	}
	groups, err := db.DuplicateGroups()
	if err != nil || len(groups) != 1 {
		t.Fatal("review lost", err)
	}
}
