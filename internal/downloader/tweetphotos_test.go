package downloader

import (
	"reflect"
	"testing"
)

// TestTweetRequest: status URLs are tweets, /photo/N ones are pictures, and
// everything else (profiles, other sites) is neither.
func TestTweetRequest(t *testing.T) {
	cases := []struct {
		url                string
		handle             string
		isTweet, photoOnly bool
	}{
		{"https://x.com/noctal_01/status/2001214651778916839/photo/1", "noctal_01", true, true},
		{"https://x.com/noctal_01/status/2001214651778916839", "noctal_01", true, false},
		{"https://twitter.com/Some_User/status/123/video/1", "some_user", true, false},
		{"https://x.com/i/status/123/photo/2", "", true, true},
		{"https://x.com/noctal_01", "", false, false},
		{"https://www.pornhub.com/view_video.php?viewkey=abc", "", false, false},
	}
	for _, c := range cases {
		h, tw, ph := tweetRequest(c.url)
		if h != c.handle || tw != c.isTweet || ph != c.photoOnly {
			t.Errorf("tweetRequest(%q) = %q,%v,%v; want %q,%v,%v", c.url, h, tw, ph, c.handle, c.isTweet, c.photoOnly)
		}
	}
}

// TestDirectImageRequest: copied image addresses are recognised, X CDN links
// are upgraded to the original size, and pages are left alone.
func TestDirectImageRequest(t *testing.T) {
	cases := []struct {
		url, fetch, album string
		ok                bool
	}{
		{"https://pbs.twimg.com/media/HSiDoP7aoAAt7WM?format=jpg&name=small", "https://pbs.twimg.com/media/HSiDoP7aoAAt7WM?format=jpg&name=orig", "x.com", true},
		{"https://pbs.twimg.com/media/G8W-HlqWMAA299x?format=png&name=900x900", "https://pbs.twimg.com/media/G8W-HlqWMAA299x?format=png&name=orig", "x.com", true},
		{"https://pbs.twimg.com/media/G8W-HlqWMAA299x", "https://pbs.twimg.com/media/G8W-HlqWMAA299x?format=jpg&name=orig", "x.com", true},
		{"https://www.example.com/gallery/img_01.JPG?token=abc", "https://www.example.com/gallery/img_01.JPG?token=abc", "example.com", true},
		{"https://x.com/noctal_01/status/2001214651778916839/photo/1", "", "", false},
		{"https://www.pornhub.com/view_video.php?viewkey=abc", "", "", false},
		{"not a url", "", "", false},
	}
	for _, c := range cases {
		f, a, ok := directImageRequest(c.url)
		if f != c.fetch || a != c.album || ok != c.ok {
			t.Errorf("directImageRequest(%q) = %q,%q,%v; want %q,%q,%v", c.url, f, a, ok, c.fetch, c.album, c.ok)
		}
	}
}

// TestParseGalleryDLOutput: "| url" lines are alternates of the picture
// above them, not extra pictures; noise lines are ignored.
func TestParseGalleryDLOutput(t *testing.T) {
	out := "[twitter][info] fetching\nhttps://pbs.twimg.com/media/A?format=jpg&name=orig\n| https://pbs.twimg.com/media/A?format=jpg&name=4096x4096\n| https://pbs.twimg.com/media/A?format=jpg&name=large\nhttps://pbs.twimg.com/media/B?format=png&name=orig\n\n"
	want := [][]string{
		{"https://pbs.twimg.com/media/A?format=jpg&name=orig", "https://pbs.twimg.com/media/A?format=jpg&name=4096x4096", "https://pbs.twimg.com/media/A?format=jpg&name=large"},
		{"https://pbs.twimg.com/media/B?format=png&name=orig"},
	}
	if got := parseGalleryDLOutput(out); !reflect.DeepEqual(got, want) {
		t.Fatalf("parseGalleryDLOutput = %v, want %v", got, want)
	}
	if got := parseGalleryDLOutput("| https://x/orphan\n"); len(got) != 1 || got[0][0] != "https://x/orphan" {
		t.Fatalf("orphan alternate should start a group, got %v", got)
	}
}

// TestXPhotoNaming: X media URLs carry the type in ?format=, which the
// extension and filename must pick up.
func TestXPhotoNaming(t *testing.T) {
	u := "https://pbs.twimg.com/media/Gxyz123?format=jpg&name=orig"
	if got := extFromImage("", u); got != ".jpg" {
		t.Fatalf("ext = %q", got)
	}
	if got := photoBaseName(u); got != "Gxyz123.jpg" {
		t.Fatalf("name = %q", got)
	}
	if got := extFromImage("image/png", u); got != ".png" {
		t.Fatalf("content-type should win, got %q", got)
	}
}
