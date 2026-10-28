# 0004: Isolated Park UI foundation

Status: implemented for milestone 1 on codex/park-ui-rebuild. Supersedes incremental component-porting for this branch only.

Build the new frontend in apps/library, with Park source and Ark composition in private @clipkit/ui. Panda 2.4.0 builds the package manifest/runtime; the app consumes it using designSystem. Storybook consumes the same component source and generated package CSS. The old frontend and Wails asset paths are unchanged.

Pin React 18.3.1, Ark 5.39.3, Panda 2.4.0, Vite 7.3.7, plugin-react 5.2.0, TypeScript 5.9.3 and Storybook 10.6.5 for the new workspace. The old frontend retains Vite 3.2.11 and TypeScript 4.9.5. Node >=22.18 is required; verification uses 24.19.0 and npm 12.0.2. ESLint 10.13.0, typescript-eslint 8.72.1 and Prettier 3.9.10 cover new source. Park source provenance is in the package NOTICE.

Typed canonical values generate the legacy scoped CSS and feed the new semantic adapter. Preserve the old declaration contract during extraction. New code uses semantic roles, a clean layered cascade and a single reset, with no legacy CSS specificity bridge or copied page selectors.

Source exports remain private and bundler-oriented; an isolated tarball consumer verifies actual delivery. One coordinated dev build queue watches tokens, recipes and source for both app and catalogue. Broader widgets, real media features and production cutover remain later milestones.
