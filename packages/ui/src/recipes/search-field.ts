import { defineSlotRecipe } from '@pandacss/dev';

/**
 * `.manager-search` from the existing app: a bordered field surface at the
 * regular control height holding a leading glyph, the input, an optional
 * shortcut hint and a clear control. Focus moves to the wrapper, which shows
 * the cherry border and the selection halo. Sources: frontend/src/manager.css,
 * design-system.css, brand-theme.css and browse-layout.css.
 */
export const searchField = defineSlotRecipe({
  className: 'ck-search',
  slots: ['root', 'icon', 'input', 'hint', 'clear'],
  base: {
    root: {
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 'actionGap',
      minW: '0',
      w: 'full',
      h: 'control',
      px: '3',
      bg: 'field',
      color: 'text',
      borderWidth: '1px',
      borderColor: 'line',
      borderRadius: 'control',
      transitionProperty: 'colors',
      transitionDuration: 'state',
      transitionTimingFunction: 'state',
      _focusWithin: { borderColor: 'focus', boxShadow: '0 0 0 2px token(colors.selected)' },
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      color: 'subtle',
      '& svg': { width: 'iconSmall', height: 'iconSmall' },
    },
    input: {
      flex: '1',
      minW: '0',
      w: 'full',
      bg: 'transparent',
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      color: 'text',
      fontFamily: 'body',
      fontSize: 'control',
      lineHeight: 'control',
      _placeholder: { color: 'muted', opacity: '1' },
    },
    hint: {
      flexShrink: '0',
      whiteSpace: 'nowrap',
      fontFamily: 'body',
      fontSize: 'eyebrow',
      color: 'subtle',
      borderWidth: '1px',
      borderColor: 'line',
      borderRadius: 'small',
      px: '1',
      py: '0.5',
    },
    clear: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: '7',
      h: '7',
      mr: '-1',
      borderRadius: 'small',
      color: 'muted',
      cursor: 'pointer',
      _hover: { bg: 'raised', color: 'text' },
      _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '1px' },
      '& svg': { width: 'iconSmall', height: 'iconSmall' },
    },
  },
  variants: {
    size: {
      regular: {},
      compact: {
        root: { h: 'controlCompact', px: '2.5', gap: '2' },
        input: { fontSize: 'control' },
      },
    },
  },
  defaultVariants: { size: 'regular' },
});
