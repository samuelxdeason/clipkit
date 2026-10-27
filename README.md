# ClipKit

A private video and photo library with playback, people, tags, nested collections, source following and a persistent download queue. The React UI runs in a Wails desktop app or against the headless Go server.

## Start here

- [Documentation map](docs/README.md): product, architecture, design system, troubleshooting and decisions.
- [Contributor and AI-agent instructions](AGENTS.md).
- [Repository evolution](docs/repository-evolution.md): staged shared packages and separate frontends.

## Development

```sh
npm ci
npm run dev
npm run check
npm run test:ui -- library photo-collections
npm run build:desktop
```

See [testing and prerequisites](docs/testing.md) before running browser or desktop checks. The root npm workspace installs dependencies for frontend and packages from one lockfile. Desktop packaging does not start the app.

Headless build: `go build -o build/bin/clipkitd.exe ./cmd/troved`. Run with `-addr 127.0.0.1:8899 -ui frontend/dist` and an intentional vault root. `start-clipkit.cmd` is the existing launcher. Downloads need FFmpeg/ffprobe in resources/ffmpeg, beside the executable, or on PATH.

ClipKit was previously Trove. The Go module, cmd/troved, TROVE_ROOT and existing saved configuration remain compatible. The desktop embeds frontend/dist. Do not point automated tests at a real vault or running queue.
