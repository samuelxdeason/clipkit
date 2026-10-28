import { defineRecipe, defineSlotRecipe } from '@pandacss/dev';

/**
 * The small surfaces and text roles the pages were still drawing inline:
 * panels, hairlines, stat tiles, progress bars, icon tiles, identity
 * colour, avatars, breadcrumbs, disclosures, inline links and preview
 * images. Each is one rule family from the existing app's stylesheets.
 */

/** `.settings-card`, `.account-row`, `.download-row`: a bordered panel surface. */
export const panel = defineRecipe({
  className: 'ck-panel',
  jsx: ['Panel'],
  base: {
    minW: '0',
    bg: 'surface',
    color: 'text',
    borderWidth: '1px',
    borderColor: 'line',
    borderRadius: 'panel',
  },
  variants: {
    padding: {
      none: {},
      compact: { p: '3' },
      regular: { p: { base: '4', md: '5' } },
      roomy: { p: { base: '5', md: '6' } },
    },
    // `.download-row.is-running` and friends: a tone bar at the leading edge.
    accent: {
      info: { borderColor: 'infoLine', boxShadow: 'inset 3px 0 token(colors.info)' },
      success: { boxShadow: 'inset 3px 0 token(colors.success)' },
      danger: { borderColor: 'dangerLine', boxShadow: 'inset 3px 0 token(colors.danger)' },
      selected: { borderColor: 'selectedLine' },
    },
    elevation: {
      flat: {},
      floating: { boxShadow: 'surface' },
    },
  },
  defaultVariants: { padding: 'regular', elevation: 'flat' },
});

/** A hairline on one side, with the spacing the existing app pairs with it. */
export const rule = defineRecipe({
  className: 'ck-rule',
  base: { borderColor: 'line', borderStyle: 'solid', borderWidth: '0' },
  variants: {
    side: {
      top: { borderTopWidth: '1px', pt: '4' },
      bottom: { borderBottomWidth: '1px', pb: '4' },
      left: { borderLeftWidth: '1px', pl: '3' },
    },
  },
  defaultVariants: { side: 'top' },
});

