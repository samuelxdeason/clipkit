# Collections

Open Collections in the sidebar, or `/?view=collections`; a collection is `/?view=collection&id=<id>`. Ported on 2026-10-28 from the existing app's `AlbumBrowser`, `CollectionTree`, `CollectionFolderCard` and `CollectionHeader`, with their rules in `albums.css` and the theme sheets. Collections are connected-only; `/?demo=1` keeps its sidebar entry disabled. Storybook's Patterns/Collections stories show the surfaces and Reference/Legacy collections renders the old versions beside them.

## Ownership

- `packages/ui/src/recipes/collections.ts`: `coverMosaic`, `collectionHero`, `folderCard` and `folderTree`; the featured collection card is MediaCard `kind="collection"` with its `Action` slot; the options menu is Popover `variant="menu"`.
- `packages/ui/src/components/collections.tsx`: `CoverMosaic`, `Hero.*`, `FolderCard.*`, `FolderTree.*`.
- `apps/library/src/components/browsing/collection-model.ts`: trails and paths, the move rule, subfolder listing, pins (localStorage, as the existing app) and this session's unlocked collections (sessionStorage).
- `apps/library/src/components/browsing/collection-tree.tsx`: the sidebar outline, rendered by the shell on every connected page.
- `apps/library/src/components/browsing/photo-viewer.tsx`: the photo viewer, now shared by Photos and collections.
- `apps/library/src/features/collections/`: `collections-page.tsx` (the directory), `collection-page.tsx` (one collection), `collection-card.tsx`, `collection-item-card.tsx`, `collection-dialogs.tsx`, `use-collection-browser.ts` and `model.ts` (items and their filter and sort; tests alongside).
- `apps/library/src/services/library-client.ts`: `videosByCollection`, `createAlbum`, `moveAlbum`, `renameCollection`, `deleteCollection`, `addAlbumItems`, `removeAlbumItems`, `transferCollectionItems`, `trashMedia`.

The app composes the player into the collection page from `app/application.tsx` (`renderPlayer`), so the collections feature never imports the videos feature.

## Observed behaviour in the existing app

- The directory lists top-level collections as featured cards: up to three covers in a mosaic, a kind badge, the name, the item and folder counts, and a photos/videos footer. A corner control creates a subfolder. Searching matches any collection by name.
- A collection opens with a hero: its covers in a square mosaic, an eyebrow ("Your collection" or "Collection folder", plus Pinned and Locked), the title with New folder and an options menu (Pin, Rename, Move, Delete), a caption and four facts.
- Below, an Up button and a search, then the subfolders as compact rows (icon, name, counts, hover-revealed new-subfolder control) and the media as mixed photo and video tiles with a kind badge, filtered by All, Photos or Videos, sorted newest or by name, sixty to a page.
- Select mode gathers items for Move to folder, Assign person, Add to collection, Remove from this folder and Move to trash. Escape clears the selection, F2 renames, Alt+Up goes to the parent.
- A locked collection asks before it opens; the answer lasts for the session. Hidden collections stay out of the sidebar tree but appear in the directory.
- The sidebar tree lists folders with expand controls, a find box that matches full paths and a pinned-only filter; the current collection's ancestors start expanded.

## In the new app

The same, composed from recipes. Moving media and collections uses the dialogs' destination choice rather than dragging; the existing app's pointer drag-and-drop was not ported. The move dialog excludes the collection itself, its descendants, its current parent and locked folders. A locked collection's media is not requested until the session has opened it; the gate is a dialog over an empty page, not only a visual cover.

## Contracts

| Part | Contract |
| --- | --- |
| MediaCard kind="collection" | Link wraps Frame (CoverMosaic or a glyph), Badge, Body and Footer; Action is a separate button outside the link |
| Hero | Root is a labelled header; wrap Cover and Eyebrow in Identity for the tone; Copy holds the PageHeader, Caption and a Rule with Stats |
| FolderCard | Open is the link, Action the button outside it; Action is disabled, and hidden, for a locked folder |
| FolderTree | Expand carries aria-expanded only when there are children; Open is a link with aria-current; Row marks the current one with data-active |
| Collection dialogs | One Dialog per action; destination and person are ChoiceSelects; delete is the danger action and returns to the parent |

## Checks

`node --test apps/library/src/features/collections/model.test.mjs` covers trails, the move rule, subfolder search and item filtering. The connected pages were exercised by hand against a daemon on a scratch vault: create, open and delete a subfolder, the options menu, the hero and the tree. Do not point them at the real vault for testing.
