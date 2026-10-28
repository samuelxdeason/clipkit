# UI foundation implementation plan

Status: milestone 1 implemented; later milestones remain planned. Current usage and limits are in [the UI guide](ui/README.md). This is the implementation brief for `codex/park-ui-rebuild`. Branch recovery instructions are in [the rebuild outline](park-ui-rebuild.md). The existing frontend remains functional and is the behavior reference until cutover.

## Outcome

Build a distinct, coherent media-library interface that developers and AI agents can extend without making fresh design decisions on every screen. Preserve the charcoal, cherry and warm-white character, stable identity colors, immersive media and organizing capabilities. Improve composition where needed; old markup, exact dimensions and CSS selectors are not requirements.

Success means a new page can be assembled from documented components and patterns, changing a recipe updates its consumers, and a contributor can find the relevant owner without reading the entire application.

## Stack and responsibilities

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Application | React, TypeScript, Vite | Screens, routes, feature state and transport adapters |
| UI starting point | Park UI component source | Consistent primitives and composition APIs we own |
| Interaction behavior | Ark UI through Park | Focus, keyboard, overlays and accessible state machinery |
| Styling | Panda CSS | Typed tokens, recipes, slot recipes, responsive layout and generated CSS |
| Visual catalogue | Storybook with React/Vite | Searchable components, usage guidance, variants and state examples |
| Checks | TypeScript, ESLint, Prettier, browser tests, accessibility checks | Readability, boundaries and behavior |

Versions must be selected together in the first milestone: record Node/npm engines, React peers, TypeScript, Vite, Park CLI source version, Panda, Ark and Storybook compatibility. Use stable supported releases, exact direct versions for the initial foundation and one root npm lockfile. Do not run an unpinned generator over the existing frontend. Keep upgrades scoped to the new workspace where possible and test shared dependency effects on the old app.

Use Park's source distribution as the baseline, with documented local customizations. Do not add Radix, shadcn or another styling system for the same responsibilities. Use Lucide for the new icon vocabulary unless the initial visual review establishes a concrete reason to retain the old set; one shared Icon convention controls sizes, stroke and labeling.

## Repository layout and boundaries

Planned structure; create directories only when they contain working code:

```text
apps/library/
  src/app/                 # bootstrap, shell, routing and providers
  src/features/videos/     # page, components, hooks, model and tests
  src/features/photos/
  src/components/          # app-specific shared patterns and media cards
  src/services/            # HTTP/native adapters and boundary mapping
  src/test/                # synthetic fixtures and test helpers
packages/design-tokens/    # canonical semantic design values and adapters
packages/ui/
  src/components/          # Park-based primitives and compound components
  src/recipes/             # component and slot recipes, grouped by owner
  src/theme/               # Park/Panda theme assembly from shared tokens
  src/patterns/            # only generic, proven compositions
  .storybook/              # package catalogue configuration
  panda.config.ts
  README.md
  AGENTS.md
docs/ui/                   # concise design rules and contributor workflow
frontend/                  # existing application, retained until cutover
```

Stories and focused interaction tests sit beside their component. Feature folders get public entry points; do not deep-import another feature's private state. Use named exports and explicit package exports. Generic UI must not import app routes, transport, Wails bindings or domain models. Media cards and collection-specific behavior initially belong in the app; extract them only when another real consumer needs them.

Use the existing backend contracts. Separate presentation from API/mutation code with focused hooks or controllers, without introducing a generic repository abstraction for every endpoint. Decide routing and asynchronous-state tools in the first real-data slice based on URL/persistence, caching and SSE needs; record the decision rather than installing overlapping libraries speculatively.

## Token and CSS architecture

1. **Palette values:** charcoal, warm neutrals, cherry, status and identity ramps. Raw values exist only in the token owner.
2. **Semantic tokens:** names describe use, such as canvas, surface, text, border, action, selection, focus, danger and identity. Components normally use these, not raw palette steps.
3. **Recipes:** component geometry, variants, slots and states. A page chooses variants; it does not restyle descendant buttons.
4. **Layout:** Panda patterns and readable responsive styles compose pages. Literal media aspect ratios and measured runtime values may be justified exceptions; do not invent a token for every isolated number.

Current color anchors are canvas `#0d0d0f`, panel `#19181b`, raised surface `#29262a`, warm text `#faf6f0`, secondary text `#c6bdba`, cherry highlight `#f26b80`, and deeper action red `#bd2342`. Preserve these recognizable anchors where contrast allows. They are not a complete Park palette: build and verify the missing steps and semantic state mappings rather than assigning one cherry value to every state.

