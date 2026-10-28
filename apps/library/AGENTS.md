# New library app

Read [../../docs/ui/README.md](../../docs/ui/README.md). This is the isolated rebuild; do not switch Wails/daemon asset paths yet. Use synthetic examples until a real-data slice is explicitly being implemented.

Compose @clipkit/ui controls and typed Panda layout styles. Component variants own appearance; pages own layout and behavior. Do not import frontend CSS or private shared-package source paths. Services/native adapters belong in the app, never shared UI. Keep JSX formatted and separate feature state from presentation as features grow.

Run npm run check:foundation and build both app/catalogue before npm run test:foundation. Root npm run check verifies the old app; use existing affected smoke suites when changing shared tokens or dependencies.
