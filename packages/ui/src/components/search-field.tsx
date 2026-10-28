import { Search, X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { searchField, type SearchFieldVariantProps } from '../../styled-system/recipes';

export interface SearchFieldProps
  extends
    Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'value' | 'onChange'>,
    SearchFieldVariantProps {
  /** Accessible name; the field has no visible label. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Keyboard shortcut shown at the trailing edge, such as "Ctrl K". */
  hint?: string;
  clearLabel?: string;
}

/** The existing app's search field: glyph, input, optional shortcut hint, clear control. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, value, onChange, hint, clearLabel = 'Clear search', size, className, ...props },
  ref,
) {
  const classes = searchField({ size });
  return (
    <div className={[classes.root, className].filter(Boolean).join(' ')}>
      <span className={classes.icon} aria-hidden="true">
        <Search strokeWidth={1.7} />
      </span>
      <input
        {...props}
        ref={ref}
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={classes.input}
      />
      {hint && !value && <kbd className={classes.hint}>{hint}</kbd>}
      {value && (
        <button
          type="button"
          className={classes.clear}
          aria-label={clearLabel}
          onClick={() => onChange('')}
        >
          <X strokeWidth={1.7} />
        </button>
      )}
    </div>
  );
});
