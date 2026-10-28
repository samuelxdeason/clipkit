# New UI system

This guide describes the implemented milestone-1 foundation on `codex/park-ui-rebuild`. [The legacy design guide](../design-system.md) still governs the existing frontend. [The plan](../ui-foundation-plan.md) covers later milestones.

| Need | Owner |
| --- | --- |
| Color roles, typography and sizes | [Foundations](foundations.md) |
| Choose/use a component | [Components](components.md), then its Storybook entry |
| Change or debug the system | [Contributing and checks](contributing.md) |
| Package build/imports | [UI package](../../packages/ui/README.md) |
| Upstream source and deviations | [Provenance](../../packages/ui/NOTICE.md) |

Working inventory: Button, IconButton, Input, Text, Heading and Icon. Storybook includes default, disabled, loading, selected, invalid, size and long-label examples. The new app proves composition independently of Storybook. Neither connects to real media.

Not implemented yet: browse patterns/cards, dialogs, menus, popovers, form-field composition, toasts, routing and data adapters. Their guides and examples will be added with working consumers, not speculative abstractions.
