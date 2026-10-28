import { defineRecipe, defineSlotRecipe } from '@pandacss/dev';

/**
 * Small feedback patterns from the existing app, each written from its
 * rules: `.tag-pill`, `.download-status` / `.connection-state`,
 * `.manager-alert` / `.manager-notice` and `.manager-empty` /
 * `.workspace-load-state`. Sources: frontend/src/design-system.css,
 * ui-system.css, after-hours.css, library-browsing.css and workspace.css.
 */

/** `.tag-pill`: a lilac chip; interactive when rendered as a button. */
export const tag = defineRecipe({
  className: 'ck-tag',
  jsx: ['Tag'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    minW: '0',
    maxW: 'full',
    px: '2',
    py: '1',
    bg: 'tag.surface',
    color: 'tag.text',
    borderWidth: '1px',
    borderColor: 'tag.line',
    borderRadius: 'small',
    fontFamily: 'body',
    fontSize: 'eyebrow',
    lineHeight: 'compact',
    fontWeight: 'label',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transitionProperty: 'colors',
    transitionDuration: 'state',
    transitionTimingFunction: 'state',
    '&:is(button)': {
      cursor: 'pointer',
      _hover: { color: 'text', bg: 'raised' },
      _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '2px' },
    },
  },
});

/** `.download-status` and `.connection-state`: a small tinted label, optionally with a dot. */
export const statusBadge = defineRecipe({
  className: 'ck-status',
  jsx: ['StatusBadge'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    flexShrink: '0',
    px: '2.5',
    py: '1.5',
    borderRadius: 'small',
    fontFamily: 'body',
    fontSize: 'eyebrow',
    lineHeight: 'compact',
    fontWeight: 'body',
    whiteSpace: 'nowrap',
  },
  variants: {
    tone: {
      neutral: { color: 'muted', bg: 'surface', borderWidth: '1px', borderColor: 'line' },
      info: { color: 'info', bg: 'infoSurface' },
      success: { color: 'success', bg: 'successSurface' },
      warning: { color: 'warning', bg: 'warningSurface' },
      danger: { color: 'danger', bg: 'dangerSurface' },
    },
    dot: {
      // .connection-state: a slightly larger label with a leading dot.
      true: {
        fontSize: 'meta',
        px: '2.5',
        py: '2',
        borderWidth: '1px',
        borderColor: 'line',
        borderRadius: 'control',
        _before: {
          content: '""',
          w: '1.5',
          h: '1.5',
          borderRadius: 'full',
          bg: 'currentColor',
          flexShrink: '0',
        },
      },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

/** `.manager-alert` / `.manager-notice`: an inline message with an accent bar and optional action. */
export const notice = defineSlotRecipe({
  className: 'ck-notice',
  slots: ['root', 'message', 'actions'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '4',
      px: '5',
      py: '4.5',
      borderWidth: '1px',
      borderRadius: 'inset',
      fontFamily: 'body',
      fontSize: 'control',
      lineHeight: 'body',
      overflowWrap: 'anywhere',
    },
    message: { flex: '1', minW: '0' },
    actions: { display: 'flex', flexShrink: '0', gap: '2', alignItems: 'center' },
  },
  variants: {
    tone: {
      danger: {
        root: {
          color: 'danger',
          bg: 'dangerSurface',
          borderColor: 'dangerLine',
          boxShadow: 'inset 3px 0 token(colors.danger)',
        },
      },
      success: {
        root: {
          color: 'success',
          bg: 'successSurface',
          borderColor: 'line',
          boxShadow: 'inset 3px 0 token(colors.success)',
        },
      },
      info: {
        root: {
          color: 'info',
          bg: 'infoSurface',
          borderColor: 'infoLine',
          boxShadow: 'inset 3px 0 token(colors.info)',
        },
      },
    },
  },
  defaultVariants: { tone: 'success' },
});

/** `.manager-empty` / `.workspace-load-state`: a centred panel for empty, loading and error. */
export const emptyState = defineSlotRecipe({
  className: 'ck-empty',
  slots: ['root', 'symbol', 'spinner', 'title', 'description', 'actions'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      minH: '[300px]',
      px: '7',
      py: '11',
      bg: 'surface',
      color: 'subtle',
      borderWidth: '1px',
      borderColor: 'line',
      borderRadius: 'panel',
    },
    symbol: {
      display: 'grid',
      placeItems: 'center',
      flexShrink: '0',
      w: '[60px]',
      h: '[60px]',
      mb: '5',
      bg: 'field',
      color: 'muted',
      borderWidth: '1px',
      borderColor: 'line',
      borderRadius: 'panel',
      '& svg': { w: 'iconFeature', h: 'iconFeature' },
    },
    spinner: {
      display: 'inline-block',
      w: '6',
      h: '6',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'selectedLine',
      borderTopColor: 'accent',
      borderRadius: 'full',
      animation: 'spin 0.9s linear infinite',
    },
    title: {
      m: '0',
      color: 'text',
      fontSize: 'section',
      fontWeight: 'heading',
      lineHeight: 'heading',
      letterSpacing: 'section',
    },
    description: {
      maxW: '[540px]',
      mt: '3',
      color: 'muted',
      fontSize: 'body',
      lineHeight: 'body',
      overflowWrap: 'anywhere',
    },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 'actionGap',
      mt: '5',
    },
  },
  variants: {
    state: {
      empty: {},
      loading: { symbol: { borderColor: 'tag.line', bg: 'tag.surface' } },
      error: {
        root: { borderColor: 'dangerLine' },
        symbol: { color: 'danger', borderColor: 'dangerLine', bg: 'dangerSurface' },
      },
    },
  },
  defaultVariants: { state: 'empty' },
});
