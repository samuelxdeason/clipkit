package downloader

import (
	"context"
	"fmt"
	"os/exec"
	"syscall"
)

// WriteTriptych samples three moments without changing the video or its poster.
// The caller owns cancellation, concurrency limits and the temporary output file.
func WriteTriptych(ctx context.Context, ffmpeg, video, output string, duration int) error {
	args := triptychArgs(video, output, duration)
	cmd := exec.CommandContext(ctx, ffmpeg, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Run()
}

func triptychArgs(video, output string, duration int) []string {
	args := []string{"-nostdin", "-y", "-v", "error", "-filter_complex_threads", "1"}
	for _, fraction := range []float64{0.2, 0.5, 0.8} {
		args = append(args, "-ss", fmt.Sprintf("%.3f", float64(duration)*fraction), "-threads", "1", "-i", video)
	}
	filter := ""
	for i := 0; i < 3; i++ {
		filter += fmt.Sprintf("[%d:v]scale=216:384:force_original_aspect_ratio=decrease,pad=216:384:(ow-iw)/2:(oh-ih)/2,setsar=1[v%d];", i, i)
	}
	filter += "[v0][v1][v2]hstack=inputs=3,pad=684:384:(ow-iw)/2:0[out]"
	return append(args, "-filter_complex", filter, "-map", "[out]", "-frames:v", "1", "-q:v", "3", output)
}
