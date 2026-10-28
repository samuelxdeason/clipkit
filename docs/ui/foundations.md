# Foundations

## Colors and ownership

Canonical values live in `packages/design-tokens/src/values.ts`. `build.mjs` generates the existing scoped CSS; `src/panda.ts` derives the complete Panda theme from the same values: colour roles, the spacing grid, the two control heights, the type ramp, radii, shadows, gradients and the state duration. Never edit generated tokens.css or copy color literals into a component. The saved legacy contract verifies value/scope parity.

The theme still loads `@pandacss/preset-panda` for its numeric size and space names (`h: '10'`, `w: 'full'`), which older recipes and app layout code use. Named scales from `values.ts` are the target; the preset is removed once nothing depends on it.

Pages compose; recipes style. In `apps/library`, inline `css()` may set layout (display, grid, flex, gap, size, position) but not colour, type, borders, radii or shadows. ESLint warns on each such property; the warning count from `npm run lint:foundation` is the migration backlog, and it reaches zero when every appearance decision lives in a recipe or text style in `packages/ui`.

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

| hover / hoverSurface / hoverLine | Hover fills and borders on neutral controls |
| dialog / dialogLine / overlay / overlayLine / toolbar | Dialog, card-overlay and toolbar surfaces |
| info / infoSurface / infoLine | Active work such as a running download; not success |
| tag.* | Tag chips |
| gradients.action / actionHover | The primary button fill and its hover |

Component variants map directly to these roles. There is no arbitrary colorPalette prop or stock color ramp. Add a new role in the owner only when a component needs it; every role above comes from a value the existing app already uses.

## Typography and geometry

Interface text uses the shared `body` font token: Segoe UI Variable, Segoe UI, then the platform system sans-serif. This matches the working Windows frontend; other platforms use their installed system fallback. The locally bundled, licensed Nunito face is reserved for the `brand` token and ClipKit wordmark. No remote font request is required. Font roles live in `packages/ui/panda.config.ts`; never set a different family per page.

Heading sizes are the existing app's three heading roles: `sm` is the 16px subsection, `md` (the default) the 22px section with -0.4px tracking, and `lg` the page title (36px desktop / 28px narrow, weight 750, -1px tracking, 1.15 line height). Prefer PageHeader for a page title and SectionHeading for a region, which carry the matching description styles; use Heading directly only where neither pattern fits. Visual size and document hierarchy are separate. Text offers sm/md/lg and default/muted/danger tones. Use labels for inputs, not a visual Text component alone.

Controls come in two heights, carried over from the existing app: `regular` is the `control` size (42px, 13px text, 9px by 14px padding) and `compact` is `controlCompact` (32px, 4px by 10px padding). Buttons and inputs share them, so toolbars and forms line up without per-page adjustment. Icon buttons are square at the same heights. Buttons use minimum heights so enlarged text can grow. Long content and zoom remain review requirements for future layouts.

Spacing is the 4px grid from `values.ts`; the numeric names (`2`, `3`, `4`, `6`, `8` = 8/12/16/24/32px) match Panda's, and role names (`actionGap`, `iconGap`, `panel`, `dialog`, `card`) cover the gaps the existing app names. Radii are `small` 6px, `control` 8px, `inset` 12px, `panel` 16px and `dialog` 20px. Page layout uses typed css(); control geometry belongs in its recipe. Do not adjust button padding or font size to repair a page layout.

## States

Named text styles `cardTitle`, `metadata`, and `fieldLabel` own compact browsing typography. Card-title weight, tracking and line height are theme tokens; avoid arbitrary values in consuming cards. Tag renders tag metadata; `Button variant="quiet" size="compact"` renders quiet card actions. Compact size is reserved for secondary metadata, not primary forms or toolbar actions. Checkbox appearance belongs in `recipes/checkbox.ts`, with its component retaining Ark behavior.

The shared Checkbox uses a 24px rounded square with the 8px control radius, inside a minimum 40px hit area. Checked and indeterminate states share the same geometry; disabled and keyboard-focus styles remain visible. Use this component for card selection, select-page controls and filter choices instead of creating page-specific checkbox styles.

Hover uses raised neutral surfaces or primary hover tokens. `aria-pressed` retains selected colors on hover. Focus has its own visible cherry ring. Native disabled/fieldset states prevent activation; loading also disables actions and exposes aria-busy. Reduced-motion CSS removes transitions and animation. Color alone never communicates status.

The theme applies at the document root so portals inherit it. See [browsing patterns](browsing.md) for overlay positioning, nested boundaries and focus checks. Dark-only is intentional; additional themes require complete role/state contrast checks.
