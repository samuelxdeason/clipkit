import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { comparison, decisionBar, reviewNav } from '../../styled-system/recipes';

/**
 * The duplicate review queue's navigation: Progress holds Count and Caption;
 * Pager holds the previous and next controls and the group choice.
 */
const nav = createSlotRecipeContext(reviewNav);
export const ReviewNav = {
  Root: nav.withProvider(ark.nav, 'root'),
  Progress: nav.withContext(ark.div, 'progress'),
  Count: nav.withContext(ark.strong, 'count'),
  Caption: nav.withContext(ark.span, 'caption'),
  Pager: nav.withContext(ark.div, 'pager'),
};

/**
 * The comparison table. Root wraps the Scroll region and the Caption; Table sets
 * `--copies` to the number of columns. RowLabel is the first cell of each
 * row; in the head, each copy's cell holds CopyHeading, Preview (with Play
 * over a button), Title and the Choice tiles. Body cells hold Value and
 * Note; mark a recycled column's cells with data-recycle.
 */
const compare = createSlotRecipeContext(comparison);
export const Comparison = {
  Root: compare.withProvider(ark.div, 'root'),
  Scroll: compare.withContext(ark.div, 'scroll'),
  Table: compare.withContext(ark.table, 'table'),
  RowLabel: compare.withContext(ark.th, 'rowLabel'),
  CopyHeading: compare.withContext(ark.div, 'copyHeading'),
  Preview: compare.withContext(ark.div, 'preview'),
  Play: compare.withContext(ark.span, 'play'),
  Title: compare.withContext(ark.strong, 'title'),
  Choice: compare.withContext(ark.label, 'choice'),
  ChoiceCopy: compare.withContext(ark.span, 'choiceCopy'),
  Value: compare.withContext(ark.strong, 'value'),
  Note: compare.withContext(ark.small, 'note'),
  Path: compare.withContext(ark.span, 'path'),
  Caption: compare.withContext(ark.p, 'caption'),
};

/** The sticky decision bar: Summary holds Count and Note; Actions the buttons. */
const decision = createSlotRecipeContext(decisionBar);
export const DecisionBar = {
  Root: decision.withProvider(ark.div, 'root'),
  Summary: decision.withContext(ark.div, 'summary'),
  Count: decision.withContext(ark.strong, 'count'),
  Note: decision.withContext(ark.small, 'note'),
  Actions: decision.withContext(ark.div, 'actions'),
};
