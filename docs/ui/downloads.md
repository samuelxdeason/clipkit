# Connected Downloads

`/?view=downloads` is available under Manage library in the sidebar. The page
uses the configured daemon connection; it does not control a different app's queue.

## Ownership and behavior

- `features/downloads/downloads-page.tsx` composes the overview, add-links form,
  shared browsing toolbar/paging, and queue actions.
- `download-row.tsx` owns status, progress and state-appropriate controls.
- `model.ts` validates/deduplicates pasted links and groups statuses.
- `services/download-client.ts` owns the queue DTO. HTTP uses `LibraryClient`;
  lifecycle and mutation locking reuse `useLibraryResource`.

Queue snapshots arrive through `/api/queue`, queue events, reconnect refreshes,
and a three-second visible-page fallback poll. Polling waits during reads/writes.
The daemon owns persistence and work; closing this page does not stop downloads.
Snapshots remain visible after read errors. Failed submissions retain pasted text.
The UI never automatically retries a write; a server error may follow partial work.

Overview totals always represent the full queue. Search/status filters affect
only displayed rows. Queue order is the default; alphabetical sorting is visual
only. Waiting-job position controls use the full queue, not filtered positions.
Paging is 24 rows and clamps after removals. Completed includes `done` and
`duplicate` (already saved); failed jobs are a separate group.

## API contracts

| Action | Endpoint and payload |
| --- | --- |
| Add unique HTTP(S) links | `/api/enqueue/many` `{urls}`; shows returned `added` count |
| Reorder a waiting job | `/api/job/move` `{id, direction: "up" / "down" / "next"}` |
| Remove a waiting job | `/api/job/remove` `{id}` |
| Retry one/all failed jobs | `/api/job/retry` `{id}`; empty ID means all |
| Clear completed history | `/api/queue/clear-completed` `{}` |

Clear completed removes queue entries, not media files. Active jobs have no
pause/cancel buttons because the Python daemon does not implement those actions.
Progress is clamped to 0–100; speed/ETA are shown only when supplied. ETA belongs
to one job, not the whole queue. Unknown statuses are displayed without invented
controls. No download queue, worker or storage code is changed by this page.

## Verification

Build with `npm run build:library`, then run `npm run test:downloads-connected`
using the [browser prerequisites](../testing.md). Every API is intercepted;
no real download starts. The suite covers paging/search, exact action payloads,
active-job controls, URL validation, failed-write draft retention, live progress,
read recovery, narrow layout and axe. Screenshots are visual review artifacts.

## Presentation

The old Downloads layout is the visual baseline: one blue-tinted header contains
`download-composer.tsx`, four status summaries, and Active now / Up next.
Compact entry uses the shared Input. Multiple-link entry expands on demand or
when pasting several links, preserving drafts across mode changes. Counts refer
to the full queue, including while searching. The live summary shows the first
active job and first waiting job in authoritative order, not the sorted view.

Activity uses info blue, completion success green, errors danger red; cherry is
reserved for actions/selection. `queue-overview.tsx` owns this composition.
`download-row.tsx` places actions at the right on desktop and wraps them below on
mobile. Waiting positions use the complete queue. Errors expand with a native
keyboard-accessible details control; step/remove controls use shared IconButton.
There are no new API calls or changes to download behavior.
