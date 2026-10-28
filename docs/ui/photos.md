# Connected Photos and shared browsing

Open Photos in the new app sidebar, or `/?view=photos`. It shares the connected Videos server configuration and ClipKit shell; see [connection setup](connected-library.md). The old `frontend/` and desktop asset entry are unchanged. Photos is connected-only; `/?demo=1` remains the isolated video demo.

## Ownership

- `features/photos/photo-library.tsx`: page composition and which dialog/preview is open.
- `photo-toolbar.tsx`, `photo-card.tsx`, `photo-dialogs.tsx`: photo-specific presentation and interactions.
- `use-photo-library.ts`: cancelled reads, event refresh, mutations, selection and session settings.
- `model.ts`: pure photo filter/sort rules; tests sit alongside it.
- `services/library-client.ts`: serializable DTOs and HTTP methods, independent of legacy Wails model classes.
- `app/connection-panel.tsx`: connection UI used by both features.
- `components/browsing/browse-controls.tsx`: search, toolbar/results count, active filter chips, preview sizes, Manage toggle, grid density and paging footer used by both Videos and Photos.
- `components/browsing/collection-options.ts`: unlocked collection options with folder paths and hidden-destination labels.

These browsing components remain app-owned because they describe this application's browsing patterns. They compose `@clipkit/ui`; they do not introduce a competing theme or import feature state. Shared UI remains generic. Feature components do not import another feature's internals. Video preview/organizing dialogs now live in `features/videos/video-dialogs.tsx` rather than the page; the page keeps composition, while its hooks retain demo/connected state.

## Data and privacy contracts

Photos are fetched from `/api/photos/all` in complete 120-row batches and deduplicated by photo ID before filtering. The backend's accessible catalogue remains the source of visibility. Filtering includes search terms, person, album label, added date, unassigned photos and collection membership. Sorting supports newest, oldest and filename; UI pages contain 24 items. Settings persist in sessionStorage, separately from Videos. Filter/sort/page changes clear selection; selection is scoped to the visible page, and pages clamp when results shrink.

The backend `album` field is a label, not normalized collection membership. **Album label** filters that field. **Collection** reads `/api/albums/photos` and intersects its IDs with the accessible main catalogue, so that endpoint cannot introduce hidden rows. Hidden, inherited-hidden, locked and inherited-locked collections cannot be browsed through this filter. A collection becoming unavailable clears its membership result and displays recovery guidance. Clearing that filter returns to the main catalogue.

Each photo has one `model` assignment. Assign person replaces it through `/api/photos/assign`; Remove assignment sends an empty name. Do not model this as video's multi-person append operation. The backend has no photo favorite/tag endpoints, so the UI does not invent them.

Add to collection calls `/api/albums/add` with photo IDs and an empty videos array, preserving existing memberships. Locked destinations are excluded; hidden destinations are labeled. Trash requires confirmation and calls `/api/media/trash`, preserving the backend's recoverable transaction. There is no pretend Undo.

Reads use cancellation and event-driven refresh, and failed refreshes retain existing results with an error. Writes disable competing actions, keep dialogs/selection available on failure, and reload authoritative data afterward. Backend assignment operations are atomic. Photos, metadata and selection are not stored in browser persistence. The page never starts a download.

## Preview and checks

Photo and video metadata share `components/browsing/media-card-content.tsx`: 14px horizontal/12px vertical padding, 16px titles at weight 650 and 22px line height, and a muted 14px people line with a fixed purple icon. Photo filenames stay on one line; video titles allow two. Long titles and people labels truncate with full-text tooltips. Change this shared owner to keep both card types aligned.

Portrait 4:5 image cards share selection geometry and person icon treatment with Videos, with a photo badge, filename and one person line. Album labels remain available through filters rather than duplicating the person below the card. Missing images show a fallback. The basic preview displays the original image, supports previous/next buttons and arrow keys, and restores focus on close. The complete immersive photo-viewer tooling remains milestone 4.

Run `npm run build:library`, `npm run test:photos-connected`, `npm run test:library-connected`, and `npm run test:library-demo`. Follow [test prerequisites](../testing.md). The photo suite intercepts all HTTP/media requests and covers a 125-photo catalogue, batch loading, search/collection intersections, page persistence, exact mutation payloads, write failure/retry, SSE refresh, viewport bounds, focus and axe. Never verify this feature by mutating a live vault.
