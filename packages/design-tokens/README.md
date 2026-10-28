# @clipkit/design-tokens

Private canonical ClipKit values. Edit src/values.ts, then run npm run build:tokens at the repository root. Do not edit tokens.css: it is the generated compatibility output used by the existing frontend. The src/panda.ts adapter exports semantic colors/radii for the new UI.

Run npm run check:token-parity to verify generated output and the original legacy declaration/scoping contract; npm run test:tokens verifies the packed consumer. Intentional future legacy token changes require explicit review of the migration fixture. See [the new foundations guide](../../docs/ui/foundations.md).
