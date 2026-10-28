import { defineRecipe } from '@pandacss/dev';

// State styles belong in the variant layer so they outrank each variant's hover fill.
const selection = {
  '&[aria-pressed="true"]': {
    bg: 'selected',
    color: 'selectedText',
    borderColor: 'selectedLine',
    _hover: { bg: 'selected' },
  },
} as const;

// Adapted from Park UI's button recipe. See NOTICE.md for provenance and changes.
export const button = defineRecipe({
  className: 'ck-button',
  jsx: ['Button', 'IconButton'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    gap: '2',
    borderRadius: 'control',
    borderWidth: '1px',
    borderColor: 'transparent',
    fontWeight: 'semibold',
    cursor: 'pointer',
    position: 'relative',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: 'colors',
    _focusVisible: { outline: '2px solid', outlineColor: 'accent', outlineOffset: '3px' },
    _disabled: { opacity: '0.45', cursor: 'not-allowed' },
    '& svg': { flexShrink: '0', width: '5', height: '5' },
  },
  variants: {
    variant: {
      toolbar: {
        ...selection,
        bg: 'transparent',
        color: 'muted',
        _hover: { bg: 'raised', color: 'text', _disabled: { bg: 'transparent' } },
        _expanded: { bg: 'raised', color: 'text' },
      },
      manage: {
        ...selection,
        bg: 'transparent',
        color: 'text',
        _hover: { bg: 'raised', _disabled: { bg: 'transparent' } },
      },
      picker: {
        ...selection,
        bg: 'transparent',
        color: 'text',
        borderColor: 'line',
        fontWeight: 'normal',
        _hover: { bg: 'raised', _disabled: { bg: 'transparent' } },
      },
      tag: {
        bg: 'tag.surface',
        color: 'tag.text',
        borderColor: 'tag.line',
        minW: '0',
        flexShrink: '1',
        _hover: { bg: 'raised', _disabled: { bg: 'tag.surface' } },
      },
      solid: {
        ...selection,
        bg: 'action',
        color: 'onAction',
        _hover: { bg: 'actionHover', _disabled: { bg: 'action' } },
      },
      surface: {
        ...selection,
        bg: 'surface',
        color: 'text',
        borderColor: 'line',
        _hover: { bg: 'raised', _disabled: { bg: 'surface' } },
      },
      outline: {
        ...selection,
        bg: 'transparent',
        color: 'text',
        borderColor: 'line',
        _hover: { bg: 'raised', _disabled: { bg: 'transparent' } },
      },
      subtle: {
        ...selection,
        bg: 'selected',
        color: 'selectedText',
        _hover: { bg: 'raised', _disabled: { bg: 'selected' } },
      },
      plain: {
        ...selection,
        bg: 'transparent',
        color: 'muted',
        _hover: { bg: 'raised', _disabled: { bg: 'transparent' } },
      },
    },
    size: {
      compact: { minH: '6', minW: '0', px: '2', py: '0.5', fontSize: 'xs' },
      sm: { minH: '9', minW: '9', px: '3', py: '1', fontSize: 'sm' },
      md: { minH: '10', minW: '10', px: '3.5', py: '2', fontSize: 'sm' },
      lg: { minH: '11', minW: '11', px: '4', py: '2', fontSize: 'md' },
    },
    iconOnly: { true: { px: '0', py: '0', aspectRatio: '1' } },
    tone: { danger: { color: 'danger', bg: 'dangerSurface', borderColor: 'danger' } },
  },
  compoundVariants: [
    {
      variant: 'plain',
      size: 'compact',
      css: { px: '0', py: '1', fontWeight: 'normal', minW: '9' },
    },
    { iconOnly: true, size: 'sm', css: { width: '9', height: '9', p: '0' } },
    { iconOnly: true, size: 'md', css: { width: '10', height: '10', p: '0' } },
    { iconOnly: true, size: 'lg', css: { width: '11', height: '11', p: '0' } },
  ],
  defaultVariants: { variant: 'surface', size: 'md' },
});
