# New ClipKit library frontend

Milestone 3 connects the video-library slice to the existing backend. It is not yet a replacement for the whole working app. Root `npm run dev` and desktop builds still target `frontend/`.

Run `npm run dev:library` or `npm run dev:foundation` from the root. Use `npm run build:library` for production assets. The app consumes `@clipkit/ui` through Panda's designSystem manifest and imports its own generated CSS plus the package font. It does not import legacy styles.

The default route is connected mode. Expand **Library connection** to specify your running backend's origin; empty uses same-origin HTTP and Wails discovers its backend automatically. The dev command does not start a backend. See [connection setup and contracts](../../docs/ui/connected-library.md).

`/?view=photos` opens the connected Photos page, also available from the sidebar. See [Photos contracts and shared browsing ownership](../../docs/ui/photos.md). `/?demo=1` retains the synthetic video library with session-only edits and `/?view=foundation` retains the controls demo. `/?view=people` and `/?view=tags` open the connected directories; people have editable profiles and account connections. See [People and Tags contracts](../../docs/ui/people-tags.md). Collections, other sidebar pages and the full player remain future slices. See [browsing contracts](../../docs/ui/browsing.md) and [the foundation plan](../../docs/ui-foundation-plan.md).
