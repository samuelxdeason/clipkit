# ClipKit

Self-hosted library for media you save from anywhere. A headless Go server
(`clipkitd`) owns the catalogue and serves the HTTP API, SSE events, media, and
the web UI (installable as a PWA); the Wails desktop app is a thin client over
the same engine.

ClipKit was previously called Trove. Existing library folders, configuration,
`TROVE_ROOT`, and saved view preferences remain compatible. The old
`start-trove.cmd` launcher forwards to `start-clipkit.cmd`. Internal Go module
and server source paths retain their existing names.

## Running

Downloads require FFmpeg to merge separate video and audio tracks. Put
`ffmpeg.exe` and `ffprobe.exe` in `resources/ffmpeg/` (a local, ignored tools
directory), beside the application executable, or on PATH. Windows builds are
linked from [FFmpeg's download page](https://ffmpeg.org/download.html).
Restart ClipKit after adding the tools.

- **Build the UI:** run `npm ci` and `npm run build` in `frontend/`.
- **Server:** `go build -o build/bin/clipkitd.exe ./cmd/troved`, then `build/bin/clipkitd.exe -addr 0.0.0.0:8899 -ui frontend/dist`
  (or use `start-clipkit.cmd`, which prints your LAN URL for phones).
- **Desktop app:** `wails dev` for live development, `wails build` for a
  redistributable build (see `wails.json`).

The vault location comes from `-root`, `$TROVE_ROOT`, or the saved config
(`%APPDATA%\Trove\config.json`). App state (catalogue db, sidecars, thumbs)
lives in a hidden `.trove/` folder inside the vault; media files live under
`media/`.

The sidebar separates Videos and Photos. Videos contains All videos, Recently
added, Favorites, and Needs organizing views in its own navigation.
The default workspace is a dark video file manager with neutral surfaces and
blue controls. Search titles, filenames, paths,
sources, people (including nicknames), and tags with Ctrl/Cmd+K. Search words
are combined; quotation marks keep a phrase together. Combine people, tag,
source, duration, and resolution filters, then sort or switch between list and
grid views. The workspace loads every accessible catalogue page before filtering;
very large libraries may take longer to open. Hidden collection contents stay
out of the main library and search.

Click a list row to watch its video. Use its circular selector or toolbar Select
mode to choose rows; Shift-click selects a range. Space follows the current mode,
and Enter or double-click opens the video.
Use the floating action bar to tag, assign people, or add selected videos to
collections without scrolling back up. Search sits alongside the filters.
Open the player’s Details panel to organize the current video.
Grid thumbnails and titles play the video directly. A compact circular selector
toggles each card; toolbar Select mode makes thumbnails and titles select instead,
with double-click opening the video. Shift-click selects a range, and Ctrl/Cmd-click
toggles a card without opening it. Portrait media fits within a consistent frame.
Search and filters hide together; Ctrl/Cmd+K reveals and focuses search.
Organization dialogs suggest existing tags, people, and collections as you type.
Tags also accept new comma-separated names. The player includes volume,
10-second seeking, fullscreen, saved positions, and previous/next navigation
through the current results. Its Details panel lets you organize while watching.
Escape closes the player and returns to the library. Playback requires a
browser-supported codec. The library remembers your grid/list preference.
Grid cards reserve equal space for tags and controls. Search sits beside the
content and stays scoped to the current view.
People open dedicated profiles with editable names and biographies, video totals,
and their own videos/favorites views. Favorites opens as a gallery with direct
watch actions and favorite management in Details. Needs organizing separates missing people and
missing tags into actionable queues with completion counts. Recently added
groups videos by arrival date and supports 7-, 30-, and 90-day periods.
Locked collections retain their opening prompt.

Photos is available in the main navigation, with album filtering, scoped search,
local/gallery-link imports, and a keyboard-accessible viewer. Person profiles
include Photos and Accounts tabs; accounts can be viewed, connected by URL or
from unassigned accounts, and disconnected directly from the profile.

Settings provides access to the existing photo, account, subscription, and other
library tools. Rebuild the UI to use the redesigned workspace.

Downloads includes status filters, live progress, local imports, and finished-job
cleanup. Settings groups storage and appearance, service connections, and
maintenance into separate sections using the same dark workspace design.

Downloads provides queue search, status filters, active jobs first, and retry for
failed standard downloads. Settings groups storage, connections, maintenance, and
advanced tools into focused sections with location-aware breadcrumbs.

The compact workspace keeps library controls in the top toolbar, with search and
filters in its expandable row. Video views use unframed thumbnails, restrained
selection accents, and compact subview controls. Organizer dialogs use Cancel/Save
actions and floating suggestions.

Person profiles keep a stable identity summary above Videos, Photos, and Accounts.
Favorites filters their Videos tab; video controls sit beneath the profile tabs.
Profile edits open separately without shifting the content.

### Shared interface styling

The current workspace imports `frontend/src/design-system.css` after its layout
styles. Use its shared color, border, and radius variables for new UI. Ordinary
buttons are neutral; blue marks primary actions and selection. Directory headings
use the same compact scale, media grids use unframed tiles, and editing dialogs
place Cancel before Save. Keep controls next to the content they affect and retain
visible keyboard focus and reduced-motion support. Legacy tools remain separate.

Video tabs preserve search, filter visibility and values, sorting, and grid/list
layout. Shared controls sit beneath the tabs, with period and organization options
in a consistent results row. Switching views clears selection and resets pagination.

Video views use a distinct segmented control within the Videos location; the
breadcrumb stays Videos. The expandable filter shelf groups search with labeled
metadata fields and highlights active filters without changing navigation sizing.

Videos uses a compact search row with an anchored Filters popover. Filter changes
apply instantly and appear as removable chips. The popover closes with Done,
Escape, or an outside click without shifting the results. Reset preserves search.

Person video views reuse the same search and filter popover, with removable chips
and tags/sources drawn from that person’s videos. The redundant Person filter is omitted.

Tag and People filters support searchable multi-selection. Videos must match every
selected tag and at least one selected person. Each selection can be removed
individually from the applied-filter chips. People search includes account names
and nicknames, and person profiles keep their tag options scoped to their videos.

Tags and People use a focused picker inside the filter popover, with automatic
search focus, full-row checkbox targets, selected-name previews, and a stable
scrolling results area. Back, Done, and Escape return to the filter overview.

Videos and person profiles share one action row: Favorites on the left, selection,
sorting, and grid/list controls on the right. The library Favorites tab is now a
toggle that combines with the current video view. Add videos lives in the header.

Person and Videos tabs share segmented-control styling at every screen size.
Person breadcrumbs show People / person name, independent of the active tab.
