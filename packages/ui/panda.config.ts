import { defineConfig } from '@pandacss/dev';
import { colors, radii } from '@clipkit/design-tokens/panda';
import { button } from './src/recipes/button';
import { input } from './src/recipes/input';
import { heading, text } from './src/recipes/typography';

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
        fonts: { body: { value: '"Nunito", system-ui, sans-serif' } },
        radii,
      },
      semanticTokens: { colors },
      recipes: { button, input, heading, text },
    },
  },
});
