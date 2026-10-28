import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  designSystem: '@clipkit/ui',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  preflight: true,
  strictTokens: true,
});
