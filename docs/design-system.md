# ClipKit design system

## Source of truth

- `frontend/src/tokens.css`: the single owner of global colors, typography, spacing, radii, icon sizes and responsive token values.
- `frontend/src/app-theme.css`: the ordered stylesheet entry shared by the app, component preview and browser harness.
- `frontend/src/ui-system.css`: component sizing, page typography and state treatments using those tokens.
- `frontend/src/typography.css`: shared typography roles and mappings for section headings, labels, and supporting text; loaded after component styles.
- `frontend/src/UIControls.tsx`: `Button`, `ActionGroup`, and Primary button gradients meet 4.5:1 contrast for white text in normal and hover states.
- `frontend/src/WorkspaceUI.tsx`: `PageHeader`, `LibraryToolbar`, `EmptyState`, `LoadState`, `ActivityIndicator` and `DialogHeader`.
- `frontend/src/after-hours.css`: media layouts and decorative theme treatments.

Run `npm run dev --prefix frontend`, then open `/design-system.html` on the local Vite server for an interactive component reference. It uses synthetic examples and never reads the library. This is a development entry, not an app navigation destination.

Specialized layout sheets remain for media ratios, responsive grids and page-specific placement. Superseded declarations with identical selectors and conditions have been removed; avoid rebuilding override chains. `ui-system.css` loads after the legacy page styles. Do not add page-specific button heights or heading fonts to those legacy sheets. Component dimensions/variants intentionally override legacy declarations during migration; remove conflicting legacy rules when moving another component into this system.

## Page action placement

The top navigation bar owns location/breadcrumbs on the left and the primary page action on the right: Add videos, Add photos, New collection/New folder, or New person. Use `PageActionsProvider`, `PageActionsSlot`, and `PageActions` for child-owned actions; their event handlers and dialog state stay in the page. Never duplicate these primary actions beside the page heading. Empty-state recovery actions and contextual item menus can remain next to their content.

Use `BrowseToolbar` for collections, people, tags, Following and the download queue. Source/queue status filters use the shared dropdown with live counts; bulk actions stay in the organizing group. Display sorting must not change queue priority or lose source selections. It provides search, display controls, an optional organizing group and a result summary; omit controls that do not apply rather than rendering empty groups. Keep search refs connected so Ctrl+K continues to work.

Browsing controls belong in the content toolbar: search and filters first, then sort and preview size. Manage stays in a separate group with a divider. Applied filter chips sit below the row, followed by the result count. On narrow screens the display/Manage row wraps beneath search; buttons retain their shared target sizes. Filter triggers use the same sliders icon and show a selected treatment whenever filters are active.

## Making changes

- Change shared values in `tokens.css`, including narrow-screen values. Identity palette values also live in tokens.css; card scope maps the stable identity tone to these tokens.
- Import `app-theme.css` rather than assembling a page-specific stylesheet stack.
- Reuse `EmptyState` for empty results and `LoadState` for loading/error recovery. Keep messages and action callbacks in the caller.
- Reuse `DialogHeader` inside `DetailDialog`; preserve the caller's busy/close behavior and accessible label.
- Import icons from `Icons.tsx`, not the legacy App module.
- Component styles own geometry and appearance; page styles own placement and responsive layout. Keep intentional media/viewer exceptions explicit.

Run `node frontend/tests/style-contracts.cjs` to check token ownership and theme entry points. Browser smoke tests cover rendered typography, icons, geometry, dialog focus, filtering, organization and recovery. The remaining specialized sheets are not a license to redefine global tokens or add competing component styles.

## Typography and spacing

Use `PageHeader` for top-level pages. Titles are 36px desktop / 28px at widths up to 700px, weight 750, line-height 1.15, letter-spacing -1px. Descriptions are 14px with 1.6 line-height and a 4px gap below the title. Ordinary page headers start 20px below the top bar and leave 16px before the next section. Profile and collection detail heroes retain their padded layouts but share the title typography. Section titles are 22px / 20px.

