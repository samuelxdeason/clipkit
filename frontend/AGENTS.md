# Frontend contribution rules

Read ../docs/design-system.md and ../docs/architecture.md. The app is React/TypeScript; both desktop and browser clients use src/api.ts. Keep native imports behind that adapter; generated models already leak into some components, but do not extend that pattern into reusable packages.

- Reuse UIControls and WorkspaceUI; page components own state and mutations.
- Global values: packages/design-tokens/tokens.css (frontend/src/tokens.css is an import-only shim). Theme entry: app-theme.css. Browsing/paging: browse-layout.css. Menu anchoring: PopoverPosition.ts.
- Preserve immediate filtering, paging resets, selection, focus return and playback continuity. Do not replace shared popovers with native selects or hardcoded offsets.
- Tests use synthetic data under test/ and tests/. Add assertions for bugs, not snapshots that merely restate implementation.
- wailsjs and dist are generated. Do not edit them directly.
- New feature extraction should follow docs/repository-evolution.md; avoid opportunistic sweeping moves.
