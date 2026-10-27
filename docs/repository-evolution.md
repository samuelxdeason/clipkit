# Repository evolution

Status: npm workspace and token extraction completed; UI/API extraction and app relocation remain planned. Current desktop/browser builds remain in frontend/ and the root Go module.

## Target structure
```text
apps/
  library/            # future move of frontend, desktop + web application
  marketing/          # separate future public site; no private catalogue access
packages/
  design-tokens/      # portable semantic CSS values
  ui/                 # app-independent React controls and styles
  api-client/         # HTTP client and serializable contracts; no Wails imports
frontend/             # current application until the relocation gate passes
internal/             # Go services/domain/adapters remain here
cmd/troved/           # existing headless entry
scripts/              # portable repository commands/checks
docs/                 # product, ownership, decisions and runbooks
```
These package names are tentative/private; no npm namespace or publishing permission is assumed.

## Migration sequence and completion gates
1. Context foundation (implemented): root instructions, docs index, source map, test commands and decision records. Correct stale guides before using them as agent context.
2. Completed: npm workspaces with one root lockfile and Wails npm commands. Original migration gate: compare current lockfiles, produce a reproducible workspace lockfile from a clean install, align Wails and CI, then remove the redundant lockfile. Gate: same dependency versions or explicitly reviewed upgrades; frontend + desktop + UI checks pass. Do not combine with framework upgrades.
3. Completed: private @clipkit/design-tokens, consumed through the frontend compatibility import and checked with an isolated tarball consumer. Original migration gate: make a private packages/design-tokens package consumed by the existing frontend. Gate: one token owner, unchanged computed styles, packaged CSS export and package-consumer test. Change style-contracts to follow the new owner in the same change.
4. Extract UI primitives incrementally: Button/ActionGroup, icons, then menu positioning/choice controls. Separate shared behavior from page-specific CSS. Gate: package imports no api.ts, Wails types or app modules; accessible states and browser tests pass; no duplicate theme instance. Keep compatibility re-exports while migrating callers.
5. Extract feature boundaries inside the app: videos, photos, collections, people, following, downloads, settings, player. Move pure selectors/types first, then hooks/controllers, then views. Gate: public entry points, no circular feature imports, unchanged routes and API payloads. Break up Manager/App by responsibility, not arbitrary line counts.
6. Move frontend to apps/library only after package/build boundaries are stable. Update main.go embedding, Wails config, scripts, launchers, daemon UI defaults, tests and docs together. Gate: clean desktop and headless builds plus full smoke matrix.
7. Create apps/marketing when there is an actual site brief. Share tokens and useful presentational primitives, not library-specific grids/filters or private APIs. Choose rendering/deployment based on that brief.
8. Publish only when requested: review package API/exports, license, assets/fonts, peer dependencies, browser support, versioning and changelog; pack and test in an isolated consumer. Private packages remain private by default.

## Module conventions
Feature folders should expose a small index and colocate behavior tests. Generic UI owns behavior/semantics, apps own content and side effects. Avoid catch-all utils folders and import barrels that hide circular dependencies. Prefer explicit props and named domain types to large shared global state. Move files with their imports/tests in small reviewable changes.
