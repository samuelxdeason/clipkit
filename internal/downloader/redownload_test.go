package downloader

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"trove/internal/library"
)

func newReplaceFixture(t *testing.T) (*Downloader, *library.DB, string) {
	t.Helper()
	root := t.TempDir()
	state := filepath.Join(root, ".trove")
	db, err := library.Open(filepath.Join(t.TempDir(), "test.db"), root)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	for _, dir := range []string{filepath.Join(root, library.MediaDirName), filepath.Join(state, library.MetaDirName), filepath.Join(state, library.ThumbsDirName)} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	d := newTestDL()
	d.db = db
	d.cfg = Config{MediaRoot: root, StateDir: state, Archive: filepath.Join(state, "downloaded.archive")}
	return d, db, root
}

func write(t *testing.T, path, data string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(data), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestRedownloadReplacesFileAndKeepsUserData(t *testing.T) {
	d, db, root := newReplaceFixture(t)
	base := library.FlatBase("Generic", "30919")
	oldFile := filepath.Join(root, library.MediaDirName, base+".mp4")
	write(t, oldFile, "720p bytes")
	write(t, filepath.Join(d.metaDir(), base+".info.json"), `{"id":"30919","extractor_key":"Generic","height":720}`)
	write(t, filepath.Join(d.thumbsDir(), base+".jpg"), "thumb")
	write(t, d.cfg.Archive, "pornhub abc\ngeneric 30919\n")
	h720 := 720
	if err := db.Upsert(library.Video{ID: "30919", Site: "Generic", Title: "Clip", Height: &h720,
		Filepath: oldFile, WebpageURL: "https://example.test/videos/30919/"}); err != nil {
		t.Fatal(err)
	}
	if err := db.SetFavorite("Generic", "30919", true); err != nil {
		t.Fatal(err)
	}
	v, _, _ := db.VideoByKey("Generic", "30919")
	if _, err := d.Redownload(v); err != nil {
		t.Fatal(err)
	}
	j := d.jobs[d.order[0]]

	// What run() does before starting yt-dlp.
	d.setArchived(archiveKey("Generic", "30919"), false)
	if got, _ := os.ReadFile(d.cfg.Archive); strings.Contains(string(got), "generic 30919") || !strings.Contains(string(got), "pornhub abc") {
		t.Fatalf("archive after unmark = %q", got)
	}

	// yt-dlp's staged output.
	staged := filepath.Join(root, library.MediaDirName, base+".redownload-x.mp4")
	write(t, staged, "1080p bytes, much bigger")
	write(t, strings.TrimSuffix(staged, ".mp4")+".info.json", `{"id":"30919","extractor_key":"Generic","height":1080}`)
	d.finish(j, []string{staged}, nil, "")

	if j.Status != "done" || j.Error != "" {
		t.Fatalf("status %q error %q", j.Status, j.Error)
	}
	if got, _ := os.ReadFile(oldFile); string(got) != "1080p bytes, much bigger" {
		t.Fatalf("canonical file holds %q", got)
	}
	if fileExists(staged) {
		t.Fatal("staged file left behind")
	}
	if got, _ := os.ReadFile(filepath.Join(d.metaDir(), base+".info.json")); !strings.Contains(string(got), "1080") {
		t.Fatalf("parked sidecar not refreshed: %q", got)
	}
	v, _, _ = db.VideoByKey("Generic", "30919")
	if v.Height == nil || *v.Height != 1080 || !v.Favorite || !strings.EqualFold(v.Filepath, oldFile) {
		t.Fatalf("catalogue row after replace: height=%v fav=%v path=%q", v.Height, v.Favorite, v.Filepath)
	}
}

func TestFailedRedownloadKeepsOldCopyAndArchive(t *testing.T) {
	d, _, root := newReplaceFixture(t)
	oldFile := filepath.Join(root, library.MediaDirName, library.FlatBase("Generic", "30919")+".mp4")
	write(t, oldFile, "720p bytes")
	write(t, d.cfg.Archive, "generic 30919\n")
	j := &Job{ID: "1", Replace: true, replace: &replaceTarget{site: "Generic", id: "30919", oldFile: oldFile}}

	d.setArchived(archiveKey("Generic", "30919"), false)
	d.finish(j, nil, os.ErrDeadlineExceeded, "ERROR: HTTP Error 403")

	if j.Status != "error" {
		t.Fatalf("status %q", j.Status)
	}
	if !fileExists(oldFile) {
		t.Fatal("old copy deleted after a failed download")
	}
	if got, _ := os.ReadFile(d.cfg.Archive); strings.TrimSpace(string(got)) != "generic 30919" {
		t.Fatalf("archive not restored: %q", got)
	}
}
