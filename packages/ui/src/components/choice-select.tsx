import { useMemo, type ReactNode } from 'react';
import { createListCollection } from '@ark-ui/react/select';
import { Portal } from '@ark-ui/react/portal';
import * as Select from './select';

export interface ChoiceSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
  layout?: 'stacked' | 'inline';
  appearance?: 'field' | 'toolbar' | 'toolbarIcon';
  /** Compact toolbar trigger; the full accessible label and menu options remain. */
  triggerContent?: ReactNode;
  /** Disable inside a Popover or Dialog to retain its focus/dismissal boundary. */
  portalled?: boolean;
}

/** Single-choice convenience composition. Compound Select stays available for richer flows. */
export function ChoiceSelect({
  label,
  value,
  options,
  onChange,
  hideLabel,
  layout = 'stacked',
  appearance = 'field',
  triggerContent,
  portalled = true,
}: ChoiceSelectProps) {
  const collection = useMemo(() => createListCollection({ items: options }), [options]);
  return (
    <Select.Root
      layout={layout}
      appearance={appearance}
      collection={collection}
      value={[value]}
      onValueChange={(event) => onChange(event.value[0] ?? '')}
      positioning={{ placement: 'bottom-start', gutter: 8, strategy: 'fixed', overflowPadding: 12 }}
    >
      {!hideLabel && <Select.Label>{label}</Select.Label>}
      <Select.Control>
        <Select.Trigger
          aria-label={label}
          title={options.find((option) => option.value === value)?.label}
        >
          {triggerContent || <Select.ValueText />}
          <Select.Indicator />
        </Select.Trigger>
      </Select.Control>
      <Portal disabled={!portalled}>
        <Select.Positioner>
          <Select.Content>
            {hideLabel && <Select.Caption>{label}</Select.Caption>}
            <Select.List>
              {options.map((option) => (
                <Select.Item key={option.value} item={option}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect aria-label={label} />
    </Select.Root>
  );
}
