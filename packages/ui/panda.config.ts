import { defineConfig } from '@pandacss/dev';
import { theme } from '@clipkit/design-tokens/panda';
import { button } from './src/recipes/button';
import { input } from './src/recipes/input';
import { checkbox } from './src/recipes/checkbox';
import { heading, text } from './src/recipes/typography';
import { select, popover, dialog } from './src/recipes/overlays';
import { tabs } from './src/recipes/tabs';
import { searchField } from './src/recipes/search-field';
import { tag, statusBadge, notice, emptyState } from './src/recipes/feedback';
import { mediaCard } from './src/recipes/media-card';
import { pageHeader, sectionHeading, toolbar, filterRail, filterChip } from './src/recipes/layout';
import { sidebar } from './src/recipes/sidebar';
import {
  panel,
  rule,
  stat,
  progressBar,
  iconTile,
  identity,
  avatar,
  breadcrumbs,
  disclosure,
  textLink,
  accent,
  previewImage,
} from './src/recipes/surfaces';

export default defineConfig({
  // preset-panda still supplies the numeric size/space scale that older
  // recipes and app styles lean on. It is removed once every consumer uses
  // the named scales from @clipkit/design-tokens; see docs/ui/foundations.md.
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  strictTokens: true,
  plugins: [
    {
      name: 'clipkit-semantic-colors-only',
      hooks: {
        'preset:resolved': ({ utils, preset, name }) =>
          name === '@pandacss/preset-panda'
            ? utils.omit(preset, ['theme.tokens.colors', 'theme.semanticTokens.colors'])
            : preset,
      },
    },
  ],
  staticCss: { recipes: '*' },
  globalCss: {
    ':root': { colorScheme: 'dark', fontFamily: 'body', color: 'text', bg: 'canvas' },
    body: { margin: '0' },
    // Recipes set their own durations at class specificity, so this universal
    // rule needs !important to win when the user asks for reduced motion.
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0s !important',
        transitionDuration: '0s !important',
      },
    },
  },
  theme: {
    extend: {
      ...theme,
      recipes: {
        button,
        input,
        heading,
        text,
        tag,
        statusBadge,
        filterChip,
        panel,
        rule,
        progressBar,
        iconTile,
        identity,
        breadcrumbs,
        textLink,
        accent,
        previewImage,
      },
      slotRecipes: {
        select,
        popover,
        dialog,
        checkbox,
        tabs,
        searchField,
        notice,
        emptyState,
        mediaCard,
        pageHeader,
        sectionHeading,
        toolbar,
        filterRail,
        sidebar,
        stat,
        avatar,
        disclosure,
      },
    },
  },
});
