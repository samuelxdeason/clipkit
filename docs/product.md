# Product and behavior

ClipKit is a private media-library application: import or download videos/photos, watch them, and organize them with people, tags and collections. It runs as a Wails desktop app and as a web UI served by the Go daemon. It was called Trove; internal module names, configuration and vault compatibility still use that name.

## User areas
- Videos and Photos: grid-first browsing, adjustable preview sizes, search, filters and chips, sorting, paged results, and separate Manage actions. Selection uses rounded-square controls. Do not restore list views or redundant library tabs.
- People and Tags: searchable directories with stable identity colors. Person profiles link associated videos, photos and source accounts.
- Collections: mixed-media memberships and nested folders. Moving memberships does not relocate the source media file. Preserve hidden/locked rules and descendant behavior.
- Following: saved sources, cached content, update checks, selection and downloads. Show more remains distinct from numbered library paging.
- Downloads: persistent queue, status filtering, progress/speed/ETA, ordering and retry/removal controls. Display sorting must never reorder execution priority.
- Player/photo viewer: playback and organization without losing the viewing session; Escape and focus recovery matter.
- Settings and Potential duplicates: connection/storage/maintenance, backups and comparison/cleanup workflows. Preserve busy, error and recovery states.

## Data semantics to preserve
The vault contains media and hidden `.trove/` app state. The queue is stored in `.trove/queue.json`. Restarting resumes unfinished jobs; an interrupted transfer may restart. Collection removal is not deletion of media. Trash/recycling is different from permanent deletion. Verify exact mutation semantics in internal/core and internal/library before changing UI copy or handlers.

People is the UI term; some APIs/generated models still use Model. Collection/folder APIs still use Album in several files. Keep translation at boundaries; do not rename persisted identifiers casually.

## UI principles
Charcoal canvas, warm white text, cherry primary/active accents, restrained stable person/tag colors. Content is the visual focus. Main-page creation actions sit beside titles; nested pages retain breadcrumbs. Full-width search precedes the results/control row. Paging stays below results. Menus anchor to their triggers and remain inside the viewport. See the design guide for implementation ownership.
