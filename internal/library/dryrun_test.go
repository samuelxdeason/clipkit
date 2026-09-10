package library

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"testing"
)

// TestCleanupDryRun runs the people cleanup against a COPY of a real catalogue
// (TROVE_DRYRUN_DB=<path>) and prints the report. Skipped otherwise.
func TestCleanupDryRun(t *testing.T) {
	src := os.Getenv("TROVE_DRYRUN_DB")
	if src == "" {
		t.Skip("set TROVE_DRYRUN_DB to a catalogue path")
	}
	dst := filepath.Join(t.TempDir(), "copy.db")
	in, err := os.Open(src)
	if err != nil {
		t.Fatal(err)
	}
	out, _ := os.Create(dst)
	if _, err := io.Copy(out, in); err != nil {
		t.Fatal(err)
	}
	in.Close()
	out.Close()
	db, err := Open(dst, filepath.Dir(src))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	rep := db.LastCleanup
	if rep == nil {
		t.Fatal("cleanup did not run (already marked done?)")
	}
	b, _ := json.MarshalIndent(rep, "", "  ")
	os.WriteFile(os.Getenv("TROVE_DRYRUN_OUT"), b, 0o644)
	people, _ := db.People()
	t.Logf("kept=%d deleted=%d sourceFill=%d tagsKept=%d tagsDerived=%d tagsDropped=%d", len(rep.Kept), len(rep.Deleted), rep.SourceFill, rep.TagsKept, rep.TagsDerived, rep.TagsDropped)
	for _, p := range people {
		t.Logf("  %-28s %4d videos  sites=%s", p.Name, p.Count, p.Sites)
	}
	uns, _ := db.Unsorted()
	t.Logf("unsorted=%d", len(uns))
}
