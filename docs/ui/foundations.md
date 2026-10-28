# Foundations

## Colors and ownership

Canonical values live in `packages/design-tokens/src/values.ts`. `build.mjs` generates the existing scoped CSS; `src/panda.ts` maps values to new semantic roles. Never edit generated tokens.css or copy color literals into a component. The saved legacy contract verifies value/scope parity.

| Token | Use |
| --- | --- |
| canvas / surface / raised / field | Background hierarchy; no decorative cherry panel fills |
| text / muted / subtle | Main copy, secondary copy, hints |
| line | Neutral separators and control borders |
| action / actionHover / onAction | Primary action fill, hover and contrasting text |
| accent | Focus and brand details; not a substitute for readable button fills |
| selected / selectedText / selectedLine | Persistent active choices, including hover |
| danger / dangerSurface | Destructive action and validation; pair with a label |
| success / warning / info | Reserved semantic status roles |
| identity.* | Stable decorative person/tag accents; never selection or error meaning |

The initial foundation maps Park's component variants directly to these semantic roles. It deliberately has no arbitrary colorPalette prop or full stock color ramp. Add a new role in the owner only when a component needs it. The old aliases remain solely for compatibility; no competing hand-maintained theme.

## Typography and geometry

Interface text uses the shared `body` font token: Segoe UI Variable, Segoe UI, then the platform system sans-serif. This matches the working Windows frontend; other platforms use their installed system fallback. The locally bundled, licensed Nunito face is reserved for the `brand` token and ClipKit wordmark. No remote font request is required. Font roles live in `packages/ui/panda.config.ts`; never set a different family per page.

Heading defaults to h2 and medium visual size; choose `as="h1" size="lg"` for the page title. Large headings use shared page-title tokens (36px desktop / 28px narrow, weight 750, -1px tracking, 1.15 line height), matching the working frontend. Visual size and document hierarchy are separate. Text offers sm/md/lg and default/muted/danger tones. Use labels for inputs, not a visual Text component alone.

Standard controls use Park size names: sm 36px, md 40px, lg 44px. Medium is the desktop default; prefer large for touch-focused actions. Inputs and buttons align at a given size. Icon buttons are square at the same dimensions. Buttons use minimum heights so enlarged text can grow. Long content and zoom remain review requirements for future layouts.

Use Panda's shared spacing scale (commonly 2/3/4/6/8 = 8/12/16/24/32px), control radius 8px, panel 16px and dialog 20px. Page layout uses typed css(); control geometry belongs in its recipe. Do not adjust button padding or font size to repair a page layout.

## States

Named text styles `cardTitle`, `metadata`, and `fieldLabel` own compact browsing typography. Card-title weight, tracking and line height are theme tokens; avoid arbitrary values in consuming cards. `Button variant="tag" size="compact"` renders tag metadata; `variant="plain" size="compact"` renders quiet card actions. Compact size is reserved for secondary metadata, not primary forms or toolbar actions. Checkbox appearance belongs in `recipes/checkbox.ts`, with its component retaining Ark behavior.

The shared Checkbox uses a 24px rounded square with the 8px control radius, inside a minimum 40px hit area. Checked and indeterminate states share the same geometry; disabled and keyboard-focus styles remain visible. Use this component for card selection, select-page controls and filter choices instead of creating page-specific checkbox styles.

Hover uses raised neutral surfaces or primary hover tokens. `aria-pressed` retains selected colors on hover. Focus has its own visible cherry ring. Native disabled/fieldset states prevent activation; loading also disables actions and exposes aria-busy. Reduced-motion CSS removes transitions and animation. Color alone never communicates status.

The theme applies at the document root so portals inherit it. See [browsing patterns](browsing.md) for overlay positioning, nested boundaries and focus checks. Dark-only is intentional; additional themes require complete role/state contrast checks.
