package downloader

import "time"

// Access is guarded by the running download's mutex.
type downloadActivity struct {
	lastBytes  int64
	lastActive time.Time
	processing bool
}

func (a *downloadActivity) progress(bytes int64, now time.Time) {
	if bytes < 0 {
		return
	}
	// A lower counter starts a new audio/video transfer or a retry. Keeping
	// the previous stream's high-water mark would falsely time out that stream.
	if bytes != a.lastBytes {
		a.lastBytes, a.lastActive = bytes, now
	}
	a.processing = false
}

func (a *downloadActivity) expired(now time.Time, timeout time.Duration) bool {
	return !a.processing && now.Sub(a.lastActive) > timeout
}
