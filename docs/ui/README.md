# New UI system

This guide describes the shared foundation, synthetic library and first connected video slice on `codex/park-ui-rebuild`. [The legacy design guide](../design-system.md) still governs the existing frontend. [The plan](../ui-foundation-plan.md) covers later milestones.

| Need | Owner |
| --- | --- |
| Color roles, typography and sizes | [Foundations](foundations.md) |
| Choose/use a component | [Components](components.md), then its Storybook entry |
| Change or debug the system | [Contributing and checks](contributing.md) |
| Package build/imports | [UI package](../../packages/ui/README.md) |
| Upstream source and deviations | [Provenance](../../packages/ui/NOTICE.md) |
| Library layout, state and overlays | [Browsing patterns](browsing.md) |
| Backend connection, mutations and real-data tests | [Connected library](connected-library.md) |
| Photos and shared browsing ownership | [Connected Photos](photos.md) |
| Queue controls, progress and download testing | [Downloads](downloads.md) |
| Directories, profiles, accounts and scoped media links | [People and Tags](people-tags.md) |

Working inventory: Button, IconButton, Input, Text, Heading, Icon, Checkbox, Select/ChoiceSelect, Popover, Dialog and Paging. Storybook includes state examples and nested overlays. The new app has connected and synthetic video-library modes; Storybook and demo mode remain independent of real media.

Connected Videos, Photos, People and Tags use shared app-owned browsing components. People includes profiles and account connections; directory links open the existing media organizing flows. Not implemented yet: collection pages, full player/viewer tooling, action menus, full form-field composition and toasts. Their guides and examples will be added with working consumers, not speculative abstractions.
