# Component selection

Browsing toolbars use Select `appearance="toolbar"` for text choices and `toolbarIcon` for preview size. These share field-select behavior and menus, but remove the idle box border/fill. Hover and open states use a neutral raised surface; keyboard focus remains visible. Form and popover fields retain the default `field` appearance. Toolbar utilities such as Filters and Manage are Button `quiet`; active choices use `aria-pressed` and shared selection colors.

Compact card controls use Button `tag/compact` for labels and `quiet/compact` for File info. Picker triggers are `neutral` with `aria-pressed` for active choices; avoid per-instance font or color overrides. Layout constraints (such as maximum tag width) stay with the app. Checkbox supports `disabled`, `name`, and `value` in addition to controlled selection; its slot recipe owns geometry and states. Storybook's Patterns/Metadata examples demonstrate these contracts.

| Component | Default and choices | Contract |
| --- | --- | --- |
| Button | neutral, regular; primary / quiet / danger / tag; compact | Native type=button; use submit deliberately; loadingText describes progress |
| IconButton | Button appearance with square target | aria-label required; use Icon as decorative content; aria-pressed for toggles |
| Input | regular; compact | Visible label required; ref and native attributes preserved; aria-invalid and aria-describedby connect errors |
| Heading | h2, md; sm/lg and as | Choose semantic level by document outline, visual size by role |
| Text | md, default; sm/lg and muted/danger | Paragraph by default; can select semantic element with as |
| Icon | Lucide glyph, md; sm | Decorative only; name the surrounding action |
| ChoiceSelect / Select | Single-choice / compound | Label required; portal keeps options above surrounding panels; use controlled values |
| Checkbox | Rounded square; boolean or indeterminate | Label required even when visually hidden; native hidden input preserves keyboard semantics |
| Popover | Compound trigger/content/footer | Anchor to the trigger; use fixed positioning and viewport clearance; Escape returns focus |
| Dialog | Compound modal | Title required; description explains consequences; preserve focus restoration and recovery |
| Paging | Controlled count/page/pageSize | Page number reflects results; caller owns page resets and result focus |

Use one primary action for the current local task. Neutral is the supporting action; quiet is toolbar utility; danger names a destructive action. These are the existing app's four variants, written as one recipe; Storybook's Reference/Legacy buttons story renders both side by side. Destructive actions must be named accurately and preserve the app's confirmation/recovery behavior. A red button is not a confirmation flow.

Styled primitives retain composition/style props, but application code should use the documented variants for appearance. Layout props are acceptable for placement; appearance changes require a recipe update and story. Do not duplicate control variants in app CSS.

Field-level validation remains app-owned in this milestone. Use label wrapping or htmlFor/id; associate hint/error text explicitly. Keep native form behavior and announce asynchronous outcomes. Full forms/Field abstractions will be added with an actual feature.

See Storybook's Browsing controls for copyable overlay examples and [browsing contracts](browsing.md). Retain Park/Ark compound structure and test keyboard/focus before wrapping more widgets in a convenience API.
