import { useState } from 'react';
import { ChevronDown, Users, Tags } from 'lucide-react';
import { Button, Checkbox, Icon, Input, Popover, Text, Identity } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/** Nested, non-portalled picker preserves the parent filter panel's focus boundary. */
export function FilterPicker({
  label,
  options,
  value,
  onChange,
  multiple = true,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
}) {
  const [query, setQuery] = useState('');
  const matches = options.filter((option) =>
    option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: '88px minmax(0, 1fr)',
        alignItems: 'center',
        gap: '3',
        minW: '0',
      })}
    >
      <Text size="sm" tone="muted" textStyle="fieldLabel">
        {label}
      </Text>
      <Popover.Root
        variant="picker"
        onOpenChange={({ open }) => {
          if (!open) setQuery('');
        }}
        positioning={{
          placement: 'bottom-start',
          strategy: 'fixed',
          gutter: 6,
          overflowPadding: 12,
        }}
      >
        <Popover.Trigger asChild>
          <Button
            variant="neutral"
            aria-pressed={value.length > 0}
            aria-label={`Choose ${label.toLowerCase()}`}
            justifyContent="space-between"
            w="full"
            title={value.length ? value.join(', ') : `Any ${label.toLowerCase()}`}
          >
            <Identity tone="plum" className={css({ display: 'inline-flex', flexShrink: '0' })}>
              <Icon glyph={label === 'Tags' ? Tags : Users} size="sm" />
            </Identity>
            <span
              className={css({
                flex: '1',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minW: '0',
              })}
            >
              {value.length === 1
                ? value[0]
                : value.length
                  ? `${value.length} selected`
                  : `Any ${label.toLowerCase()}`}
            </span>
            <Icon glyph={ChevronDown} size="sm" />
          </Button>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>{label}</Popover.Title>
            <Popover.Description>
              {multiple ? 'Choose entries to filter by.' : 'Choose one entry.'}
            </Popover.Description>
            <Popover.Body>
              <Input
                aria-label={`Search ${label.toLowerCase()} filters`}
                placeholder={`Find ${label.toLowerCase()}…`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div
                className={css({
                  display: 'grid',
                  gap: '1',
                  maxH: '48',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  overscrollBehavior: 'contain',
                })}
              >
                {matches.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={value.includes(option)}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked
                          ? multiple
                            ? [...new Set([...value, option])]
                            : [option]
                          : value.filter((item) => item !== option),
                      )
                    }
                  />
                ))}
                {!matches.length && (
                  <Text size="sm" tone="muted" role="status">
                    {options.length ? 'No matches. Try another search.' : 'No options yet.'}
                  </Text>
                )}
              </div>
            </Popover.Body>
            <Popover.Footer>
              <Button variant="quiet" disabled={!value.length} onClick={() => onChange([])}>
                Clear {label.toLowerCase()}
              </Button>
              <Popover.CloseTrigger asChild aria-label={`Done choosing ${label.toLowerCase()}`}>
                <Button>Done</Button>
              </Popover.CloseTrigger>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </div>
  );
}
