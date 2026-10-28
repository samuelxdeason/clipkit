import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Controls/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Use solid for the main action, surface for supporting actions and plain for quiet utilities. Native type defaults to button. Loading disables activation; use a useful loadingText. Selection uses aria-pressed. Keep page styling outside the component.',
      },
    },
  },
  args: { children: 'Save changes' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Primary: Story = { args: { variant: 'solid' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, loadingText: 'Saving changes…' } };
export const Destructive: Story = { args: { tone: 'danger', children: 'Remove item' } };
export const LongLabel: Story = { args: { children: 'Add selected items to this collection' } };
export const Sizes: Story = {
  render: () => (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap' })}>
      <Button size="sm">Small</Button>
      <Button>Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
function Toggle() {
  const [selected, setSelected] = useState(false);
  return (
    <Button aria-pressed={selected} onClick={() => setSelected((value) => !value)}>
      Favorite
    </Button>
  );
}
export const Selection: Story = { render: () => <Toggle /> };
