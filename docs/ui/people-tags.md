# Connected People and Tags

The new app exposes `/?view=people`, `/?view=person&name=…`, and `/?view=tags`. These use the existing backend and shared UI; the legacy frontend and production entry points remain unchanged.

## Ownership

- `app/application.tsx` composes routes. Features do not import one another's internals.
- `components/browsing/directory-browser.tsx` owns the shared directory search, sorting, preview sizes, chips, loading/error/empty states and 24-item paging. It composes the same browse controls as Videos and Photos.
- `directory-card.tsx` owns directory cards and the identity artwork used by profiles. `directory-model.ts` owns filtering and stable identity-color selection.
- `features/people` owns creation, profile presentation/editing and account connections. `features/tags` derives the tag directory from accessible videos.
- `services/use-library-resource.ts` owns directory/profile connection discovery, cancellable reads, event refresh, mutation locking and authoritative reconciliation. Supply a stable loader (module function or `useCallback`). HTTP contracts stay in `library-client.ts`.

Directory settings persist independently in session storage. Search/filter/sort changes reset paging; preview size changes preserve it. Results clamp when data shrinks. Identity colors use canonical names, not array positions, aliases or counts, so sorting and filtering do not recolor cards. Renaming the registered identity can change its color because the backend has no immutable person/tag ID. Identity colors decorate artwork, localized washes and identity-related labels/icons; body text remains neutral and shared cherry action/selection colors retain their roles.

## People contracts and organizing

`GET /api/models` supplies registered people, aliases, video counts and thumbnails. Profiles read `/api/modelinfo?name=…`, `/api/accounts`, and the accessible video catalogue for summary statistics. Existing cover/thumbnail images are displayed; this slice does not add an avatar-upload workflow.

| Action | Endpoint and payload |
| --- | --- |
| Create person | `/api/people/create` — `{name}` |
| Edit profile | `/api/savemodelinfo` — `{name, nickname, bio, links}` |
| Rename registered identity | `/api/model/rename` — `{name, newName}` |
| Delete person | `/api/people/delete` — `{name}` |
| Connect existing account | `/api/accounts/connect` — `{name, platform, handle}` |
| Disconnect account | Same endpoint, with empty `name` |
| Connect profile URL | `/api/accounts/create` — `{name, url}` |

Rename/delete are exposed in profile Manage mode. Deletion requires confirmation and explains that profile associations are removed while media files remain. It has no in-app Undo. Writes retain editor drafts on failure, disable competing mutations and refresh authoritative state even after an error. Backend multi-step writes are not transactional; errors must not imply a rollback. Profile links accept only HTTP(S), without URL credentials. Existing-account selection offers only unassigned accounts.

Profiles embed the existing video/photo browsers under Videos / Photos / Accounts
tabs. Application composition supplies browsers through a render slot; People
never imports another feature's internals. An optional `person` prop removes the
browser shell, page heading and connection panel. Hooks restrict results to that
person before user filters, so clearing filters cannot escape the profile.
Preferences use separate session keys per person and media type. Tab changes
clear selection/dialog state while restoring browsing settings. Account forms
and identity Manage controls live under Accounts. Global person/tag entry links
continue working.

## Tags and visibility

Tags come from user `labels` on the accessible `/api/videos` catalogue, deduplicated per video. Imported source tags are not directory entries. Do not use `/api/labelcounts`: that endpoint does not apply the main library's hidden-collection exclusion. Never fetch hidden collection contents to construct directory counts.

The existing Tags page is a browsing directory, not a global taxonomy editor. Selecting a tag opens filtered Videos; use its existing Manage controls to organize media tags. There is no invented global create/rename/delete-tag API in this slice. People counts represent videos, so a person with photos alone can appear under “Without videos.”

## Verification

Build the library, then run `npm run test:directories-connected` with the [browser prerequisites](../testing.md). Every API/media request is intercepted with synthetic fixtures. Coverage includes directory paging/persistence, aliases, stable colors, exact mutation payloads, failed-save draft retention, account connections, punctuation-safe media links, rename/delete, recovery, narrow layout and axe checks. Run both video suites and `test:photos-connected` when changing shared browsing or entry-filter behavior. Screenshots are review artifacts, not golden baselines.

## Directory presentation

