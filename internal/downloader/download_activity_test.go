package downloader

import (
	"testing"
	"time"
)

func TestDownloadActivityAcrossStreams(t *testing.T) {
	now := time.Unix(0, 0)
	a := downloadActivity{lastBytes: -1, lastActive: now}
	a.progress(10000, now)
	a.progress(10, now.Add(90*time.Second)) // next stream / retry
	a.progress(20, now.Add(180*time.Second))
	if a.expired(now.Add(240*time.Second), 2*time.Minute) {
		t.Fatal("healthy second stream timed out")
	}
	a.progress(20, now.Add(290*time.Second)) // identical bytes cannot keep a stall alive
	a.progress(-1, now.Add(299*time.Second))
	if !a.expired(now.Add(301*time.Second), 2*time.Minute) {
		t.Fatal("stalled transfer did not time out")
	}
	a.processing = true
	if a.expired(now.Add(time.Hour), 2*time.Minute) {
		t.Fatal("silent post-processing timed out")
	}
}

func TestProgressKeepsQueueRowFields(t *testing.T) {
	d := newTestDL()
	j := &Job{ID: "1", URL: "https://example.test/video", Title: "Example", Status: "downloading", Replace: true}
	var got Job
	d.emit = func(event string, data any) {
		if event == "progress" {
			got = data.(Job)
		}
	}
	d.applyProgress(j, "50.0%|1MiB/s|00:02|1024")
	if got.Status != j.Status || got.Title != j.Title || got.URL != j.URL || !got.Replace || got.Percent != 50 || got.Speed != "1MiB/s" || got.ETA != "00:02" {
		t.Fatalf("bad progress row: %+v", got)
	}
}
