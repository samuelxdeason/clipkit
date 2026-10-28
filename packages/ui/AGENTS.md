# UI package

Read [../../docs/ui/README.md](../../docs/ui/README.md) and [NOTICE.md](NOTICE.md). Reuse a component and its documented variants before adding a new one. Change recipe/token owners, not page overrides. Preserve native semantics, refs, disabled/loading behavior and accessible naming.

Components/stories live together under src/components; appearance belongs in src/recipes. Values come from @clipkit/design-tokens/panda. No app, API or Wails imports. Keep typography roles separate from heading hierarchy. Never edit generated styled-system/dist or add legacy frontend CSS.

Use npm run check:foundation, then the relevant browser and consumer tests described in README. Add stories for meaningful state combinations and recovery paths. Update provenance when importing upstream changes. Browsing controls now have a synthetic library consumer; do not invent further wrappers ahead of a real consumer.
