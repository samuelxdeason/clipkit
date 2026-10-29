# Connected video library

## Vertical preview generation

The daemon for the new library app now lives in `D:\Dev\sam\trove-py`. New backend work belongs there; the Go implementation remains a compatibility reference. The Python route uses the same URL below, so the frontend client does not need a route change.

The new server endpoint `GET /api/videos/triptych?site=…&id=…` generates a widescreen JPEG from frames at 20%, 50% and 80% of a known vertical video's duration. It uses the same catalogue visibility predicate as browsing, resolves the source inside the media root, and caches under `.trove/cache/triptychs` using source identity, size and modification time. Existing video/poster files and download queue state are untouched. Extraction is serialized with a 45-second deadline covering waiting and generation; cache hits bypass extraction. In the Python daemon, a disconnected client does not immediately cancel the synchronous worker, which finishes within that deadline. Failed extraction produces a recoverable image error, and the new UI returns to the original poster. This endpoint requires a rebuilt/restarted backend; frontend changes alone cannot enable it. Tests use generated color panels and temporary roots, never a real vault.

This is the first real-data slice of milestone 3. The new video library uses the existing HTTP API; the desktop and daemon still embed the old frontend. [Photos](photos.md) is now connected too; people/collection pages and the full player remain later slices. The ClipKit wordmark from the synthetic shell is retained.

## Run and connect

Run `npm run dev:library`, then open `http://localhost:5174/`. Open Settings and, under Library, enter the backend server: the origin of an already-running ClipKit backend, for example `http://localhost:8899` for a daemon using its default port. Every page reads the saved address on load; the address is set in one place, as the existing app had no per-page connection panel. The desktop backend uses a random port; use its actual address, not a guessed fixed port. This command starts only the new frontend, never the daemon or a vault.

Leaving the field empty uses same-origin `/api` routes, appropriate when the UI is served alongside the backend. Inside Wails, the adapter calls `window.go.main.App.APIBase()` instead of using the saved address. No Wails-generated modules or legacy styles are imported. A Vite page without a configured backend shows a readable connection error; it does not silently switch to sample data. Addresses must be HTTP(S) origins without credentials, query strings or paths. Browser HTTPS/mixed-content and CORS rules still apply.

The server address is saved in localStorage. Filters, sort, density and page are saved in sessionStorage; changing the server resets filters/page. Catalogue rows and file paths are not cached in browser storage. Storage being unavailable does not prevent browsing. The native app's asset entry is deliberately unchanged until cutover.

Use `/?demo=1` for the isolated, session-only synthetic library, or `/?view=foundation` for the controls demo. Demo mode makes no API/media/event requests. Storybook also remains synthetic.

## Owners and contracts

| Concern | Owner |
| --- | --- |
| DTOs, HTTP errors, media URLs, native discovery, event subscription | `apps/library/src/services/library-client.ts` |
| Normalizing catalogue fields and pure filtering | `apps/library/src/features/videos/model.ts` |
| Loads, cancellation, session settings, selection and mutations | `apps/library/src/features/videos/use-connected-library.ts` |
| Connection form | `apps/library/src/app/connection-panel.tsx` |
| Layout/cards/controls | [Browsing patterns](browsing.md) |

The API contract is derived from `internal/server/server.go` and `internal/library/library.go`. Video identity is the pair `(site, id)`, encoded without delimiter collisions. People shown on cards come from derived `people`, while writes append to manual `models`; never overwrite manual people with derived source-account membership. User tags come from `labels`; imported `tags` remain searchable metadata. Resolution uses height; finished status matches the existing UI's 95% resume-position threshold.

Like the existing Manager, the adapter fetches `/api/videos` in 500-row batches until exhausted, then applies the full filter intersection and 12-item UI paging locally. It does not filter only the first backend page. `/api/videos` enforces the backend's hidden-collection exclusion; never replace it with collection-specific reads to assemble the main library. Duplicate rows across batches are deduplicated by source and ID. This preserves current behavior, but offset reads are not a transactional snapshot and large libraries still require a full load. A future server query/count endpoint is a separate backend change.

Search supports terms and quoted phrases across current/original titles, file names/paths, source, uploader, people/nicknames, labels and source tags. Filters include people (any), tags (all/any), source, viewing status, duration, minimum resolution, date added, favorites and missing metadata. Changes reset page and selection. Refreshes keep the visible catalogue on failure; page clamps when results shrink. Selection remains confined to the current page.

## Writes and recovery

Favorites use `/api/setfavorite`; tags use `/api/setlabels`; manual people use `/api/setmodels`; collection additions use `/api/albums/add`. Bulk tags/people append and deduplicate rather than replacing existing associations. Locked/inherited-locked collections are excluded; hidden destinations are labeled because adding a video may remove it from the main library. Folder paths distinguish identically named collections. People can be created in the new People directory. Collection creation/unlocking remains in the existing app.

Writes disable competing actions, report errors and reconcile authoritative data afterward. Sequential bulk writes report how many succeeded and preserve selection for retry on partial failure. Idempotent append/set operations make that retry safe. A refresh error after a successful write is shown separately from the success message; it does not imply a rollback. External writers can still race read/modify/write operations because the existing API has no revision precondition.

Real removal requires confirmation and calls `/api/media/trash`, preserving the backend's recoverable file-and-catalogue transaction. It does not call a permanent-delete endpoint. There is no restore API, so connected mode has no fake Undo. Demo removal/Undo remains local only.

Backend `library`, `queue`, `avatar` and `import` events trigger debounced refresh; reconnect also refreshes. In-flight reads are aborted on replacement/unmount. Events during writes are covered by the final authoritative refresh. Subscriptions/timers are disposed on unmount. Mutation failures remain visible across subsequent background refreshes.

## Verify without real data

Run `npm run build:library`, `npm run test:library-connected`, and `npm run test:library-demo`, using [browser prerequisites](../testing.md). Connected tests intercept every API call and use invented records. They cover a 505-row catalogue, cross-source ID collisions, filter intersections, page persistence, exact write payloads, locked collections, append semantics, trash, partial failure/retry and live reconciliation. Transport/model tests cover nullable arrays, readable errors, aborts, URL encoding and Wails discovery. Never use a live vault as a smoke-test fixture.
