package core

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"trove/internal/downloader"
)

// Bound CPU/disk work independently of the active download queue.
var triptychSlot = make(chan struct{}, 1)

func (c *Core) ServeTriptych(w http.ResponseWriter, r *http.Request) {
	v, ok, err := c.db.VisibleVideoByKey(r.URL.Query().Get("site"), r.URL.Query().Get("id"))
	if err != nil || !ok || v.Width == nil || v.Height == nil || *v.Width <= 0 || *v.Height <= *v.Width || v.Duration == nil || *v.Duration <= 0 {
		http.NotFound(w, r)
		return
	}
	// Resolve symlinks as well as traversal before opening any source file.
	root, err := filepath.EvalSymlinks(c.mediaRoot)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	source, err := filepath.EvalSymlinks(v.Filepath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	rel, err := filepath.Rel(root, source)
	if err != nil || filepath.IsAbs(rel) || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		http.NotFound(w, r)
		return
	}
	stat, err := os.Stat(source)
	if err != nil || !stat.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}
	key := sha256.Sum256([]byte(fmt.Sprintf("v1|%s|%s|%s|%d|%d", v.Site, v.ID, source, stat.Size(), stat.ModTime().UnixNano())))
	directory := filepath.Join(c.stateDir, "cache", "triptychs")
	output := filepath.Join(directory, fmt.Sprintf("%x.jpg", key))
	if info, err := os.Stat(output); err == nil && info.Size() > 0 {
		w.Header().Set("Cache-Control", "private, max-age=3600")
		http.ServeFile(w, r, output)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
	defer cancel()
	select {
	case triptychSlot <- struct{}{}:
		defer func() { <-triptychSlot }()
	case <-ctx.Done():
		http.Error(w, "Preview unavailable", http.StatusServiceUnavailable)
		return
	}
	if _, err := os.Stat(output); err != nil {
		if err := os.MkdirAll(directory, 0700); err != nil {
			http.Error(w, "Preview unavailable", 503)
			return
		}
		temp, err := os.CreateTemp(directory, "preview-*.jpg")
		if err != nil {
			http.Error(w, "Preview unavailable", 503)
			return
		}
		name := temp.Name()
		temp.Close()
		defer os.Remove(name)
		if err := downloader.WriteTriptych(ctx, ffmpegPath(), source, name, *v.Duration); err != nil {
			http.Error(w, "Preview unavailable", 503)
			return
		}
		if info, err := os.Stat(name); err != nil || info.Size() == 0 {
			http.Error(w, "Preview unavailable", 503)
			return
		}
		if err := os.Rename(name, output); err != nil {
			http.Error(w, "Preview unavailable", 503)
			return
		}
	}
	w.Header().Set("Cache-Control", "private, max-age=3600")
	http.ServeFile(w, r, output)
}
