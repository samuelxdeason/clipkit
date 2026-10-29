# Settings

Open Settings in the sidebar, or `/?view=settings`; a section is `/?view=settings&section=connections`. Ported on 2026-10-28 from the existing app's `LibrarySettings`, with its rules in `manager.css`, `after-hours.css`, `library-browsing.css`, `surface-system.css`, `ui-system.css` and `typography.css`. Settings is connected-only. Storybook's Patterns/Settings stories show the surfaces and Reference/Legacy settings renders the old page beside them.

## Ownership

- `packages/ui/src/recipes/settings.ts`: `settingsNav` (the section navigation), `settingsCard` (a card of rows with their icon, copy, control and the library path) and `storageSummary` (tiles, track and legend).
- `packages/ui/src/components/settings.tsx`: `SettingsNav.*`, `SettingsCard.*` and `Storage.*`. The section heading is SectionHeading `surface`, which was measured against this very element when it was ported.
- `apps/library/src/features/settings/settings-page.tsx` and `model.ts`: the three sections, their copy and the storage figure.
- `apps/library/src/services/library-client.ts`: `mediaRoot`, `stats`, `cookieStatus`, `uploadCookies`, `backup`, `rebuild`.

## Observed behaviour in the existing app

- A sticky column of two-line section buttons beside the page: Library, Connections, Maintenance and Advanced; the current one carries the accent bar.
- Each section opens with its heading on a panel. Library shows where the vault is, as a code line under its row, then three storage tiles (total, videos, people) and a track with a legend of storage by source. Connections imports a cookies.txt file and shows whether X and Pornhub are connected. Maintenance backs up the catalogue and rebuilds the library, and in the desktop build optimizes streaming and fetches profile pictures. Advanced opens the desktop build's legacy tools window.
- Results arrive as a notice; failures as an alert with Retry. The footer says the library stays in the vault.

## In the new app

The same, composed from recipes. Three sections remain: Advanced only opened the desktop build's tools window, and the Python daemon has no routes for optimizing streaming or fetching profile pictures, so those rows are not shown rather than shown disabled. Library ends with the Connection section, the one place the backend address is set: the existing app had no per-page connection panel, and the new app's pages no longer carry one. Changing the library folder and restarting are the desktop build's; the page says the location is set where the daemon starts. A cookies.txt chosen with the file control is read in the browser and posted to the daemon as text; the app keeps no copy and the page shows only whether each service is connected.

## Contracts

| Part | Contract |
| --- | --- |
| SettingsNav | Items are buttons with aria-pressed; the detail line hides below the `lg` breakpoint, where the items form a row |
| SettingsCard | Rows are a grid of Icon, Copy and Control; Control hides when empty; Path is a code block under a row |
| Storage | Tiles are Value over Label; Segment and Dot take their colour from the chart tokens through the `bg` prop; the first tile spans the row when narrow |
| Actions | Each maintenance action is one Button with its loading text; the result lands in a Notice with Dismiss |

## Checks

The page was checked by hand against a daemon on a scratch vault: the three sections, the storage summary and the connection state. Backup and rebuild were not run, as they write to the vault. The file control was not exercised. Do not point the page at the real vault for testing.
