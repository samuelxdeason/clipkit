# Development and verification

Run commands from the repository root. Prerequisites: Node/npm, the Go version declared by go.mod, and Wails matching go.mod for desktop packaging. Windows desktop builds require the existing WebView2/toolchain setup. Do not upgrade toolchains implicitly.

```sh
npm ci
npm run dev
npm run check
npm run test:go
npm run test:ui -- library photo-collections
npm run build:desktop
```
The standalone Vite dev command serves frontend assets; it does not start the Go API or configure an API proxy. Use `wails dev` for the integrated desktop development session, the headless server with built UI for browser behavior, or the mocked smoke harness for isolated UI work.

Use npm 12.0.2 (declared in packageManager) and a compatible Node runtime; this migration was verified on Node 24.19.0. Run npm ci at the repository root. Wails installs from the root with --include=dev (its production build still needs TypeScript/Vite) and invokes npm in the frontend workspace. After changing installation configuration, use wails build -f to bypass the Wails install cache. Do not run npm ci concurrently with Vite/UI tests on Windows because esbuild can be file-locked. The root desktop command builds then packages with wails build -s. esbuild 0.15.18 is explicitly allowed to run its installation script. Do not keep nested package-manager lockfiles. `npm run test:tokens` packs the private token package and builds a separate temporary consumer.

## Test selection
| Change | Checks |
| --- | --- |
| Docs/tooling | check:docs; exercise changed runner/commands |
| Tokens/shared UI/geometry | check:styles, build, headers, design-system, affected page suites |
| Videos/people/tags/filters/paging | library |
| Photos/collections/sidebar/dialogs | photo-collections |
| Player/organization | player |
| Source checking | following |
| Queue presentation | downloads |
| Settings/duplicates/recovery | settings, duplicates, states |
| Pure frontend helpers | test:unit |
| API/core/persistence/downloader | test:go and affected UI suite |

`npm run test:ui -- all` runs browser suites sequentially. These scripts start temporary Vite servers on fixed ports; avoid concurrent runs of the same suite. They use synthetic media and mocked APIs. Screenshots are written to temporary directories; paths appear in test output.

Browser suites require Playwright accessible as `playwright` or via `PLAYWRIGHT_MODULE_PATH` pointing to an installed package. Edge is the default browser; `PLAYWRIGHT_CHANNEL` overrides it. The player fixture also requires FFmpeg as described in its test source. A missing prerequisite is a blocked check, not a passing test. Never copy a particular developer's absolute runtime path into repository commands.

Builds do not verify behavior by themselves. For positioning changes verify viewport bounds, anchor gap, scrolling/resizing, nested menus, Escape/focus return and keyboard selection. For migrations verify the same desktop/browser behavior before and after. Tests must not touch a live queue or real vault.

## New UI foundation

The existing commands above still target the working app. Use `npm run dev:foundation` for the separate synthetic app and catalogue. See [new UI checks](ui/contributing.md) for build, type/lint/format, browser and isolated consumer verification. Node >=22.18 supports the typed token generator; verified on 24.19.0. Both esbuild 0.15.18 and 0.28.2 install scripts are allowed for their respective toolchains.
