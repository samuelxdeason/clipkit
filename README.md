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

The download queue is saved to `.trove/queue.json` whenever jobs are added,
reordered, removed, retried, or change status. Reopening ClipKit restores the
queue and automatically runs unfinished jobs in their saved order. An interrupted
download returns to waiting and may restart its file transfer from the beginning;
failed jobs remain available for manual retry. Re-download jobs retain their
replacement target. Completed queue history remains until cleared. This cannot
recover queues lost before persistent storage was added.

The player has People, Tags, and Collections actions beneath the video. These
open an inline organization panel that stays inside fullscreen and preserves
playback. Search existing entries, link or unlink them, or create a person, tag,
or collection without leaving the player. Changes save immediately, with Undo
for the last successful membership change (new profiles/collections themselves
are kept). People linked through source accounts are identified separately.
File details contains title editing, favorites, file information, and re-download.
Escape closes the organization panel first, then the player outside fullscreen.

Player UI regression checks: run `node frontend/tests/player-smoke.cjs` with
Playwright available (`PLAYWRIGHT_MODULE_PATH` can point to its installed package).
The test uses Edge by default (`PLAYWRIGHT_CHANNEL` overrides it), bundled FFmpeg,
a synthetic video, mocked API responses, and a temporary Vite server on port 5198.
It does not modify the real library. Preview fixtures live under `frontend/tests/`
and are not included in the production build.

The sidebar separates Videos and Photos. Videos contains All videos, Recently
added, Favorites, and Needs organizing views in its own navigation.
Photos have direct selection circles in grid and list views, Shift-click range
selection, and bulk **Assign person**, **Add to collection**, and **Move to trash**
actions. Assigning a person replaces the selected photos' current person and
makes them available in that person's Photos tab.

**Collections** brings the former video collections and named photo albums together.
Collections can contain photos, videos, and nested folders. Use the expandable
sidebar tree, breadcrumbs, and the **+** beside a folder to create subfolders.
Drag one item or a selected batch from Photos or Videos onto a folder to add it.
Dragging between collection folders moves items; hold **Ctrl** to keep them in
both folders. You can also use **Move to folder** or **Add to collection** on a
selection. Drag folders onto other folders to nest them, or onto the sidebar's
**Folders** heading to move them to the top level. Invalid circular moves are blocked.
Use **F2** to rename the open collection and **Ctrl+Shift+N** to create a folder.
The collection options menu also supports renaming, moving, and pinning folders.
These are library memberships, so organizing does not duplicate or relocate media
files on disk. **Remove from collection** leaves the file in the library; deleting
a collection preserves media and moves its subfolders up one level. Hidden status
applies to media in descendant collections.

The default workspace is a dark video file manager with restrained charcoal surfaces,
warm whites, muted blush actions, and locally bundled Nunito for rounded,
readable type. Subtle gray selections mark the current location, while compact
media cards and list rows share consistent metadata and controls. Search titles, filenames, paths,
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
Choose **Move to trash** in the selection bar to move selected videos to the
vault’s `Recycle bin` folder. Photos support **Select photos** in both grid and
list views, including person galleries; **Select all matching** includes every
photo matching the current filters across pages. Trashed files leave the library
but remain in dated recycle folders with a manifest of their original paths.
Recovery is manual; there is no in-app restore action yet.
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

Photos is available in the main navigation, with collection filtering, scoped search,
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

Following is available in the main sidebar. Load supported profile, channel, playlist, or favorites URLs; browse cached lists, check manually for updates, and queue selected items or all items not yet in the library. Unfollow removes only the saved source. Site support and login requirements depend on the existing downloader; this is not an automatic background subscription scheduler.

Select two or more videos and choose **Mark as potential duplicates** to save a
review group. Open **Potential duplicates** in the sidebar to preview each video,
compare resolution, duration, and size, and choose which entries to keep. **Keep
all** dismisses a group without changing the videos. Removing duplicates removes
catalogue entries and collection memberships, and moves video files into the
vault **Recycle bin** folder. Dated batches preserve filenames and original paths
in a recycle manifest. Files stay there until you manually delete them to free
space. The queue displays the folder path. Library scans skip recycled files.
Private or locked collection videos cannot be added to this shared queue.

To fill the queue automatically, run `troved find-duplicates` (dry run) and
then `troved find-duplicates --apply`. It groups videos that point at the same
file, or that share a source URL, an identical file size, or an identical title
at the same duration; cleaner fallback titles ("Someone clip") are ignored.
Groups already queued are skipped. Applying backs the catalogue up first, adds
only review rows, and is safe while the app is running. Removing a review entry
whose file is still catalogued under a kept entry drops the row and leaves the
file where it is.

