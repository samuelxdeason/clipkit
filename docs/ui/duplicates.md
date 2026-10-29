# Potential duplicates

Open Potential duplicates under Manage library, or `/?view=duplicates`. Ported on 2026-10-28 from the existing app's `DuplicateQueue` and `duplicateComparison`, with their rules in `design-system.css`, `after-hours.css` and `library-browsing.css`. Storybook's Patterns/Duplicates stories show the surfaces and Reference/Legacy duplicates renders the old versions beside them.

**The Python daemon does not serve these routes yet.** The page targets the Go backend's contract (`GET /api/duplicates`, `GET /api/duplicates/recycle-folder`, `POST /api/duplicates/create`, `POST /api/duplicates/resolve`), which the Python rebuild's schema already carries a `duplicate_groups` table for. Against trove-py the page shows the request error with Refresh queue; against the Go backend it works as the old screen did. Adding the routes is backend parity work in trove-py's consolidation plan.

## Ownership

- `packages/ui/src/recipes/duplicates.ts`: `reviewNav` (how many groups are left, and the pager), `comparison` (the table with one column per copy) and `decisionBar` (the sticky summary and actions).
- `packages/ui/src/components/duplicates.tsx`: `ReviewNav.*`, `Comparison.*`, `DecisionBar.*`. The intro is SectionHeading `surface` beside a Popover; the keep and recycle marks are StatusBadge; the messages are Notices.
- `apps/library/src/features/duplicates/model.ts`: the comparison rows (resolution, duration, file size, source) and the size and duration formats; tests alongside.
- `apps/library/src/features/duplicates/duplicates-page.tsx`: the queue, one group's review, and the decision.
- `apps/library/src/features/videos/`: Mark as potential duplicates in the Manage bar, for two or more selected videos (connected only; the demo notes it).
- `apps/library/src/services/library-client.ts`: `duplicateGroups`, `duplicateRecycleFolder`, `createDuplicateGroup`, `resolveDuplicateGroup`.

The app composes the player into the page from `app/application.tsx` (`renderPlayer`).

## Observed behaviour in the existing app

- The queue opens with an intro and a disclosure about the recycle folder, then the number of groups left, the videos to compare and the count reviewed this session, with a pager and a group chooser.
- One group at a time: its copies as columns with a preview (a poster that plays, or the files side by side), the title, a keep-or-recycle tile with a checkbox and Keep only this, then rows for resolution, duration, file size and source. Notes name the highest resolution, the longest version and the smallest file when the copies differ. More details adds added date, people, tags, filename and location. Columns marked for recycling sit a shade darker.
- The sticky bar sums the choices and the size that would move to the recycle folder, with Skip for now, Keep all, and Save & next (or Save & finish). Saving resolves the group through the backend, which moves the discarded files to the vault's recycle folder; the group leaves the queue and focus moves to the next heading.
- Marking happens in the video library: select two or more videos and choose Mark as potential duplicates.

## In the new app

The same, composed from recipes. Previews side by side pause other players when one starts, and are unloaded before a decision is saved. The group chooser is a ChoiceSelect, and the recycle folder note is a Popover.

## Contracts

| Part | Contract |
| --- | --- |
| ReviewNav | Progress holds Count and Caption; Pager holds IconButtons and the group ChoiceSelect |
| Comparison | Scroll is a focusable labelled region; Table sets `--copies`; RowLabel is sticky; head cells hold CopyHeading, Preview, Title and Choice; body cells hold Value and Note; `data-recycle` on a column's cells, `data-highlight` on a note, `data-choice="keep"` or `"recycle"` on a Choice tile |
| DecisionBar | Summary is a live region with Count and Note; the primary action is disabled until at least one copy is kept and one recycled |

## Checks

`node --test apps/library/src/features/duplicates/model.test.mjs` covers the formats and the comparison notes. The page cannot be exercised against the Python daemon, which lacks the routes; it was not run against the Go backend, which only serves the real vault.
