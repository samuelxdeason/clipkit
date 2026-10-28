# Park UI source provenance

Core controls are based on [Park UI](https://github.com/chakra-ui/park-ui), revision `102769cc91a9d36753dbc5893c74b7954b495efe`, retrieved 2026-10-27. Upstream license is preserved in [LICENSE.park-ui](LICENSE.park-ui).

Input, Text and Heading retain the upstream styled-component structure from `components/react/src/components/ui/`, with local generated-runtime imports. Button and IconButton adapt the same directory's native/Ark composition. Button/input recipes adapt `packages/preset/src/recipes/`; typography recipes are local role definitions.

Intentional changes: ClipKit semantic colors; neutral default action; sm/md/lg sizes; explicit icon-only dimensions; required icon-button label; smaller loading API with native disabled and aria-busy; no ButtonGroup/Loader dependency yet. The foundation does not install Park's full preset, all palettes or unused widgets. It is an editable source integration, not a claim that `@park-ui/cli` is a runtime dependency.

When updating, compare these source paths against the recorded revision, preserve local contracts and rerun state/consumer checks. Do not overwrite components with an unreviewed CLI update.

Nunito is copied from the existing app, with its OFL license in `assets/OFL-Nunito.txt`. It is bundled locally and makes no network font request.

Milestone 2 adds Select, Popover and Dialog compound sources from the same pinned Park revision and directory. Their `createStyleContext` calls use Panda 2's `createSlotRecipeContext`; local slot recipes supply ClipKit surfaces and viewport constraints. Popover RootProvider uses Ark's corresponding RootProvider. Checkbox adapts the Park/Ark structure with a compact controlled API; ChoiceSelect and Paging are local Ark compositions. All retain Ark behavior rather than implementing overlay positioning or keyboard state machines in the app.