The existing token CSS must not become a second manually maintained palette. In the foundation milestone, establish a typed canonical source in `packages/design-tokens` with generated legacy CSS and a Panda adapter. Preserve current legacy declarations, scope and responsive behavior through a parity test before switching their ownership. Keep legacy aliases in the compatibility output; the new UI uses meaningful semantic names. Update package instructions and token tests in that same change.

Prefer Panda's documented design-system package build/consumer contract for the verified version. Prove a real consuming app and Storybook share the theme and generated runtime, and test the production CSS path. Do not recreate the previous pilot's unlayered-CSS specificity bridge: the new app starts with intentional cascade layers and one reset. Never import the legacy stylesheet stack into it.

Generated styles are ignored and rebuilt automatically. Dev commands must watch recipes as well as JSX; fresh installs must build without pre-existing generated files. Include stories in extraction where required. Test portals so menus/dialogs inherit the same dark theme and tokens outside the triggering subtree.

## Design rules that reduce guesswork

| Decision | Default rule |
| --- | --- |
| Primary action | One visually dominant action per local task; solid cherry with verified text contrast |
| Secondary action | Neutral surface or outline; quiet utility actions use plain treatment |
| Selection | Shared selected tokens and a visible indicator; preserve selection during hover |
| Identity | Stable person/tag color for avatars, small marks or restrained washes; never an error/selection signal |
| Status | Dedicated success, warning, danger and information palettes, always paired with text/icon cues |
| Surfaces | Canvas, panel, raised/overlay; use borders and spacing before adding decorative gradients |
| Text | Named heading/body/label/meta roles; no page-specific font metrics for the same role |
| Control sizes | Keep Park's common size names and aligned geometry; start with md for desktop and lg for touch-oriented controls, validate in context |
| Spacing and radii | One small token scale; controls, panels and dialogs have documented roles |
| Icons | Consistent glyph size by role; icon-only actions require an accessible name |
| Motion | Short state transitions, restrained media hover and reduced-motion support |
| Overlays | Shared portal/layer convention, viewport collision handling and nested Escape/focus behavior |

Begin dark-only. Structure semantic tokens so another theme is possible, but do not build a theme switcher or unused palette variants. Prefer Park's standard component sizes/variants where available over duplicating them with a second naming scheme. Establish approved examples for primary/secondary/destructive actions in the catalogue. Exact type and spacing choices are reviewed in the first screen before becoming rules.

Target WCAG 2.2 AA: test text and non-text contrast in context, visible focus, zoom/reflow, keyboard access and target sizes. Prefer comfortable 44px touch targets where practical. A library's accessibility features help but do not replace testing labels, composition and real workflows.

## Component API and readability rules

- Format all new source with Prettier; use strict TypeScript and focused ESLint rules. Avoid compressed JSX, nested ternary chains and unrelated responsibilities in one page file.
- Prefer a small set of named variants to boolean combinations. Preserve Park/Ark compound APIs for complex widgets; do not hide their accessibility or ref contracts behind a giant wrapper.
- Native semantics remain native: links navigate, buttons act, inputs have labels, form submission is intentional. Preserve refs and controlled/uncontrolled contracts where supported.
- Defaults should be useful: standard size, neutral secondary appearance, consistent focus and disabled behavior. Document how primary/destructive actions opt in.
- Recipe files own appearance, components own interaction composition, callers own content and side effects. State styles are colocated with their recipe.
- Expose intentional composition slots. Avoid catch-all style props that allow each screen to redefine controls; do not build a universal component with dozens of unrelated options.
- Use Panda layout utilities for page layout. Global CSS is limited to reset, fonts and genuinely global behavior; no append-only override sheets, deep page selectors or routine `!important`.
- Extract reusable patterns after they demonstrate shared structure. Prefer a clear second example before generalizing, rather than building a framework for hypothetical pages.

## Documentation and AI context

Create a concise `docs/ui/README.md` index as the new system is implemented. The legacy design guide continues to describe the old frontend. Mark planned versus implemented content explicitly.

Required guides: foundations/color roles; typography/spacing; component selection; page and browsing patterns; forms/validation; overlays/focus; testing; and an ownership/troubleshooting map. Each rule should have a reason and a short good example; avoid repeating the same policy across documents.

Every public component needs a catalogue entry covering purpose, when to use it, variants/sizes, accessible naming, keyboard behavior where relevant, loading/disabled/error states, narrow layouts, and a realistic copyable example. Include long labels, missing content and combinations such as selected + hover, not just default screenshots. Use TypeScript/autodocs for prop details instead of manually copying interfaces into prose.

