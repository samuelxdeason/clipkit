// People are MANUAL. A person exists only because the user created one (the
// registry is the model_info table), and a person gets platform accounts only
// because the user connected them. Nothing on the ingest path ever creates a
// person or writes a person's name onto a video.
//
// Accounts are AUTOMATIC: every download records the account it came from
// (videos.source_platform/source_handle) and, for Pornhub, the cast accounts.
//
// A person's videos are then derived, never stored:
//
//	uploads    = videos whose source account is connected to the person
//	appears in = videos the user tagged with the person (videos.model)
//	           ∪ videos whose cast contains an account connected to the person
//
// Unsorted = videos that fall in nobody's set.
package library

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"time"
)

const metaSchema = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);`

// ---- registry ------------------------------------------------------------

// EnsurePerson makes sure a person exists in the registry (no-op if present).
func (db *DB) EnsurePerson(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil
	}
	_, err := db.sql.Exec(`INSERT OR IGNORE INTO model_info(name, updated) VALUES(?, ?)`,
		name, time.Now().Format("2006-01-02 15:04:05"))
	return err
}

// CreatePerson adds a person to the registry (the only way people come to be).
func (db *DB) CreatePerson(name string) error {
	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("a person needs a name")
	}
	return db.EnsurePerson(name)
}

// DeletePerson removes a person: registry row, account connections, and every
// manual tag. Photos are left on disk and in the catalogue (they return if the
// person is re-created under the same name).
func (db *DB) DeletePerson(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil
	}
	if _, err := db.sql.Exec(`DELETE FROM model_info WHERE name=?`, name); err != nil {
		return err
	}
	if _, err := db.sql.Exec(`UPDATE accounts SET person='' WHERE person=?`, name); err != nil {
		return err
	}
	return db.removeTagEverywhere(name)
}

// personNames returns every registered person.
func (db *DB) personNames() ([]string, error) {
	rows, err := db.sql.Query(`SELECT name FROM model_info WHERE name<>'' ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var n string
		if rows.Scan(&n) == nil && strings.TrimSpace(n) != "" {
			out = append(out, n)
		}
	}
	return out, rows.Err()
}

// ---- source account (stored at ingest) -----------------------------------

// deriveSource works out the platform account a video came from, using the
// platform's canonical id where there is one. "" when the site has no account
// notion we understand (Local imports).
func deriveSource(v Video) (platform, handle string) {
	switch {
	case strings.EqualFold(v.Site, "Twitter"):
		if h := XHandleFromURL(v.WebpageURL); h != "" {
			return "x", h
		}
	case strings.EqualFold(v.Site, "PornHub"):
		if _, h := ParsePHUploaderID(v.UploaderID); h != "" {
			return "pornhub", h
		}
		if h := HandleSlug(v.Uploader); h != "" {
			return "pornhub", h
		}
	case strings.EqualFold(v.Site, "RedGifs"):
		if h := HandleSlug(v.Uploader); h != "" {
			return "redgifs", h
		}
	}
	return "", ""
}

// sourceAccount is the stored source as an Account key ("", false if none).
func sourceAccount(v Video) (Account, bool) {
	if v.SourceHandle == "" {
		return Account{}, false
	}
	return Account{Platform: v.SourcePlatform, Handle: v.SourceHandle}, true
}