Potential duplicates reviews one group at a time with aligned resolution, duration,
size, and source comparisons. Use Keep only this for one copy, or check multiple
keepers; Save & next recycles the others and advances. Skip preserves your choices
while the page stays open. Side-by-side previews and More details provide a closer
look, with queue navigation and a sticky decision bar for longer comparisons.

When one file is catalogued under several rows, run `troved merge-same-file-rows`
(dry run) and then `troved merge-same-file-rows --apply`. Each file keeps the row
it is named after (else the oldest); people, tags, labels, favourite, watch
history and collection memberships from the other rows are merged into it, and
those rows are dropped. Files are never moved. The catalogue is backed up first
and the dropped rows are written to a JSON file beside the backup.

Photos now shares the Videos search and filter layout, segmented views, sort and
grid/list controls, result counts, and pagination. The header Add photos action
offers local and gallery-link imports. Person profile Photos uses the same browser.
Utility pages share compact headings, search fields, button sizing, and spacing.

Video cards show saved viewing progress and a fallback when a preview is missing.
The People directory supports name search, alphabetical sorting, and sorting by
video count. Profiles display the saved name, original name, notes, and library
stats above their Videos, Photos, and Accounts tabs. Existing search, filters,
selection, bulk organization, and grid/list controls remain available.

`node frontend/tests/library-smoke.cjs` checks browsing and profile workflows with
an isolated synthetic catalog. It requires Playwright (or `PLAYWRIGHT_MODULE_PATH`)
and Edge; set `PLAYWRIGHT_CHANNEL` to use another installed browser channel.

Collections use cover cards at the top level and compact subfolders inside each
collection. Photos share the library card styling, with selection beside sorting
and view controls. Missing image previews use a placeholder. Collection options
close after choosing an action, clicking outside, or pressing Escape.
`node frontend/tests/photo-collections-smoke.cjs` checks photo filtering, selection,
viewer navigation, drag-and-drop payloads, collection dialogs, and narrow layouts
against synthetic data using the same Playwright setup.

Downloads uses queue overview cards, separate job cards, and prominent live
progress, speed, and ETA information. Overview cards filter the queue; existing
retry, reorder, removal, import, and history controls remain available.
`node frontend/tests/downloads-smoke.cjs` simulates live queue events and verifies
queue actions without connecting to the real download service.

Following uses source cards with separate library counts and actions, plus a
source header and selectable item cards. Search fields include clear buttons;
the results row clarifies that Download available applies to the entire source.
`node frontend/tests/following-smoke.cjs` verifies source browsing, refresh and
retry, filtering, selection, queue exclusion, unfollowing, and responsive layouts
with simulated sources and downloads.

Settings shares the library's section headers and action cards, with descriptive
navigation, storage summary cards, and dismissible completion notices.
`node frontend/tests/settings-smoke.cjs` checks storage, mocked desktop folder
selection and connection import, backup/rebuild actions, and maintenance events
without modifying the real vault or settings.

Potential duplicates uses a review summary, refined comparison panels, distinct
keep/recycle states, and a sticky decision bar. Missing thumbnails have a fallback.
`node frontend/tests/duplicates-smoke.cjs` verifies draft selections, navigation,
playback, preview exclusivity, cleanup failure/retry, and exact keeper payloads
with generated neutral video and mocked cleanup endpoints.

Tags uses searchable cards with video counts and alphabetical or most-used
sorting. Opening a tag retains the existing video filter and bulk organization
workflow. Empty tag suggestions appear inline so they do not cover Save.
The library smoke test includes tag search, keyboard browsing, and creating a
tag through bulk editing while preserving existing labels.

The sidebar groups Library and Organize destinations, highlights the active page
and folder, and keeps collection search, pinned folders, and drag targets available.
In narrow windows, Close navigation or Escape closes the sidebar and returns focus
to its toggle. Escape first clears an active folder search. The photo/collection
smoke test also checks sidebar shortcuts, folder navigation, pins, and closing.

Editing, importing, and organizing dialogs share field, action, and menu styling.
Shared dialogs preserve autofocus, skip hidden and disabled controls when trapping
Tab, return focus on close, and let picker Escape handling run before dismissal.
The library and photo/collection smoke tests cover these dialog workflows.

