import { defineRecipe } from '@pandacss/dev';

export const text = defineRecipe({
  className: 'ck-text',
  jsx: ['Text'],
  base: { margin: '0', lineHeight: '1.6', color: 'text' },
  variants: {
    size: { sm: { fontSize: 'sm' }, md: { fontSize: 'md' }, lg: { fontSize: 'lg' } },
    tone: { default: { color: 'text' }, muted: { color: 'muted' }, danger: { color: 'danger' } },
    // Named roles from the theme's text styles; they override size.
    variant: {
      body: {},
      eyebrow: { textStyle: 'eyebrow', textTransform: 'uppercase', letterSpacing: '[1.2px]' },
      metadata: { textStyle: 'metadata' },
      label: { textStyle: 'fieldLabel' },
    },
  },
  defaultVariants: { size: 'md', tone: 'default', variant: 'body' },
});

export const heading = defineRecipe({
  className: 'ck-heading',
  jsx: ['Heading'],
  // Sizes are the existing app's heading roles: subsection, section, page title.
  base: {
    margin: '0',
    color: 'text',
    fontWeight: 'heading',
    lineHeight: 'heading',
  },
  variants: {
    size: {
      sm: { fontSize: 'subsection', letterSpacing: 'dialogTitle' },
      md: { fontSize: 'section', letterSpacing: 'section' },
      lg: {
        textStyle: 'pageTitle',
        fontSize: { base: 'headingCompact', md: 'heading' },
      },
    },
  },
  defaultVariants: { size: 'md' },
});
