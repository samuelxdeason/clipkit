# Trove

Self-hosted library for media you save from anywhere. A headless Go server
(`troved`) owns the catalogue and serves the HTTP API, SSE events, media, and
the web UI (installable as a PWA); the Wails desktop app is a thin client over
the same engine.

## Running

Downloads require FFmpeg to merge separate video and audio tracks. Put
`ffmpeg.exe` and `ffprobe.exe` in `resources/ffmpeg/` (a local, ignored tools
directory), beside the application executable, or on PATH. Windows builds are
linked from [FFmpeg's download page](https://ffmpeg.org/download.html).
Restart Trove after adding the tools.

- **Build the UI:** run `npm ci` and `npm run build` in `frontend/`.
- **Server:** `go build -o build/bin/troved.exe ./cmd/troved`, then `build/bin/troved.exe -addr 0.0.0.0:8899 -ui frontend/dist`
  (or use `start-trove.cmd`, which prints your LAN URL for phones).
- **Desktop app:** `wails dev` for live development, `wails build` for a
  redistributable build (see `wails.json`).

The vault location comes from `-root`, `$TROVE_ROOT`, or the saved config
(`%APPDATA%\Trove\config.json`). App state (catalogue db, sidecars, thumbs)
lives in a hidden `.trove/` folder inside the vault; media files live under
`media/`.

The archive home brings photos and videos together. Photographs has a gallery,
album browsing, search, and a keyboard/touch viewer, including images without
a person attached. Connections follows shared appearances already recorded in
the catalogue. Familiar faces uses favorites and in-progress viewing; it does
not perform automatic face recognition. Rebuild both the UI and server when
updating, since the gallery uses the `/api/photos/all` endpoint.
