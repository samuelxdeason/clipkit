# Repository tooling

Run through the root package scripts. test.cjs selects existing unit/browser suites and propagates failures. Browser suites run sequentially to avoid fixed-port collisions. check-docs.cjs validates relative file links in current docs, excluding the explicitly historical archive; it does not validate prose or external URLs. No tool installs dependencies, starts the real desktop app, or touches a live vault.
