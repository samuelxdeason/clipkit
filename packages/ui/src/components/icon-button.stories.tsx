import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from 'lucide-react';
import { IconButton } from './icon-button';
import { Icon } from './icon';

const meta = {
  title: 'Controls/IconButton',
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component:
          'Requires aria-label describing the action. The decorative Icon inherits color. Use aria-pressed for a toggle; tooltips do not replace accessible names.',
      },
    },
  },
  args: { 'aria-label': 'Favorite', children: <Icon glyph={Heart} /> },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { 'aria-pressed': true } };
export const Disabled: Story = { args: { disabled: true } };
