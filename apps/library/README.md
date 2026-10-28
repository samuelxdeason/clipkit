# New ClipKit library frontend

Milestone 1 is a synthetic UI foundation demo, not a replacement for the working library. It has no API, vault or queue access. Root `npm run dev` and desktop builds still target `frontend/`.

Run `npm run dev:library` or `npm run dev:foundation` from the root. Use `npm run build:library` for production assets. The app consumes `@clipkit/ui` through Panda's designSystem manifest and imports its own generated CSS plus the package font. It does not import legacy styles.

The first video-library layout and real data adapters remain future milestones. See [the foundation plan](../../docs/ui-foundation-plan.md).
