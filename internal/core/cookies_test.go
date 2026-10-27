package core

import "testing"

func TestMergeCookiesPreservesHttpOnly(t *testing.T) {
	const header = "# Netscape HTTP Cookie File\n"
	const existing = "#HttpOnly_.example.com\tTRUE\t/\tTRUE\t0\tsession\told"
	const incoming = "#HttpOnly_.other.example\tTRUE\t/\tTRUE\t0\tauth\tnew"
	got := mergeCookies(header+existing+"\r\n", "# ordinary comment\r\n\r\n#HttpOnly_invalid\r\n"+incoming+"\r\n")
	want := header + existing + "\n" + incoming + "\n"
	if got != want {
		t.Fatalf("mergeCookies() = %q, want %q", got, want)
	}
}

func TestMergeCookiesIncomingHttpOnlyAttributeWins(t *testing.T) {
	const plain = ".example.com\tTRUE\t/\tTRUE\t0\tsession\told"
	const httpOnly = "#HttpOnly_.example.com\tTRUE\t/\tTRUE\t0\tsession\tnew"
	for _, tc := range []struct {
		name, existing, incoming string
	}{
		{"add attribute", plain, httpOnly},
		{"remove attribute", httpOnly, plain},
		{"retain attribute", httpOnly, "#HttpOnly_.example.com\tTRUE\t/\tTRUE\t0\tsession\tupdated"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			want := "# Netscape HTTP Cookie File\n" + tc.incoming + "\n"
			if got := mergeCookies(tc.existing, tc.incoming); got != want {
				t.Fatalf("mergeCookies() = %q, want %q", got, want)
			}
		})
	}
}
