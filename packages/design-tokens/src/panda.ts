import { values } from './values';

/**
 * The complete Panda theme, derived from the canonical values.
 *
 * Every scale the UI package needs is defined here from `values.ts` so a
 * recipe can only ever land on the grid the existing app was designed on:
 * two control heights, one type ramp, five radii, one state duration. Names
 * describe the role (control, panel, meta); raw numbers stay in `values.ts`.
 */

type Name = keyof typeof values;

/** Follow `var(--x)` references inside values.ts down to a literal. */
function literal(name: Name): string {
  const raw: string = values[name];
  const match = /^var\((--[a-z0-9-]+)\)$/i.exec(raw.trim());
  if (!match) return raw;
  return literal(match[1] as Name);
}

const v = (name: Name) => ({ value: literal(name) });

export const colors = {
  canvas: v('--ui-canvas'),
  surface: v('--ui-panel'),
  raised: v('--ui-raised'),
  field: v('--ui-field'),
  dialog: v('--ui-dialog'),
  dialogLine: v('--ui-dialog-line'),
  toolbar: v('--ui-toolbar-surface'),
  segment: v('--ui-segment'),
  segmentActive: v('--ui-segment-active'),
  overlay: v('--ui-card-overlay'),
  overlayLine: v('--ui-card-overlay-line'),
  text: v('--ui-text'),
  muted: v('--ui-secondary'),
  subtle: v('--ui-muted'),
  line: v('--ui-line'),
  hover: v('--ui-hover'),
  hoverSurface: v('--ui-hover-surface'),
  hoverLine: v('--ui-hover-line'),
  accent: v('--ui-accent'),
  accentInk: v('--ui-accent-ink'),
  focus: v('--ui-focus'),
  action: v('--ui-primary-start'),
  actionEnd: v('--ui-primary-end'),
  actionHover: v('--ui-primary-hover-start'),
  actionHoverEnd: v('--ui-primary-hover-end'),
  onAction: v('--ui-on-primary'),
  selected: v('--ui-selection-surface'),
  selectedText: v('--ui-selection-text'),
  selectedLine: v('--ui-selection-line'),
  selectedHover: v('--ui-selection-hover'),
  danger: v('--ui-danger'),
  dangerSurface: v('--ui-danger-surface'),
  dangerLine: v('--ui-danger-line'),
  success: v('--ui-success'),
  successSurface: v('--ui-success-surface'),
  warning: v('--ui-warning'),
  warningSurface: v('--ui-warning-surface'),
  info: v('--ui-info'),
  infoSurface: v('--ui-info-surface'),
  infoLine: v('--ui-info-line'),
  brandGlow: v('--ui-brand-glow'),
  brandBorder: v('--ui-brand-border'),
  rose: v('--ui-rose'),
  lilac: v('--ui-lilac'),
  peach: v('--ui-peach'),
  tag: {
    surface: v('--ui-tag-surface'),
    text: v('--ui-tag-text'),
    line: v('--ui-tag-line'),
  },
  identity: {
    plum: v('--ui-identity-plum'),
    plumWash: v('--ui-identity-plum-wash'),
    plumLine: v('--ui-identity-plum-line'),
    rose: v('--ui-identity-rose'),
    roseWash: v('--ui-identity-rose-wash'),
    roseLine: v('--ui-identity-rose-line'),
    blue: v('--ui-identity-midnight'),
    blueWash: v('--ui-identity-midnight-wash'),
    blueLine: v('--ui-identity-midnight-line'),
    amber: v('--ui-identity-amber'),
    amberWash: v('--ui-identity-amber-wash'),
    amberLine: v('--ui-identity-amber-line'),
  },
  chart: {
    1: v('--ui-chart-1'),
    2: v('--ui-chart-2'),
    3: v('--ui-chart-3'),
    4: v('--ui-chart-4'),
  },
};

export const gradients = {
  action: {
    value: `linear-gradient(115deg, ${literal('--ui-primary-start')}, ${literal('--ui-primary-end')})`,
  },
  actionHover: {
    value: `linear-gradient(115deg, ${literal('--ui-primary-hover-start')}, ${literal('--ui-primary-hover-end')})`,
  },
};

/** The 4px grid: a numeric name is that many grid steps (`3` is 12px). */
export const spacing = {
  0: { value: '0' },
  0.5: { value: '2px' },
  1: v('--ui-space-1'),
  1.5: { value: '6px' },
  2: v('--ui-space-2'),
  2.5: { value: '10px' },
  3: v('--ui-space-3'),
  3.5: { value: '14px' },
  4: v('--ui-space-4'),
  4.5: { value: '18px' },
  5: v('--ui-space-5'),
  6: v('--ui-space-6'),
  7: { value: '28px' },
  8: v('--ui-space-8'),
  9: { value: '36px' },
  10: { value: '40px' },
  11: { value: '44px' },
  12: { value: '48px' },
  actionGap: v('--ui-action-gap'),
  iconGap: v('--ui-icon-gap'),
  iconGapSmall: v('--ui-icon-gap-small'),
  controlBlock: v('--ui-control-padding-block'),
  controlInline: v('--ui-control-padding-inline'),
  compactBlock: v('--ui-control-compact-block'),
  compactInline: v('--ui-control-compact-inline'),
  panel: v('--ui-panel-padding'),
  dialog: v('--ui-dialog-padding'),
  menu: v('--ui-menu-padding'),
  card: v('--ui-card-padding'),
};

