import type { ReactNode } from 'react';
import { Tabs } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/** Underline tabs over one content panel; the caller renders the active panel. */
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
  return (
    <Tabs.Root
      value={value}
      onValueChange={(details) => onChange(details.value)}
      className={css({ mt: '6' })}
    >
      <Tabs.List aria-label={label}>
        {items.map((item) => (
          <Tabs.Trigger key={item.value} value={item.value}>
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content value={value}>{children}</Tabs.Content>
    </Tabs.Root>
  );
}
