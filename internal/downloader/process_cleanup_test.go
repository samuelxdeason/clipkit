package downloader

import (
	"bufio"
	"io"
	"os"
	"os/exec"
	"testing"
	"time"
)

// The helper child inherits stdout, just like the frozen downloader. An orphan
// keeps the pipe open and blocks the queue worker even after the parent exits.
func TestCleanupProcessHelper(t *testing.T) {
	mode := os.Getenv("CLIPKIT_CLEANUP_TEST")
	if mode == "" {
		return
	}
	if mode == "parent" {
		child := exec.Command(os.Args[0], "-test.run=^TestCleanupProcessHelper$")
		child.Env = append(os.Environ(), "CLIPKIT_CLEANUP_TEST=child")
		child.Stdout, child.Stderr = os.Stdout, os.Stderr
		if err := child.Start(); err != nil {
			os.Exit(2)
		}
		_ = child.Wait()
		os.Exit(0)
	}
	_, _ = os.Stdout.WriteString("ready\n")
	time.Sleep(30 * time.Second) // bounded fallback if a regression leaves it orphaned
	os.Exit(0)
}

func TestKillTreeClosesInheritedPipe(t *testing.T) {
	cmd := exec.Command(os.Args[0], "-test.run=^TestCleanupProcessHelper$")
	cmd.Env = append(os.Environ(), "CLIPKIT_CLEANUP_TEST=parent")
	pipe, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err = cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { killTree(cmd); _ = pipe.Close() })
	ready := make(chan struct{})
	closed := make(chan struct{})
	go func() {
		r := bufio.NewReader(pipe)
		line, _ := r.ReadString('\n')
		if line == "ready\n" {
			close(ready)
		}
		_, _ = io.Copy(io.Discard, r)
		close(closed)
	}()
	select {
	case <-ready:
	case <-time.After(5 * time.Second):
		t.Fatal("child did not start")
	}
	killTree(cmd)
	select {
	case <-closed:
	case <-time.After(5 * time.Second):
		t.Fatal("child kept stdout open; queue worker would remain blocked")
	}
	_ = cmd.Wait()
}
