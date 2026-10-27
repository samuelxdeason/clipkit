# ClipKit design tokens

Private CSS-only package. Import `@clipkit/design-tokens/tokens.css` once before component styles. Variables are scoped to `.finder-shell`, including responsive overrides; wrap the consuming surface in that class. No global reset, fonts, JavaScript, React or Wails dependencies are included. The existing selector scope is retained for visual compatibility.

Edit tokens.css here, not the frontend compatibility import. Run `npm run check` and UI style checks from the repository root. This package is not approved for publishing.
