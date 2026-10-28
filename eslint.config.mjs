import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/styled-system/**', '**/dist/**', '**/storybook-static/**', 'frontend/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['packages/ui/src/**/*.{ts,tsx}', 'packages/design-tokens/src/**/*.ts', 'apps/library/src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/frontend/**', '**/wailsjs/**'], message: 'Use a typed application adapter; shared UI must remain app-independent.' }] }],
    },
  },
  {
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['**/apps/**', '**/frontend/**', '**/wailsjs/**'], message: 'Shared UI may not depend on applications.' }] }] },
  },
);
