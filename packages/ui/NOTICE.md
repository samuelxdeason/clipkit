# Park UI source provenance

Core controls are based on [Park UI](https://github.com/chakra-ui/park-ui), revision `102769cc91a9d36753dbc5893c74b7954b495efe`, retrieved 2026-10-27. Upstream license is preserved in [LICENSE.park-ui](LICENSE.park-ui).

Input, Text and Heading retain the upstream styled-component structure from `components/react/src/components/ui/`, with local generated-runtime imports. Button and IconButton adapt the same directory's native/Ark composition. Button/input recipes adapt `packages/preset/src/recipes/`; typography recipes are local role definitions.

Intentional changes: ClipKit semantic colors; neutral default action; sm/md/lg sizes; explicit icon-only dimensions; required icon-button label; smaller loading API with native disabled and aria-busy; no ButtonGroup/Loader dependency yet. The foundation does not install Park's full preset, all palettes or unused widgets. It is an editable source integration, not a claim that `@park-ui/cli` is a runtime dependency.

When updating, compare these source paths against the recorded revision, preserve local contracts and rerun state/consumer checks. Do not overwrite components with an unreviewed CLI update.

Nunito is copied from the existing app, with its OFL license in `assets/OFL-Nunito.txt`. It is bundled locally and makes no network font request.
