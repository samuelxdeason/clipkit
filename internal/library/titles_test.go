package library

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
)

func TestCleanTitle(t *testing.T) {
	cases := []struct {
		v        Video
		aliases  []string
		want     string
		fallback bool
	}{
		{v: Video{Site: "Local", Title: "Sophie Rain Pajama Shorts Strip Tease Video Leaked", Uploader: "Sophie Rain", Models: []string{"Sophie Rain"}},
			want: "Pajama Shorts Strip Tease"},
		{v: Video{Site: "Local", Title: "Ella Alexandra Leaked Car Blowjob With Cumshot On Titties [6777]", Uploader: "Ella Alexandra", Models: []string{"Ella Alexandra"}},
			want: "Car Blowjob With Cumshot On Titties"},
		{v: Video{Site: "Local", Title: "Heralteregoo Surprise Bathroom Sex Tape [12178]", Uploader: "Rebecca McLeod", Models: []string{"Rebecca McLeod"}}, aliases: []string{"heralteregoo"},
			want: "Surprise Bathroom Sex Tape"},
		{v: Video{Site: "Local", Title: "Heralteregoo Surprise Bathroom Sex Tape [12178]", Uploader: "Rebecca McLeod", Models: []string{"Rebecca McLeod"}},
			want: "Heralteregoo Surprise Bathroom Sex Tape"},
		{v: Video{Site: "Local", Title: "Lexi Rae Valentine S Day Creampie [7838]", Models: []string{"Lexi Rae"}},
			want: "Valentine's Day Creampie"},
		{v: Video{Site: "Local", Title: "Ella Alexandra And Rebecca Mcleod Banged By 1 Lucky Lad Porn Video Leaked [6785]", Models: []string{"Ella Alexandra", "Rebecca McLeod"}},
			want: "Banged By 1 Lucky Lad"},
		{v: Video{Site: "Local", Title: "Sophie Rain Striptease Onlyfans Video Leaked", Models: []string{"Sophie Rain"}},
			want: "Striptease"},
		{v: Video{Site: "Local", Title: "Sophie Rain Latest Video", Models: []string{"Sophie Rain"}},
			want: "Sophie Rain clip", fallback: true},
		{v: Video{Site: "Local", Title: "Ktnt6ArH", Models: []string{"Dove Cameron"}},
			want: "Dove Cameron clip", fallback: true},
		{v: Video{Site: "Local", Title: "Sophieraiin Of Nude Pink Lingerie Strip Video Leaked 14c53d6 720p (1)", Models: []string{"Sophie Rain"}},
			want: "Sophieraiin Of Nude Pink Lingerie Strip"},
		{v: Video{Site: "Generic", Title: "Ella Alexandra & Rebecca McLeod threesome in truck - XXBRITS", Models: []string{"Ella Alexandra", "Rebecca McLeod"}},
			want: "Threesome in truck"},
		{v: Video{Site: "Generic", Title: "Maddie Price Aka Funsizedkate In Brown Dress Kneel Down And Blow Big Dick Leaked Onlyfans Video - SheeshFans", Models: []string{"Maddie Price"}},
			want: "Funsizedkate In Brown Dress Kneel Down And Blow Big Dick"},
		{v: Video{Site: "Generic", Title: "CARDIO AFTER GYM! I End Workout At Home With My Gym Crush, Rough Sex & Orgasms - Peaky Brownies - GO.PORN", Uploader: "Peaky Brownies"},
			want: "Cardio After Gym. I End Workout At Home With My Gym Crush, Rough Sex & Orgasms"},
		{v: Video{Site: "PornHub", Title: "Cute Babe Making Me Nut💦 All Day Long🥵 - Spirite Moon", Uploader: "BunnyRabbits"},
			want: "Cute Babe Making Me Nut All Day Long - Spirite Moon"},
		{v: Video{Site: "PornHub", Title: "Sunny Sextape on the Sofa! Squirt, deepthroat, prone bone - Amateur LeoLulu", Uploader: "LeoLulu"},
			want: "Sunny Sex tape on the Sofa. Squirt, deepthroat, prone bone"},
		{v: Video{Site: "PornHub", Title: "She Refused to Do Her Homework And Asked Me to Show Her My Dick!!!", Uploader: "HottiesTwo"},
			want: "She Refused to Do Her Homework And Asked Me to Show Her My Dick"},
		{v: Video{Site: "PornHub", Title: "CALVIN KLEIN panties try-on redhead", Uploader: "petitesubkitten"},
			want: "Calvin klein panties try-on redhead"},
		{v: Video{Site: "PornHub", Title: "CAUGHT! „Now you have to FUCK me!”", Uploader: "Amateurtwo"},
			want: "Caught. „Now you have to fuck me”"},
		{v: Video{Site: "PornHub", Title: "VIXENPLUS La Legende Compilation", Uploader: "VixenPlus"},
			want: "La Legende Compilation"},
		{v: Video{Site: "PornHub", Title: "intimate sextape in bed - amateur couple leolulu", Uploader: "LeoLulu"},
			want: "Intimate sex tape in bed"},
		{v: Video{Site: "PornHub", Title: "Giving is as good as receiving", Uploader: "bonniealex"},
			want: "Giving is as good as receiving"},
		{v: Video{Site: "PornHub", Title: "POV blowjob in 4K HD", Uploader: "x"},
			want: "POV blowjob"},
		{v: Video{Site: "PornHub", Title: "ALL GIRL MASSAGE - HOT LESBIAN THREESOMES COMPILATION! Lana Rhoades, Angela White and Lauren Phillip", Uploader: "Girlsway"},
			want: "Hot Lesbian Threesomes Compilation. Lana Rhoades, Angela White and Lauren Phillip"},
		{v: Video{Site: "PornHub", Title: "Slim blonde is determined to MAKE YOU CUM with her STRIPTEASE", Uploader: "x"},
			want: "Slim blonde is determined to make you cum with her striptease"},
		{v: Video{Site: "PornHub", Title: "WHAT?! Step sis, are you a Pornhub model?", Uploader: "x"},
			want: "What? Step sis, are you a Pornhub model?"},
		{v: Video{Site: "PornHub", Title: "Alinity Sexy Joi Onlyfans Ppv Video Leaked", Uploader: "x"},
			want: "Alinity Sexy JOI PPV"},
		{v: Video{Site: "Twitter", Title: "Onlyfans Video Clips - Wataa 😋", Uploader: "Onlyfans Video Clips", Models: []string{"Hannah & James"}, Description: "Wataa 😋 https://t.co/qBziYTGUes"},
			want: "Hannah & James clip", fallback: true},
		{v: Video{Site: "Twitter", Title: "Onlyfans Video Clips - Wataa 😋", Uploader: "Onlyfans Video Clips", Description: "Wataa 😋 https://t.co/qBziYTGUes"},
			want: "Untitled clip", fallback: true},
		{v: Video{Site: "Twitter", Title: "Meri Dee🌸YOUR GIFT AND FUN ON MY OF💋 - https://t.co/0SwGPmngM3", Uploader: "Meri Dee🌸YOUR GIFT AND FUN ON MY OF💋", Description: "https://t.co/0SwGPmngM3"},
			want: "Meri Dee clip", fallback: true},
		{v: Video{Site: "Twitter", Title: "Blonde_Barbie - Have you ever seen a sexier brunette? She is stunning? After a little...", Uploader: "Blonde_Barbie",
			Description: "Have you ever seen a sexier brunette? She is stunning? After a little tease she drops to her knees & sucks him dry https://t.co/x"},
			want: "Have you ever seen a sexier brunette? She is stunning"},
		{v: Video{Site: "Twitter", Title: "Veronica Diaz / FREE OF - Shower with me this morning 🥱", Uploader: "Veronica Diaz / FREE OF", Description: "Shower with me this morning 🥱 https://t.co/8kDCGlGwtJ"},
			want: "Shower with me this morning"},
		{v: Video{Site: "Twitter", Title: "Luna - sucking dick makes my pussy drip", Uploader: "Luna", Description: "sucking dick makes my pussy drip https://t.co/utIpP0Bjjy"},
			want: "Sucking dick makes my pussy drip"},
		{v: Video{Site: "Twitter", Title: "Ry - Sweet &amp; Tight!😁  #genz #teenage", Uploader: "Ry", Description: "Sweet &amp; Tight!😁  #genz #teenage #blonde #petite"},
			want: "Sweet & Tight"},
		{v: Video{Site: "Twitter", Title: "m0seph - This Brunette...", Uploader: "m0seph", Description: "This Brunette shawty decided to give sloppy 🧠to her neighbor🧠#schoolthot"},
			want: "This Brunette shawty decided to give sloppy to her neighbor"},
		{v: Video{Site: "Twitter", Title: "OF PREMIUM - WATCH CONTENT AND CHAT FOR FREE  👇👇", Uploader: "OF PREMIUM", Description: "WATCH CONTENT AND CHAT FOR FREE  👇👇"},
			want: "Untitled clip", fallback: true},
		{v: Video{Site: "Twitter", Title: "Ella Alexandra🍒 - What’s happening 😈 Ella Alexandra", Uploader: "Ella Alexandra🍒", Owner: "Ella Alexandra", People: []string{"Ella Alexandra"}, Description: "What’s happening 😈 Ella Alexandra"},
			want: "What’s happening"},
		{v: Video{Site: "PornHub", Title: "I love massage with oil ̶a̶n̶d̶ ̶c̶u̶m̶s̶h̶o̶t̶ ̶o̶n̶ ̶t̶h̶e̶ ̶a̶s̶s😜", Uploader: "x"},
			want: "I love massage with oil and cumshot on the ass"},
		{v: Video{Site: "Generic", Title: "", Uploader: ""}, want: "Untitled clip", fallback: true},
	}
	for _, c := range cases {
		got, fb := CleanTitle(c.v, c.aliases...)
		if got != c.want || fb != c.fallback {
			t.Errorf("CleanTitle(%q)\n got %q fallback=%v\nwant %q fallback=%v", c.v.Title, got, fb, c.want, c.fallback)
		}
	}
}

