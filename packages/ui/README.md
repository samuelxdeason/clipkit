# @clipkit/ui

Private Park/Ark + Panda foundation for the new ClipKit app. Start with [the UI guide](../../docs/ui/README.md) and [source provenance](NOTICE.md).

```tsx
import { Button, Input, Heading, IconButton, Icon } from '@clipkit/ui';
import { Heart } from 'lucide-react';

<Heading as="h1" size="lg">Your library</Heading>
<label>Collection name<Input name="name" /></label>
<Button variant="primary" type="submit">Save</Button>
<IconButton aria-label="Favorite"><Icon glyph={Heart} /></IconButton>
```

For Panda consumers, set `designSystem: '@clipkit/ui'` in the app's Panda configuration and import the app's generated stylesheet once. For a CSS-only consumer, import `@clipkit/ui/styles.css` once. Both import `@clipkit/ui/fonts.css`. Do not load both generated CSS bundles or the old app theme. Layout code may import typed `css` from `@clipkit/ui/css`.

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:foundation` | App at localhost:5174 and Storybook at localhost:6006, with one coordinated recipe/token watcher |
| `npm run dev:library` | New demo and watcher only |
| `npm run storybook` | Catalogue and watcher only |
| `npm run build:library` | Package plus new production app |
| `npm run build:storybook` | Package plus static catalogue |
| `npm run check:foundation` | Token parity, build, strict types, lint and formatting |
| `npm run test:ui-consumer` | Isolated tarball build after building UI |
| `npm run test:foundation-install` | Clean npm ci and all frontend/catalogue builds in a temporary source-only checkout |
| `npm run test:foundation` | Built app/catalogue browser checks; build both first |

Use one dev command at a time; `dev:foundation` serves both without competing generators. Node >=22.18, verified on 24.19.0; npm 12.0.2. Codegen/lib/styles are generated automatically. Do not edit `styled-system/`, `dist/` or generated Panda package exports. Source exports are intended for bundlers; the isolated consumer verifies that contract. Package publication remains out of scope.

`src/components` owns native/Ark composition and stories. `src/recipes` owns all control appearance and states. `src/theme/fonts.css` is the only authored global stylesheet. Panda config assembles the token adapter, reset and theme. Components never import the app or Wails.
