# ClipKit design system

## Source of truth

- `frontend/src/ui-system.css`: semantic tokens, component sizing, typography, state colors.
- `frontend/src/UIControls.tsx`: `Button`, `ActionGroup`, and `ViewSwitcher`.
- `frontend/src/WorkspaceUI.tsx`: `PageHeader`, `LibraryToolbar`, loading/error states.
- `frontend/src/after-hours.css`: media layouts and decorative theme treatments.

Run `npm run dev --prefix frontend`, then open `/design-system.html` on the local Vite server for an interactive component reference. It uses synthetic examples and never reads the library. This is a development entry, not an app navigation destination.

Legacy page styles remain for specialized layouts. `ui-system.css` loads last. Do not add page-specific button heights or heading fonts to those legacy sheets. Component dimensions/variants intentionally override legacy declarations during migration; remove conflicting legacy rules when moving another component into this system.

## Typography and spacing

Use `PageHeader` for top-level pages. Titles are 36px desktop / 28px at widths up to 700px, weight 750, line-height 1.15. Descriptions are 14px with 1.6 line-height. Section titles are 22px / 20px. A person's profile name retains its larger hero typography; it is not a directory page title.

Controls use 13px text and a 42px minimum height. Compact buttons are explicitly 32px; use them only in dense supporting surfaces, never to squeeze a main toolbar. Text may wrap and increase height rather than clip. Use 4, 8, 12, 16, 24, and 32px spacing tokens; the shared action gap is 10px. Action groups wrap, align centers, and own no external margins. Containers own layout and spacing between groups.

## Color roles

| Role | Usage |
| --- | --- |
| Canvas / panel / field / raised | Background hierarchy, inputs, neutral hover surfaces. |
| Text / secondary / muted | Titles and important values / supporting copy / low-priority metadata. Never use muted text for required error information. |
| Primary gradient | The main constructive action in a local region: Add, Save, Download. Avoid competing primary actions in one action group. |
| Accent / focus | Focus rings, navigation emphasis, playback progress. Not a generic decorative text color. |
| Selection surface / line / text | Pressed toggles, selected media, applied filters. Preserve pressed/selected semantics as well as color. |
| Tag surface / line / text | Metadata labels. Lavender distinguishes tags from active actions. |
| Success | Confirmed completion. Do not use green for work still running. |
| Warning | Needs attention without a failed operation. Always include explanatory text. |
| Danger | Errors and destructive actions, paired with explicit labels. |

Do not assign colors by row index to communicate status. Decorative art and data-chart series can vary, but need textual labels and must not imply semantic states. Keep image/cover treatments separate from control colors. Use semantic variables instead of new hex values in components.

## Components

```tsx
<PageHeader title="Collections" description="Keep related media together." />
<ActionGroup aria-label="Collection actions" role="group">
  <Button onClick={cancel}>Cancel</Button>
  <Button variant="primary" type="submit">Save</Button>
  <Button variant="danger" onClick={remove}>Delete collection</Button>
</ActionGroup>
```

`Button` supports native props/ref, `neutral` (default), `primary`, `quiet`, and `danger` variants, plus regular/compact sizes. Its default type is `button`; form submissions **must** set `type="submit"`. Preserve disabled logic, accessible names, keyboard handlers, and `aria-pressed` on toggles. `ActionGroup` adds layout, not toolbar keyboard semantics; use `role="group"` and an accessible label when the grouping needs a name.

Use native buttons for media controls, tree items, menu entries, and icon-only actions until they have dedicated primitives. Do not convert every button into a rectangular action button. Links retain link semantics. Specialized player, timeline, and media-card controls keep their own geometry.

## Validation

Build with `npm run build --prefix frontend`. Existing mocked browser suites in `frontend/tests/*-smoke.cjs` cover library/people/tags, photos/collections, downloads, Following, settings, duplicates, recovery states, and the player. They do not touch the live queue or library. Review their desktop and narrow screenshots after changes. Validate real form submission, focus restoration, selection, and overflow, not just static rendering.

The library smoke suite also checks equal page-title sizes and the toolbar's control centerlines, so the original drift is caught during future design changes.

`ViewSwitcher` owns accessible list/grid toggles for videos and photos. Pass the current layout and an onChange callback; persistence stays with the page. Primary button gradients meet 4.5:1 contrast for white text in both normal and hover states.

## Library card family

`LibraryCards.tsx` supplies CardImage (lazy/async image loading and missing-image fallback), CardSelection (the shared accessible selection control), PersonCard, and TagCard. VideoCard, MediaTile, and CollectionFolderCard keep their playback, viewer, organization, and drag/drop behavior. The directory pages supply data and callbacks rather than rebuilding card markup.

`library-cards.css`, loaded after `ui-system.css`, owns the card family. All types share a 16px radius, 16px content inset, semantic surfaces/borders, keyboard focus treatment, and selection state. Use the `--ui-card-*` tokens to tune this family.

- VideoCard: 16:9 preview, duration and watch progress, title/people/tags/specifications. Portrait videos use contain instead of cropping.
- MediaTile: photos use a 4:5 frame with contain, preserving the entire photo; collection video tiles use 16:9. Keep selection separate from the open action.
- CollectionFolderCard: mosaic cover plus item counts; compact subfolders retain their row layout.
- PersonCard: portrait/avatar and identity, with a distinct count footer.
- TagCard: typographic discovery card using the semantic lavender metadata colors.

Use real button semantics without nesting buttons. Cards must support long titles, absent images, keyboard focus, touch selection, reduced motion, and existing drag/drop. The interactive design-system preview includes all five variants using synthetic artwork.

People and tag cards use four muted decorative tones (plum, dusty rose, midnight blue, warm amber), defined together in `library-cards.css`. `cardTone` hashes a normalized identity instead of using position. People use their canonical saved name, so display-name edits do not recolor them; tags use their name. Colors are deterministic across sorting, filtering, remounts, and restarts without extra storage. Names and counts remain neutral and selection/focus retain the stronger global pink. These tones do not indicate status. Renaming a canonical identity or tag may assign a different tone.

Person profiles share the directory card's tone through `identityTone.ts`, keyed by the canonical saved person name. Only the portrait backing and soft surrounding glow use the identity wash; the header surface and borders stay neutral. Photographs are not color-filtered. Profile typography, controls, and focus states retain their global semantic colors.

The utility color pass uses neutral icons, page eyebrows, metadata, profile counts, and settings surfaces. Storage charts use `--ui-chart-1` through `--ui-chart-4`, a separate labeled neutral series palette rather than borrowing success/selection colors. Layout switches, navigation, tabs, and pickers use shared selection tokens. Duplicate keep choices are selections (pink), not completed operations (green); recycle choices remain labeled amber. Connection success, completed downloads, and errors retain their semantic colors. People/tag identity tones and portrait glows are intentionally excluded from these utility overrides.
