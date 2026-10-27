package downloader

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type storedQueue struct {
	Version  int         `json:"version"`
	Sequence uint64      `json:"sequence"`
	Jobs     []storedJob `json:"jobs"`
}

type storedJob struct {
	Job
	Replacement *storedReplacement `json:"replacement,omitempty"`
}

type storedReplacement struct {
	Site    string `json:"site"`
	ID      string `json:"id"`
	OldFile string `json:"oldFile"`
}

func (d *Downloader) queuePath() string {
	if d.cfg.StateDir == "" {
		return ""
	}
	return filepath.Join(d.cfg.StateDir, "queue.json")
}

// saveQueueLocked serializes writes with queue mutations. The previous snapshot
// remains intact until the complete new snapshot has been flushed and renamed.
func (d *Downloader) saveQueueLocked() error {
	path := d.queuePath()
	if path == "" || d.queueStoreBlocked {
		return nil
	}
	saved := storedQueue{Version: 1, Sequence: d.seq}
	for _, id := range d.order {
		j := d.jobs[id]
		if j == nil || j.Status == "removed" {
			continue
		}
		s := storedJob{Job: *j}
		if r := j.replace; r != nil {
			s.Replacement = &storedReplacement{Site: r.site, ID: r.id, OldFile: r.oldFile}
		}
		saved.Jobs = append(saved.Jobs, s)
	}
	data, err := json.MarshalIndent(saved, "", "  ")
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(path), "queue-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if _, err = f.Write(data); err != nil {
		f.Close()
		return err
	}
	if err = f.Sync(); err != nil {
		f.Close()
		return err
	}
	if err = f.Close(); err != nil {
		return err
	}
	return os.Rename(f.Name(), path)
}

// loadQueue runs before the worker starts. Interrupted transfers are retried
// from the queue; this does not promise byte-level media resume.
func (d *Downloader) loadQueue() error {
	path := d.queuePath()
	if path == "" {
		return nil
	}
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		d.queueStoreBlocked = true
		return err
	}
	var saved storedQueue
	if err = json.Unmarshal(data, &saved); err != nil {
		backup := path + ".corrupt-" + strconv.FormatInt(time.Now().UnixNano(), 10)
		if moveErr := os.Rename(path, backup); moveErr != nil {
			d.queueStoreBlocked = true
			return fmt.Errorf("invalid saved queue; could not preserve it: %w", moveErr)
		}
		return fmt.Errorf("invalid saved queue preserved at %s: %w", backup, err)
	}
	if saved.Version != 1 {
		d.queueStoreBlocked = true
		return fmt.Errorf("unsupported saved queue version %d; file left unchanged", saved.Version)
	}
	d.seq = saved.Sequence
	for _, s := range saved.Jobs {
		j := s.Job
		if j.ID == "" || j.URL == "" || j.Status == "removed" || d.jobs[j.ID] != nil {
			continue
		}
		if n, err := strconv.ParseUint(j.ID, 36, 64); err == nil && n > d.seq {
			d.seq = n
		}
		if r := s.Replacement; r != nil {
			j.replace = &replaceTarget{site: r.Site, id: r.ID, oldFile: r.OldFile}
		}
		if j.Status == "downloading" {
			j.Status, j.Percent, j.Count, j.Error = "queued", 0, 0, ""
		}
		j.Speed, j.ETA = "", ""
		if j.Replace && j.replace == nil {
			j.Status, j.Error = "error", "Saved replacement details are missing. Re-download from the library instead."
		}
		d.jobs[j.ID] = &j
		d.order = append(d.order, j.ID)
	}
	return nil
}

func (d *Downloader) persistQueueLocked() {
	if err := d.saveQueueLocked(); err != nil {
		log.Printf("save download queue: %v", err)
	}
}
