package library

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const RecycleDirName = "Recycle bin"

type recycledFile struct {
	Original string `json:"original"`
	Recycled string `json:"recycled"`
}

// Resolve links before checking containment. Never move files outside the vault,
// or use a recycle directory redirected to another location by a symlink/junction.
func withinRecycleRoot(root, path string) bool {
	rel, err := filepath.Rel(root, path)
	return err == nil && rel != "." && rel != ".." && !filepath.IsAbs(rel) && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func (db *DB) recycleDuplicateFiles(paths, protected []string) (func() error, error) {
	root, err := filepath.EvalSymlinks(db.root)
	if err != nil {
		return nil, fmt.Errorf("resolve vault folder %s: %w", db.root, err)
	}
	root, err = filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	var sources []string
	seen := map[string]bool{}
	for _, path := range paths {
		if path == "" {
			return nil, fmt.Errorf("video has no file path; nothing was recycled")
		}
		source, err := filepath.EvalSymlinks(path)
		if err != nil {
			return nil, fmt.Errorf("cannot recycle %s: %w", path, err)
		}
		source, err = filepath.Abs(source)
		if err != nil {
			return nil, err
		}
		if !withinRecycleRoot(root, source) || withinRecycleRoot(filepath.Join(root, RecycleDirName), source) {
			return nil, fmt.Errorf("video is outside the active vault: %s", path)
		}
		info, err := os.Stat(source)
		if err != nil {
			return nil, err
		}
		if !info.Mode().IsRegular() {
			return nil, fmt.Errorf("video is not a regular file: %s", path)
		}
		for _, other := range protected {
			otherInfo, err := os.Stat(other)
			if err != nil && !os.IsNotExist(err) {
				return nil, fmt.Errorf("cannot check shared file %s: %w", other, err)
			}
			if err == nil && os.SameFile(info, otherInfo) {
				return nil, fmt.Errorf("file is still used by a video or photo you are keeping: %s", path)
			}
		}
		if !seen[source] {
			sources = append(sources, source)
			seen[source] = true
		}
	}
	bin := filepath.Join(root, RecycleDirName)
	if err := os.MkdirAll(bin, 0755); err != nil {
		return nil, err
	}
	resolved, err := filepath.EvalSymlinks(bin)
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(resolved, bin) {
		return nil, fmt.Errorf("recycle folder must not be redirected: %s", bin)
	}
	batch, err := os.MkdirTemp(bin, time.Now().Format("2006-01-02_150405")+"-*")
	if err != nil {
		return nil, err
	}
	var plan []recycledFile
	for _, source := range sources {
		rel, err := filepath.Rel(root, source)
		if err != nil {
			return nil, err
		}
		dest := filepath.Join(batch, rel)
		if !withinRecycleRoot(batch, dest) {
			return nil, fmt.Errorf("invalid recycle destination")
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
			return nil, err
		}
		plan = append(plan, recycledFile{source, dest})
	}
	// Keep an on-disk map of original paths, including if the process is interrupted.
	data, err := json.MarshalIndent(plan, "", "  ")
	if err != nil {
		return nil, err
	}
	manifest, err := os.OpenFile(filepath.Join(batch, "recycle-manifest.json"), os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return nil, err
	}
	_, writeErr := manifest.Write(data)
	syncErr := manifest.Sync()
	closeErr := manifest.Close()
	if err := errors.Join(writeErr, syncErr, closeErr); err != nil {
		return nil, err
	}
	var moved []recycledFile
	undo := func() error {
		var failures []error
		for i := len(moved) - 1; i >= 0; i-- {
			item := moved[i]
			if _, err := os.Lstat(item.Original); !os.IsNotExist(err) {
				failures = append(failures, fmt.Errorf("cannot restore %s; recover it from %s", item.Original, item.Recycled))
				continue
			}
			if err := os.Rename(item.Recycled, item.Original); err != nil {
				failures = append(failures, fmt.Errorf("restore %s from %s: %w", item.Original, item.Recycled, err))
			}
		}
		return errors.Join(failures...)
	}
	for _, item := range plan {
		// Rename stays on the same filesystem and never copies/deletes video bytes.
		if _, err := os.Lstat(item.Recycled); !os.IsNotExist(err) {
			return nil, errors.Join(fmt.Errorf("recycle destination already exists: %s", item.Recycled), undo())
		}
		if err := os.Rename(item.Original, item.Recycled); err != nil {
			return nil, errors.Join(fmt.Errorf("could not move %s to recycle bin (close its player and retry): %w", item.Original, err), undo())
		}
		moved = append(moved, item)
	}
	return undo, nil
}