Empty states, loading indicators, and recovery messages share consistent cards,
spacing, and action styling. Loading indicators respect reduced-motion preferences.
The states smoke test uses mocked failures to verify library, photo, Settings, and
duplicate-queue recovery, empty-state actions, and narrow-window error layouts.

The final consistency pass aligns search and keyboard focus, placeholder contrast,
checkbox accents, pagination controls, compact headings, and numeric metadata.
The eight page smoke suites cover player, library, photos/collections, downloads,
Following, Settings, duplicates, and loading/recovery using isolated sample data.

The After Hours theme layers near-black and plum surfaces, crimson primary actions,
sharper system typography, and cinematic media accents over the existing layouts.
Its styles live in frontend/src/after-hours.css, including player and portaled menus.
All eight mocked workflow suites passed with the theme applied.

Media-first browsing uses larger widescreen video previews, quieter card borders,
and roomier photo, people, and collection grids. Selection and metadata remain
visible, with existing list views, filtering, tagging, and drag-and-drop preserved.
Library, photo/collection, and player smoke checks passed with these layouts.

The immersive player fills the available window with a compact title bar and
persistent playback/organization dock. Desktop organization scrolls independently;
narrow windows stack it beneath playback. Player smoke checks also exercise the
880px breakpoint, phone width, short windows, and forward/rewind controls.

People profiles use a large portrait, a responsive identity header, clearer library
stats, and underlined media tabs. The header keeps its height in the scrolling
workspace so Edit profile remains reachable. Profile smoke checks include a sample
portrait plus editing on desktop and phone-sized windows.

Collections now use larger cover mosaics with up to three available images;
unavailable covers fall back to remaining images or the folder icon. Photo grids
use larger uncropped previews, and the photo viewer fills the window while keeping
navigation visible. The photo/collection smoke suite covers cover recovery, viewer
sizing, editing, selection, drag-and-drop, keyboard shortcuts, and narrow layouts.

Following uses larger source portraits and a responsive gallery of widescreen media
cards, with selection, source links, and download states visible on each card.
Previews use existing saved thumbnails; other items show an explicit placeholder.
Source checking, refresh/retry, status filtering, selection, bulk downloads, and
narrow layouts pass the isolated Following smoke suite.

Downloads uses larger queue summary cards, clearer active-transfer progress, and
separate row action areas. At narrow widths, reorder and retry controls move below
the download details. The mocked downloads suite verifies progress, speed, ETA,
filtering, queue order/removal, retry recovery, enqueue, and bulk cleanup.

Settings uses wider section navigation, clearer storage summaries, connection
status badges, and structured action rows. Navigation moves above the content on
smaller windows, with action buttons below descriptions on phones. The Settings
smoke suite verifies connection imports, folder/restart mocks, backup recovery,
rebuild, maintenance progress, advanced tools, and responsive layouts.

Potential duplicates uses larger previews, wider comparison columns, clearer
keep/recycle cards, and a prominent sticky decision bar. Horizontal comparison
remains available in narrow windows. The duplicate smoke suite verifies playback,
preview exclusivity, group navigation, preserved choices, and cleanup failure/retry
with exact mocked keep payloads; no library files are changed by these checks.

Tags uses larger category tiles, prominent names and video counts, and a clearer
sorting toolbar. Existing search, keyboard activation, filtered video browsing,
and bulk tagging pass the library smoke suite, including narrow layouts.

Sidebar navigation uses roomier destinations, distinct current-page styling,
visible folder-add controls, and clearer pinned-folder state. Short windows retain
compact rows; narrow windows use a wider drawer. Photo/collection and library
smoke suites verify shortcuts, nested/pinned folders, drag-and-drop, focus return,
and browsing layouts with the new sidebar dimensions.

Dialogs and pop-up menus share richer After Hours surfaces, larger fields and
menu rows, stronger headings, and consistent action spacing. Library and photo/
collection smoke checks verify editing, import-dialog access, organizing menus,
Tab trapping, Escape ordering, focus return, and narrow layouts.

Empty, loading, and recovery states use After Hours cards, clearer status colors,
and prominent retry actions. Loading animation still respects reduced motion.
State, Following, downloads, and Settings smoke suites verify recovery actions,
notifications, progress, and narrow-window layouts with mocked failures.

The final After Hours consistency pass unifies selected rows, grid selection,
filter chips, pressed controls, bulk actions, and drag/drop highlights. All eight
isolated UI smoke suites passed against the completed theme, including playback,
organization, download controls, Settings, duplicates, and error recovery.