// accountPersonMap loads every connected account -> person in one query.
func (db *DB) accountPersonMap() (map[Account]string, error) {
	rows, err := db.sql.Query(`SELECT platform, handle, person FROM accounts WHERE person<>''`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := map[Account]string{}
	for rows.Next() {
		var p, h, person string
		if rows.Scan(&p, &h, &person) == nil {
			m[Account{Platform: p, Handle: h}] = person
		}
	}
	return m, rows.Err()
}

// ---- derivation ------------------------------------------------------------

// resolvePeople fills the derived Owner and People fields of a video from the
// account map: owner = person connected to the source account; people =
// owner ∪ manual tags ∪ cast-connected people (deduped, order preserved).
func resolvePeople(v *Video, acct map[Account]string) {
	v.Owner = ""
	if a, ok := sourceAccount(*v); ok {
		v.Owner = acct[a]
	}
	seen := map[string]bool{}
	people := make([]string, 0, len(v.Models)+2)
	add := func(name string) {
		if name == "" || seen[strings.ToLower(name)] {
			return
		}
		seen[strings.ToLower(name)] = true
		people = append(people, name)
	}
	add(v.Owner)
	for _, t := range v.Models {
		add(t)
	}
	for _, member := range v.Cast {
		if h := HandleSlug(member); h != "" {
			add(acct[Account{Platform: "pornhub", Handle: h}])
		}
	}
	v.People = people
}

func containsFold(list []string, s string) bool {
	for _, x := range list {
		if strings.EqualFold(x, s) {
			return true
		}
	}
	return false
}

// isUploadOf reports whether the video's source account is connected to person.
func isUploadOf(v Video, person string, acct map[Account]string) bool {
	a, ok := sourceAccount(v)
	return ok && strings.EqualFold(acct[a], person)
}

// VideosOf returns everything on a person's page: uploads ∪ appears-in,
// newest first (hidden-collection items excluded).
func (db *DB) VideosOf(name string) ([]Video, error) {
	all, err := db.query(`WHERE ` + notHidden + ` ORDER BY added DESC, id`)
	if err != nil {
		return nil, err
	}
	out := []Video{}
	for _, v := range all {
		if containsFold(v.People, name) {
			out = append(out, v)
		}
	}
	return out, nil
}

// VideosUploadedBy returns videos from the person's connected accounts.
func (db *DB) VideosUploadedBy(name string) ([]Video, error) {
	acct, err := db.accountPersonMap()
	if err != nil {
		return nil, err
	}
	all, err := db.query(`WHERE ` + notHidden + ` ORDER BY added DESC, id`)
	if err != nil {
		return nil, err
	}
	out := []Video{}
	for _, v := range all {
		if isUploadOf(v, name, acct) {
			out = append(out, v)
		}
	}
	return out, nil
}

// VideosAppearing returns videos the person is in but did not upload: manual
// tags plus cast-connected appearances.
func (db *DB) VideosAppearing(name string) ([]Video, error) {
	acct, err := db.accountPersonMap()
	if err != nil {
		return nil, err
	}
	all, err := db.query(`WHERE ` + notHidden + ` ORDER BY added DESC, id`)
	if err != nil {
		return nil, err
	}
	out := []Video{}
	for _, v := range all {
		if containsFold(v.People, name) && !isUploadOf(v, name, acct) {
			out = append(out, v)
		}
	}
	return out, nil
}

// Unsorted returns videos that belong to nobody: no tags, source account not
// connected, no cast member connected.
func (db *DB) Unsorted() ([]Video, error) {
	all, err := db.query(`WHERE ` + notHidden + ` ORDER BY added DESC, id`)
	if err != nil {
		return nil, err
	}
	out := []Video{}
	for _, v := range all {
		if len(v.People) == 0 {
			out = append(out, v)
		}
	}
	return out, nil
}

// People returns the registry with per-person tallies derived from the
// library. Unassigned videos are not people. Ordered by
// video count, then name.
func (db *DB) People() ([]Model, error) {
	names, err := db.personNames()
	if err != nil {
		return nil, err
	}
	all, err := db.query(`WHERE ` + notHidden)
	if err != nil {
		return nil, err
	}
	type agg struct {
		count   int
		seconds int
		bytes   int64
		sites   map[string]bool
		thumb   string
	}
	acc := map[string]*agg{}
	canon := map[string]string{} // lower -> registered spelling
	for _, n := range names {
		acc[n] = &agg{sites: map[string]bool{}}
		canon[strings.ToLower(n)] = n
	}
	bump := func(a *agg, v Video) {
		a.count++
		if v.Duration != nil {
			a.seconds += *v.Duration
		}
		if v.Filesize != nil {
			a.bytes += *v.Filesize
		}
		if v.Site != "" {
			a.sites[v.Site] = true
		}
		if a.thumb == "" && v.Thumbnail != "" {
			a.thumb = v.Thumbnail
		}
	}
	for _, v := range all {
		for _, p := range v.People {
			if n, ok := canon[strings.ToLower(p)]; ok {
				bump(acc[n], v)
			}
		}
	}

	covers, nicks := map[string]string{}, map[string]string{}
	if crows, e := db.sql.Query(`SELECT name, COALESCE(cover,''), COALESCE(nickname,'') FROM model_info`); e == nil {
		for crows.Next() {
			var n, c, nk string
			if crows.Scan(&n, &c, &nk) == nil {
				if c != "" {
					covers[n] = c
				}
				if nk != "" {
					nicks[n] = nk
				}
			}
		}
		crows.Close()
	}

	out := make([]Model, 0, len(names))
	build := func(name string, a *agg) Model {
		sites := make([]string, 0, len(a.sites))
		for s := range a.sites {
			sites = append(sites, s)
		}
		sort.Strings(sites)
		thumb := a.thumb
		if c, ok := covers[name]; ok {
			thumb = c
		}
		if thumb != "" {
			thumb = db.abs(thumb)
		}
		return Model{Name: name, Nickname: nicks[name], Count: a.count, TotalSeconds: a.seconds,
			Bytes: a.bytes, Sites: strings.Join(sites, ","), Thumbnail: thumb}
	}
	for _, n := range names {
		out = append(out, build(n, acc[n]))
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Count != out[j].Count {
			return out[i].Count > out[j].Count
		}
		return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name)
	})
	return out, nil
}