Keep header typography and spacing in `ui-system.css`; page styles should only handle layout, wrapping, and intentional hero padding. The top bar keeps a 60px minimum row height with 8px vertical padding on narrow windows so action buttons do not shift page headings. `frontend/tests/headers-smoke.cjs` checks the rendered header contract across nine pages at desktop, tablet, and phone widths.

Controls use 13px text and a 42px minimum height. Compact buttons are explicitly 32px; use them only in dense supporting surfaces, never to squeeze a main toolbar. Text may wrap and increase height rather than clip. Use 4, 8, 12, 16, 24, and 32px spacing tokens; the shared action gap is 10px. Action groups wrap, align centers, and own no external margins. Containers own layout and spacing between groups.

### Supporting typography

Use the following shared roles. `typography.css` maps existing components to these roles, and new components can use the corresponding `ui-type-*` class. Keep layout margins in the component; do not introduce local font metrics for these roles.

| Role / class suffix | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Section (`section`) | 22px / 20px at <=700px | 650 | 1.3 | -0.4px |
| Subsection (`subsection`) | 16px | 650 | 1.3 | -0.2px |
| Form/menu label (`label`) | 13px | 600 | 1.5 | 0 |
| Supporting prose (`body`) | 14px | 400 | 1.6 | 0 |
| Metadata (`meta`) | 12px | 400 | 1.5 | 0 |
| Eyebrow caption (`eyebrow`) | 11px | 600 | 1.5 | 1.2px |
| Setting/list item name (`item`) | 14px | 650 | 1.5 | 0 |

Typography roles do not override semantic colors, identity colors, or error states. Keep filenames and paths wrappable where supported, and retain tabular numerals for progress and statistics. Media-card titles and overlaid duration/quality badges keep their compact card-specific contracts; prominent numeric statistics and brand lettering are intentional exceptions. Do not use eyebrow tracking for prose or field labels.

The component preview includes these roles. The header smoke suite also checks their computed metrics on real pages at 1440, 700, and 390px, catching legacy CSS overrides.

## Surface geometry

`surface-system.css` is the final geometry contract. Use tokens rather than introducing new local radii or container insets. It maps existing cards, settings, source/download panels, menus and content dialogs to these roles.

| Role | Corner radius | Content inset |
| --- | --- | --- |
| Controls | 8px | Shared Button padding; keep the 42px minimum target |
| Inset surfaces and menus | 12px | 8px menu shell; 16px expanded filter panel |
| Cards and panels | 16px | 16px media-card copy; 24px major panels |
| Content dialogs | 20px | 24px |

Major panel and dialog insets reduce to 16px at 700px and below. Use 4, 8, 12, 16, 20, 24 and 32px spacing tokens for layout. Keep the existing 10px action-group gap and optical button insets (9px/14px regular, 4px/10px compact) as named control tokens; they preserve control height and alignment. Icon/text gaps remain 8px or 6px for compact metadata.

Nested sections should share the parent's inset, especially settings rows, paths, notices and storage summaries. Apply dialog padding once at the outer content shell, not again inside the form. Media tiles keep edge-to-edge frames and distinct aspect ratios. Circular avatars, playback buttons, progress tracks, pills and fullscreen viewer stages are intentional shape exceptions. Do not round every descendant or change overflow just to enforce a radius.

Rendered smoke checks cover card/control radii, responsive panel padding, desktop collection dialogs and narrow photo-import dialogs.

## Interaction states

`interaction-system.css` owns shared interaction treatments; state values live in `tokens.css`. Keep native `disabled`, `aria-pressed`, `aria-checked` and the existing selected classes connected to application state. Styling does not replace disabled behavior or accessible state attributes.

- Hover: neutral raised surface and shared border for ordinary actions and menu choices. Primary and destructive actions retain their semantic palettes. Hover must not erase selection.
- Selected: cherry selection surface, border and text. A selected menu choice uses the selection-hover token when hovered; selected media retains its selection surface and accent outline. Identity colors remain decorative, never selection indicators.
- Focus: a separate 2px cherry keyboard ring with 3px offset. Card faces and menu rows use an inset ring to prevent clipping. Search wrappers show the focus treatment around the entire field, with no second ring around the inner input.
- Disabled: native disabled controls, including controls in disabled fieldsets, use the same opacity and unavailable cursor. They do not lift, brighten or receive keyboard focus. Do not use opacity alone to disable an action.
- Motion: short color/border transitions; reduced-motion preferences disable them. Existing media hover motion remains separately scoped to fine pointers and respects reduced motion.

