import { defineConfig } from '@pandacss/dev';
import { colors, radii } from '@clipkit/design-tokens/panda';
import { button } from './src/recipes/button';
import { input } from './src/recipes/input';
import { checkbox } from './src/recipes/checkbox';
import { heading, text } from './src/recipes/typography';
import { select, popover, dialog } from './src/recipes/overlays';

export default defineConfig({
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
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': { animationDuration: '0s', transitionDuration: '0s' },
    },
  },
  theme: {
    extend: {
      tokens: {
        fonts: {
          body: { value: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
          brand: { value: '"Nunito", system-ui, sans-serif' },
        },
        fontWeights: { pageTitle: { value: 750 }, cardTitle: { value: 650 } },
        lineHeights: { cardTitle: { value: '22px' } },
        fontSizes: { pageTitle: { value: '36px' }, pageTitleCompact: { value: '28px' } },
        letterSpacings: { pageTitle: { value: '-1px' }, cardTitle: { value: '-0.2px' } },
        radii,
      },
      semanticTokens: { colors },
      textStyles: {
        cardTitle: {
          value: {
            fontSize: 'md',
            fontWeight: 'cardTitle',
            lineHeight: 'cardTitle',
            letterSpacing: 'cardTitle',
          },
        },
        metadata: { value: { fontSize: 'sm', lineHeight: '1.6', fontWeight: 'normal' } },
        fieldLabel: { value: { fontSize: 'xs', fontWeight: 'medium', lineHeight: '1.6' } },
      },
      recipes: { button, input, heading, text },
      slotRecipes: { select, popover, dialog, checkbox },
    },
  },
});