// ---- manual tags -----------------------------------------------------------

// SetTags replaces the people tagged on a video (empty = none). Every tag is
// registered as a person — typing a new name in the organizer IS creating
// them, deliberately.
func (db *DB) SetTags(site, id string, people []string) error {
	clean := make([]string, 0, len(people))
	seen := map[string]bool{}
	for _, p := range people {
		p = strings.TrimSpace(p)
		if p == "" || seen[strings.ToLower(p)] {
			continue
		}
		seen[strings.ToLower(p)] = true
		clean = append(clean, p)
		if err := db.EnsurePerson(p); err != nil {
			return err
		}
	}
	_, err := db.sql.Exec(`UPDATE videos SET model=? WHERE site=? AND id=?`, jsonArr(clean), site, id)
	return err
}

// removeTagEverywhere strips a name from every video's tag list.
func (db *DB) removeTagEverywhere(name string) error {
	b, _ := json.Marshal(name)
	rows, err := db.sql.Query(`SELECT rowid, model FROM videos WHERE model LIKE ?`, "%"+string(b)+"%")
	if err != nil {
		return err
	}
	type item struct {
		rowid int64
		raw   string
	}
	var items []item
	for rows.Next() {
		var it item
		if rows.Scan(&it.rowid, &it.raw) == nil {
			items = append(items, it)
		}
	}
	rows.Close()
	for _, it := range items {
		ms := parseModels(it.raw)
		kept := make([]string, 0, len(ms))
		for _, m := range ms {
			if !strings.EqualFold(m, name) {
				kept = append(kept, m)
			}
		}
		if len(kept) == len(ms) {
			continue
		}
		if _, err := db.sql.Exec(`UPDATE videos SET model=? WHERE rowid=?`, jsonArr(kept), it.rowid); err != nil {
			return err
		}
	}
	return nil
}

// ---- one-time cleanup ------------------------------------------------------

// CleanupReport says what the people cleanup did (or would do).
type CleanupReport struct {
	Kept        []string `json:"kept"`        // people with a touched profile — survive
	Deleted     []string `json:"deleted"`     // auto-created people — removed
	SourceFill  int      `json:"sourceFill"`  // videos whose source account was recorded
	TagsKept    int      `json:"tagsKept"`    // manual tags retained
	TagsDerived int      `json:"tagsDerived"` // tags dropped because accounts already imply them
	TagsDropped int      `json:"tagsDropped"` // tags dropped with their deleted person
	Backup      string   `json:"backup"`
}

