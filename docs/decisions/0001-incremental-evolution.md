# 0001: Incremental repository evolution

Status: Adopted for this cleanup; target package extraction is planned.

Context: Wails embeds frontend/dist; browser tests and launchers use frontend paths. Backend services already have a host-independent core. UI files and CSS have accumulated overlapping responsibilities.

Decision: Preserve working runtime paths while establishing ownership, commands and tests. Extract reusable packages behind existing entry points before moving the app. Add a separate marketing frontend when required. Do not publish packages automatically.

Alternatives: a wholesale apps/packages move would create broad import/build churn before improving boundaries; maintaining duplicate UI implementations would make consistency harder.

Consequences: frontend/ remains temporarily nonstandard. Migration gates are explicit in repository-evolution.md. Root npm scripts are a command facade, not a workspace lockfile strategy; that transitional package-manager state is superseded by [decision 0003](0003-npm-workspaces-and-tokens.md).
