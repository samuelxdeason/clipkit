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
| Watch window, organize inspector and photo viewer | [Player and viewer](player.md) |
| Collection directory, one collection, folder tree and dialogs | [Collections](collections.md) |
| Followed sources, one source's items and downloads from it | [Following](following.md) |
| Library location and storage, connections, backup and rebuild | [Settings](settings.md) |
| Reviewing marked copies and recycling the extras | [Potential duplicates](duplicates.md) |

Working inventory: Button, IconButton, Input, Textarea, Text, Heading, Icon, Checkbox, Select/ChoiceSelect, Popover, Dialog, Paging, Tabs, SearchField, Tag, StatusBadge, Notice, EmptyState, MediaCard, PageHeader, SectionHeading, Toolbar, FilterRail, Sidebar, Panel and the other surfaces, and Viewer with its Organizer. Storybook includes state examples and nested overlays. The new app has connected and synthetic video-library modes; Storybook and demo mode remain independent of real media.

Connected Videos, Photos, People and Tags use shared app-owned browsing components. People includes profiles and account connections; directory links open the existing media organizing flows. Videos open in the watch window with its organize inspector, and photos in the photo viewer. Collections have their directory, pages, sidebar tree and dialogs, Following its sources and items, Settings its three sections, and Potential duplicates its review queue. Not implemented yet: the desktop build's tools, drag-and-drop organizing, full form-field composition and toasts. Their guides and examples will be added with working consumers, not speculative abstractions.
