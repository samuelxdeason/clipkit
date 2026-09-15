package downloader

import (
	"os"
	"path/filepath"
	"testing"
	"trove/internal/library"
)

func TestFollowingOwnershipAcrossSources(t *testing.T) {
	dir := t.TempDir()
	archive := filepath.Join(dir, "archive.txt")
	if err := os.WriteFile(archive, []byte("pornhub ph1\nyoutube yt1\ntwitter 123\n"), 0600); err != nil {
		t.Fatal(err)
	}
	db, err := library.Open(filepath.Join(dir, "library.db"), dir)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if err := db.Upsert(library.Video{Site: "OtherSite", ID: "42", WebpageURL: "https://example.com/videos/42", Filepath: "saved.mp4"}); err != nil {
		t.Fatal(err)
	}
	d := newTestDL()
	d.cfg.Archive = archive
	d.db = db
	cases := []struct {
		url   string
		owned bool
	}{
		{"https://www.pornhub.com/view_video.php?viewkey=ph1", true},
		{"https://youtu.be/yt1", true}, {"https://www.youtube.com/watch?v=yt1&list=abc", true},
		{"https://x.com/user/status/123", true}, {"https://twitter.com/user/status/123", true},
		{"https://example.com/videos/42#player", true}, {"https://youtube.com/watch?v=ph1", false},
		{"https://example.com/videos/43", false},
	}
	for _, c := range cases {
		got := d.withOwned([]RemoteItem{{URL: c.url}})[0].Owned
		if got != c.owned {
			t.Errorf("%s: got %v want %v", c.url, got, c.owned)
		}
	}
	if got := d.EnqueueMany([]string{cases[0].url, cases[1].url, cases[3].url, cases[5].url}); got != 0 {
		t.Fatalf("queued %d saved items", got)
	}
}
func TestRemoteEnumerationKeepsIdentity(t *testing.T) {
	item, ok := parseRemote(`{"id":"abc","url":"abc","title":"Example","ie_key":"Youtube"}`)
	if !ok || item.Site != "youtube" || item.ID != "abc" || item.URL != "https://www.youtube.com/watch?v=abc" {
		t.Fatalf("bad item: %+v", item)
	}
	if _, ok := parseRemote("not json"); ok {
		t.Fatal("accepted invalid entry")
	}
	if _, ok := parseRemote(`{"id":"abc","url":"abc","ie_key":"Unknown"}`); ok {
		t.Fatal("accepted unusable URL")
	}
}

func TestStaleFollowingOwnershipUsesCatalogue(t *testing.T) {
	dir := t.TempDir()
	db, err := library.Open(filepath.Join(dir, "library.db"), dir)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	const id = "69b6fda0f09bb"
	const raw = "http://www.pornhub.com/view_video.php?viewkey=" + id
	if err := db.Upsert(library.Video{Site: "PornHub", ID: id, WebpageURL: raw, Filepath: "media/PornHub-" + id + ".mp4"}); err != nil {
		t.Fatal(err)
	}
	d := newTestDL()
	d.db = db
	d.cfg.Archive = filepath.Join(dir, "missing-archive")
	cached := []RemoteItem{{URL: raw, ID: id, Owned: false}}
	if !d.withOwned(cached)[0].Owned {
		t.Fatal("stale cached flag overrode catalogue ownership")
	}
	if cached[0].Owned {
		t.Fatal("mutated cached source")
	}
	if got := d.EnqueueMany([]string{raw, "https://fr.pornhub.com/view_video.php?viewkey=" + id}); got != 0 {
		t.Fatalf("queued %d downloaded items", got)
	}
}
