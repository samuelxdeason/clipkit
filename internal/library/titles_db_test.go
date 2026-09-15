package library

import "testing"

func mustVideo(t *testing.T, db *DB, site, id string) Video {
	t.Helper()
	v, ok, err := db.VideoByKey(site, id)
	if err != nil || !ok {
		t.Fatalf("video %s/%s: ok=%v err=%v", site, id, ok, err)
	}
	return v
}

func TestCleanTitlesKeepsOriginalsAndSkipsManual(t *testing.T) {
	db := openTestDB(t)
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(db.Upsert(Video{Site: "Local", ID: "a", Title: "Sophie Rain Pajama Shorts Strip Tease Video Leaked", Uploader: "Sophie Rain", Models: []string{"Sophie Rain"}, Added: "2026-01-01"}))
	must(db.Upsert(Video{Site: "PornHub", ID: "b", Title: "Giving is as good as receiving", Uploader: "x", Added: "2026-01-02"}))
	must(db.Upsert(Video{Site: "Twitter", ID: "c", Title: "Someone - https://t.co/x", Uploader: "Someone", Description: "https://t.co/x", Added: "2026-01-03"}))
	must(db.Upsert(Video{Site: "PornHub", ID: "d", Title: "LOUD TITLE!!!", Uploader: "x", Added: "2026-01-04"}))
	must(db.SetTitle("PornHub", "d", "My own name"))

	rep, err := db.CleanTitles(false)
	must(err)
	if rep.Checked != 3 || rep.Changed != 2 || rep.Fallback != 1 {
		t.Fatalf("report = %+v, want checked 3 changed 2 fallback 1", rep)
	}

	a := mustVideo(t, db, "Local", "a")
	if a.Title != "Pajama Shorts Strip Tease" || a.SourceTitle != "Sophie Rain Pajama Shorts Strip Tease Video Leaked" || a.TitleStatus != TitleRules {
		t.Fatalf("a = %q / %q / %q", a.Title, a.SourceTitle, a.TitleStatus)
	}
	b := mustVideo(t, db, "PornHub", "b")
	if b.Title != "Giving is as good as receiving" || b.SourceTitle != "" || b.TitleStatus != TitleRules {
		t.Fatalf("unchanged b = %q / %q / %q", b.Title, b.SourceTitle, b.TitleStatus)
	}
	c := mustVideo(t, db, "Twitter", "c")
	if c.Title != "Someone clip" || !containsFold(c.Labels, NeedsTitleLabel) {
		t.Fatalf("fallback c = %q labels=%v", c.Title, c.Labels)
	}
	d := mustVideo(t, db, "PornHub", "d")
	if d.Title != "My own name" || d.SourceTitle != "LOUD TITLE!!!" || d.TitleStatus != TitleStatusManual {
		t.Fatalf("manual d = %q / %q / %q", d.Title, d.SourceTitle, d.TitleStatus)
	}

	// The original title still finds the video; a second pass has nothing to do.
	hits, err := db.Search("Video Leaked")
	must(err)
	if len(hits) != 1 || hits[0].ID != "a" {
		t.Fatalf("search by source title: %+v", hits)
	}
	rep, err = db.CleanTitles(false)
	must(err)
	if rep.Checked != 0 {
		t.Fatalf("second pass checked %d rows, want 0", rep.Checked)
	}
}

func TestUpsertKeepsEditedTitles(t *testing.T) {
	db := openTestDB(t)
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(db.Upsert(Video{Site: "Local", ID: "a", Title: "Alinity Nude Shower Scrubbing Onlyfans Video Leaked", Uploader: "x", Added: "2026-01-01"}))
	must(db.Upsert(Video{Site: "Local", ID: "b", Title: "Plain title", Uploader: "x", Added: "2026-01-01"}))
	must(db.Upsert(Video{Site: "Local", ID: "c", Title: "Anything", Uploader: "x", Added: "2026-01-01"}))
	if _, err := db.CleanTitles(false); err != nil {
		t.Fatal(err)
	}
	must(db.SetTitle("Local", "c", "Hand typed"))

	// Re-download / rebuild upserts the raw source title again.
	must(db.Upsert(Video{Site: "Local", ID: "a", Title: "Alinity Nude Shower Scrubbing Onlyfans Video Leaked", Uploader: "x", Added: "2026-02-01"}))
	must(db.Upsert(Video{Site: "Local", ID: "b", Title: "Plain title v2", Uploader: "x", Added: "2026-02-01"}))
	must(db.Upsert(Video{Site: "Local", ID: "c", Title: "Anything", Uploader: "x", Added: "2026-02-01"}))

	if a := mustVideo(t, db, "Local", "a"); a.Title != "Alinity Nude Shower Scrubbing" || a.TitleStatus != TitleRules {
		t.Fatalf("cleaned title lost on re-upsert: %q / %q", a.Title, a.TitleStatus)
	}
	if b := mustVideo(t, db, "Local", "b"); b.Title != "Plain title v2" || b.TitleStatus != "" {
		t.Fatalf("untouched title should follow the source and reset status: %q / %q", b.Title, b.TitleStatus)
	}
	if c := mustVideo(t, db, "Local", "c"); c.Title != "Hand typed" || c.TitleStatus != TitleStatusManual {
		t.Fatalf("manual title lost on re-upsert: %q / %q", c.Title, c.TitleStatus)
	}
}
