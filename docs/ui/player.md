# Player and viewer

Open a video card's preview, or a photo card's, in the new app. The watch window and the photo viewer are the existing app's `.watch-window` and `.photo-viewer` chrome, ported on 2026-10-28 as the `Viewer` and `Organizer` compositions in `@clipkit/ui`. Storybook's Patterns/Viewer stories show them; Reference/Legacy viewer renders the old versions beside them from the old stylesheets.

## Ownership

- `packages/ui/src/recipes/viewer.ts`: the `viewer` slot recipe (backdrop, window, header, stage, bar, footer, controls, error, inspector) and the `organizer` slot recipe (heading, tray, feedback, intro, create, option rows, facts).
- `packages/ui/src/components/viewer.tsx`: `Viewer.*` on Ark's Dialog, so focus trapping, Escape and focus restoration are Ark's; `Viewer.Organizer.*` are native parts.
- `apps/library/src/features/videos/video-player.tsx`: the watch window, its transport controls and the organize inspector's sections.
- `apps/library/src/features/videos/use-watch-organizer.ts`: one video's people, tags, collection memberships, title and favourite, with the save-as-you-go notice and one-step undo.
- `apps/library/src/features/photos/photo-dialogs.tsx`: the photo viewer with Previous/Next and the counter.
- `apps/library/src/services/library-client.ts`: `markWatched`, `position`, `setTitle`, `collectionsForVideo`, `uncollect`, `createCollection`, `allLabels`, `listCollections`.

## Observed behaviour in the existing app

- The window fills the viewport inside a 16px (8px narrow) margin on a blurred, near-black backdrop. Media sits on a black stage and is letterboxed, never cropped.
- The header carries an eyebrow (“Now playing”, “Photo viewer”), a one-line title and the close control. Under the stage, the organize bar offers People, Tags and Collections; the footer carries the source caption and the transport controls (previous, next, rewind and forward ten seconds, file details, fullscreen).
- Playback position is saved every ten seconds, on pause, at the end and on close; the server clears it when the video finished. The first play marks the video watched. A failed save or an unplayable file is reported in a line under the controls, and playback continues.
- Escape closes the inspector first, then the player; nothing closes while fullscreen. Focus returns to the card control that opened the window.
- The inspector's People, Tags and Collections sections list every choice, linked ones first, filter as you type, and offer to create what the search did not find. Each change saves immediately and can be undone once. People attributed through a source account cannot be unlinked here. The File section edits the title, toggles the favourite and lists the facts and source link.
- The photo viewer shows one photo with Previous and Next and a counter; arrow keys move too.

## In the new app

The same, composed from recipes: Button carries the pressed state in the bar and controls; SectionHeading, Heading, Text, Input, Notice and Identity fill the inspector. The inspector sits beside the stage from the `lg` breakpoint and below it when narrower. The window's radius lands on the panel radius (16px, 12px narrow) rather than the old 14px and 10px.

In the synthetic demo (`/?demo=1`) no file is loaded: the stage shows the card's artwork and the footer says so, seek is disabled, and the organizer edits session state only. Connected, the player streams `/media?p=` for the video's file path and the organizer reads `/api/models`, `/api/labels`, `/api/collections` and `/api/collections-for-video`.

Not ported: the old inspector's “download again” control, which belongs with the downloads feature.

## Contracts

| Part | Contract |
| --- | --- |
| Viewer.Root | An Ark Dialog; `kind="photo"` gives the footer its hairline and centres the caption. Pass `closeOnEscape={false}` while a nested panel should take Escape first |
| Viewer.Window | The dialog content; give it the ref for fullscreen. Title is `Viewer.Title`, so the dialog is named |
| Viewer.Video / Viewer.Image | The one media element on the stage, letterboxed |
| Viewer.Controls | Regular Buttons; icon-only ones carry an aria-label; `aria-pressed` marks the open inspector section |
| Viewer.Error | `role="alert"`, under the controls, never covering the stage |
| Organizer.Root | A labelled section with `aria-busy` while saving; Tray items are buttons with `aria-pressed`; Feedback is `aria-live="polite"` |
| Organizer.Option | A button with `aria-pressed` for a linked choice; disabled when the link is automatic |

## Checks

`npm run test:unit` covers the client's request bodies. The synthetic library suite opens the demo player from a card and checks that Escape returns focus to the card. The connected player is exercised against a daemon by hand; do not point it at the real vault for testing.
