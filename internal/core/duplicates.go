package core

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"trove/internal/library"
)

func (c *Core) DuplicateGroups() ([]library.DuplicateGroup, error) { return c.db.DuplicateGroups() }
func (c *Core) CreateDuplicateGroup(keys []library.VideoKey) (int64, error) {
	id, err := c.db.CreateDuplicateGroup(keys)
	if err == nil {
		c.emit("library", nil)
	}
	return id, err
}
func (c *Core) ResolveDuplicateGroup(id int64, keep []library.VideoKey) error {
	err := c.db.ResolveDuplicateGroup(id, keep)
	if err == nil {
		c.emit("library", nil)
	}
	return err
}

// DuplicateScanReport summarises one find-duplicates run.
type DuplicateScanReport struct {
	Scanned int // candidate groups found that are not already queued
	Queued  int // groups saved to the review queue (0 on a dry run)
}

// FindDuplicatesAt scans the catalogue at mediaRoot for probable duplicate
// videos and, unless dryRun, queues each group for review in the app. Safe
// alongside a running app: it only inserts review rows, after backing the
// catalogue up. Media files are never touched.
func FindDuplicatesAt(mediaRoot string, dryRun bool) (candidates []library.DuplicateCandidate, rep DuplicateScanReport, backup string, err error) {
	sdir := stateDir(mediaRoot)
	dbPath, _ := resolveDBPath(mediaRoot, sdir)
	db, err := library.Open(dbPath, mediaRoot)
	if err != nil {
		return nil, rep, "", err
	}
	defer db.Close()
	candidates, err = db.FindDuplicateCandidates()
	if err != nil {
		return nil, rep, "", err
	}
	rep.Scanned = len(candidates)
	if dryRun || len(candidates) == 0 {
		return candidates, rep, "", nil
	}
	c := &Core{db: db, mediaRoot: mediaRoot, stateDir: sdir, emit: func(string, any) {}}
	if backup, err = c.BackupCatalogue(); err != nil {
		return candidates, rep, "", err
	}
	for _, cand := range candidates {
		if _, err := db.CreateDuplicateGroup(cand.Keys()); err != nil {
			return candidates, rep, backup, err
		}
		rep.Queued++
	}
	return candidates, rep, backup, nil
}

// MergeSameFileRowsAt folds catalogue rows that point at one file into a
// single row each (see library.MergeSameFileRows). Unless dryRun, it backs
// the catalogue up first and writes the dropped rows, with their collection
// memberships, to a JSON file beside the backup so nothing is lost.
func MergeSameFileRowsAt(mediaRoot string, dryRun bool) (rep library.MergeReport, backup, export string, err error) {
	sdir := stateDir(mediaRoot)
	dbPath, _ := resolveDBPath(mediaRoot, sdir)
	db, err := library.Open(dbPath, mediaRoot)
	if err != nil {
		return rep, "", "", err
	}
	defer db.Close()
	if dryRun {
		rep, err = db.MergeSameFileRows(true)
		return rep, "", "", err
	}
	c := &Core{db: db, mediaRoot: mediaRoot, stateDir: sdir, emit: func(string, any) {}}
	if backup, err = c.BackupCatalogue(); err != nil {
		return rep, "", "", err
	}
	rep, err = db.MergeSameFileRows(false)
	if len(rep.Files) > 0 {
		export = strings.TrimSuffix(backup, ".db") + "-merged-rows.json"
		if data, jerr := json.MarshalIndent(rep.Files, "", "  "); jerr == nil {
			if werr := os.WriteFile(export, data, 0o600); werr != nil {
				err = errors.Join(err, fmt.Errorf("write %s: %w", export, werr))
			}
		}
	}
	return rep, backup, export, err
}

// DuplicateRecycleFolder is where resolved duplicates are moved, shown in the
// review queue so the user knows where to free space later.
func (c *Core) DuplicateRecycleFolder() string {
	return filepath.Join(c.mediaRoot, library.RecycleDirName)
}
