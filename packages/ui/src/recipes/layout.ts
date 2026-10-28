import { defineRecipe, defineSlotRecipe } from '@pandacss/dev';

/**
 * Page-level structure from the existing app: the page header
 * (`.manager-heading.ui-page-header`), section headings
 * (`.settings-section-heading`), the browsing toolbar (`.library-toolbar`)
 * and the active-filter rail (`.video-filter-chips`). Sources:
 * frontend/src/ui-system.css, workspace.css, browse-layout.css and
 * after-hours.css.
 */

export const pageHeader = defineSlotRecipe({
  className: 'ck-page-header',
  slots: ['root', 'copy', 'title', 'description', 'actions'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4',
      minH: '11',
      mb: '4',
    },
    copy: { display: 'grid', gap: '1', minW: '0', flex: '1' },
    title: { m: '0', textStyle: 'pageTitle', fontSize: { base: 'headingCompact', md: 'heading' } },
    description: { m: '0', color: 'muted', fontSize: 'body', lineHeight: 'body' },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'actionGap',
      ml: 'auto',
    },
  },
});

export const sectionHeading = defineSlotRecipe({
  className: 'ck-section',
  slots: ['root', 'eyebrow', 'title', 'description'],
  base: {
    root: { display: 'grid', gap: '1', minW: '0' },
    eyebrow: {
      m: '0',
      color: 'subtle',
      textStyle: 'eyebrow',
      textTransform: 'uppercase',
      letterSpacing: '[1.2px]',
      mb: '1',
    },
    title: { m: '0', color: 'text', textStyle: 'section' },
    description: {
      m: '0',
      mt: '2',
      maxW: '[650px]',
      color: 'muted',
      fontSize: 'body',
      lineHeight: 'body',
    },
  },
  variants: {
    // .settings-section-heading sits on its own panel; queue and composer headings do not.
    surface: {
      true: {
        root: {
          p: '6',
          bg: 'surface',
          borderWidth: '1px',
          borderColor: 'line',
          borderRadius: 'panel',
        },
      },
    },
  },
});

/** `.library-toolbar`: search on top, then the result count beside the controls, then chips. */
export const toolbar = defineSlotRecipe({
  className: 'ck-toolbar',
  slots: ['root', 'search', 'row', 'summary', 'controls', 'chips'],
  base: {
    root: {
      display: 'grid',
      gap: '3',
      minW: '0',
      mb: '4',
      pb: '4',
      borderBottomWidth: '1px',
      borderColor: 'line',
    },
    search: { minW: '0' },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      rowGap: '2',
      columnGap: '4',
      minH: 'control',
    },
    summary: { color: 'muted', fontSize: 'meta', lineHeight: 'body', minW: '0' },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '2',
      ml: 'auto',
    },
    chips: { minW: '0' },
  },
});

/** `.video-filter-chips`: the applied-filter rail under a toolbar. */
export const filterRail = defineSlotRecipe({
  className: 'ck-filters',
  slots: ['root', 'caption', 'reset'],
  base: {
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '2',
      pt: '3',
      borderTopWidth: '1px',
      borderColor: 'line',
    },
    caption: { color: 'subtle', fontSize: 'meta' },
    reset: {
      display: 'inline-flex',
      alignItems: 'center',
      ml: 'auto',
      minH: 'controlCompact',
      px: '3',
      py: '1',
      borderRadius: 'control',
      color: 'muted',
      fontFamily: 'body',
      fontSize: 'meta',
      fontWeight: 'label',
      cursor: 'pointer',
      _hover: { color: 'text', bg: 'raised' },
      _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '2px' },
    },
  },
});

/** One applied filter: the selection treatment at the compact height; click removes it. */
export const filterChip = defineRecipe({
  className: 'ck-chip',
  jsx: ['FilterChip'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    minH: 'controlCompact',
    maxW: 'full',
    px: '3',
    py: '1',
    bg: 'surface',
    color: 'muted',
    borderWidth: '1px',
    borderColor: 'line',
    borderRadius: 'control',
    fontFamily: 'body',
    fontSize: 'meta',
    lineHeight: 'compact',
    fontWeight: 'label',
    cursor: 'pointer',
    transitionProperty: 'colors',
    transitionDuration: 'state',
    transitionTimingFunction: 'state',
    _hover: { bg: 'raised', color: 'text' },
    _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '2px' },
    '& > span': { minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    '& svg': { flexShrink: '0', w: 'iconSmall', h: 'iconSmall' },
  },
});