The component preview includes selected actions, disabled controls, a disabled fieldset, search focus and a keyboard-operated sort menu. The design-system smoke suite checks state combinations and focus restoration, not just isolated default styles.

## Icons

Use `Icon` from `Icons.tsx` for the shared 24-unit outline set; the old App export remains compatible. Icons are decorative (`aria-hidden`, non-focusable). Name icon-only controls through `IconButton`'s `label` prop. Do not use text glyphs as substitutes for existing icons.

`icon-system.css` owns role sizing and spacing and loads after component sheets. Standard sizes are 14px for metadata, search and chevrons; 18px for actions, navigation and setting rows; 24px for feature/status symbols; and 32px for media placeholders. `Icon` accepts `size="small|regular|feature|placeholder"`; a component's contextual role takes precedence. Outlines use a 1.7 stroke, round caps and joins. Icons do not shrink in flex rows. Use an 8px icon/text gap, or 6px in compact metadata and preview controls. The glyph size does not change the control's 42px target area.

Action icons inherit the button's text color, including primary, danger, selected and disabled treatments. Search and inactive navigation use muted text; active navigation uses the shared accent. Person/tag identity marks, favorite indicators and success/error symbols retain semantic colors. Keep selection ticks, playback overlays and the brand mark as purpose-built exceptions. Never globally reset SVG fill or color, which would erase those meanings.

The component preview includes size examples and action icons; the header smoke suite checks icon dimensions and button color inheritance across desktop and narrow layouts.

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

The utility color pass uses neutral icons, page eyebrows, metadata, profile counts, and settings surfaces. Storage charts use `--ui-chart-1` through `--ui-chart-4`, a separate labeled neutral series palette rather than borrowing success/selection colors. Layout switches, navigation, tabs, and pickers use shared selection tokens. Duplicate keep choices use labeled sage; recycle choices remain labeled amber. Connection success, completed downloads, and errors retain their semantic colors. People/tag identity tones and portrait glows are intentionally excluded from these utility overrides.

## Media viewers

`ViewerHeader` shares title layout and an accessible `IconButton` close control between the video player and both photo-viewer entry points. Playback actions and organizer actions use `Button`; native video controls, the video element, keyboard handling, saving, and fullscreen behavior remain unchanged. `media-viewers.css` supplies neutral viewer surfaces, shared 42px controls and spacing, restrained metadata, pink selected states, and semantic errors. Media stays on a black stage. The layout adapts to narrow and short windows without applying decorative identity tints to the media.

### Browsing, selection, and navigation

Videos and photos always use grids, including Manage mode. Collections use cover cards, compact nested folders, and media grids. Do not reintroduce list toggles or layout preferences.

ThumbnailSizeControl is a compact disclosure menu with small, medium, and large choices. Preferences are saved separately for videos, photos, and collections. Selecting a size closes the menu and returns focus; Escape and outside clicks dismiss it. MediaBrowseBar keeps display preferences separate from search and filters.

Manage on Videos and Photos reveals rounded-square selection controls and bulk actions. Collections use Select items for bulk media actions only: folder creation and collection options are always accessible. Sidebar folders have no Manage mode and no per-folder plus button. Folder navigation, drag/drop, keyboard shortcuts, and the top-level New collection control remain available.

AlbumPicker separates choosing a destination from browsing its children. A persistent destination summary shows the selected path. Search does not discard selection; inline folder creation identifies its parent. Shared Chevron icons indicate disclosure state and folder navigation.

Card hover uses a subtle lift, border highlight, and image brightening/zoom on fine pointers. Reduced motion disables movement. Preserve people and tag identity colors.

Styles have explicit ownership: library-cards.css owns card geometry, identity colors, and hover; browsing-controls.css owns grid density, browsing bars, preview menus, destination pickers, and sidebar navigation. Remove unused rules when retiring a control rather than leaving competing overrides.


