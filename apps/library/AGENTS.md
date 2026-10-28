# New library app

Read [../../docs/ui/README.md](../../docs/ui/README.md). This is the isolated rebuild; do not switch Wails/daemon asset paths yet. Use synthetic examples until a real-data slice is explicitly being implemented.

Compose @clipkit/ui controls and typed Panda layout styles. Component variants own appearance; pages own layout and behavior. Do not import frontend CSS or private shared-package source paths. Services/native adapters belong in the app, never shared UI. Keep JSX formatted and separate feature state from presentation as features grow.

Shared browse controls live in components/browsing; connection UI in app; HTTP DTOs in services. Features own their models, hooks, cards, filters and dialogs. Do not import another feature's internals to reuse a pattern: extract an app-owned component after a second concrete consumer exists. Read docs/ui/photos.md for the connected Photos contracts and run both video suites when changing shared browsing controls.

Run npm run check:foundation and build both app/catalogue before npm run test:foundation. Root npm run check verifies the old app; use existing affected smoke suites when changing shared tokens or dependencies.

People/Tags share directory-browser, directory-card and directory-model under components/browsing. Directory/profile reads use services/use-library-resource with stable loaders. Read docs/ui/people-tags.md before changing counts, identity colors, profile writes or scoped media links; run test:directories-connected and the media browsing suites for shared changes.
