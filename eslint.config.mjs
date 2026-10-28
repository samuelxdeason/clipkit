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
  {
    // Pages compose; recipes style. Inline css() in the app may set layout, but
    // colour, type, borders, radii and shadows belong to a recipe or text style
    // in packages/ui. Warnings are the migration backlog; see docs/ui/foundations.md.
    files: ['apps/library/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['warn', {
        selector: "CallExpression[callee.name='css'] > ObjectExpression > Property[key.name=/^(color|bg|background|backgroundColor|bgGradient|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|borderRadius|rounded|boxShadow|shadow|fontSize|fontWeight|fontFamily|lineHeight|letterSpacing|textStyle|opacity)$/]",
        message: 'Appearance belongs to a recipe or text style in packages/ui; css() in the app is for layout.',
      }],
    },
  },
);
