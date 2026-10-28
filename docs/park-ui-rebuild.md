# Park UI rebuild

Status: milestone 1 foundation implemented alongside the existing frontend. See [the UI guide](ui/README.md) for commands, components and remaining work.

The detailed [UI foundation implementation plan](ui-foundation-plan.md) defines the target architecture, design rules, documentation, quality gates and first implementation task. Use it for new UI work; this outline retains the branch recovery information and overall direction.

## Saved starting point

- Original branch: `trove-design-concept-01`.
- Rebuild branch: `codex/park-ui-rebuild`.
- Both started at `3297dde` (Establish Repository Guidance And UI Foundations).
- The pending Panda pilot was saved, including untracked source files, in a named Git stash: `Preserve Panda pilot before Park UI rebuild (trove-design-concept-01)`.
- Saved stash object: `7cb21f13db11d64f91d6e0d5d7c6c93512d90d32`.
- No branch commits were created. This stash is local, not a remote backup. Keep it until the old work is no longer needed.

To restore the prior working version, first save any new rebuild changes separately, then:

```sh
git switch trove-design-concept-01
git stash apply 7cb21f13db11d64f91d6e0d5d7c6c93512d90d32
```

Use apply rather than pop so the saved copy remains. Restore dependencies from the root lockfile before running the restored app. The pilot's dev/build commands regenerate its ignored Panda output. Existing ignored executables and frontend build artifacts are not branch-specific; rebuild the selected branch before judging its UI. No live app restart, queue operation or vault modification is part of this work.

## Direction

Build a fresh interface around Park UI components, Panda recipes and Ark UI behavior. Preserve the product capabilities and visual character, while allowing layouts, composition and component APIs to change. The old screens are a behavior inventory and visual reference, not a markup template or pixel-for-pixel migration target.

Visual direction:

- Charcoal canvas with clearly separated neutral surfaces and warm white text.
- Cherry for primary actions, active choices and focus; avoid tinting every panel.
- Stable, restrained person/tag identity colors that remain consistent after filtering and sorting.
- Large media previews, quiet metadata and an immersive player/viewer.
- One deliberate type, spacing, radius and control-size scale.
- Grid-first browsing with compact controls, visible applied filters, separate organizing actions and paging below results.
- Keyboard, narrow-window, loading, empty, error and recovery states designed alongside the default screen.

## Proposed boundaries

- `apps/library`: new React frontend with its own build entry and styles, initially using synthetic fixtures. Do not import the legacy app-theme.css cascade.
- `packages/ui`: Park UI component source, Panda recipes, shared accessible primitives and documentation. No library API calls, routes or Wails types.
- `packages/design-tokens`: one semantic brand vocabulary. Adapt it to Park's color/state model intentionally; avoid maintaining competing palettes. Do not copy every legacy token mechanically.
- App feature modules: videos, photos, people, tags, collections, following, downloads, settings, viewers. Own state, domain actions and screen composition.
- Existing Go backend, persistence and HTTP contracts remain the working foundation. Keep native integration behind an adapter. The current `frontend` remains the reference until the replacement meets the cutover gate.

Keep npm workspaces and the root lockfile. Before scaffolding, verify the chosen Park/Ark/Panda versions against React, TypeScript and Vite; pin and document the resulting toolchain. Do not assume the legacy versions support the current generators. Record the provenance of imported Park source and customizations. New packages stay private.

Park distributes component source that we own and can customize; Ark supplies interaction behavior and Panda supplies styling. Theme the component recipes directly rather than adding page-level override sheets. Use the documented composition APIs instead of preserving legacy class names for compatibility.

## Delivery sequence

1. **Foundation and reviewable library slice.** Scaffold the new workspace and UI package. Add Park Button, IconButton, Input, Menu, Select, Popover, Checkbox, Dialog and Pagination as needed. Establish the theme and a component showcase. Build the shell, video cards, toolbar, active chips and bottom paging using synthetic content. Review desktop and narrow layouts before extending the visual language.
2. **Real browsing and organization.** Connect videos and photos through the existing API boundary. Preserve filter combinations, sort, page resets, preview preferences, multi-selection and organizing actions. Build people/tags and collection/folder flows from the same primitives.
3. **Viewing.** Implement player and photo viewer layouts with organization panels, keyboard controls, focus restoration and uninterrupted playback when editing metadata. Reuse working media logic where appropriate.
4. **Operational screens.** Rebuild Following, Downloads, Settings and duplicate review. Preserve queue priority versus display sort, progress, retries, cancellation, busy states, hidden/locked rules and destructive-action semantics.
5. **Cutover and cleanup.** Connect the new build to desktop embedding and the daemon only after capability parity. Validate production assets, native integration and browser behavior. Retire superseded frontend code/styles once the new entry owns the feature; retain the saved branch/stash as the reference.

Each slice must render and work before starting the next. Do not add empty packages or install the entire component catalogue up front. Document intentional interaction changes; do not silently drop features to fit a stock component.

## Completion gates

- New UI runs independently of legacy CSS and consumes the actual shared package.
- One owner for each token, recipe and reusable interaction; page code owns placement and domain behavior.
- Behavior checks cover keyboard operation, disabled/busy states, focus return, viewport-bounded overlays, responsive layouts and recovery paths using synthetic data.
- Reuse existing behavioral test scenarios; update selectors to accessible roles and labels when markup changes. Pixel equivalence to the old UI is not required.
- Verify API mutation payloads, selection/paging semantics, playback continuity and persistence, not just screenshots.
- No real media, cookies, credentials or live queues in test fixtures.
- Frontend build, relevant unit/browser suites and desktop packaging pass before replacing the current application entry.

References: [Park installation](https://park-ui.com/docs/installation), [Park architecture](https://park-ui.com/docs/introduction), [product inventory](product.md), [existing design direction](design-system.md), [testing](testing.md).
