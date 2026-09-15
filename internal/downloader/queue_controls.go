package downloader

import "fmt"

// MoveJob changes only waiting jobs; history and active work keep their slots.
func (d *Downloader) MoveJob(id, direction string) error {
	if direction != "up" && direction != "down" && direction != "next" {
		return fmt.Errorf("unknown queue direction")
	}
	d.mu.Lock()
	positions := []int{}
	from := -1
	for i, jid := range d.order {
		if j := d.jobs[jid]; j != nil && j.Status == "queued" {
			if jid == id {
				from = len(positions)
			}
			positions = append(positions, i)
		}
	}
	if from < 0 {
		d.mu.Unlock()
		return fmt.Errorf("this download is no longer waiting")
	}
	to := 0
	if direction == "up" {
		to = from - 1
	}
	if direction == "down" {
		to = from + 1
	}
	if to >= 0 && to < len(positions) {
		step := 1
		if to < from {
			step = -1
		}
		for i := from; i != to; i += step {
			a, b := positions[i], positions[i+step]
			d.order[a], d.order[b] = d.order[b], d.order[a]
		}
	}
	d.mu.Unlock()
	d.emitQueue()
	return nil
}

// RetryFailed reuses failed jobs, preserving replacement metadata. Empty id retries all.
func (d *Downloader) RetryFailed(id string) int {
	d.mu.Lock()
	inflight := map[string]bool{}
	for _, jid := range d.order {
		j := d.jobs[jid]
		if j.Status == "queued" || j.Status == "downloading" {
			inflight[j.URL] = true
		}
	}
	retried := []string{}
	kept := []string{}
	for _, jid := range d.order {
		j := d.jobs[jid]
		if j.Status == "error" && (id == "" || id == jid) && !inflight[j.URL] {
			j.Status, j.Error, j.Speed, j.ETA = "queued", "", "", ""
			j.Percent, j.Count = 0, 0
			inflight[j.URL] = true
			retried = append(retried, jid)
		} else {
			kept = append(kept, jid)
		}
	}
	d.order = append(kept, retried...)
	d.mu.Unlock()
	if len(retried) > 0 {
		select {
		case d.wake <- struct{}{}:
		default:
		}
		d.emitQueue()
	}
	return len(retried)
}

func (d *Downloader) ClearCompleted() {
	d.mu.Lock()
	kept := []string{}
	for _, id := range d.order {
		if s := d.jobs[id].Status; s != "done" && s != "duplicate" {
			kept = append(kept, id)
		}
	}
	d.order = kept
	d.mu.Unlock()
	d.emitQueue()
}
