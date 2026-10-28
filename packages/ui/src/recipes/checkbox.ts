import { defineSlotRecipe } from '@pandacss/dev';

export const checkbox = defineSlotRecipe({
  className: 'ck-checkbox',
  slots: ['root', 'control', 'label'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2',
      minH: '10',
      minW: '10',
      cursor: 'pointer',
      _disabled: { opacity: '0.45', cursor: 'not-allowed' },
    },
    control: {
      display: 'grid',
      placeItems: 'center',
      boxSize: '6',
      flexShrink: '0',
      borderRadius: 'control',
      borderWidth: '1px',
      borderColor: 'muted',
      bg: 'field',
      color: 'onAction',
      transition: 'colors',
      _hover: { borderColor: 'text' },
      _checked: { bg: 'action', borderColor: 'accent' },
      _indeterminate: { bg: 'action', borderColor: 'accent' },
      _focusVisible: {
        outlineWidth: '2px',
        outlineStyle: 'solid',
        outlineColor: 'accent',
        outlineOffset: '1',
      },
    },
    label: { fontSize: 'body' },
  },
  variants: { hideLabel: { true: { label: { srOnly: true } } } },
});
