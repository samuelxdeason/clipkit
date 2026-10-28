# Shared packages

- [design-tokens](design-tokens/README.md): typed canonical values, generated legacy CSS and Panda semantic adapter.
- [ui](ui/README.md): private Park/Ark + Panda core controls and Storybook.

Use npm ci at the root. Packages must not import applications, Wails bindings or private data. Further UI/API extraction follows [the foundation plan](../docs/ui-foundation-plan.md). Packages remain private; publishing requires a separate request.
