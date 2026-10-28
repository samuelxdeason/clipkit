import { useId, type ReactNode } from 'react';
import { css } from '@clipkit/ui/css';

/** Manual-activation tabs: arrows move focus, Enter/Space opens the panel. */
export function ContentTabs({
  label,
  items,
  value,
  onChange,
  children,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className={css({ mt: '6' })}>
      <div
        role="tablist"
        aria-label={label}
        className={css({ display: 'flex', gap: '4', mb: '3' })}
      >
        {items.map((item, index) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-controls={`${id}-panel`}
            aria-selected={value === item.value}
            tabIndex={value === item.value ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % items.length
                  : event.key === 'ArrowLeft'
                    ? (index + items.length - 1) % items.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? items.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                document.getElementById(`${id}-${items[next].value}`)?.focus();
              }
            }}
            className={css({
              px: '1',
              py: '3',
              color: 'muted',
              fontWeight: 'semibold',
              fontSize: 'md',
              borderBottomWidth: '2px',
              borderColor: 'transparent',
              cursor: 'pointer',
              _hover: { color: 'text' },
              '&[aria-selected=true]': { color: 'text', borderColor: 'accent' },
              _focusVisible: {
                outline: '[2px solid]',
                outlineColor: 'accent',
                outlineOffset: '[2px]',
              },
            })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${value}`} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