const peopleCleanupKey = "people_cleanup_v1"

func (db *DB) metaGet(key string) string {
	var v string
	_ = db.sql.QueryRow(`SELECT value FROM meta WHERE key=?`, key).Scan(&v)
	return v
}

func (db *DB) metaSet(key, value string) {
	_, _ = db.sql.Exec(`INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, key, value)
}

// touchedPeople returns the registry rows the user demonstrably worked on: a
// nickname, bio, links, or cover on the profile; imported photos; or an
// account connected by hand (source "link"/"manual" — download-created
// accounts could have been auto-linked by name, so they don't count).
func (db *DB) touchedPeople() (map[string]bool, error) {
	kept := map[string]bool{}
	rows, err := db.sql.Query(`
SELECT name FROM model_info
WHERE COALESCE(nickname,'')<>'' OR COALESCE(bio,'')<>'' OR COALESCE(cover,'')<>''
   OR (COALESCE(links,'') NOT IN ('', '[]', 'null'))`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var n string
		if rows.Scan(&n) == nil {
			kept[n] = true
		}
	}
	rows.Close()
	if rows, err = db.sql.Query(`SELECT DISTINCT model FROM photos WHERE model<>''`); err == nil {
		for rows.Next() {
			var n string
			if rows.Scan(&n) == nil {
				kept[n] = true
			}
		}
		rows.Close()
	}
	if rows, err = db.sql.Query(`SELECT DISTINCT person FROM accounts WHERE person<>'' AND source IN ('link','manual')`); err == nil {
		for rows.Next() {
			var n string
			if rows.Scan(&n) == nil {
				kept[n] = true
			}
		}
		rows.Close()
	}
	return kept, nil
}

// backfillSources records the source account on every row that lacks one.
func (db *DB) backfillSources() int {
	rows, err := db.sql.Query(`SELECT rowid, site, COALESCE(uploader,''), COALESCE(uploader_id,''), COALESCE(webpage_url,'')
FROM videos WHERE COALESCE(source_handle,'')=''`)
	if err != nil {
		return 0
	}
	type row struct {
		rowid int64
		v     Video
	}
	var todo []row
	for rows.Next() {
		var r row
		if rows.Scan(&r.rowid, &r.v.Site, &r.v.Uploader, &r.v.UploaderID, &r.v.WebpageURL) == nil {
			todo = append(todo, r)
		}
	}
	rows.Close()
	n := 0
	for _, r := range todo {
		p, h := deriveSource(r.v)
		if h == "" {
			continue
		}
		if _, err := db.sql.Exec(`UPDATE videos SET source_platform=?, source_handle=? WHERE rowid=?`, p, h, r.rowid); err == nil {
			n++
		}
	}
	return n
}

// cleanupPeople is the one-time migration to manual people. It runs once
// (recorded in meta) after backing the catalogue file up next to itself.
//
//  1. Record every video's source account.
//  2. Keep only people with a touched profile; delete the rest and clear
//     their account connections.
//  3. Fold the old "featured" list into the tags, drop tags of deleted
//     people, and drop tags the accounts already imply (owner / cast).
func (db *DB) cleanupPeople(dbPath string) (*CleanupReport, error) {
	if db.metaGet(peopleCleanupKey) != "" {
		return nil, nil
	}
	rep := &CleanupReport{Kept: []string{}, Deleted: []string{}}
	var n int
	_ = db.sql.QueryRow(`SELECT COUNT(*) FROM videos`).Scan(&n)
	if n == 0 { // fresh catalogue: nothing to clean, just mark done
		db.metaSet(peopleCleanupKey, time.Now().Format(time.RFC3339))
		return rep, nil
	}
	if dbPath != "" {
		if p, err := db.backupFile(dbPath, "pre-people-cleanup"); err == nil {
			rep.Backup = p
		} else {
			return nil, fmt.Errorf("backup before people cleanup: %w", err)
		}
	}

	rep.SourceFill = db.backfillSources()

	kept, err := db.touchedPeople()
	if err != nil {
		return nil, err
	}
	// Every name that exists anywhere: registry, tags, featured, accounts.
	all := map[string]bool{}
	if names, err := db.personNames(); err == nil {
		for _, n := range names {
			all[n] = true
		}
	}
	vids, err := db.query(`WHERE 1=1`)
	if err != nil {
		return nil, err
	}
	for _, v := range vids {
		for _, m := range v.Models {
			all[m] = true
		}
		for _, f := range v.legacyFeatured {
			all[f] = true
		}
	}
	for name := range all {
		if kept[name] {
			rep.Kept = append(rep.Kept, name)
		} else {
			rep.Deleted = append(rep.Deleted, name)
		}
	}
	sort.Strings(rep.Kept)
	sort.Strings(rep.Deleted)

	tx, err := db.sql.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	for _, name := range rep.Deleted {
		if _, err := tx.Exec(`DELETE FROM model_info WHERE name=?`, name); err != nil {
			return nil, err
		}
		if _, err := tx.Exec(`UPDATE accounts SET person='' WHERE person=?`, name); err != nil {
			return nil, err
		}
	}
	for _, name := range rep.Kept { // people can exist with zero media
		if _, err := tx.Exec(`INSERT OR IGNORE INTO model_info(name, updated) VALUES(?, ?)`, name, time.Now().Format("2006-01-02 15:04:05")); err != nil {
			return nil, err
		}
	}

	acct := map[Account]string{}
	if rows, err := tx.Query(`SELECT platform, handle, person FROM accounts WHERE person<>''`); err == nil {
		for rows.Next() {
			var p, h, person string
			if rows.Scan(&p, &h, &person) == nil {
				acct[Account{Platform: p, Handle: h}] = person
			}
		}
		rows.Close()
	}
	for _, v := range vids {
		// Re-derive with the post-cleanup connections.
		v.SourcePlatform, v.SourceHandle = deriveSource(v)
		implied := map[string]bool{}
		if a, ok := sourceAccount(v); ok && acct[a] != "" {
			implied[strings.ToLower(acct[a])] = true
		}
		for _, member := range v.Cast {
			if p := acct[Account{Platform: "pornhub", Handle: HandleSlug(member)}]; p != "" {
				implied[strings.ToLower(p)] = true
			}
		}
		tags := []string{}
		seen := map[string]bool{}
		for _, name := range append(append([]string{}, v.Models...), v.legacyFeatured...) {
			key := strings.ToLower(name)
			if seen[key] {
				continue
			}
			seen[key] = true
			switch {
			case !kept[name]:
				rep.TagsDropped++
			case implied[key]:
				rep.TagsDerived++
			default:
				rep.TagsKept++
				tags = append(tags, name)
			}
		}
		if _, err := tx.Exec(`UPDATE videos SET model=?, featured=NULL WHERE site=? AND id=?`, jsonArr(tags), v.Site, v.ID); err != nil {
			return nil, err
		}
	}
	_, _ = tx.Exec(`DROP TABLE IF EXISTS saved_confirmed`)
	if _, err := tx.Exec(`INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
		peopleCleanupKey, time.Now().Format(time.RFC3339)); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return rep, nil
}

// backupFile checkpoints the WAL and copies the catalogue to
// "<name>-<tag>-<stamp>.db" beside it, returning the copy's path.
func (db *DB) backupFile(dbPath, tag string) (string, error) {
	_, _ = db.sql.Exec(`PRAGMA wal_checkpoint(TRUNCATE)`)
	dst := strings.TrimSuffix(dbPath, ".db") + "-" + tag + "-" + time.Now().Format("20060102-150405") + ".db"
	in, err := os.Open(dbPath)
	if err != nil {
		return "", err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return "", err
	}
	return dst, out.Close()
}
