package library

import "testing"

// TestXHandleFromURL: profile links and status URLs both yield the handle;
// site pages and non-X URLs don't.
func TestXHandleFromURL(t *testing.T) {
	cases := map[string]string{
		"https://x.com/NikkiiRyder":                        "nikkiiryder",
		"https://x.com/NikkiiRyder/status/2089706/video/1": "nikkiiryder",
		"https://twitter.com/Some_User123?s=21":            "some_user123",
		"https://x.com/i/status/123":                       "",
		"https://x.com/search?q=hi":                        "",
		"https://onlyfans.com/nikkiiryder":                 "",
		"https://www.pornhub.com/pornstar/emma-hix":        "",
	}
	for u, want := range cases {
		if got := XHandleFromURL(u); got != want {
			t.Errorf("XHandleFromURL(%q) = %q, want %q", u, got, want)
		}
	}
}

// TestAccountFromURL: profile URLs resolve to platform account keys.
func TestAccountFromURL(t *testing.T) {
	if a, ok := AccountFromURL("https://www.pornhub.com/pornstar/emma-hix/videos/upload"); !ok || a != (Account{Platform: "pornhub", Handle: "emma-hix"}) {
		t.Fatalf("AccountFromURL = %+v, %v", a, ok)
	}
	if a, ok := AccountFromURL("https://x.com/NikkiiRyder"); !ok || a != (Account{Platform: "x", Handle: "nikkiiryder"}) {
		t.Fatalf("AccountFromURL = %+v, %v", a, ok)
	}
}
