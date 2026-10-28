import { defineSlotRecipe } from '@pandacss/dev';

/**
 * The existing app's tab row (`nav.utility-tabs.profile-tabs`): text tabs
 * on a hairline, the selected one in the selection text colour with a
 * two-pixel cherry underline. Sources: frontend/src/after-hours.css and
 * design-system.css, measured through the Reference/Legacy controls story.
 */
export const tabs = defineSlotRecipe({
  className: 'ck-tabs',
  slots: ['root', 'list', 'trigger', 'indicator', 'content'],
  base: {
    root: { display: 'grid', gap: '3', minW: '0' },
    list: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '[26px]',
      minW: '0',
      position: 'relative',
      borderBottomWidth: '1px',
      borderColor: 'line',
    },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'iconGap',
      flexShrink: '0',
      minH: '12',
      px: '1',
      py: '3',
      mb: '-1px',
      whiteSpace: 'nowrap',
      color: 'muted',
      fontFamily: 'body',
      fontSize: 'body',
      fontWeight: 'control',
      borderBottomWidth: '2px',
      borderColor: 'transparent',
      cursor: 'pointer',
      userSelect: 'none',
      transitionProperty: 'colors',
      transitionDuration: 'state',
      transitionTimingFunction: 'state',
      _hover: { color: 'text' },
      _selected: {
        color: 'selectedText',
        fontWeight: 'heading',
        borderColor: 'accent',
        _hover: { color: 'selectedText' },
      },
      _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '3px' },
      _disabled: { opacity: '0.45', cursor: 'not-allowed' },
      '& svg': { flexShrink: '0', width: 'iconSmall', height: 'iconSmall' },
    },
    content: { minW: '0', _focusVisible: { outline: '2px solid', outlineColor: 'focus' } },
  },
});
