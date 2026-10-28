import { defineRecipe } from '@pandacss/dev';

/**
 * The existing app's button contract, written as a recipe.
 *
 * Source rules: frontend/src/ui-system.css (.ui-button and its four
 * variants), interaction-system.css (hover) and the shared "one selected
 * treatment" rule. Two heights only: regular and compact. A page picks a
 * variant; it never restyles a button.
 */

// Selection outranks every variant's own hover fill.
const selection = {
  '&[aria-pressed="true"], &[aria-current="page"], &[data-state="open"]': {
    bg: 'selected',
    color: 'selectedText',
    borderColor: 'selectedLine',
    _hover: { bg: 'selected' },
  },
} as const;

export const button = defineRecipe({
  className: 'ck-button',
  jsx: ['Button', 'IconButton'],
  base: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    gap: 'iconGap',
    minH: 'control',
    px: 'controlInline',
    py: 'controlBlock',
    borderRadius: 'control',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'line',
    fontFamily: 'body',
    fontSize: 'control',
    lineHeight: 'control',
    fontWeight: 'control',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    transitionProperty: 'colors',
    transitionDuration: 'state',
    transitionTimingFunction: 'state',
    _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '3px' },
    _disabled: { opacity: '0.45', cursor: 'not-allowed' },
    '& svg': { flexShrink: '0', width: 'iconRegular', height: 'iconRegular' },
  },
  variants: {
    variant: {
      neutral: {
        ...selection,
        bg: 'surface',
        color: 'text',
        borderColor: 'line',
        _hover: { bg: 'raised', _disabled: { bg: 'surface' } },
      },
      quiet: {
        ...selection,
        bg: 'transparent',
        color: 'muted',
        borderColor: 'transparent',
        _hover: { bg: 'raised', color: 'text', _disabled: { bg: 'transparent', color: 'muted' } },
      },
      primary: {
        bgGradient: 'action',
        color: 'onAction',
        borderColor: 'transparent',
        _hover: { bgGradient: 'actionHover', _disabled: { bgGradient: 'action' } },
      },
      danger: {
        bg: 'dangerSurface',
        color: 'danger',
        borderColor: 'dangerLine',
        _hover: { bg: 'selected', _disabled: { bg: 'dangerSurface' } },
      },
    },
    size: {
      regular: {},
      compact: {
        minH: 'controlCompact',
        px: 'compactInline',
        py: 'compactBlock',
        '& svg': { width: 'iconSmall', height: 'iconSmall' },
      },
    },
    iconOnly: {
      true: { px: '0', py: '0', aspectRatio: '1', minW: 'control' },
    },
  },
  compoundVariants: [{ iconOnly: true, size: 'compact', css: { minW: 'controlCompact' } }],
  defaultVariants: { variant: 'neutral', size: 'regular' },
});
