import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import {
  emptyState,
  notice,
  statusBadge,
  tag,
  type EmptyStateVariantProps,
  type NoticeVariantProps,
  type StatusBadgeVariantProps,
} from '../../styled-system/recipes';

function join(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ---- Tag -------------------------------------------------------------------

export interface TagProps extends ComponentPropsWithoutRef<'button'> {
  /** Present when the tag filters or navigates; otherwise it renders as plain text. */
  onClick?: ComponentPropsWithoutRef<'button'>['onClick'];
}

/** `.tag-pill`: a chip for tags and labels; a button when it has an action. */
export const Tag = forwardRef<HTMLButtonElement, TagProps>(function Tag(
  { onClick, className, children, ...props },
  ref,
) {
  const classes = join(tag(), className);
  if (!onClick) {
    return (
      <span className={classes} title={props.title}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" {...props} ref={ref} onClick={onClick} className={classes}>
      {children}
    </button>
  );
});

// ---- StatusBadge -----------------------------------------------------------

export interface StatusBadgeProps
  extends ComponentPropsWithoutRef<'span'>, StatusBadgeVariantProps {}

/** `.download-status` / `.connection-state`: a tinted label for a state. */
export function StatusBadge({ tone, dot, className, ...props }: StatusBadgeProps) {
  return <span {...props} className={join(statusBadge({ tone, dot }), className)} />;
}

// ---- Notice ----------------------------------------------------------------

export interface NoticeProps extends ComponentPropsWithoutRef<'div'>, NoticeVariantProps {
  /** Buttons rendered at the trailing edge, such as Retry or Dismiss. */
  actions?: ReactNode;
}

/**
 * `.manager-alert` / `.manager-notice`: an inline message. Danger notices
 * default to role="alert"; others to role="status". Pass role to override.
 */
export function Notice({ tone = 'success', actions, className, children, ...props }: NoticeProps) {
  const classes = notice({ tone });
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      {...props}
      className={join(classes.root, className)}
    >
      <div className={classes.message}>{children}</div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </div>
  );
}

// ---- EmptyState ------------------------------------------------------------

export interface EmptyStateProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'>, EmptyStateVariantProps {
  title: ReactNode;
  description?: ReactNode;
  /** A Lucide glyph; ignored while loading, which shows the spinner. */
  symbol?: ReactNode;
  actions?: ReactNode;
}

/** `.manager-empty` / `.workspace-load-state`: empty, loading and error panels. */
export function EmptyState({
  state = 'empty',
  title,
  description,
  symbol,
  actions,
  className,
  ...props
}: EmptyStateProps) {
  const classes = emptyState({ state });
  const live = state === 'error' ? 'alert' : 'status';
  return (
    <div role={live} {...props} className={join(classes.root, className)}>
      {(symbol || state === 'loading') && (
        <div className={classes.symbol} aria-hidden="true">
          {state === 'loading' ? <span className={classes.spinner} /> : symbol}
        </div>
      )}
      <h2 className={classes.title}>{title}</h2>
      {description && <p className={classes.description}>{description}</p>}
      {actions && <div className={classes.actions}>{actions}</div>}
    </div>
  );
}
