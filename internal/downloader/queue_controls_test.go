package downloader

import (
	"reflect"
	"testing"
)

func queueFixture() *Downloader {
	d := newTestDL()
	for _, j := range []Job{
		{ID: "active", URL: "active", Status: "downloading"},
		{ID: "a", URL: "a", Status: "queued"},
		{ID: "done", URL: "done", Status: "done"},
		{ID: "b", URL: "b", Status: "queued"},
		{ID: "c", URL: "c", Status: "queued"},
		{ID: "failed", URL: "failed", Status: "error", Replace: true, Error: "old error", Percent: 80, replace: &replaceTarget{site: "example", id: "1"}},
	} {
		j := j
		d.jobs[j.ID] = &j
		d.order = append(d.order, j.ID)
	}
	return d
}

func TestMoveWaitingJobs(t *testing.T) {
	d := queueFixture()
	for _, move := range []struct {
		id, direction string
		want          []string
	}{
		{"c", "next", []string{"active", "c", "done", "a", "b", "failed"}},
		{"c", "down", []string{"active", "a", "done", "c", "b", "failed"}},
		{"b", "up", []string{"active", "a", "done", "b", "c", "failed"}},
		{"a", "up", []string{"active", "a", "done", "b", "c", "failed"}},
	} {
		if err := d.MoveJob(move.id, move.direction); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(d.order, move.want) {
			t.Fatalf("got %v want %v", d.order, move.want)
		}
	}
	for _, id := range []string{"active", "done", "missing"} {
		if d.MoveJob(id, "next") == nil {
			t.Fatalf("moved non-waiting job %s", id)
		}
	}
	if d.MoveJob("a", "invalid") == nil {
		t.Fatal("accepted invalid direction")
	}
}

func TestRetryAndClearPreserveWork(t *testing.T) {
	d := queueFixture()
	d.ClearCompleted()
	if !reflect.DeepEqual(d.order, []string{"active", "a", "b", "c", "failed"}) {
		t.Fatal(d.order)
	}
	if n := d.RetryFailed(""); n != 1 {
		t.Fatal(n)
	}
	j := d.jobs["failed"]
	if j.Status != "queued" || j.Error != "" || j.Percent != 0 || !j.Replace || j.replace == nil {
		t.Fatalf("bad retry: %+v", j)
	}
	if n := d.RetryFailed(""); n != 0 {
		t.Fatalf("retried in-flight work: %d", n)
	}
	d.jobs["duplicate-failure"] = &Job{ID: "duplicate-failure", URL: "failed", Status: "error"}
	d.order = append(d.order, "duplicate-failure")
	if n := d.RetryFailed(""); n != 0 {
		t.Fatalf("duplicated URL in flight: %d", n)
	}
}
