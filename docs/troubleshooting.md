# Where to investigate

| Symptom | Start here | Verify |
| --- | --- | --- |
| Header/toolbar spacing or unexpected color | app-theme.css import order, tokens.css, browse-layout.css, DevTools computed style | headers + style-contracts |
| Popover misplaced, clipped or behind a dialog | PopoverPosition.ts; trigger ref; top-layer lifecycle; legacy offsets | library bounds tests, affected dialog suite |
| Filter option/chip does not match results | Manager.tsx or PhotoBrowser.tsx state and reset handlers; FilterMultiSelect.tsx | combined filtering + reset + paging |
| Missing/stale catalogue or HTML returned as JSON | api.ts, httpResponse.ts, internal/server/server.go | unit HTTP tests, states |
| Download progress stuck | SSE /api/events, LibraryUtilities.tsx, internal/downloader, internal/core | downloads suite, controlled backend fixtures |
| Queue order or lost jobs | internal/core queue persistence and downloader worker; separate display sort from priority | Go tests and queue UI suite |
| Collections wrong after move/delete | AlbumBrowser.tsx, internal/core/albums.go, internal/library/albums.go | membership/descendant tests |
| Duplicate cleanup unsafe or confusing | DuplicateQueue.tsx, duplicateComparison.ts, internal/core/duplicates.go, library duplicate code | duplicates suite + Go tests |
| Desktop-only failure | app.go, native api.ts branch, generated bindings, Wails logs | desktop build; compare browser transport |
| Organization interrupts playback | VideoPlayer.tsx, App.tsx, organizing components | player suite preserving video element |

## Debugging workflow
1. Capture expected/actual behavior, affected page, app build, window size and steps. Keep personal media/cookies out of reports.
2. Reproduce with synthetic fixtures. Inspect the owning component and its styles/callers before changing anything.
3. Follow data from UI handler to api.ts to HTTP/core/persistence when relevant. Do not fix an API bug with misleading UI fallback data.
4. Add a regression assertion for the actual failure; run the smallest relevant suite, then broader shared checks when warranted.
5. Report changes, evidence, and anything not tested. Never restart or alter a user's current download queue merely to diagnose appearance.
