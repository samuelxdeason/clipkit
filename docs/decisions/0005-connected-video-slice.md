# 0005: Connect the video slice through an app-owned adapter

Status: adopted for the first milestone-3 slice.

The new frontend must work with the existing backend without importing legacy React components, CSS or generated Wails model classes. Keep serializable HTTP DTOs, APIBase discovery, media URLs and event subscriptions in `apps/library/src/services`; shared UI stays unaware of transport and library identities.

Use the current `/api/videos` accessible-catalogue endpoint in complete 500-row batches, followed by local filtering and paging, matching the existing Manager. Introducing server-side query/count endpoints is deferred. This avoids silently filtering only one backend page and preserves hidden-collection exclusion, at the cost of full-catalogue load time and non-transactional offset reads.

Mutations use existing endpoints and reconcile authoritative state after success or partial failure. Do not present synthetic Undo as real restore: the backend has recoverable trash but no restore endpoint. Keep explicit demo mode for isolated design review and HTTP-intercepted fixtures for all integration checks.

The old frontend remains the production entry until feature parity. The video slice does not imply completion of photos, directory pages or playback. See [connected library](../ui/connected-library.md) for the executable contracts and remaining limitations.
