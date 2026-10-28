# Library browsing patterns

The video library is the first complete visual slice. Its explicit `/?demo=1` mode uses invented metadata and locally generated geometric SVG artwork, with session-only edits and no backend requests. Default connected mode uses [the real-data adapter](connected-library.md); its mutation and recovery semantics are documented separately.

## Ownership and layout

Videos and Photos share `components/browsing/browse-controls.tsx` for search, toolbar, active chips, preview sizes, Manage toggle, responsive grid and paging. Change those owners to adjust both pages. Domain filters/cards stay in their features. The connection form belongs to `app/`; video dialogs now have their own feature component. See [Photos ownership and contracts](photos.md).

`apps/library/src/app/library-shell.tsx` owns navigation and responsive page placement. `features/videos/video-library.tsx` composes the screen; `video-card.tsx` owns domain-specific media presentation. Keep these in the app until another real consumer proves a shared pattern. Generic controls and overlay recipes belong in `packages/ui`; theme values remain in `packages/design-tokens`.

Use one page heading, then search and a compact row of filters, sorting and preview size. Manage is a separate explicit toggle. Active chips sit below the toolbar with their own padding. Results follow directly, with the count and paging at the bottom. Avoid a duplicate top-bar title or a second set of browse tabs.

`ActiveFilters` owns the labeled active-filter strip: neutral chips, cherry remove icons, a top separator with padding, and a right-aligned “Clear search & filters” action that wraps on narrow screens. Clearing retains each feature's existing reset behavior.

`components/browsing/manage-bar.tsx` owns the floating Videos/Photos action dock. It appears while Manage mode is active, retains select-page and clear-selection actions, and disables actions without a selection. Feature pages supply their existing actions; the dock does not implement mutations. It sits above results but below popovers/dialogs, fits inside the content area, and wraps/scrolls on narrow screens. A ResizeObserver reserves its actual height at the end of the page so the footer can scroll clear. The close control exits Manage, clears selection through the feature hook, and restores focus to the Manage toggle. Keep the dock inside the feature's disabled fieldset so pending writes also disable its controls.

Video cards use a widescreen preview, a two-line title, person, compact tag chips and File info action. Collection feedback stays visible in Manage mode; full tags and collection details remain in the details dialog. Unknown durations do not display a misleading 0:00 badge. Photo cards use a 4:5 portrait preview, type badge, filename and person without repeating the album as a second identity line. Cherry identifies selected/favorite actions; neutral surfaces frame artwork. Artwork palettes are content, not additional UI color roles. Preview sizes change column density without adding list mode. Missing artwork has a text/icon fallback. Keep image controls named and avoid nesting buttons inside buttons.

## Behavior contracts

Video browsing uses the regular responsive grid with 16:9 frames and Small/Medium/Large minimum card widths of 240/350/440px. Mixed-aspect and justified-row experiments have been removed. Artwork uses centered contain with no hover zoom. For videos known to be vertical, portrait posters (or absent posters) can be replaced by a cached three-frame triptych through `/api/videos/triptych`; existing widescreen posters/contact sheets remain unchanged. Missing dimensions, older servers and extraction failures retain the original poster/fallback. Full generation requires the updated backend; the UI never decodes videos in hidden browser players.

The app-owned `app/navigation.styles.ts` slot recipe controls sidebar branding, group labels and navigation rows. It uses the shared theme and icon component: a cherry play mark beside the retained clipkit wordmark, compact uppercase group labels, 44px navigation rows and a neutral active surface with a cherry inset marker. Disabled destinations share row geometry but remain non-interactive until implemented; do not disguise placeholders as working routes.

Library and directory headers use `PageIntro`: the shared large Heading plus a 14px subtitle separated by 4px. Video cards display up to two user-label tag buttons and a remaining-count tooltip beside File info. Clicking a tag adds it to the active tag filters without discarding other filters; backend source tags are not shown as user labels. Card titles use a compact 22px line height and the footer keeps metadata secondary.

Video cards omit individual favorite buttons; Manage retains Favorite selected. The standalone Needs organizing checkbox is removed from the filter panel; Organization still offers missing-people and missing-tags filters. Previously persisted unorganized filters remain removable through their active chip. People/Tags picker triggers use normal-weight summaries, a purple identity icon and ellipsis with a full-value tooltip, keeping long names from stretching the panel.

- `model.ts` contains pure filtering/sorting; `fixtures.ts` owns deterministic demo data; `use-video-library.ts` owns state and mutations.
- Filters intersect. Search includes title, person and tags. Changing search/filter/sort resets the page and selection. Clearing filters restores the full library.
- Paging uses 12 results, clamps when the result set shrinks, clears selection and focuses the results region. Preview density does not change the result count.
- Manage selection is limited to the current page and cleared when leaving Manage. Bulk favorite and collection assignment mutate fixtures only. Removal is confirmed and offers Undo; production deletion must preserve the existing app's separate semantics.
- Demo tools expose loading, failure/retry and reset. No-match results offer clear-search recovery. Status messages announce mutation feedback.

