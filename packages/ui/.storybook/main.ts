import type { StorybookConfig } from '@storybook/react-vite';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const packagePath = (name: string) => dirname(require.resolve(`${name}/package.json`));

const config: StorybookConfig = {
  framework: packagePath('@storybook/react-vite'),
  stories: ['../src/**/*.stories.tsx'],
  addons: [packagePath('@storybook/addon-docs'), packagePath('@storybook/addon-a11y')],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    return { ...config, css: { postcss: { plugins: [] } } };
  },
};
export default config;