/**
 * Sizes share the grid names with spacing (`h: '11'` is 44px) and add the
 * roles the existing app names. Container widths are the page, column and
 * dialog measures it lays out on.
 */
export const sizes = {
  0: { value: '0' },
  0.5: { value: '2px' },
  1: { value: '4px' },
  1.5: { value: '6px' },
  2: { value: '8px' },
  2.5: { value: '10px' },
  3: { value: '12px' },
  3.5: { value: '14px' },
  4: { value: '16px' },
  5: { value: '20px' },
  6: { value: '24px' },
  7: { value: '28px' },
  8: { value: '32px' },
  9: { value: '36px' },
  10: { value: '40px' },
  11: { value: '44px' },
  12: { value: '48px' },
  16: { value: '64px' },
  24: { value: '96px' },
  32: { value: '128px' },
  40: { value: '160px' },
  48: { value: '192px' },
  96: { value: '384px' },
  full: { value: '100%' },
  container: {
    narrow: { value: '320px' },
    compact: { value: '448px' },
    regular: { value: '512px' },
    wide: { value: '672px' },
    content: { value: '768px' },
    frame: { value: '1024px' },
    page: { value: '1280px' },
  },
  control: v('--ui-control-height'),
  controlCompact: v('--ui-control-compact'),
  iconSmall: v('--ui-icon-small'),
  iconRegular: v('--ui-icon-regular'),
  iconFeature: v('--ui-icon-feature'),
  iconPlaceholder: v('--ui-icon-placeholder'),
};

export const fonts = {
  body: { value: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
  brand: { value: '"Nunito", system-ui, sans-serif' },
};

export const fontSizes = {
  eyebrow: v('--ui-type-eyebrow'),
  meta: v('--ui-type-meta'),
  control: v('--ui-type-control'),
  label: v('--ui-type-label'),
  body: v('--ui-type-body'),
  title: v('--ui-type-title'),
  subsection: v('--ui-type-subsection'),
  cardTitle: v('--ui-card-title'),
  section: v('--ui-type-section'),
  heading: v('--ui-type-heading'),
  headingCompact: { value: '28px' },
  // Earlier names, kept while their consumers migrate.
  pageTitle: v('--ui-type-heading'),
  pageTitleCompact: { value: '28px' },
};

export const lineHeights = {
  heading: v('--ui-leading-heading'),
  body: v('--ui-leading-body'),
  compact: v('--ui-leading-compact'),
  pageTitle: { value: '1.15' },
  control: { value: '22px' },
  cardTitle: { value: '22px' },
};

export const fontWeights = {
  body: { value: '400' },
  label: v('--ui-weight-label'),
  control: v('--ui-weight-label'),
  heading: v('--ui-weight-heading'),
  cardTitle: { value: '650' },
  pageTitle: { value: '750' },
};

export const letterSpacings = {
  pageTitle: { value: '-1px' },
  section: { value: '-0.4px' },
  dialogTitle: { value: '-0.3px' },
  cardTitle: { value: '-0.2px' },
};

export const radii = {
  small: v('--ui-radius-small'),
  control: v('--ui-radius-control'),
  inset: v('--ui-radius-inset'),
  panel: v('--ui-radius-panel'),
  card: v('--ui-card-radius'),
  dialog: v('--ui-radius-dialog'),
  full: { value: '9999px' },
};

export const aspectRatios = {
  square: { value: '1 / 1' },
  video: { value: '16 / 9' },
  portrait: { value: '4 / 5' },
};

export const shadows = {
  surface: v('--ui-surface-shadow'),
  dialog: v('--ui-dialog-shadow'),
  cardHover: { value: '0 8px 24px #0003' },
};

export const durations = {
  state: v('--ui-state-duration'),
};

export const easings = {
  state: { value: 'ease' },
};

/**
 * Min-width breakpoints for the responsive layouts in the app. The existing
 * app collapses its own layouts at 700px; these are the three widths the new
 * screens were checked at.
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
};

export const keyframes = {
  spin: { to: { transform: 'rotate(360deg)' } },
};

export const textStyles = {
  pageTitle: {
    value: {
      fontSize: 'heading',
      fontWeight: 'pageTitle',
      lineHeight: 'pageTitle',
      letterSpacing: 'pageTitle',
    },
  },
  section: {
    value: {
      fontSize: 'section',
      fontWeight: 'heading',
      lineHeight: 'heading',
      letterSpacing: 'section',
    },
  },
  cardTitle: {
    value: {
      fontSize: 'cardTitle',
      fontWeight: 'cardTitle',
      lineHeight: 'cardTitle',
      letterSpacing: 'cardTitle',
    },
  },
  body: { value: { fontSize: 'body', lineHeight: 'body', fontWeight: 'body' } },
  metadata: { value: { fontSize: 'meta', lineHeight: 'body', fontWeight: 'body' } },
  fieldLabel: { value: { fontSize: 'meta', fontWeight: 'label', lineHeight: 'body' } },
  eyebrow: { value: { fontSize: 'eyebrow', fontWeight: 'label', lineHeight: 'compact' } },
};

/** Drop into `theme.extend` of a Panda config. */
export const theme = {
  tokens: {
    fonts,
    fontSizes,
    lineHeights,
    fontWeights,
    letterSpacings,
    spacing,
    sizes,
    radii,
    shadows,
    durations,
    easings,
    gradients,
    aspectRatios,
  },
  semanticTokens: { colors },
  textStyles,
  breakpoints,
  keyframes,
};
