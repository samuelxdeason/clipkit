import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import { ChoiceSelect } from './choice-select';
import { Checkbox } from './checkbox';
import { Paging } from './paging';
import * as Popover from './popover';
import * as Dialog from './dialog';
import { Portal } from '@ark-ui/react/portal';

const meta = {
  title: 'Browsing/Controls',
  parameters: {
    docs: {
      description: {
        component:
          'Park compound overlays retain Ark keyboard/focus behavior. ChoiceSelect is a single-choice composition; use compound Select for richer needs. Portals inherit the root theme. Selects sit above dialog content and filters; viewport positioning is shared, not hardcoded by pages.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const options = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];
function SelectExample({ nested = false }: { nested?: boolean }) {
  const [value, setValue] = useState('newest');
  return (
    <ChoiceSelect
      portalled={!nested}
      label="Sort videos"
      value={value}
      onChange={setValue}
      options={options}
    />
  );
}
export const Select: Story = { render: () => <SelectExample /> };
function ToolbarExample() {
  const [sort, setSort] = useState('newest');
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <Button variant="quiet">Filters</Button>
      <ChoiceSelect
        hideLabel
        appearance="toolbar"
        label="Sort library"
        value={sort}
        onChange={setSort}
        options={options}
      />
      <Button variant="quiet">Manage</Button>
    </div>
  );
}
export const Toolbar: Story = { render: () => <ToolbarExample /> };
function CheckExample() {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate');
  return <Checkbox label="Select this page" checked={checked} onCheckedChange={setChecked} />;
}
export const Selection: Story = { render: () => <CheckExample /> };
export const NestedFilter: Story = {
  render: () => (
    <Popover.Root
      positioning={{ placement: 'bottom-start', gutter: 8, overflowPadding: 12, strategy: 'fixed' }}
    >
      <Popover.Trigger asChild>
        <Button>Filters</Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>Filter videos</Popover.Title>
            <Popover.Description>Choices stay within the viewport.</Popover.Description>
            <Popover.Body>
              <SelectExample nested />
              <CheckExample />
            </Popover.Body>
            <Popover.CloseTrigger asChild>
              <Button>Done</Button>
            </Popover.CloseTrigger>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  ),
};
export const DialogWithSelect: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Organize</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>Organize selection</Dialog.Title>
            <Dialog.Description>
              Use Escape to close the nested choice before the dialog.
            </Dialog.Description>
            <SelectExample nested />
            <Dialog.CloseTrigger asChild>
              <Button>Close</Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  ),
};
function PagesExample() {
  const [page, setPage] = useState(1);
  return <Paging count={100} pageSize={12} page={page} onPageChange={setPage} />;
}
export const Pagination: Story = { render: () => <PagesExample /> };
