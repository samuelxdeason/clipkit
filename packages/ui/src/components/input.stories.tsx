import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './input';

const meta = {
  title: 'Controls/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Always supply a visible label. Associate help/error text with aria-describedby; set aria-invalid when validation fails. md aligns with md buttons. Native refs, disabled and form attributes are preserved.',
      },
    },
  },
  args: { placeholder: 'Weekend favorites' },
  decorators: [
    (Story) => (
      <label>
        Collection name
        <Story />
      </label>
    ),
  ],
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = {
  args: { 'aria-invalid': true, 'aria-describedby': 'error' },
  render: (args) => (
    <>
      <Input {...args} />
      <p id="error">A collection name is required.</p>
    </>
  ),
};
export const TouchSize: Story = { args: { size: 'lg' } };
