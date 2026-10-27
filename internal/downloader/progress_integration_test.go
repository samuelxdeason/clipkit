package downloader

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestBundledDownloaderReportsLocalTransferProgress(t *testing.T) {
	exe, _ := filepath.Abs(filepath.Join("..", "..", "resources", "yt-dlp.exe"))
	if _, err := os.Stat(exe); err != nil {
		t.Skip("bundled yt-dlp not installed")
	}
	// Synthetic local bytes exercise reporting without real media or credentials.
	const total = 2 * 1024 * 1024
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "video/mp4")
		w.Header().Set("Content-Length", fmt.Sprint(total))
		if r.Method == "HEAD" {
			return
		}
		chunk := make([]byte, 32768)
		for n := 0; n < total; n += len(chunk) {
			if _, err := w.Write(chunk); err != nil {
				return
			}
			w.(http.Flusher).Flush()
			time.Sleep(15 * time.Millisecond)
		}
	}))
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	args := []string{"--ignore-config", "--no-simulate", "--newline", "--no-warnings", "-o", filepath.Join(t.TempDir(), "test.mp4")}
	args = append(args, downloadProgressArgs()...)
	args = append(args, server.URL+"/test.mp4")
	out, err := exec.CommandContext(ctx, exe, args...).CombinedOutput()
	if err != nil {
		t.Fatalf("local transfer: %v\n%s", err, out)
	}
	d := newTestDL()
	j := &Job{ID: "test", Status: "downloading"}
	intermediate, speed, eta, bytes := false, false, false, false
	for _, line := range strings.Split(string(out), "\n") {
		if i := strings.Index(line, "[[PROG]]"); i >= 0 {
			payload := line[i+8:]
			d.applyProgress(j, payload)
			intermediate = intermediate || (j.Percent > 0 && j.Percent < 100)
			speed = speed || strings.Contains(j.Speed, "/s")
			eta = eta || strings.Contains(j.ETA, ":")
			bytes = bytes || progBytes(payload) > 0
		}
	}
	if !intermediate || !speed || !eta || !bytes || !strings.Contains(string(out), "[[DONE]]") {
		t.Fatalf("missing progress: intermediate=%v speed=%v eta=%v bytes=%v\n%s", intermediate, speed, eta, bytes, out)
	}
}