`packages/ui/AGENTS.md` and `apps/library/AGENTS.md` should be short maps to owners, commands and rules. Agent workflow: locate an existing component/pattern, choose a documented variant, change the owner if a capability is missing, add a meaningful example/check, then update the relevant guide. New visual decisions belong in recipes/tokens and a short decision record, not unexplained page CSS.

Record imported Park component provenance and local deviations so upgrades can be reviewed deliberately. Keep a lightweight component inventory with implemented/planned status. Avoid a separate manually maintained document that duplicates every source file.

## Verification and maintenance

- Root commands for new app dev/build, UI catalogue, typecheck, lint, format check and tests; preserve old commands until cutover.
- Import-boundary rules prevent shared UI depending on app/Wails code and features deep-importing one another.
- Enforce token use in design properties with Panda strict settings where supported plus focused lint checks. Document allowed runtime/layout exceptions.
- Component checks cover actual behavior: keyboard, focus return, form semantics, disabled/loading, overlay edges and portal theme inheritance. Use automated accessibility checks plus manual keyboard and targeted screen-reader verification.
- Browser flows cover data contracts, filter/page resets, organizing, queue actions and uninterrupted playback with synthetic fixtures.
- Maintain a small deterministic visual baseline for the catalogue and representative screens. Fix fonts, viewports, data and motion; review baseline changes deliberately, never auto-accept failures.
- Add an isolated package consumer build before calling the package reusable. Verify exports, CSS, peers and production output independently of workspace aliases. Keep packages private; publication is separate.
- Keep bundle size and initial library rendering measurements as a baseline; investigate regressions rather than setting an arbitrary budget before measuring.

## Milestones and acceptance

### 1. Reproducible foundation

Deliver new workspace, version/engine decision, canonical tokens and adapters, Park/Panda integration, source formatting, boundaries and build/watch commands. Add Button, IconButton, Input, Text/Heading and Icon conventions with catalogue stories. Write the initial package/agent guides.

Done when: clean install builds the old app, new app and package; token parity holds for the old app; new app and catalogue consume the same system; one theme/recipe edit updates both; generated output is not required in Git. No production entry changes.

### 2. First complete visual slice

Deliver new shell and video library using synthetic content, cards, search, filters, sorting, preview sizes, active chips, Manage selection and bottom paging. Add Park Select/Menu/Popover/Checkbox/Pagination and Dialog only as used. Keep media cards in the app. Include empty, loading, error, dense-content and narrow-window examples.

Done when: the page is visually reviewed as a coherent design, controls align, long content does not break layout, overlays remain in bounds, keyboard flows work, and organizing is discoverable. Use this review to finalize the initial type/spacing scales before propagating them.

### 3. Real feature patterns

Connect videos/photos to existing transport, then people, tags and collections. Extract shared browsing patterns from these real consumers. Document cache/event handling, query persistence and mutation feedback. Preserve collection membership, hidden/locked and deletion semantics.

Done when: behavior scenarios from the existing app pass against the new screens and shared patterns require no page-specific visual overrides.

### 4. Viewing and operations

Build player/photo viewer, Following, Downloads, Settings and duplicates from the established primitives. Preserve viewer continuity, focus recovery, progress, retry/cancellation and queue ordering. Add any new primitives with the same documentation and state coverage.

Done when: capabilities in the product inventory are accounted for and validated; omissions are explicit, never silently accepted.

### 5. Cutover

Switch Wails embedding and daemon assets after capability parity. Validate desktop/native adapters, browser production assets, accessibility and responsive flows. Retire replaced styles and entry points deliberately. Preserve the prior branch/stash reference.

Done when: the new frontend is the tested default, build/run documentation is accurate, and duplicate implementations are removed from the active runtime.

## First implementation task

Execute milestone 1 with a small working demo, not a large catalogue of unused components. Its review artifact should show our neutral surfaces, cherry actions, typography, form controls and all their states, alongside a minimal app consuming the package. The next task builds the video-library slice; do not wire real vault data into the foundation demo.

## Sources

- [Park setup](https://park-ui.com/docs/installation): source/component setup and Ark foundation.
- [Park theming](https://park-ui.com/docs/theming): shared sizing, variants and color system.
- [Panda design-system packaging](https://panda-css.com/docs/design-systems/overview): package/consumer and generated-style contracts; verify against the pinned release.
- [Storybook stories](https://storybook.js.org/docs/writing-stories): colocated, rendered component-state examples.
- [Product behaviors to preserve](product.md) and [current architecture](architecture.md).
