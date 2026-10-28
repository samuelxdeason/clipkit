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

/** The 4px grid. Numeric names match Panda's own scale so both read the same. */
export const spacing = {
  0.5: { value: '2px' },
  1: v('--ui-space-1'),
  1.5: { value: '6px' },
  2: v('--ui-space-2'),
  2.5: { value: '10px' },
  3: v('--ui-space-3'),
  3.5: { value: '14px' },
  4: v('--ui-space-4'),
  5: v('--ui-space-5'),
  6: v('--ui-space-6'),
  7: { value: '28px' },
  8: v('--ui-space-8'),
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

export const sizes = {
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
  },
  semanticTokens: { colors },
  textStyles,
};