## Overlays and keyboard

ChoiceSelect composes Park/Ark Select with fixed positioning, an 8px gutter and 12px viewport clearance. Top-level controls portal to the document; inside Popover or Dialog use `portalled={false}` to retain the parent's focus/dismissal boundary. Fixed positioning keeps these options outside the scrolling content flow. Use this shared composition for ordinary single-choice controls. Compound Select remains available for richer consumers. Popover uses the same positioning options at its trigger. Recipes constrain width and scroll height using Ark's available-height variable.

The shared layer order is popover 60, dialog backdrop 90, dialog 100 and select 120 so a collection selector remains usable inside a dialog. These layer values are owned by `recipes/overlays.ts`; do not add page-specific z-index fixes. Dialogs trap focus and restore it; Escape closes the innermost overlay first. Checkbox uses a rounded square at every density, including indeterminate state. All controls retain visible focus and accessible names.

Select menus have a 190px minimum preferred width, expand to their trigger width, and clamp to the viewport. Rows retain natural height with a fixed 16px indicator slot in both selected and unselected states; never insert an un-sized empty SVG as a placeholder. Long option labels wrap. Lists scroll only when needed, with thin theme-colored scrollbars. Filter popovers compose title, description, scrollable body, and footer/close action in that order; the body uses natural-height rows so scrolling cannot compress checkbox groups into overlapping controls. The overall panel is capped at the smaller of available space and 640px, keeping its heading and footer visible.

## Verify

Build with `npm run build:library`, then run `npm run test:library-demo` with the Playwright prerequisites in [contributing](contributing.md). It covers filter intersections, sorting, density, page resets, collection assignment, removal/undo, empty/loading/error recovery, focus restoration, nested Escape, narrow viewport bounds and axe. Unit tests run separately with `node --test apps/library/src/features/videos/model.test.mjs`.

Review the generated desktop/phone screenshots as well. The tests do not replace a screen-reader audit or prove real-data behavior. Keep the existing frontend and Wails entry points unchanged until cutover.

## Working frontend layout parity

The new shell fills the available viewport width, with a 248px desktop sidebar and compact page gutters. Library and Organize links are left aligned; the neutral selected row has a cherry edge. Manage library is a bottom disclosure. The clipkit. wordmark is retained. Unmigrated destinations stay disabled; imports and collection-folder navigation remain future connected slices, not decorative controls.

Media headers omit the extra eyebrow and place search directly below the title/subtitle. Connection configuration remains available below the results and paging. Minimum preview widths match frontend/src/browsing-controls.css: videos 240/350/440px and photos 200/310/400px for small/medium/large. Auto-fill grids respond to available space rather than stopping at three columns; paging remains independent of density. A synthetic 2560px regression checks six medium video columns and full-width results.

Menu refinement follows the working frontend: 12px overlay corners, 36px option rows, quiet captions for toolbar menus, and a compact grid-icon preview trigger. ChoiceSelect supports an inline label/control layout for filter fields; other form fields retain stacked labels. The icon trigger retains the accessible Preview size name and exposes the selected size in its tooltip. Appearance stays in the shared overlay recipe, not page-specific overrides.

Connected media filters use the shared `filters` Popover variant: a 720px, two-column panel on desktop, with compact rows that fit without scrolling at the tested 1440×1000 viewport. Narrow/short windows retain a bounded scrolling fallback so no controls become unreachable. The single-column default remains for ordinary popovers. `components/browsing/filter-picker.tsx` owns searchable People/Tags pickers (and single-person selection in Photos). These nested popovers remain inside the parent focus boundary, use the `picker` variant, and scroll their option list independently. Search only changes visible options, never selection; closing resets search, not filters. People retain any-match semantics and Tags retain their separate all/any choice. Clear removes only that picker's selections. No backend or filter-model changes are required.

### Portrait preview preference

Video cards default to a sharp, fully contained poster with a decorative blurred
copy behind portrait artwork (18px blur, 30% opacity, clipped within the frame).
Landscape posters stay unchanged. The video toolbar's **Portrait preview style**
select switches between **Soft backdrop** and **Three frames**, independently of
Small/Medium/Large sizing and Manage mode. The choice is stored locally under
`clipkit.library.preview-style`; blocked storage falls back to a session preference.
Only the three-frame option requests montage images. Failed montage generation
falls back to the original poster and soft backdrop. Missing artwork retains the
accessible unavailable state. The decorative layer is hidden from assistive tech
and cannot intercept clicks. No video files or backend settings are modified.
