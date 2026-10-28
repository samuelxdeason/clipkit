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

Nunito is bundled locally with its license. Heading defaults to h2 and medium visual size; choose `as="h1"` for the page title. Visual size and document hierarchy are separate. Text offers sm/md/lg and default/muted/danger tones. Use labels for inputs, not a visual Text component alone.

Standard controls use Park size names: sm 36px, md 40px, lg 44px. Medium is the desktop default; prefer large for touch-focused actions. Inputs and buttons align at a given size. Icon buttons are square at the same dimensions. Buttons use minimum heights so enlarged text can grow. Long content and zoom remain review requirements for future layouts.

Use Panda's shared spacing scale (commonly 2/3/4/6/8 = 8/12/16/24/32px), control radius 8px, panel 16px and dialog 20px. Page layout uses typed css(); control geometry belongs in its recipe. Do not adjust button padding or font size to repair a page layout.

## States

Hover uses raised neutral surfaces or primary hover tokens. `aria-pressed` retains selected colors on hover. Focus has its own visible cherry ring. Native disabled/fieldset states prevent activation; loading also disables actions and exposes aria-busy. Reduced-motion CSS removes transitions and animation. Color alone never communicates status.

The theme applies at the document root so future portals can inherit it. Portal/focus behavior is not yet verified for overlays because this milestone adds no overlays. Dark-only is intentional; additional themes require complete role/state contrast checks.
