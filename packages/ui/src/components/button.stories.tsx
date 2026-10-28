import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Icon } from './icon';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Controls/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Four variants from the existing app: neutral for supporting actions, quiet for toolbar utilities, primary for the one leading action, danger for destructive actions. Two heights: regular (42px) and compact (32px). Selection uses aria-pressed. Keep page styling outside the component.',
      },
    },
  },
  args: { children: 'Save changes' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = css({ display: 'flex', alignItems: 'center', gap: 'actionGap', flexWrap: 'wrap' });

export const Default: Story = {};
export const Primary: Story = { args: { variant: 'primary' } };
export const Quiet: Story = { args: { variant: 'quiet', children: 'Filters' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Remove item' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, loadingText: 'Saving changes…' } };
export const LongLabel: Story = { args: { children: 'Add selected items to this collection' } };

export const Variants: Story = {
  render: () => (
    <div className={row}>
      <Button variant="primary">
        <Icon glyph={Plus} />
        Add videos
      </Button>
      <Button>Neutral</Button>
      <Button variant="quiet">Quiet</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className={row}>
      <Button>Regular</Button>
      <Button size="compact">Compact</Button>
      <IconButton aria-label="Favorite">
        <Icon glyph={Heart} />
      </IconButton>
      <IconButton aria-label="Favorite" size="compact">
        <Icon glyph={Heart} />
      </IconButton>
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
