# Shared package rules

Use npm workspaces and the root lockfile. Keep package exports explicit and packages private. Never import frontend modules or generated Wails bindings. Design-token values live in design-tokens/tokens.css; frontend/src/tokens.css is only a compatibility import. Preserve selector scope and responsive behavior when editing tokens. Run npm run test:tokens, check:styles and affected visual tests. Publishing is not part of ordinary extraction work.
