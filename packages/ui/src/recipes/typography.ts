import { defineRecipe } from '@pandacss/dev';

export const text = defineRecipe({
  className: 'ck-text',
  jsx: ['Text'],
  base: { margin: '0', lineHeight: '1.6', color: 'text' },
  variants: {
    size: { sm: { fontSize: 'sm' }, md: { fontSize: 'md' }, lg: { fontSize: 'lg' } },
    tone: { default: { color: 'text' }, muted: { color: 'muted' }, danger: { color: 'danger' } },
  },
  defaultVariants: { size: 'md', tone: 'default' },
});

export const heading = defineRecipe({
  className: 'ck-heading',
  jsx: ['Heading'],
  base: {
    margin: '0',
    color: 'text',
    fontWeight: 'bold',
    lineHeight: '1.2',
    letterSpacing: 'tight',
  },
  variants: {
    size: {
      sm: { fontSize: 'lg' },
      md: { fontSize: '2xl' },
      lg: {
        fontSize: { base: 'pageTitleCompact', md: 'pageTitle' },
        fontWeight: 'pageTitle',
        lineHeight: '1.15',
        letterSpacing: 'pageTitle',
      },
    },
  },
  defaultVariants: { size: 'md' },
});
