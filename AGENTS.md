# Working in ClipKit

Read [docs/README.md](docs/README.md) first, then the guide relevant to the task. Read nested AGENTS.md files before editing their directories. These are contributor instructions, not runtime configuration.

## Working agreement
- Inspect the current diff before editing. Preserve unrelated and unfinished work; do not reset the checkout or commit unless requested.
- State the intended user-visible change, inspect the owning component and its callers, make a focused change, then run the relevant checks in docs/testing.md.
- Prefer existing components and tokens. Fix the owner rather than stacking another CSS override. Keep source readable; do not compress new functions or JSX into dense one-line implementations.
- Separate observed behavior, intended behavior, and proposals in documentation. Do not claim tests or migrations ran when they did not.
- Update the relevant guide when behavior or ownership changes. Record durable cross-cutting decisions in docs/decisions; do not append a diary to README.
- Never use a real vault, cookies, downloaded media, or the live queue as test fixtures. Use temporary directories and synthetic/mocked media. Do not launch/restart the real app or cancel/reorder downloads as part of verification unless the user asks.
- Do not print secrets or cookie contents. Do not commit local databases, media, credentials, generated executables, or machine-specific runtime paths.
- Do not hand-edit frontend/wailsjs. Keep backend domain logic in internal/, not desktop bindings or React components.
- Package extraction must preserve behavior and have a real consumer. Do not introduce empty abstractions, dependency upgrades, or a framework migration alongside a UI fix.

## Commands from repository root
- `npm run build` — frontend TypeScript + production build.
- `npm run check` — documentation links, design contracts, frontend unit tests, frontend build.
- `npm run test:ui -- library photo-collections` — chosen isolated browser suites.
- `npm run test:go` — Go tests.
- `npm run build:desktop` — frontend build followed by Wails packaging, without starting the app.

Use npm workspaces and the single root package-lock.json. Install all dependencies with `npm ci` at the repository root. Do not add nested lockfiles or pnpm configuration. Canonical token values are owned by packages/design-tokens/src/values.ts; tokens.css is generated for the legacy app. Keep the frontend shim import-only. New UI work follows docs/ui/README.md and its scoped instructions. See docs/testing.md for browser prerequisites and tool versions. Do not install dependencies merely to edit documentation.