// TestCleanTitleCorpus runs the cleaner over a JSON export of real titles
// (TROVE_TITLES_JSON) and writes a before/after report next to it. Skipped
// when the export is absent.
func TestCleanTitleCorpus(t *testing.T) {
	path := os.Getenv("TROVE_TITLES_JSON")
	if path == "" {
		t.Skip("TROVE_TITLES_JSON not set")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var rows []struct{ Site, ID, Title, Uploader, Model, Cast, Description string }
	if err := json.Unmarshal(data, &rows); err != nil {
		t.Fatal(err)
	}
	var changed, same, fallback int
	var sb strings.Builder
	perSite := map[string][2]int{}
	for _, r := range rows {
		v := Video{Site: r.Site, ID: r.ID, Title: r.Title, Uploader: r.Uploader, Description: r.Description, Models: parseModels(r.Model)}
		got, fb := CleanTitle(v)
		// A second pass over the cleaned title must be a no-op, so re-running
		// with a new rule version never drifts titles further.
		v2 := v
		v2.Title = got
		if again, _ := CleanTitle(v2); again != got {
			t.Errorf("not idempotent [%s] %s:\n  1: %q\n  2: %q", r.Site, r.ID, got, again)
		}
		ps := perSite[r.Site]
		ps[0]++
		if fb {
			fallback++
		}
		if got == r.Title {
			same++
			perSite[r.Site] = ps
			continue
		}
		ps[1]++
		perSite[r.Site] = ps
		changed++
		mark := " "
		if fb {
			mark = "F"
		}
		fmt.Fprintf(&sb, "%s [%s] %s\n   - %s\n   + %s\n", mark, r.Site, r.ID, r.Title, got)
	}
	out := filepath.Join(filepath.Dir(path), "titles-report.txt")
	if err := os.WriteFile(out, []byte(sb.String()), 0o644); err != nil {
		t.Fatal(err)
	}
	sites := make([]string, 0, len(perSite))
	for s := range perSite {
		sites = append(sites, s)
	}
	sort.Strings(sites)
	for _, s := range sites {
		t.Logf("%-10s checked=%d changed=%d", s, perSite[s][0], perSite[s][1])
	}
	t.Logf("total=%d changed=%d same=%d fallback=%d report=%s", len(rows), changed, same, fallback, out)
}
