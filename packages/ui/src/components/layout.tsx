import { ark } from '@ark-ui/react/factory';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import {
  filterChip,
  filterRail,
  pageHeader,
  sectionHeading,
  toolbar,
  type SectionHeadingVariantProps,
} from '../../styled-system/recipes';

function join(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ---- PageHeader ------------------------------------------------------------

export interface PageHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons at the trailing edge; grouped and labelled as page actions. */
  actions?: ReactNode;
  /** Heading level; h1 for the page title, h2 when the header introduces a region. */
  as?: 'h1' | 'h2';
}

/** `.manager-heading.ui-page-header`: the page title, its one-line description and page actions. */
export function PageHeader({
  title,
  description,
  actions,
  as: Title = 'h1',
  className,
  ...props
}: PageHeaderProps) {
  const classes = pageHeader();
  return (
    <header {...props} className={join(classes.root, className)}>
      <div className={classes.copy}>
        <Title className={classes.title}>{title}</Title>
        {description && <p className={classes.description}>{description}</p>}
      </div>
      {actions && (
        <div className={classes.actions} role="group" aria-label="Page actions">
          {actions}
        </div>
      )}
    </header>
  );
}

// ---- SectionHeading --------------------------------------------------------

export interface SectionHeadingProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'>, SectionHeadingVariantProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  as?: ElementType;
}

/** `.settings-section-heading`: eyebrow, section title and an optional description. */
export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Title = 'h2',
  surface,
  className,
  ...props
}: SectionHeadingProps) {
  const classes = sectionHeading({ surface });
  return (
    <div {...props} className={join(classes.root, className)}>
      {eyebrow && <p className={classes.eyebrow}>{eyebrow}</p>}
      <Title className={classes.title}>{title}</Title>
      {description && <p className={classes.description}>{description}</p>}
    </div>
  );
}

// ---- Toolbar ---------------------------------------------------------------

const toolbarContext = createSlotRecipeContext(toolbar);

/**
 * `.library-toolbar`: Root is a labelled section. Put the SearchField in
 * Search, the result count in Summary and the selects, filters and manage
 * controls in Controls, both inside Row; FilterRail goes in Chips.
 */
export const Toolbar = {
  Root: toolbarContext.withProvider(ark.section, 'root'),
  Search: toolbarContext.withContext(ark.div, 'search'),
  Row: toolbarContext.withContext(ark.div, 'row'),
  Summary: toolbarContext.withContext(ark.p, 'summary'),
  Controls: toolbarContext.withContext(ark.div, 'controls'),
  Chips: toolbarContext.withContext(ark.div, 'chips'),
};

// ---- FilterRail ------------------------------------------------------------

export interface FilterRailProps extends ComponentPropsWithoutRef<'div'> {
  /** Clears every applied filter; omit to hide the reset link. */
  onReset?: () => void;
  resetLabel?: string;
}

/** `.video-filter-chips`: "Active filters", the chips, and a reset link at the trailing edge. */
export function FilterRail({
  onReset,
  resetLabel = 'Clear search and filters',
  className,
  children,
  ...props
}: FilterRailProps) {
  const classes = filterRail();
  return (
    <div aria-label="Active filters" {...props} className={join(classes.root, className)}>
      <span className={classes.caption}>Active filters</span>
      {children}
      {onReset && (
        <button type="button" className={classes.reset} onClick={onReset}>
          {resetLabel}
        </button>
      )}
    </div>
  );
}

export interface FilterChipProps extends ComponentPropsWithoutRef<'button'> {
  /** The filter's text; the button's accessible name says it removes the filter. */
  label: string;
}

/** One applied filter; clicking removes it. */
export function FilterChip({ label, className, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-label={`Remove ${label} filter`}
      title={label}
      {...props}
      className={join(filterChip(), className)}
    >
      <span>{label}</span>
      <X aria-hidden="true" strokeWidth={1.7} />
    </button>
  );
}
