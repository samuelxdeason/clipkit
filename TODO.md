# Deferred fixes

## Download progress and stalled-process cleanup — completed October 27, 2026

Implemented after confirming the live queue had no jobs.

- [x] Restore downloader progress reporting in `internal/downloader/downloader.go`. The command uses `--print`, which implies quiet mode, but does not explicitly enable `--progress`. The bundled yt-dlp help confirms that `--progress` enables progress output even in quiet mode. Verify percentage, speed, ETA, and downloaded-byte updates with a local test download.
- [x] Fix `killTree` so it terminates the process tree before killing the parent separately. It currently calls `Process.Kill()` before `taskkill /F /T`, which can leave the downloader child alive. Add a regression test using a controlled parent/child process fixture; confirm both exit and the queue can advance.
- [x] Verify the stall watchdog after progress is restored. Healthy transfers should keep it alive; a genuinely stalled transfer should terminate completely and allow the next queued job to start. Check behavior across separate audio/video transfers, retries, and post-processing.

### Diagnostic evidence and limits

The observed job stayed at 0% with blank speed/ETA while downloader output continued growing. A ten-second process I/O sample showed approximately 353 KiB/s of writes; this is an estimate from process I/O, not a direct network-speed measurement. The downloader child was still running after its parent disappeared, and 86 jobs were queued behind the active job at the time of inspection.

The initial zero-byte partial-file reading was misleading; later observations showed data being written. The remote server's transfer speed remains unexplained. Do not assume these application fixes will increase server bandwidth. Recheck actual transfer speed after reliable progress reporting is available, using a non-explicit test source.

No current downloads should be cancelled, retried, or restarted to carry out this deferred plan.

### Verification

Downloader and core tests pass. A synthetic local HTTP transfer through the bundled yt-dlp verifies percentage, speed, ETA, downloaded bytes, and completion output. A controlled parent/child process verifies that tree termination closes inherited stdout, allowing the worker to finish reading. Watchdog tests cover byte-counter resets between streams/retries, unchanged counters, and silent post-processing. Progress events now retain the complete queue row so the active UI keeps its title and status. These fixes do not increase remote-server bandwidth.
