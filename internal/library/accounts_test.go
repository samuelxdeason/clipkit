package library

import (
	"path/filepath"
	"testing"
)

func TestParsePHUploaderID(t *testing.T) {
	cases := map[string][2]string{
		"pornstar/arabella-rose":  {"pornstar", "arabella-rose"},
		"/pornstar/arabella-rose": {"pornstar", "arabella-rose"},
		"users/somebody":          {"users", "somebody"},
		"channels/vixen":          {"channel", "vixen"},
		"myanny":                  {"model", "myanny"},
		"":                        {"", ""},
	}
	for raw, want := range cases {
		k, h := ParsePHUploaderID(raw)
		if k != want[0] || h != want[1] {
			t.Errorf("ParsePHUploaderID(%q) = %q,%q want %q,%q", raw, k, h, want[0], want[1])
		}
	}
}

// TestAccountsFromIngest: an Upsert records the platform-asserted accounts
// (owner + cast) and keeps uploader_id/cast on the video row.
func TestAccountsFromIngest(t *testing.T) {
	db, err := Open(filepath.Join(t.TempDir(), "test.db"), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	if err := db.Upsert(Video{ID: "v1", Site: "PornHub", Uploader: "ArabellaRose",
		UploaderID: "pornstar/arabella-rose", Cast: []string{"Alex Adams", "Arabella Rose"},
		WebpageURL: "https://www.pornhub.com/view_video.php?viewkey=v1"}); err != nil {
		t.Fatal(err)
	}
	accts, err := db.Accounts()
	if err != nil {
		t.Fatal(err)
	}
	byKey := map[string]AccountInfo{}
	for _, a := range accts {
		byKey[a.Platform+"/"+a.Handle] = a
	}
	if a, ok := byKey["pornhub/arabella-rose"]; !ok || a.Kind != "pornstar" || a.DisplayName != "ArabellaRose" {
		t.Fatalf("owner account wrong: %+v (ok=%v)", a, ok)
	}
	if _, ok := byKey["pornhub/alex-adams"]; !ok {
		t.Fatalf("cast account missing: have %v", byKey)
	}

	// Round-trip: the video row keeps the canonical id + cast.
	vids, _ := db.query(`WHERE site='PornHub' AND id='v1'`)
	if len(vids) != 1 || vids[0].UploaderID != "pornstar/arabella-rose" || len(vids[0].Cast) != 2 {
		t.Fatalf("video row round-trip: %+v", vids)
	}
}

// TestBackfillLinks: backfill imports profile links as connected accounts,
// records every video's source account, and never connects by name-match.
func TestBackfillLinks(t *testing.T) {
	db, err := Open(filepath.Join(t.TempDir(), "test.db"), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	_ = db.SaveModelInfo("Nikki Ryder", "", "", []ModelLink{{Label: "OF", URL: "https://onlyfans.com/nikkiiryder"}})
	_ = db.CreatePerson("Arabella Rose")
	_ = db.Upsert(Video{ID: "p1", Site: "PornHub", Uploader: "ArabellaRose", UploaderID: "pornstar/arabella-rose"})
	_, _ = db.sql.Exec(`UPDATE videos SET source_platform=NULL, source_handle=NULL`)

	stats, err := db.BackfillAccounts(nil)
	if err != nil {
		t.Fatal(err)
	}
	if stats["from-links"] != 1 || stats["source-recorded"] != 1 {
		t.Errorf("stats: %v", stats)
	}
	if accts, _ := db.AccountsForPerson("Arabella Rose"); len(accts) != 0 {
		t.Errorf("backfill must not connect accounts by name: %v", accts)
	}
	ofAccts, _ := db.AccountsForPerson("Nikki Ryder")
	if len(ofAccts) != 1 || ofAccts[0].Platform != "onlyfans" || ofAccts[0].Handle != "nikkiiryder" {
		t.Errorf("link account wrong: %v", ofAccts)
	}
}
