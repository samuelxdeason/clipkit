# Following

Open Following under Manage library, or `/?view=following`. Ported on 2026-10-28 from the existing app's `Following`, `FollowingSourceHeader` and `followingIdentity`, with their rules in `design-system.css`, `after-hours.css`, `library-browsing.css` and `surface-system.css`. Following is connected-only. Storybook's Patterns/Following stories show the surfaces and Reference/Legacy following renders the old versions beside them.

## Ownership

- `packages/ui/src/recipes/following.ts`: `sourceCard` (a followed source in the directory) and `mediaItem` (one remote item). The source hero is `Hero` with `cover="portrait"` and its `Note` line.
- `packages/ui/src/components/following.tsx`: `SourceCard.*` and `RemoteItem.*`.
- `apps/library/src/features/following/model.ts`: the existing app's matching rules (`sourceKeys`, `libraryIndex`, `accountLookup`) and the item state order; tests alongside.
- `apps/library/src/features/following/following-page.tsx`: the directory, the add form, one source's items, selection and downloads.
- `apps/library/src/services/library-client.ts`: `syncedLists`, `removeSync`, `enumerate`, `enqueueMany`, `queue`.

The app composes the player into the page from `app/application.tsx` (`renderPlayer`).

## Observed behaviour in the existing app

- The page opens with the number of active downloads and a link to Downloads, then a form to load a new source by URL, a search and sort over the followed sources, and the sources as cards: the person's picture or initials (or a film glyph for a source without a person), the name, host, handle and kind, the saved title, counts of videos, downloaded and available, when it was last checked, and View person, Browse, Check for updates and Unfollow.
- Browsing a source shows its hero (portrait, eyebrow, name, Open source, Check for updates, host and handle, the URL, four counts and the last check) and its items as cards with a saved preview when the library has the video, the title, source line and people, and a status: Downloaded, Downloading with its percentage, Queued, Checking library, Failed · Retry or Available. Available and failed items can be selected and downloaded, one hundred at a time with Show more.
- An item is Downloaded when the daemon owns it or the library holds a video with the same site id or canonical URL; otherwise the queue decides, then pending requests from this page.
- Check for updates re-lists the source through the daemon, which can reach the network.

## In the new app

The same, composed from recipes: Button carries the actions, StatusBadge the state, Toolbar the search and controls, and the player opens saved items. Loading a source and queuing downloads are page actions outside the shared resource; the sources, accounts, catalogue and queue reload on the daemon's events.

## Contracts

| Part | Contract |
| --- | --- |
| SourceCard | Root is a labelled article; Name is the button that opens the source; Actions sits across the bottom with Unfollow at the end |
| Hero cover="portrait" | A 200 by 250 Avatar in the cover; Caption is the host line and Note the URL and the last check |
| RemoteItem | Mark is a native checkbox (asChild) when the item can be selected, else a glyph with data-state; Preview is a button when the item plays; data-selected on Root |
| Status | StatusBadge success for Downloaded, info for Queued and Downloading, danger for Failed, neutral otherwise |

## Checks

`node --test apps/library/src/features/following/model.test.mjs` covers source keys, library membership, account matching and the state order. The directory and add form were checked by hand against a daemon on a scratch vault with no followed sources; loading a source was not exercised, as it reaches the network.
