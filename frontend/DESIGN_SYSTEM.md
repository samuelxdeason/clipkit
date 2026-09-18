# Workspace design rules

Keep the current charcoal, warm-white, and muted-blush palette. Rounded Nunito
provides the softness; large surfaces stay quiet.

## Ownership

- `design-system.css`: palette tokens and feature-specific layouts, including
  media cards, list rows, and filter popovers.
- `workspace.css`: shared typography, control dimensions, page spacing,
  toolbar layout, and focus treatment. Imported last by `Manager.tsx`.
- `WorkspaceUI.tsx`: shared `PageHeader`, `LibraryToolbar`, and `LoadState`.
- `manager.css`: inherited structural styles. Prefer the shared roles when
  extending the current workspace; the legacy tools remain separate.

## Hierarchy

- Page heading: 22px / 700. Section or dialog heading: 18px / 700.
- Media title: 15px / 650. Body: 14px. Controls: 13px / 600.
- Metadata: 12px with secondary text color.
- Standard controls: 36px high, 10px radius. Compact segmented choices: 34px.
- Neutral selection fills identify the current view. Blush identifies primary
  actions and focus. Status colors retain their separate meanings.
- Videos, photos, and person media use `LibraryToolbar`. Search and actions
  share a row on wide screens; below 1200px they stack. Counts sit below them.
- At phone widths, Settings sections use a complete two-column grid.

## States and verification

A failed catalogue request must not imply that the library is empty. Use a
loading state while waiting and a retry state after an initial failure. When
refreshing cached video data fails, retain it with a refresh notice.

`httpResponse.ts` translates network errors, HTML fallback pages, and malformed
responses into readable messages while preserving server validation messages.
Its regression tests live in `test/httpResponse.test.cjs`.

Before changing a shared rule, check video grid/list, photo browsing, Settings,
Downloads, Following, dialogs, and phone-sized filters. Keep keyboard focus
visible and return focus to the originating control after closing a picker.
