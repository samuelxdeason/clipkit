# Component selection

| Component | Default and choices | Contract |
| --- | --- | --- |
| Button | surface, md; solid / outline / subtle / plain; optional danger tone | Native type=button; use submit deliberately; loadingText describes progress |
| IconButton | Button appearance with square target | aria-label required; use Icon as decorative content; aria-pressed for toggles |
| Input | md; sm/lg | Visible label required; ref and native attributes preserved; aria-invalid and aria-describedby connect errors |
| Heading | h2, md; sm/lg and as | Choose semantic level by document outline, visual size by role |
| Text | md, default; sm/lg and muted/danger | Paragraph by default; can select semantic element with as |
| Icon | Lucide glyph, md; sm | Decorative only; name the surrounding action |

Use one solid action for the current local task. Surface/outline are supporting actions; plain is quiet utility. Destructive actions must be named accurately and preserve the app's confirmation/recovery behavior. A red button is not a confirmation flow.

Park's styled primitives retain composition/style props, but application code should use the documented variants for appearance. Layout props are acceptable for placement; appearance changes require a recipe update and story. Do not duplicate control variants in app CSS.

Field-level validation remains app-owned in this milestone. Use label wrapping or htmlFor/id; associate hint/error text explicitly. Keep native form behavior and announce asynchronous outcomes. Full forms/Field abstractions will be added with an actual feature.

See Storybook for copyable examples and live props. For complex widgets in later milestones, retain Park/Ark compound structure and test keyboard/focus before wrapping it in a convenience API.
