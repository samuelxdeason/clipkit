# Component selection

Browsing toolbars use Select `appearance="toolbar"` for text choices and `toolbarIcon` for preview size. These share field-select behavior and menus, but remove the idle box border/fill. Hover and open states use a neutral raised surface; keyboard focus remains visible. Form and popover fields retain the default `field` appearance. Toolbar utilities such as Filters and Manage are Button `quiet`; active choices use `aria-pressed` and shared selection colors. Library scopes and profile sections are Tabs (`segment` in toolbars, `underline` on profiles); the toolbar search is SearchField. Menus, filter popovers and dialogs draw their surfaces from the existing app: panel surface with the 12px inset radius for menus, the dialog surface for popovers and dialogs. Storybook's Reference/Legacy controls story renders the old versions beside them.

Compact card controls use Tag for labels and Button `quiet/compact` for File info. Picker triggers are `neutral` with `aria-pressed` for active choices; avoid per-instance font or color overrides. Layout constraints (such as maximum tag width) stay with the app. Checkbox supports `disabled`, `name`, and `value` in addition to controlled selection; its slot recipe owns geometry and states. Storybook's Patterns/Metadata examples demonstrate these contracts.

| Component | Default and choices | Contract |
| --- | --- | --- |
| Button | neutral, regular; primary / quiet / danger / tag; compact | Native type=button; use submit deliberately; loadingText describes progress |
| IconButton | Button appearance with square target | aria-label required; use Icon as decorative content; aria-pressed for toggles |
| Input | regular; compact | Visible label required; ref and native attributes preserved; aria-invalid and aria-describedby connect errors |
| Heading | h2, md; sm/lg and as | Choose semantic level by document outline, visual size by role |
| Text | md, default; sm and muted/danger | Paragraph by default; can select semantic element with as |
| Icon | Lucide glyph, md; sm | Decorative only; name the surrounding action |
| ChoiceSelect / Select | Single-choice / compound | Label required; portal keeps options above surrounding panels; use controlled values |
| Checkbox | Rounded square; boolean or indeterminate | Label required even when visually hidden; native hidden input preserves keyboard semantics |
| Popover | Compound trigger/content/footer | Anchor to the trigger; use fixed positioning and viewport clearance; Escape returns focus |
| Dialog | Compound modal | Title required; description explains consequences; preserve focus restoration and recovery |
| Paging | Controlled count/page/pageSize | Page number reflects results; caller owns page resets and result focus |
| Tabs | Compound; segment (default) / underline | Manual activation; List needs aria-label; one Content per value; a toggle is a Button with aria-pressed, not a tab |
| SearchField | regular; compact; optional hint | label required (no visible label); clear control appears with text; a textbox with enterKeyHint=search |
| Tag | Chip; button when it has onClick | Truncates; give an aria-label when the visible text is not the action; consumer owns max width |
| StatusBadge | neutral; info / success / warning / danger; dot | A label for a state, never a control; green is reserved for done |
| Notice | success (status); danger (alert); info | Inline message with accent bar; put Retry or Undo in actions as quiet compact buttons |
| EmptyState | empty; loading; error | Centred panel with title, description, symbol or spinner, and actions; error is role=alert |
| PageHeader | title, description, actions; as h1 (default) / h2 | One per page; actions are grouped as "Page actions"; the description is one line |
| SectionHeading | title; eyebrow; description; surface | Introduces a region inside a page; h2 by default; `surface` puts it on its own panel like the old settings heading |
| Toolbar | Compound: Root, Search, Row, Summary, Controls, Chips | Root is a labelled section; Summary carries role=status for the result count |
| FilterRail / FilterChip | Rail with caption and reset; chip removes its filter | Chip's accessible name is "Remove … filter"; reset label is the caller's wording |
| Sidebar | Compound: Root, Brand, Mark, Wordmark, Tagline, Nav, Group, Label, Item, Count, Footer, Summary | Item is a button; links use asChild with aria-current="page"; Nav carries the "Library navigation" label; unavailable routes are disabled Items |
| Panel | padding none / compact / regular / roomy; accent info / success / danger / selected; elevation floating | The bordered surface for settings cards, download rows and the manage dock; use asChild to keep section or article semantics |
| Rule | side top (default) / bottom / left | A hairline with the spacing the old app pairs with it; asChild keeps the element |
| Stat | Compound Root, Label, Value; tone | Label over a tabular number; Label and Value render dt and dd |
| Identity | tone plum / rose / blue / amber; wash card / tag / hero | Decorative colour from a name, never selection or status; asChild colours any element |
| Avatar | Compound Root, Frame, Wash, Initials, Glow, Image; shape round / tile / portrait | Initials or a portrait in an identity-tinted frame; wrap in Identity for the tone |
| IconTile / ProgressBar / PreviewImage / Textarea | tone; native progress; contained image; Input recipe on a textarea | Small surfaces that previously lived inline |
| Breadcrumbs / Disclosure / TextLink / Accent | nav; details with quiet summary and danger tone; inline link; accent span | Copy-level patterns |
| Text | size; tone; variant body / eyebrow / metadata / label | Named roles from the theme's text styles override size |
| MediaCard | Compound; kind video (default) / photo / person / tag | Root is an article with aria-label; Media is the one clickable surface and needs a name; data-selected shows selection; identity colour and domain content stay in the app |
| Viewer | Compound on Ark Dialog; kind video (default) / photo | The full-viewport window around a playing video or a photo: Header with Eyebrow and Title, Stage with one Video or Image, Bar, Footer with Controls, Error, Inspector; see [Player and viewer](player.md) |
| Viewer.Organizer | Compound: Root, Heading, Tray, TrayItem, Feedback, Intro, Create, Options, Option, Symbol, Copy, Name, Detail, Check, Empty, File, Facts | The organize inspector's parts; TrayItem and Option are buttons with aria-pressed; Create wraps a full-width Button |

Use one primary action for the current local task. Neutral is the supporting action; quiet is toolbar utility; danger names a destructive action. These are the existing app's four variants, written as one recipe; Storybook's Reference/Legacy buttons story renders both side by side. Destructive actions must be named accurately and preserve the app's confirmation/recovery behavior. A red button is not a confirmation flow.

Styled primitives retain composition/style props, but application code should use the documented variants for appearance. Layout props are acceptable for placement; appearance changes require a recipe update and story. Do not duplicate control variants in app CSS.

Field-level validation remains app-owned in this milestone. Use label wrapping or htmlFor/id; associate hint/error text explicitly. Keep native form behavior and announce asynchronous outcomes. Full forms/Field abstractions will be added with an actual feature.

See Storybook's Browsing controls for copyable overlay examples and [browsing contracts](browsing.md). Retain Park/Ark compound structure and test keyboard/focus before wrapping more widgets in a convenience API.