SortMenu owns the themed sort popover for videos, photos, collections, people, and tags. Its menu radio items show one checked selection. Arrow keys, Home/End, and typeahead move focus without applying changes; Enter/Space apply, Escape restores trigger focus, and outside click or focus leaving closes the menu. The popover shares preview-size menu styling; FilterMenu uses the same menu behavior for single-choice filters.

FilterMenu adapts static and dynamic options to the shared themed radio menu. Inside filter panels, choice lists float with viewport-relative positioning, flip upward when needed, and scroll at a bounded height. Opening them must not resize the filter panel. Filter surfaces use the neutral panel token rather than the legacy purple dialog color. Escape closes only the choice list and restores its trigger; a second Escape dismisses the enclosing filter panel. People/tag multi-selection remains in FilterMultiSelect.

Video cards prioritize a 16:9 preview, compact title/person text, and directly clickable tags. Resolution and duration sit on the preview; progress remains visible. Source and file-size metadata live in a keyboard-accessible File info disclosure with Escape/outside-click dismissal. Missing people/tags are shown during Manage instead of adding placeholder text to every browsing card. Video library spacing is compact without reducing control hit areas.

The video library uses one compact toolbar: search, Filters, sort, preview size, and a separated Manage action. Active filter chips sit beneath it; no separate library or watch-status tabs remain. Watching includes watch status, date added (7/30/90 days), and favorites. Organization supports missing people, missing tags, or either. Reset clears all filter dimensions, including date and favorites. Narrow layouts wrap display controls to a second row.

Photos and person-photo browsing use the same compact toolbar as videos. Photo tabs are replaced by Date added (any time or last 7/30/90 days) inside Filters alongside Collection. Filter count, removable chips, and clear-all reflect both conditions. Manage stays in the toolbar; Select all matching remains available separately while selecting.

### Charcoal / cherry / warm white

Shared tokens in tokens.css define the brand: canvas #0d0d0f, panel #19181b, field #121114, warm-white text #faf6f0, secondary #c6bdba, muted #a79c9a. Primary actions use deep cherry (#bd2342 to #991b36), with a softer rose #f26b80 for progress, focus, and active navigation. Selected controls use a restrained cherry wash and warm rose text. Destructive actions keep explicit danger labels/tokens; success and warning retain semantic colors.

brand-theme.css applies the brand finish after component styles. The playback mark and slim active-navigation indicator provide identity; large canvases and utility panels stay neutral. People/tag palette mappings and portrait glow stay in library-cards.css and are not recolored by the brand pass.

Viewer chrome uses charcoal panels around a true-black media stage. ViewerHeader shares a restrained cherry indicator and warm-white titles. Organizing tabs/buttons use selected-state washes; playback/navigation controls retain full hit areas and labels. Viewer theme rules live in brand-theme.css and preserve compact layouts at narrow widths and short heights.


### Color balance and ownership

- **Charcoal and warm white:** default panels, navigation backgrounds, secondary actions, metadata and ordinary card hover borders. Avoid tinting entire utility panels or the sidebar cherry.
- **Cherry:** primary actions, active-navigation indicator, user selections, favorites, keyboard focus and playback position. A hovered ordinary card is not a selection.
- **Identity accents:** plum, dusty rose, blue and amber use `--ui-identity-*` tokens. Keep the existing stable hash and tone names so sorting/filtering never changes an identity. Use brighter accents for portrait initials, tag symbols and hover borders, with restrained washes behind art. Profile color remains local to the portrait; its header border stays neutral.
- **Status:** blue (`--ui-info*`) for download activity, sage for completion/connection/keep, amber for warning/recycle and danger tokens for errors/destructive actions. Retain labels and icons so color is never the only signal.
- **Priority:** selected cards and keyboard focus use shared cherry states even on identity-colored cards. Hover alone uses the identity border or a neutral border. Do not add brand-colored shadows to every card.

Global values belong in `tokens.css`; component selectors consume semantic roles. Change palette values there rather than adding per-page hex overrides. Primary-button text must retain at least 4.5:1 contrast, as must supporting and status text on their intended surfaces.