People and Tags share the `DirectoryCard` interaction recipe, not an identical
artwork layout. People use the legacy portrait-directory composition: a radial identity wash,
a larger circular portrait with a tinted outline (initials when artwork is
missing), followed by shared `cardTitle` typography, alias and a divided
video-count row. Portraits scale with preview size rather than staying at 128px. Tags use compact discovery tiles: a small identity
symbol, an opening arrow, title and count. Avoid large empty square tag artwork.
Borders, text, focus and actions use shared semantic tokens. Identity tints stay
subtle; never choose them from list position or use them for selected state.

`BrowseGrid` owns separate density maps: People 190/260/320px and Tags
220/280/360px minimum widths for small/medium/large. Narrow containers clamp to
one column without horizontal overflow. Directory headers use `PageIntro` with
the same title-to-toolbar spacing as media browsing, without a duplicate eyebrow.
Connection settings follow results and paging. Existing search, sort, coverage,
paging, creation and profile organizing contracts remain unchanged.

The mocked directory suite captures People and Tags layouts and checks their
separate silhouettes in addition to mutation, accessibility and stable-color checks.

## Person profile header

`features/people/person-profile-header.tsx` owns the presentation of the profile
hero; `person-page.tsx` owns reads, mutation status and dialog state. Keep these
separate so visual refinements cannot change editing or account behavior.

The header follows the legacy editorial composition: a fixed 240 x 300px portrait
on desktop, alongside a prominent responsive heading, alias, biography
and Edit profile action. `IdentityPortrait` adds a localized glow;
`IdentityWash` adds a radial wash from the upper-left of the hero. The eyebrow
and summary icons use the same stable identity color. Borders, body text and
controls retain shared theme colors. Missing artwork falls back to initials.
On narrow screens the portrait stacks above the copy.

The semantic library summary shows accessible video count, favorites, known
runtime in hours (one decimal) from one hour onward, otherwise rounded minutes,
and distinct nonempty video sources. Unknown
durations contribute zero; unknown sources are not counted. These are not photo
counts or hidden-collection totals. Content tabs replace the hero action footer.
Rename/delete stay behind Manage
in Accounts and the existing confirmation flow.
External links are validated and wrap; connection settings stay below the active content panel.
No backend routes, profile fields or mutation contracts change.

## Reuse without flattening the design

Consistency means shared controls, typography, spacing and interaction contracts,
not identical artwork layouts for every entity. Park/Ark owns accessible control
behavior; Panda owns visual recipes. Neither requires neutral-only pages.

`components/browsing/identity-style.tsx` owns stable tone lookup and the radial
wash recipe (`card` and `hero` placements). Use these for identity decoration;
do not recreate gradients or choose colors in feature pages. `IdentityMark`
owns portrait/initials rendering, `DirectoryCard` owns directory interaction and
information layout, and `PersonProfileHeader` owns profile composition. Keep
these app-level patterns here until another app needs them; generic controls
remain in `@clipkit/ui`. Cherry means action/selection, not identity.

The visual references are the legacy `library-cards.css` person tiles and
`surface-system.css` editorial profile treatment. Reuse their composition, not
their stacked CSS overrides. The directory fixture includes synthetic portrait
artwork and initials to review color balance, plus desktop and narrow profile
screenshots. Search, preview sizes, paging, accounts and mutation contracts stay
unchanged.


`components/browsing/content-tabs.tsx` owns the reusable tab strip and panel
relationship. Arrow keys/Home/End move focus; Enter/Space activates a tab. The
selected indicator uses shared cherry. Profiles default to Videos. The fixed
portrait column prevents copy drifting away on wide screens. Regression tests
cover embedded media, keyboard tab activation and profile mutation workflows.


## Synthetic test-vault dataset

`scripts/seed-test-vault.py` adds 32 fictional Demo people, 36 non-explicit tags,
96 eight-second playable clips and 96 generated geometric photos. It requires
Pillow and FFmpeg. Supply `--root`, `--server` (loopback, default port 8899), and
`--ffmpeg`. The root must be the dedicated `trove-test-ui/vault`, and the daemon's
`/api/mediaroot` must match before any write. Never point it at the production app.

The script uses ingest/profile APIs, stable fixture IDs, and a dedicated
`media/ui-synthetic-v1` folder. It skips existing records/files, preserves user
edits on reruns, and never reads cookies or changes queues. Files include portrait,
landscape and square layouts; profiles include aliases, longer names, initials
and empty libraries. A manifest identifies the fixture family; there is no
cleanup command and no automatic deletion. Refresh library after seeding.

Directory cards keep titles, alias rows and counts aligned across varying names.
Tags use the shared identity wash's `tag` placement and larger typographic titles;
People retain circular portraits. Both keep neutral text and standard focus,
search, sort, preview sizing and paging contracts.
