# 0003: npm workspaces and a private token package

Status: Adopted. Supersedes the transitional package-manager state in decision 0001.

Decision: npm 12.0.2, one root package-lock.json, frontend and packages/* workspaces. Wails uses npm. @clipkit/design-tokens exports CSS only and remains private. The frontend import shim retains the original theme order and .finder-shell scope.

Compatibility: React, Vite and TypeScript versions remain unchanged. The old npm lock lagged the installed pnpm setup for PostCSS (8.5.15 versus 8.5.26) and Autoprefixer (10.5.0 versus 10.5.4). The new lock preserves the currently installed 8.5.26/10.5.4 versions and existing manifests; this is not a toolchain upgrade. Original token bytes were preserved.

Verification: clean root npm ci, style ownership checks, tarball consumer build, existing UI suites and desktop build. Browser harnesses resolve Vite through Node module resolution rather than a fixed node_modules path.

Consequences: npm must be run from the root for dependency changes (use --workspace frontend for frontend dependencies). No nested lockfiles. The package is intentionally scoped to .finder-shell for compatibility; broader theming and token generation remain separate design decisions. No package publishing or frontend relocation occurs here.
