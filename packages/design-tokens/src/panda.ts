import { values } from './values';

/** Semantic color roles for the new UI; all values come from the canonical source. */
export const colors = {
  canvas: { value: values['--ui-canvas'] },
  surface: { value: values['--ui-panel'] },
  raised: { value: values['--ui-raised'] },
  field: { value: values['--ui-field'] },
  text: { value: values['--ui-text'] },
  muted: { value: values['--ui-secondary'] },
  subtle: { value: values['--ui-muted'] },
  line: { value: values['--ui-line'] },
  accent: { value: values['--ui-accent'] },
  action: { value: values['--ui-primary-start'] },
  actionHover: { value: values['--ui-primary-hover-start'] },
  onAction: { value: values['--ui-on-primary'] },
  selected: { value: values['--ui-selection-surface'] },
  selectedText: { value: values['--ui-selection-text'] },
  selectedLine: { value: values['--ui-selection-line'] },
  danger: { value: values['--ui-danger'] },
  dangerSurface: { value: values['--ui-danger-surface'] },
  success: { value: values['--ui-success'] },
  info: { value: values['--ui-info'] },
  warning: { value: values['--ui-warning'] },
  identity: {
    plum: { value: values['--ui-identity-plum'] },
    rose: { value: values['--ui-identity-rose'] },
    blue: { value: values['--ui-identity-midnight'] },
    amber: { value: values['--ui-identity-amber'] },
  },
};

export const radii = {
  control: { value: values['--ui-radius-control'] },
  panel: { value: values['--ui-radius-panel'] },
  dialog: { value: values['--ui-radius-dialog'] },
};
