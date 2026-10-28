package downloader

import (
	"context"
	"image/jpeg"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

func TestTriptychThreeDistinctFrames(t *testing.T) {
	ff, err := filepath.Abs("../../resources/ffmpeg/ffmpeg.exe")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(ff); err != nil {
		t.Skip("bundled FFmpeg unavailable")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	dir := t.TempDir()
	video, output := filepath.Join(dir, "synthetic.mp4"), filepath.Join(dir, "preview.jpg")
	cmd := exec.CommandContext(ctx, ff, "-nostdin", "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=red:s=90x160:d=1", "-f", "lavfi", "-i", "color=c=green:s=90x160:d=1", "-f", "lavfi", "-i", "color=c=blue:s=90x160:d=1", "-filter_complex", "[0:v][1:v][2:v]concat=n=3:v=1:a=0[out]", "-map", "[out]", "-c:v", "libx264", video)
	if err := cmd.Run(); err != nil {
		t.Fatal(err)
	}
	if err := WriteTriptych(ctx, ff, video, output, 3); err != nil {
		t.Fatal(err)
	}
	file, err := os.Open(output)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	image, err := jpeg.Decode(file)
	if err != nil {
		t.Fatal(err)
	}
	if image.Bounds().Dx() != 684 || image.Bounds().Dy() != 384 {
		t.Fatal(image.Bounds())
	}
	for index, x := range []int{126, 342, 558} {
		r, g, b, _ := image.At(x, 192).RGBA()
		channels := []uint32{r, g, b}
		for other := range channels {
			if other != index && channels[index] <= channels[other]*2 {
				t.Fatalf("panel %d does not show its distinct frame", index)
			}
		}
	}
	cancelled, stop := context.WithCancel(context.Background())
	stop()
	if err := WriteTriptych(cancelled, ff, video, filepath.Join(dir, "cancelled.jpg"), 3); err == nil {
		t.Fatal("cancelled extraction succeeded")
	}
}
