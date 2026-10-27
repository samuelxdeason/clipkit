package downloader

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func restoredQueue(t *testing.T, dir string) *Downloader {
	t.Helper()
	d := newTestDL()
	d.cfg.StateDir = dir
	if err := d.loadQueue(); err != nil {
		t.Fatal(err)
	}
	return d
}

func TestQueueSurvivesRestartAndEdits(t *testing.T) {
	dir := t.TempDir()
	d := restoredQueue(t, dir)
	a := d.Enqueue("https://example.test/a")
	b := d.Enqueue("https://example.test/b")
	c := d.Enqueue("https://example.test/c")
	if err := d.MoveJob(c, "next"); err != nil {
		t.Fatal(err)
	}
	d.RemoveJob(b)
	d.jobs[c].Status = "downloading"
	d.jobs[c].Percent, d.jobs[c].Speed, d.jobs[c].ETA = 40, "1MiB/s", "10"
	d.jobs[a].Status, d.jobs[a].Error = "error", "test failure"
	d.jobs[a].Replace = true
	d.jobs[a].replace = &replaceTarget{site: "Example", id: "a", oldFile: "original.mp4"}
	d.emitQueue()

	reopened := restoredQueue(t, dir)
	if !reflect.DeepEqual(reopened.order, []string{c, a}) {
		t.Fatalf("order: %v", reopened.order)
	}
	active := reopened.jobs[c]
	if active.Status != "queued" || active.Percent != 0 || active.Speed != "" || active.ETA != "" {
		t.Fatalf("interrupted job: %+v", active)
	}
	failed := reopened.jobs[a]
	if failed.Status != "error" || failed.Error != "test failure" || !reflect.DeepEqual(failed.replace, d.jobs[a].replace) {
		t.Fatalf("failed replacement: %+v", failed)
	}
	if reopened.RetryFailed(a) != 1 {
		t.Fatal("retry failed")
	}
	again := restoredQueue(t, dir)
	if again.jobs[a].Status != "queued" || again.jobs[a].replace == nil {
		t.Fatal("retry/replacement not persisted")
	}
	newID := again.Enqueue("https://example.test/new")
	if newID == a || newID == b || newID == c {
		t.Fatalf("ID reused: %s", newID)
	}
	again.jobs[c].Status = "done"
	again.ClearCompleted()
	last := restoredQueue(t, dir)
	if last.jobs[c] != nil {
		t.Fatal("cleared completed job returned")
	}
	if len(last.order) != 2 {
		t.Fatalf("unexpected queue: %v", last.order)
	}
}

func TestQueueCorruptionPreserved(t *testing.T) {
	d := newTestDL()
	d.cfg.StateDir = t.TempDir()
	path := d.queuePath()
	const broken = `{"version":1,"jobs":[`
	if err := os.WriteFile(path, []byte(broken), 0600); err != nil {
		t.Fatal(err)
	}
	if err := d.loadQueue(); err == nil {
		t.Fatal("expected corruption error")
	}
	backups, _ := filepath.Glob(path + ".corrupt-*")
	if len(backups) != 1 {
		t.Fatalf("backups: %v", backups)
	}
	data, err := os.ReadFile(backups[0])
	if err != nil || string(data) != broken {
		t.Fatal("corrupt queue not preserved")
	}
	d.Enqueue("https://example.test/new")
	if len(restoredQueue(t, d.cfg.StateDir).order) != 1 {
		t.Fatal("new queue not saved")
	}
}

func TestQueueNewerVersionNotOverwritten(t *testing.T) {
	d := newTestDL()
	d.cfg.StateDir = t.TempDir()
	const future = `{"version":99,"jobs":[]}`
	if err := os.WriteFile(d.queuePath(), []byte(future), 0600); err != nil {
		t.Fatal(err)
	}
	if err := d.loadQueue(); err == nil {
		t.Fatal("expected unsupported version")
	}
	d.Enqueue("https://example.test/new")
	data, err := os.ReadFile(d.queuePath())
	if err != nil || string(data) != future {
		t.Fatal("newer queue overwritten")
	}
}
