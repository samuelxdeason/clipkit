# Shared packages

- design-tokens: private `@clipkit/design-tokens` package; CSS variables only. Imported by the library frontend through its compatibility shim.

Run `npm ci` at the repository root. Packages must not import app modules, Wails bindings or private data. UI and API-client extraction remain planned in ../docs/repository-evolution.md. Publishing requires explicit authorization and review; packages remain private.
