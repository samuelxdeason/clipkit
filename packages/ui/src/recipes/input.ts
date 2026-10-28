import { defineRecipe } from '@pandacss/dev';

// Park Input structure with ClipKit semantic colors and a deliberately small API.
export const input = defineRecipe({
  className: 'ck-input',
  jsx: ['Input'],
  base: {
    appearance: 'none',
    width: '100%',
    minW: '0',
    borderRadius: 'control',
    borderWidth: '1px',
    borderColor: 'line',
    color: 'text',
    bg: 'field',
    transition: 'colors',
    _placeholder: { color: 'subtle' },
    _focusVisible: { outline: '2px solid', outlineColor: 'accent', outlineOffset: '3px' },
    _invalid: { borderColor: 'danger' },
    _disabled: { opacity: '0.45', cursor: 'not-allowed' },
  },
  variants: {
    // Fields share the two control heights so toolbars and forms line up.
    size: {
      regular: { h: 'control', px: 'controlInline', fontSize: 'body' },
      compact: { h: 'controlCompact', px: 'compactInline', fontSize: 'control' },
    },
  },
  defaultVariants: { size: 'regular' },
});
