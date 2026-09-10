package library

import (
	"path/filepath"
	"testing"
)

func openTest(t *testing.T) *DB {
	t.Helper()
	db, err := Open(filepath.Join(t.TempDir(), "test.db"), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func idSet(vs []Video) map[string]bool {
	m := map[string]bool{}
	for _, v := range vs {
		m[v.ID] = true
	}
	return m
}

// TestDownloadsCreateNoPeople: ingest records accounts and the source, but
// never a person — the registry stays empty until the user creates someone.
func TestDownloadsCreateNoPeople(t *testing.T) {
	db := openTest(t)
	_ = db.Upsert(Video{ID: "p1", Site: "PornHub", Uploader: "ArabellaRose",
		UploaderID: "pornstar/arabella-rose", Cast: []string{"Alex Adams", "Arabella Rose"}})
	_ = db.Upsert(Video{ID: "x1", Site: "Twitter", Uploader: "Reposter",
		WebpageURL: "https://x.com/SomeReposter/status/9/video/1"})

	people, err := db.People()
	if err != nil {
		t.Fatal(err)
	}
	for _, p := range people {
		if p.Name != "" {
			t.Fatalf("download created a person: %+v", people)
		}
	}
	if len(people) != 1 || people[0].Count != 2 {
		t.Fatalf("expected only an Unsorted bucket of 2, got %+v", people)
	}
	vids, _ := db.query(`WHERE 1=1`)
	src := map[string]string{}
	for _, v := range vids {
		src[v.ID] = v.SourcePlatform + "/" + v.SourceHandle
		if len(v.Models) != 0 || v.Owner != "" || len(v.People) != 0 {
			t.Errorf("%s should belong to nobody: models=%v owner=%q people=%v", v.ID, v.Models, v.Owner, v.People)
		}
	}
	if src["p1"] != "pornhub/arabella-rose" || src["x1"] != "x/somereposter" {
		t.Errorf("source accounts wrong: %v", src)
	}
	accts, _ := db.Accounts()
	if len(accts) != 3 { // arabella-rose (owner + cast), alex-adams, somereposter
		names := []string{}
		for _, a := range accts {
			names = append(names, a.Platform+"/"+a.Handle)
		}
		t.Errorf("expected 3 accounts, got %v", names)
	}
}

// TestConnectingDerivesUploadsAndAppearances: connecting accounts is the only
// thing that files videos under a person, retroactively and for new downloads.
func TestConnectingDerivesUploadsAndAppearances(t *testing.T) {
	db := openTest(t)
	_ = db.Upsert(Video{ID: "own", Site: "PornHub", Uploader: "Ella", UploaderID: "model/ella-alexandra"})
	_ = db.Upsert(Video{ID: "cast", Site: "PornHub", Uploader: "VIXEN", UploaderID: "channels/vixen",
		Cast: []string{"Ella Alexandra"}})
	_ = db.Upsert(Video{ID: "repost", Site: "Twitter", WebpageURL: "https://x.com/fanpage/status/1"})
	_ = db.Upsert(Video{ID: "other", Site: "PornHub", Uploader: "Someone", UploaderID: "model/someone"})

	if err := db.CreatePerson("Ella Alexandra"); err != nil {
		t.Fatal(err)
	}
	_ = db.ConnectAccount("pornhub", "ella-alexandra", "Ella Alexandra")
	_ = db.SetTags("Twitter", "repost", []string{"Ella Alexandra"})

	up, _ := db.VideosUploadedBy("Ella Alexandra")
	if got := idSet(up); len(got) != 1 || !got["own"] {
		t.Errorf("uploads = %v, want {own}", got)
	}
	app, _ := db.VideosAppearing("Ella Alexandra")
	if got := idSet(app); len(got) != 2 || !got["cast"] || !got["repost"] {
		t.Errorf("appearing = %v, want {cast, repost}", got)
	}
	all, _ := db.VideosByModel("Ella Alexandra")
	if got := idSet(all); len(got) != 3 {
		t.Errorf("page = %v, want 3", got)
	}
	uns, _ := db.Unsorted()
	if got := idSet(uns); len(got) != 1 || !got["other"] {
		t.Errorf("unsorted = %v, want {other}", got)
	}
	// A new download from the connected account files itself via the join.
	_ = db.Upsert(Video{ID: "new", Site: "PornHub", Uploader: "Ella", UploaderID: "model/ella-alexandra"})
	up, _ = db.VideosUploadedBy("Ella Alexandra")
	if !idSet(up)["new"] {
		t.Errorf("new download from a connected account should be an upload")
	}
	// Disconnecting takes it all away again; the tag survives.
	_ = db.ConnectAccount("pornhub", "ella-alexandra", "")
	all, _ = db.VideosByModel("Ella Alexandra")
	if got := idSet(all); len(got) != 1 || !got["repost"] {
		t.Errorf("after disconnect = %v, want {repost}", got)
	}
	people, _ := db.People()
	if len(people) == 0 || people[0].Name != "" && people[0].Count != 1 {
		t.Errorf("people = %+v", people)
	}
}

// TestProfileLinkConnects: pasting a profile URL on the person is a deliberate
// claim — the account is created and connected.
func TestProfileLinkConnects(t *testing.T) {
	db := openTest(t)
	_ = db.Upsert(Video{ID: "old1", Site: "Twitter", WebpageURL: "https://x.com/NikkiiRyder/status/1/video/1"})
	_ = db.Upsert(Video{ID: "other1", Site: "Twitter", WebpageURL: "https://x.com/SomeReposter/status/3/video/1"})
	if err := db.SaveModelInfo("Nikki Ryder", "", "", []ModelLink{{Label: "X", URL: "https://x.com/NikkiiRyder"}}); err != nil {
		t.Fatal(err)
	}
	up, _ := db.VideosUploadedBy("Nikki Ryder")
	if got := idSet(up); len(got) != 1 || !got["old1"] {
		t.Errorf("uploads = %v, want {old1}", got)
	}
}

// TestDeleteAndRenamePerson: delete clears connections and tags; rename
// carries connections along.
func TestDeleteAndRenamePerson(t *testing.T) {
	db := openTest(t)
	_ = db.Upsert(Video{ID: "v", Site: "PornHub", Uploader: "A", UploaderID: "model/a"})
	_ = db.CreatePerson("A Person")
	_ = db.ConnectAccount("pornhub", "a", "A Person")
	_ = db.SetTags("PornHub", "v", []string{"Tagged One"})

	if err := db.RenameModel("A Person", "Renamed"); err != nil {
		t.Fatal(err)
	}
	if up, _ := db.VideosUploadedBy("Renamed"); len(up) != 1 {
		t.Errorf("rename lost the account connection")
	}
	if err := db.DeletePerson("Tagged One"); err != nil {
		t.Fatal(err)
	}
	vids, _ := db.query(`WHERE id='v'`)
	if len(vids[0].Models) != 0 {
		t.Errorf("delete left the tag: %v", vids[0].Models)
	}
	people, _ := db.People()
	for _, p := range people {
		if p.Name == "Tagged One" || p.Name == "A Person" {
			t.Errorf("stale person %q in %+v", p.Name, people)
		}
	}
}

// TestCleanupPeople: the one-time migration keeps only touched profiles,
// folds featured into tags, and drops tags the accounts already imply.
func TestCleanupPeople(t *testing.T) {
	path := filepath.Join(t.TempDir(), "test.db")
	db, err := Open(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	// Simulate a pre-cleanup catalogue: auto-created people everywhere.
	_, _ = db.sql.Exec(`DELETE FROM meta WHERE key=?`, peopleCleanupKey)
	ins := func(id, site, uploader, uploaderID, url, model, featured, cast string) {
		_, err := db.sql.Exec(`INSERT INTO videos (id,site,uploader,uploader_id,webpage_url,model,featured,cast,added,title,ext,filepath,filename,thumbnail,thumbnail_url,upload_date,tags,categories,description)
VALUES (?,?,?,?,?,?,?,?,'2026-01-01','','','','','','','','[]','[]','')`, id, site, uploader, uploaderID, url, model, featured, cast)
		if err != nil {
			t.Fatal(err)
		}
	}
	ins("a1", "PornHub", "ArabellaRose", "pornstar/arabella-rose", "", `["Arabella Rose"]`, `["Alex Adams"]`, `["Alex Adams","Arabella Rose"]`)
	ins("j1", "PornHub", "JunkChannel", "channels/junkchannel", "", `["JunkChannel"]`, ``, ``)
	ins("x1", "Twitter", "reposter", "", "https://x.com/reposter/status/1", `["Sophie Rain"]`, ``, ``)
	ins("l1", "Local", "", "", "", `["Sophie Rain","JunkChannel"]`, ``, ``)
	// Touched: Arabella (bio), Sophie (nickname). Untouched: JunkChannel, Alex Adams.
	_ = db.SaveModelInfo("Arabella Rose", "", "bio here", nil)
	_ = db.SaveModelInfo("Sophie Rain", "Soph", "", nil)
	_, _ = db.sql.Exec(`INSERT INTO model_info(name) VALUES('JunkChannel')`)
	// Born-linked (download-sourced) connections: survive only for a kept person.
	_ = db.UpsertAccount(AccountInfo{Platform: "pornhub", Handle: "arabella-rose", Source: "download"})
	_ = db.ConnectAccount("pornhub", "arabella-rose", "Arabella Rose")
	_ = db.UpsertAccount(AccountInfo{Platform: "pornhub", Handle: "junkchannel", Source: "download"})
	_ = db.ConnectAccount("pornhub", "junkchannel", "JunkChannel")
	db.Close()

	db, err = Open(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	rep := db.LastCleanup
	if rep == nil {
		t.Fatal("cleanup did not run")
	}
	if rep.Backup == "" {
		t.Errorf("no backup taken")
	}
	want := map[string]bool{"Arabella Rose": true, "Sophie Rain": true}
	for _, k := range rep.Kept {
		if !want[k] {
			t.Errorf("kept unexpected %q", k)
		}
		delete(want, k)
	}
	if len(want) != 0 {
		t.Errorf("not kept: %v (report %+v)", want, rep)
	}
	for _, d := range rep.Deleted {
		if d != "JunkChannel" && d != "Alex Adams" {
			t.Errorf("deleted unexpected %q", d)
		}
	}
	people, _ := db.People()
	names := []string{}
	for _, p := range people {
		names = append(names, p.Name)
	}
	if len(people) != 3 { // Arabella, Sophie, Unsorted(j1)
		t.Errorf("people after cleanup: %v", names)
	}
	vids, _ := db.query(`WHERE 1=1`)
	by := map[string]Video{}
	for _, v := range vids {
		by[v.ID] = v
	}
	if len(by["a1"].Models) != 0 || by["a1"].Owner != "Arabella Rose" { // owner implied by account; Alex deleted
		t.Errorf("a1: models=%v owner=%q", by["a1"].Models, by["a1"].Owner)
	}
	if len(by["j1"].Models) != 0 || len(by["j1"].People) != 0 {
		t.Errorf("j1 should be unsorted: models=%v people=%v", by["j1"].Models, by["j1"].People)
	}
	if got := by["x1"].Models; len(got) != 1 || got[0] != "Sophie Rain" {
		t.Errorf("x1 tag should survive: %v", got)
	}
	if got := by["l1"].Models; len(got) != 1 || got[0] != "Sophie Rain" {
		t.Errorf("l1 should keep Sophie only: %v", got)
	}
	if by["x1"].SourceHandle != "reposter" {
		t.Errorf("x1 source not recorded: %+v", by["x1"].SourceHandle)
	}
	// Idempotent: reopening does nothing.
	db.Close()
	db3, err := Open(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer db3.Close()
	if db3.LastCleanup != nil {
		t.Errorf("cleanup ran twice")
	}
}