/** `.profile-stats`, `.download-overview-card`: a label over a large tabular number. */
export const stat = defineSlotRecipe({
  className: 'ck-stat',
  slots: ['root', 'label', 'value'],
  base: {
    root: { display: 'grid', gap: '1', minW: '0' },
    label: {
      m: '0',
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      color: 'muted',
      fontSize: 'meta',
      lineHeight: 'body',
    },
    value: {
      m: '0',
      color: 'text',
      fontSize: 'section',
      fontWeight: 'heading',
      lineHeight: 'heading',
      fontVariantNumeric: 'tabular-nums',
    },
  },
  variants: {
    tone: {
      neutral: {},
      info: { value: { color: 'info' } },
      success: { value: { color: 'success' } },
      danger: { value: { color: 'danger' } },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

/** `.download-progress`: a thin bar; the value is the active-work colour, never success. */
export const progressBar = defineRecipe({
  className: 'ck-progress',
  base: {
    appearance: 'none',
    w: 'full',
    h: '2',
    borderWidth: '0',
    borderRadius: 'full',
    overflow: 'hidden',
    bg: 'field',
    '&::-webkit-progress-bar': { bg: 'field' },
    '&::-webkit-progress-value': { bg: 'info' },
    '&::-moz-progress-bar': { bg: 'info' },
  },
});

/** `.download-file-icon`, `.setting-icon`: a 48px glyph tile on the field surface. */
export const iconTile = defineRecipe({
  className: 'ck-icon-tile',
  base: {
    display: 'grid',
    placeItems: 'center',
    flexShrink: '0',
    w: '12',
    h: '12',
    bg: 'field',
    color: 'muted',
    borderWidth: '1px',
    borderColor: 'line',
    borderRadius: 'control',
    '& svg': { w: 'iconFeature', h: 'iconFeature' },
  },
  variants: {
    tone: {
      neutral: {},
      info: { color: 'info' },
      success: { color: 'success' },
      danger: { color: 'danger' },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

/**
 * Identity colour (`[data-card-tone]`): decorative, chosen from the name,
 * never selection or status. `text` colours what it wraps; the wash
 * placements paint a soft radial field behind content.
 */
export const identity = defineRecipe({
  className: 'ck-identity',
  base: {},
  variants: {
    tone: {
      plum: { color: 'identity.plum' },
      rose: { color: 'identity.rose' },
      blue: { color: 'identity.blue' },
      amber: { color: 'identity.amber' },
    },
    wash: {
      none: {},
      card: {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '0',
        background: 'radial-gradient(ellipse at 50% 85%, currentColor, transparent 80%)',
        opacity: '0.24',
      },
      tag: {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '0',
        background: 'radial-gradient(ellipse at 0% 0%, currentColor, transparent 85%)',
        opacity: '0.14',
      },
      hero: {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '0',
        background: 'radial-gradient(ellipse at 0% 0%, currentColor, transparent 72%)',
        opacity: '0.18',
      },
    },
  },
  defaultVariants: { tone: 'plum', wash: 'none' },
});

/** `.person-avatar`: initials or a portrait inside an identity-tinted frame, with an optional glow. */
export const avatar = defineSlotRecipe({
  className: 'ck-avatar',
  slots: ['root', 'frame', 'wash', 'initials', 'glow', 'image'],
  base: {
    root: { position: 'relative', isolation: 'isolate', w: 'full', minW: '0' },
    frame: {
      position: 'relative',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
      w: 'full',
      isolation: 'isolate',
      borderWidth: '1px',
      borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
    },
    wash: { position: 'absolute', inset: '0', bg: 'currentColor', opacity: '0.12', zIndex: '-1' },
    initials: { fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 'heading', lineHeight: '1' },
    glow: {
      position: 'absolute',
      inset: '3',
      bg: 'currentColor',
      opacity: '0.28',
      filter: 'blur(28px)',
      pointerEvents: 'none',
      zIndex: '-1',
    },
    image: { w: 'full', h: 'full', objectFit: 'cover' },
  },
  variants: {
    shape: {
      round: { frame: { aspectRatio: 'square', borderRadius: 'full' } },
      tile: { frame: { aspectRatio: 'square', borderRadius: 'panel' } },
      portrait: { frame: { aspectRatio: '4 / 5', borderRadius: 'panel' } },
    },
  },
  defaultVariants: { shape: 'tile' },
});

/** `.breadcrumbs`: the muted path above a profile or collection. */
export const breadcrumbs = defineRecipe({
  className: 'ck-breadcrumbs',
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '2',
    mb: '5',
    color: 'muted',
    fontSize: 'control',
    lineHeight: 'body',
    '& a': { color: 'muted', textDecoration: 'none', _hover: { color: 'text' } },
    '& [aria-current="page"]': { color: 'text', fontWeight: 'label' },
  },
});

/** A `<details>` whose summary reads as a quiet control. */
export const disclosure = defineSlotRecipe({
  className: 'ck-disclosure',
  slots: ['root', 'summary', 'content'],
  base: {
    root: { minW: '0' },
    summary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2',
      py: '2',
      color: 'muted',
      fontSize: 'control',
      lineHeight: 'body',
      cursor: 'pointer',
      listStyle: 'none',
      '&::-webkit-details-marker': { display: 'none' },
      _hover: { color: 'text' },
      _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '2px' },
    },
    content: { pt: '2', color: 'muted', fontSize: 'control', lineHeight: 'body' },
  },
  variants: {
    tone: {
      neutral: {},
      danger: { summary: { color: 'danger' }, content: { color: 'danger' } },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

/** An inline text link in running copy. */
export const textLink = defineRecipe({
  className: 'ck-link',
  base: {
    color: 'muted',
    fontSize: 'control',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    cursor: 'pointer',
    _hover: { color: 'text' },
    _focusVisible: { outline: '2px solid', outlineColor: 'focus', outlineOffset: '2px' },
  },
});

/** The accent-coloured mark in the wordmark. */
export const accent = defineRecipe({
  className: 'ck-accent',
  base: { color: 'accent' },
});

/** A preview image inside a dialog: contained, on the control radius. */
export const previewImage = defineRecipe({
  className: 'ck-preview',
  base: {
    display: 'block',
    w: 'full',
    maxH: '60vh',
    objectFit: 'contain',
    bg: 'canvas',
    borderRadius: 'control',
  },
});
