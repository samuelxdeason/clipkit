package library

import (
	"html"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

// TitleRules is the version of the deterministic title cleaner. Bump it when
// the rules change so CleanTitles re-checks rows cleaned by an older version.
const TitleRules = "v2"

// TitleStatusManual marks a title the user typed by hand; the cleaner never
// touches it and re-downloads never overwrite it.
const TitleStatusManual = "manual"

// NeedsTitleLabel is added to videos whose source title carried no usable
// description, so they got a placeholder and can be found for hand-titling.
const NeedsTitleLabel = "needs-title"

var (
	reURL       = regexp.MustCompile(`(?i)\b(?:https?://|www\.)\S+|\bt\.co/\S+`)
	reMention   = regexp.MustCompile(`(^|[\s(\[])[@#][\p{L}\p{N}_]+`)
	reBracketN  = regexp.MustCompile(`\s*[\[(]\s*#?\d+\s*[\])]`)
	reSpaces    = regexp.MustCompile(`\s+`)
	reSepRuns   = regexp.MustCompile(`(\s*[-–—|:]\s*){2,}`)
	reEmptyPar  = regexp.MustCompile(`\s*[\[(]\s*[\])]`)
	reBangMid   = regexp.MustCompile(`!+\s+`)
	reBangQuote = regexp.MustCompile(`!+(["”’')\]])\s*$`)
	reQMarks    = regexp.MustCompile(`\?{2,}`)
	reEllipsis  = regexp.MustCompile(`(\.{2,}|…)\s*$`)
	reRTPrefix  = regexp.MustCompile(`(?i)^rt\s*:?\s*`)
	reWord      = regexp.MustCompile(`[\p{L}\p{N}']+`)
	reSep       = regexp.MustCompile(`\s+[-–—|]\s+|\s*[|]\s*|:\s+`)
	reHashTok   = regexp.MustCompile(`(?i)(^|\s)[0-9a-f]{6,8}(\s|$)`)
	reResTok    = regexp.MustCompile(`(?i)(^|\s)(?:\d{3,4}p|4k|8k|uhd|fhd)(\s|$)`)
	reLeadNum   = regexp.MustCompile(`^\$\d+(?:\.\d+)?\s+`)
	rePossess   = regexp.MustCompile(`(\p{L}{2,}) S (\p{Lu})`)
	reSentence  = regexp.MustCompile(`([.?!] +["“„']?)(\p{Ll})`)
)

// junkPhrases are promo/source words that say nothing about the content.
// Matched case-insensitively on word boundaries, longest first.
var junkPhrases = []string{
	"onlyfans video leaked", "onlyfans leaked video", "onlyfans leaked", "onlyfans leak",
	"only fans leaked", "only fans leak", "video leaked", "leaked video", "leaked onlyfans",
	"leaked", "leaks", "leak", "onlyfans", "only fans", "free of", "full video", "full vid",
	"latest video", "porn video", "porn vid", "video clips", "must watch", "new video",
	"exclusive", "official", "hd video", "hd", "18+",
}

var junkRes = func() []*regexp.Regexp {
	out := make([]*regexp.Regexp, 0, len(junkPhrases))
	for _, p := range junkPhrases {
		out = append(out, regexp.MustCompile(`(?i)(^|[\s\-|:,(\[])`+regexp.QuoteMeta(p)+`($|[\s\-|:,)\]!.?])`))
	}
	return out
}()

// spamMarkers mean the text is an advert, not a description of the video.
var spamMarkers = []string{
	"ai girlfriend", "telegram", "chat for free", "watch content", "link in bio",
	"join my", "subscribe", "free trial", "sext your own", "click here", "sign up",
	"visit my", "for free", "absolutely free", "my of link", "promo", "discount",
}

// knownSources are studios and tube sites that appear as "SOURCE - title" or
// "title - SOURCE" segments. Compared with segmentKey (letters+digits only).
var knownSources = func() map[string]bool {
	names := []string{
		"xxbrits", "thothub", "go.porn", "goporn", "sheeshfans", "porn4fans", "pornhub", "xhamster",
		"xvideos", "redgifs", "pimpbunny", "sxyprn", "eporner", "spankbang", "motherless", "camwhores",
		"dirtyship", "thotslife", "leakedzone", "fapello", "coomer", "kemono", "simpcity", "nudostar",
		"thefappening", "fappening", "lustery", "letsdoeit", "girlsway", "all girl massage",
		"fantasy massage", "sweet sinner", "vixen", "vixenplus", "vixen plus", "tushy", "tushy raw",
		"blacked", "blacked raw", "deeper", "slayed", "brazzers", "bangbros", "bang bros", "teamskeet",
		"team skeet", "reality kings", "realitykings", "naughty america", "naughtyamerica",
		"digital playground", "digitalplayground", "mofos", "nubiles", "nubiles porn", "passion-hd",
		"passion hd", "tiny4k", "exotic4k", "lubed", "holed", "povd", "spizoo", "dorcel", "private",
		"wicked", "adult time", "adulttime", "pure taboo", "puretaboo", "mom knows best", "bratty sis",
		"brattysis", "sis loves me", "sislovesme", "family strokes", "familystrokes",
		"step siblings caught", "stepsiblingscaught", "hussie pass", "hussiepass", "kink", "evil angel",
		"evilangel", "jules jordan", "julesjordan", "elegant angel", "hard x", "hardx", "erotica x",
		"eroticax", "cherry pimps", "cherrypimps", "bffs", "fake taxi", "faketaxi", "fakehub", "fake hub",
		"public agent", "publicagent", "mylf", "twistys", "babes", "penthouse", "playboy", "nympho",
		"swallowed", "true anal", "trueanal", "perv mom", "pervmom", "perv therapy", "pervtherapy",
		"free use fantasy", "freeuse fantasy", "filthy kings", "filthykings", "cum4k", "povr",
		"pornhub premium", "modelhub", "onlyfans", "fansly", "manyvids", "clips4sale", "loyalfans",
		"xxx", "porn", "nsfw",
	}
	m := map[string]bool{}
	for _, n := range names {
		m[segmentKey(n)] = true
	}
	return m
}()

// replacements normalise a few spellings (whole words, case-insensitive; the
// replacement's case is used when the word was written in caps or Title Case).
var replacements = map[string]string{
	"sextape": "sex tape", "sextapes": "sex tapes", "tiktok": "TikTok",
	"pov": "POV", "joi": "JOI", "ppv": "PPV", "dp": "DP", "bbc": "BBC", "bbw": "BBW", "milf": "MILF",
	"gilf": "GILF", "asmr": "ASMR", "bdsm": "BDSM", "pawg": "PAWG", "cfnm": "CFNM", "jav": "JAV",
	"vip": "VIP", "nsfw": "NSFW", "sph": "SPH", "cei": "CEI", "gf": "GF", "bf": "BF",
}

// acronyms stay upper-case when shouting is tamed.
var acronyms = map[string]bool{
	"POV": true, "JOI": true, "PPV": true, "BBC": true, "BBW": true, "MILF": true, "GILF": true,
	"DP": true, "VR": true, "HD": true, "4K": true, "ASMR": true, "BDSM": true, "PAWG": true,
	"BJ": true, "HJ": true, "CFNM": true, "FFM": true, "MMF": true, "JAV": true, "VIP": true,
	"USA": true, "UK": true, "TV": true, "DIY": true, "DM": true, "OMG": true, "TS": true,
	"GF": true, "BF": true, "SPH": true, "CEI": true, "DDLG": true, "NSFW": true, "AI": true,
	"3D": true, "2D": true, "II": true, "III": true, "IV": true, "VI": true, "VII": true,
	"VIII": true, "IX": true, "XL": true, "XXL": true, "I": true, "A": true,
}

var leadConnectors = map[string]bool{
	"and": true, "&": true, "x": true, "ft": true, "feat": true, "featuring": true, "aka": true, "vs": true,
}

var trailConnectors = map[string]bool{
	"with": true, "and": true, "&": true, "or": true, "in": true, "on": true, "for": true,
	"the": true, "a": true, "an": true, "to": true, "of": true, "my": true, "at": true, "by": true,
	"from": true, "follow": true, "as": true, "but": true, "so": true, "if": true, "is": true,
	"video": true, "vid": true, "videos": true, "clip": true, "porn": true, "porno": true,
	"xxx": true, "n": true, "w": true,
}

// CleanTitle derives a plain, descriptive title from a video's source title.
// It is deterministic: links, emoji, bracketed ids, promo words, studio and
// site names, the uploader prefix/suffix, and the names (and aliases) of
// attached people are removed; shouting is tamed; very long titles are cut
// at a sentence boundary. When nothing descriptive survives, the result is
// "<people or uploader> clip" and fallback is true. The original title is
// left to the caller to preserve.
func CleanTitle(v Video, aliases ...string) (title string, fallback bool) {
	t := strings.TrimSpace(v.Title)
	// Twitter titles are "<uploader> - <tweet, truncated…>"; the description
	// holds the full tweet, so prefer it.
	if strings.EqualFold(v.Site, "twitter") && strings.TrimSpace(v.Description) != "" {
		t = strings.TrimSpace(v.Description)
	}
	t = html.UnescapeString(t)
	t = reRTPrefix.ReplaceAllString(t, "")
	t = reURL.ReplaceAllString(t, " ")
	t = stripSymbols(t)
	for i := 0; i < 2; i++ {
		t = reMention.ReplaceAllString(t, "$1")
	}
	t = reBracketN.ReplaceAllString(t, " ")
	t = reHashTok.ReplaceAllStringFunc(t, func(m string) string {
		// Only a hex-looking mix of digits and letters is a hash (not "123456").
		if strings.ContainsFunc(m, unicode.IsDigit) && strings.ContainsFunc(m, unicode.IsLetter) {
			return " "
		}
		return m
	})
	t = reResTok.ReplaceAllString(t, "$1$2")
	// Promo words come off before segment matching so "Onlyfans <uploader> …"
	// and "… - <studio> Full Video" still match, and again afterwards for
	// anything a removed segment exposed.
	for _, re := range junkRes {
		t = re.ReplaceAllString(t, "$1$2")
	}
	t = stripSegments(t, v.Uploader)
	names := append([]string{}, v.Models...)
	names = append(names, v.People...)
	if v.Owner != "" {
		names = append(names, v.Owner)
	}
	names = append(names, aliases...)
	for _, name := range names {
		t = stripName(t, name)
	}
	for _, re := range junkRes {
		t = re.ReplaceAllString(t, "$1$2")
	}
	t = normaliseWords(t)
	t = tidyPunctuation(t)
	t = trimConnectors(t)
	t = tameShouting(t)
	t = clampLength(t, 100)
	t = tidyPunctuation(t)
	t = trimConnectors(t)
	t = rePossess.ReplaceAllString(t, "$1's $2")
	t = capitaliseFirst(t)
	t = reSentence.ReplaceAllStringFunc(t, strings.ToUpper)

	if isSpam(t) || !descriptive(t, strings.EqualFold(v.Site, "twitter")) {
		return fallbackTitle(v), true
	}
	return t, false
}

// stripSymbols drops emoji, pictographs, strike-through marks, and other
// symbol runes but keeps letters, digits, spaces, and ordinary punctuation.
func stripSymbols(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		switch {
		case r == 0x200D || r == 0xFE0F || r == 0xFE0E: // ZWJ, variation selectors
			continue
		case r >= 0x0332 && r <= 0x0338: // underline / strike-through combining marks
			continue
		case r >= 0x1F000 && r <= 0x1FAFF, r >= 0x2600 && r <= 0x27BF, r >= 0x1F3FB && r <= 0x1F3FF:
			b.WriteRune(' ')
		case r >= 0x2190 && r <= 0x21FF, r >= 0x2900 && r <= 0x297F, r >= 0x2B00 && r <= 0x2BFF: // arrows
			b.WriteRune(' ')
		case unicode.Is(unicode.So, r), unicode.Is(unicode.Sk, r):
			b.WriteRune(' ')
		case unicode.IsControl(r):
			b.WriteRune(' ')
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

// segmentKey lowercases and removes everything but letters and digits so
// "Blonde_Barbie", "blonde barbie" and "BLONDE.BARBIE" compare equal.
func segmentKey(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// stripSegments removes leading "<source> - " and trailing " - <source>"
// segments where the source is the uploader or a known studio/site, and a
// bare uploader prefix such as "VIXENPLUS " (uploader of four or more
// letters, up to three words).
func stripSegments(t, uploader string) string {
	up := segmentKey(uploader)
	isSource := func(seg string) bool {
		seg = strings.TrimSpace(seg)
		if seg == "" || countWords(seg) > 4 {
			return false
		}
		k := segmentKey(seg)
		if k == "" {
			return false
		}
		if knownSources[k] || (up != "" && k == up) {
			return true
		}
		for _, pre := range []string{"amateur", "amateurcouple", "couple", "by", "with", "from", "ft", "feat", "featuring", "on", "at", "via"} {
			if strings.HasPrefix(k, pre) {
				rest := k[len(pre):]
				if rest != "" && (knownSources[rest] || (up != "" && rest == up)) {
					return true
				}
			}
		}
		return false
	}
	for i := 0; i < 2; i++ {
		loc := reSep.FindStringIndex(t)
		if loc == nil || !isSource(t[:loc[0]]) {
			break
		}
		t = t[loc[1]:]
	}
	for i := 0; i < 3; i++ {
		locs := reSep.FindAllStringIndex(t, -1)
		if len(locs) == 0 {
			break
		}
		last := locs[len(locs)-1]
		if !isSource(t[last[1]:]) {
			break
		}
		t = t[:last[0]]
	}
	if len(up) >= 4 {
		words := strings.Fields(t)
		for n := 1; n <= 3 && n < len(words); n++ {
			if segmentKey(strings.Join(words[:n], "")) == up {
				t = strings.Join(words[n:], " ")
				break
			}
		}
	}
	return strings.TrimSpace(t)
}

// stripName removes a person's name or alias (whole words, case-insensitive)
// and a following possessive. Very short aliases are ignored.
func stripName(t, name string) string {
	name = strings.TrimSpace(name)
	if len([]rune(name)) < 4 {
		return t
	}
	re := regexp.MustCompile(`(?i)(^|[^\p{L}\p{N}])` + regexp.QuoteMeta(name) + `(?:'s|’s)?($|[^\p{L}\p{N}])`)
	for i := 0; i < 3; i++ {
		next := re.ReplaceAllString(t, "$1$2")
		if next == t {
			break
		}
		t = next
	}
	return t
}

func normaliseWords(t string) string {
	return reWord.ReplaceAllStringFunc(t, func(w string) string {
		r, ok := replacements[strings.ToLower(w)]
		if !ok {
			return w
		}
		if strings.ToUpper(r) == r || strings.ContainsFunc(r[1:], unicode.IsUpper) {
			return r // acronym or brand spelling: always as given
		}
		if unicode.IsUpper([]rune(w)[0]) {
			return capitaliseFirst(r)
		}
		return r
	})
}

// tidyPunctuation collapses whitespace and separator runs, removes empty
// brackets, trailing ellipses, shouting marks, and dangling separators.
func tidyPunctuation(t string) string {
	t = reEmptyPar.ReplaceAllString(t, " ")
	t = reSpaces.ReplaceAllString(t, " ")
	t = strings.TrimSpace(t)
	t = reEllipsis.ReplaceAllString(t, "")
	t = strings.ReplaceAll(t, "?!", "?")
	t = strings.ReplaceAll(t, "!?", "?")
	t = reQMarks.ReplaceAllString(t, "?")
	t = reBangQuote.ReplaceAllString(t, "$1")
	t = reBangMid.ReplaceAllString(t, ". ")
	t = reSepRuns.ReplaceAllString(t, " - ")
	t = strings.ReplaceAll(t, " ,", ",")
	t = strings.ReplaceAll(t, " .", ".")
	t = reSpaces.ReplaceAllString(t, " ")
	t = strings.Trim(t, " -–—|:,;.!·•~_\\/")
	return strings.TrimSpace(t)
}

// trimConnectors drops dangling connector words left at either end after a
// name or link was removed ("And Banged By…", "…ended with"), a leading
// bare number/price, and a trailing "Video"/"Porn" when words remain.
func trimConnectors(t string) string {
	for i := 0; i < 4; i++ {
		before := t
		t = reLeadNum.ReplaceAllString(t, "")
		words := strings.Fields(t)
		if len(words) >= 2 && leadConnectors[strings.ToLower(strings.Trim(words[0], ".,:;!?"))] {
			words = words[1:]
		}
		if len(words) >= 2 && trailConnectors[strings.ToLower(strings.Trim(words[len(words)-1], ".,:;!?-"))] {
			words = words[:len(words)-1]
		}
		t = tidyPunctuation(strings.Join(words, " "))
		if t == before {
			break
		}
	}
	return t
}

// tameShouting fixes ALL-CAPS words. If the rest of the title is mostly
// lower-case the shouted words become lower-case; otherwise they become
// Capitalised. Known acronyms and mixed-case words are left alone.
func tameShouting(t string) string {
	var shouted, other, lower int
	for _, w := range reWord.FindAllString(t, -1) {
		letters, upper := letterCounts(w)
		if letters < 2 {
			continue
		}
		if upper == letters {
			if !acronyms[w] {
				shouted++
			}
			continue
		}
		other++
		if unicode.IsLower(firstLetter(w)) {
			lower++
		}
	}
	if shouted == 0 {
		return t
	}
	toLower := other > 0 && lower*100 >= 60*other
	return reWord.ReplaceAllStringFunc(t, func(w string) string {
		letters, upper := letterCounts(w)
		if letters < 2 || upper != letters || acronyms[w] {
			return w
		}
		if toLower {
			return strings.ToLower(w)
		}
		return capitaliseFirst(strings.ToLower(w))
	})
}

func letterCounts(w string) (letters, upper int) {
	for _, r := range w {
		if unicode.IsLetter(r) {
			letters++
			if unicode.IsUpper(r) {
				upper++
			}
		}
	}
	return
}

func firstLetter(w string) rune {
	for _, r := range w {
		if unicode.IsLetter(r) {
			return r
		}
	}
	return 0
}

// clampLength cuts a title longer than max at the last sentence, dash, or
// (further in) comma boundary before max; with no boundary it is left as is.
func clampLength(t string, max int) string {
	rs := []rune(t)
	if len(rs) <= max {
		return t
	}
	head := string(rs[:max])
	cut := -1
	for _, sep := range []string{". ", "? ", "! ", " - ", "; ", ": "} {
		if i := strings.LastIndex(head, sep); i > cut && i >= 30 {
			cut = i
		}
	}
	if cut < 0 {
		if i := strings.LastIndex(head, ", "); i >= 50 {
			cut = i
		}
	}
	if cut < 0 {
		return t
	}
	return strings.TrimSpace(head[:cut])
}

func capitaliseFirst(t string) string {
	for i, r := range t {
		if unicode.IsLetter(r) {
			return t[:i] + string(unicode.ToUpper(r)) + t[i+len(string(r)):]
		}
		if unicode.IsDigit(r) {
			return t
		}
	}
	return t
}

// countWords counts words of at least two letters.
func countWords(t string) int {
	n := 0
	for _, w := range reWord.FindAllString(t, -1) {
		if l, _ := letterCounts(w); l >= 2 {
			n++
		}
	}
	return n
}

// descriptive is true for two or more real words, or one word of four or
// more letters that is not an id-like mix of letters and digits. Tweets are
// held to two words: a lone word there is almost always slang or a handle.
func descriptive(t string, tweet bool) bool {
	words := reWord.FindAllString(t, -1)
	switch countWords(t) {
	case 0:
		return false
	case 1:
		if tweet || len(words) != 1 {
			return false
		}
		switch strings.ToLower(words[0]) {
		case "clip", "video", "untitled", "vid": // a bare fallback remnant
			return false
		}
		l, _ := letterCounts(words[0])
		return l >= 4 && !strings.ContainsFunc(words[0], unicode.IsDigit)
	}
	return true
}

func isSpam(t string) bool {
	l := strings.ToLower(t)
	for _, m := range spamMarkers {
		if strings.Contains(l, m) {
			return true
		}
	}
	return false
}

// fallbackTitle names a video by its attached people, else its uploader.
func fallbackTitle(v Video) string {
	names := append([]string(nil), v.Models...)
	if len(names) == 0 {
		names = append(names, v.People...)
	}
	sort.Strings(names)
	who := strings.Join(names, " & ")
	if who == "" {
		who = cleanUploaderName(v.Uploader)
	}
	if who == "" {
		return "Untitled clip"
	}
	return capitaliseFirst(who) + " clip"
}

// TitleCleanReport says what one CleanTitles pass did.
type TitleCleanReport struct {
	Rules    string `json:"rules"`    // rule version applied
	Checked  int    `json:"checked"`  // rows looked at (not manual, not already at this version)
	Changed  int    `json:"changed"`  // rows whose title changed (source title kept)
	Fallback int    `json:"fallback"` // of those, rows that got a placeholder and the needs-title tag
}

// CleanTitles runs the deterministic cleaner over every video the user has
// not renamed by hand and that the current rule version has not checked
// yet. A changed row keeps its original title in source_title (set once,
// never overwritten) so it stays searchable and the change can be undone;
// every checked row is stamped with the rule version so the pass is cheap
// to re-run after new downloads. With dryRun the report is computed and
// nothing is written.
func (db *DB) CleanTitles(dryRun bool) (TitleCleanReport, error) {
	rep := TitleCleanReport{Rules: TitleRules}
	vids, err := db.query(`WHERE COALESCE(title_status,'') NOT IN (?, ?) ORDER BY added, id`, TitleStatusManual, TitleRules)
	if err != nil {
		return rep, err
	}
	aliases, err := db.personAliases()
	if err != nil {
		return rep, err
	}
	tx, err := db.sql.Begin()
	if err != nil {
		return rep, err
	}
	defer tx.Rollback()
	for _, v := range vids {
		rep.Checked++
		var al []string
		for _, name := range append(append([]string{}, v.People...), v.Models...) {
			al = append(al, aliases[strings.ToLower(name)]...)
		}
		title, fallback := CleanTitle(v, al...)
		if title == v.Title {
			if _, err := tx.Exec(`UPDATE videos SET title_status=? WHERE site=? AND id=?`, TitleRules, v.Site, v.ID); err != nil {
				return rep, err
			}
			continue
		}
		rep.Changed++
		labels := v.Labels
		if fallback {
			rep.Fallback++
			if !containsFold(labels, NeedsTitleLabel) {
				labels = append(append([]string{}, labels...), NeedsTitleLabel)
			}
		}
		if _, err := tx.Exec(`UPDATE videos SET
  source_title=CASE WHEN COALESCE(source_title,'')='' THEN title ELSE source_title END,
  title=?, title_status=?, labels=? WHERE site=? AND id=?`,
			title, TitleRules, jsonArr(labels), v.Site, v.ID); err != nil {
			return rep, err
		}
	}
	if dryRun {
		return rep, tx.Rollback()
	}
	return rep, tx.Commit()
}

// personAliases maps a lower-cased person name to the other names they go
// by in titles: their nickname and their connected account handles (five
// or more characters, so short handles can't eat ordinary words).
func (db *DB) personAliases() (map[string][]string, error) {
	out := map[string][]string{}
	rows, err := db.sql.Query(`SELECT name, COALESCE(nickname,'') FROM model_info`)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var name, nick string
		if rows.Scan(&name, &nick) == nil && len([]rune(nick)) >= 4 {
			out[strings.ToLower(name)] = append(out[strings.ToLower(name)], nick)
		}
	}
	rows.Close()
	rows, err = db.sql.Query(`SELECT person, handle FROM accounts WHERE person<>''`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var person, handle string
		if rows.Scan(&person, &handle) == nil && len([]rune(handle)) >= 5 {
			out[strings.ToLower(person)] = append(out[strings.ToLower(person)], handle)
		}
	}
	return out, rows.Err()
}

// cleanUploaderName keeps the part of a display name before any promo:
// "Veronica Diaz / FREE OF" -> "Veronica Diaz". Names with nothing left but
// generic words return "".
func cleanUploaderName(u string) string {
	u = stripSymbols(u)
	if i := strings.IndexAny(u, "/|(["); i > 0 {
		u = u[:i]
	}
	for _, re := range junkRes {
		u = re.ReplaceAllString(u, "$1$2")
	}
	u = tidyPunctuation(u)
	words := strings.Fields(u)
	if len(words) > 0 && !isShout(words[0]) {
		for i, w := range words {
			if i > 0 && isShout(w) {
				words = words[:i]
				break
			}
		}
	}
	u = tameShouting(strings.Join(words, " "))
	if l, _ := letterCounts(u); l < 3 {
		return ""
	}
	return u
}

func isShout(w string) bool {
	letters, upper := letterCounts(w)
	return letters >= 3 && upper == letters
}
